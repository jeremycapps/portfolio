import { type FormEvent, type ReactNode, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Check, Linkedin, Mail, Search, Send, Sparkles, Trash2 } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { ChatView } from '@/components/chat-view';
import { PromptStarters } from '@/components/prompt-starters';
import { ProjectCards } from '@/components/project-cards';
import { SiteHeader } from '@/components/site-header';
import { ThinkingIndicator } from '@/components/thinking-indicator';
import { ResumeSurface } from '@/components/facia/resume-surface';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  AnswerApiError,
  sendStructuredAnswer,
} from '@/lib/answer';
import {
  consumeChoices,
  markdownContent,
  messageHasVisibleContent,
  sendChat,
  type ClientMessage,
} from '@/lib/chat';
import { ResumeApiError, sendResumeRequest, type ResumeResponse } from '@/lib/resume';
import { EXPLAIN_PROJECT_CHOICES, PORTFOLIO_PROJECTS } from '@/lib/projects';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

const HERO_PHRASES = ['my experience', 'my projects', 'anything'];

function RotatingPhrase() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_PHRASES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <em className="hero-rotator" key={index}>
      {HERO_PHRASES[index]}.
    </em>
  );
}

function Home() {
  const [prompt, setPrompt] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'normal' | 'error' | 'success'>('normal');
  const [toastMessage, setToastMessage] = useState('');
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [resumeMode, setResumeMode] = useState(false);
  const [resumeResult, setResumeResult] = useState<ResumeResponse | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const hasConversation =
    messages.length > 0 || resumeResult !== null || chatError !== null;
  // A request is in flight but nothing has rendered yet — show a loader so the
  // interface never looks idle while the model is calculating.
  const awaitingAnswer =
    streaming &&
    resumeResult === null &&
    !messages.some((m) => m.role === 'assistant' && messageHasVisibleContent(m));
  const chatActive = hasConversation || awaitingAnswer;
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(''), 3400);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const handlePromptSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      if (!streaming) {
        setStatusTone('error');
        setStatusMessage('Write a question first, then send it to Domain.');
      }
      return;
    }
    setPrompt('');
    if (resumeMode) {
      void submitResume(cleanPrompt);
      return;
    }
    void submitPrompt(cleanPrompt);
  };

  const submitPrompt = async (rawPrompt: string) => {
    const cleanPrompt = rawPrompt.trim();
    if (!cleanPrompt || streaming) return;

    setStatusMessage('');
    setChatError(null);
    setResumeMode(false);
    setResumeResult(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      // Consume any pending interactive choices so the picker stops being clickable.
      const history = messages.map(consumeChoices);
      const next: ClientMessage[] = [...history, { role: 'user', content: cleanPrompt }];
      setMessages([...next, { role: 'assistant', content: markdownContent() }]);

      try {
        const answer = await sendStructuredAnswer(cleanPrompt, 'glance', controller.signal);
        setMessages([
          ...next,
          {
            role: 'assistant',
            content: { kind: 'facia', question: cleanPrompt, answer },
          },
        ]);
        return;
      } catch (error) {
        const fallbackCodes = new Set([
          'QUESTION_NOT_MODELED',
          'MODEL_REFUSED',
          'MODEL_PROVIDER_TIMEOUT',
          'MODEL_MALFORMED_JSON',
          'MODEL_SCHEMA_INVALID',
          'MODEL_PROVIDER_UNAVAILABLE',
          'INVALID_RESPONSE',
        ]);
        if (!(error instanceof AnswerApiError) || !fallbackCodes.has(error.code)) throw error;
      }

      await sendChat(next, {
        signal: controller.signal,
        onDelta: (t) =>
          setMessages((cur) => {
            if (cur.length === 0) return cur;
            const last = cur[cur.length - 1];
            if (!last || last.role !== 'assistant' || last.content.kind !== 'markdown') return cur;
            const copy = cur.slice();
            copy[copy.length - 1] = {
              ...last,
              content: markdownContent(last.content.markdown + t),
            };
            return copy;
          }),
      });
      setMessages((cur) => {
        const last = cur[cur.length - 1];
        return last && last.role === 'assistant'
          && last.content.kind === 'markdown'
          && last.content.markdown === ''
          ? cur.slice(0, -1)
          : cur;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // reset/abort, not a real error
      setChatError(err instanceof Error ? err.message : 'Something went wrong.');
      // Drop the empty assistant placeholder on hard failure.
      setMessages((cur) => {
        const last = cur[cur.length - 1];
        return last?.role === 'assistant'
          && last.content.kind === 'markdown'
          && last.content.markdown === ''
          ? cur.slice(0, -1)
          : cur;
      });
    } finally {
      setStreaming(false);
    }
  };

  const armResume = () => {
    if (streaming) return;
    setResumeMode(true);
    setStatusTone('normal');
    setStatusMessage('Paste the job description or a link, then send.');
  };

  const submitResume = async (jobDescription: string) => {
    if (streaming) return;
    setResumeMode(false);
    setResumeResult(null);
    setStatusMessage('');
    setChatError(null);
    setMessages([]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await sendResumeRequest(jobDescription, controller.signal);
      setResumeResult(result);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setChatError(
        error instanceof ResumeApiError
          ? error.message
          : 'The resume could not be generated.',
      );
    } finally {
      setStreaming(false);
    }
  };

  // "Explain a project" synthesizes an assistant turn whose response carries the
  // interactive picker (the Facia pattern, rendered client-side for now).
  const handleExplainProject = () => {
    if (streaming) return;
    setStatusMessage('');
    setChatError(null);
    setResumeMode(false);
    setResumeResult(null);
    setMessages((cur) => [
      ...cur.map(consumeChoices),
      { role: 'user', content: 'Can you tell me about one of your projects?' },
      {
        role: 'assistant',
        content: markdownContent('Sure — which one would you like to hear about?'),
        choices: EXPLAIN_PROJECT_CHOICES,
      },
    ]);
  };

  const handleClearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setResumeMode(false);
    setResumeResult(null);
    setChatError(null);
  };

  return (
    <main className={`app-shell${chatActive ? ' app-shell-chatting' : ''}`}>
      <SiteHeader current="portfolio" onNotice={showToast} />

      <section
        className={`workspace${chatActive ? ' workspace-chatting' : ''}`}
        aria-label={chatActive ? 'Portfolio assistant' : undefined}
        aria-labelledby={chatActive ? undefined : 'hero-title'}
      >
        <div className="intro">
          <p className="eyebrow" data-testid="text-eyebrow">The portfolio of Jeremy Capps</p>
          <h1 className="hero-title" id="hero-title">
            Ask me about<br />
            <RotatingPhrase />
          </h1>
          <p className="hero-description">
            A conversational portfolio. Ask about my experience, the systems I'm building, or how I think about software.
          </p>
        </div>

        {chatActive && (
          <div className="conversation-pane" role="region" aria-label="Conversation">
            {resumeResult ? (
              <>
                <ResumeSurface view={resumeResult.view} provenance={resumeResult.provenance} />
                {chatError && <div className="chat-error" role="alert" data-testid="chat-error">{chatError}</div>}
              </>
            ) : messages.length > 0 ? (
              <ChatView
                messages={messages}
                streaming={streaming}
                error={chatError}
                onChoice={(p) => void submitPrompt(p)}
              />
            ) : awaitingAnswer ? (
              <div className="loading-surface">
                <ThinkingIndicator />
              </div>
            ) : chatError ? (
              <div className="chat-error" role="alert" data-testid="chat-error">{chatError}</div>
            ) : null}
          </div>
        )}

        <div className={`composer-wrap${chatActive ? ' composer-wrap-chatting' : ''}`}>
          <form className="composer" onSubmit={handlePromptSubmit} data-testid="form-prompt">
            <div className="composer-prompt">
              <Search aria-hidden="true" />
              <textarea
                className="composer-input"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  // Cmd+Enter (macOS) / Ctrl+Enter (Windows/Linux) sends the prompt.
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={resumeMode ? 'Paste the job description or a link…' : 'Ask anything...'}
                aria-label="Ask Domain anything"
                data-testid="input-prompt"
              />
            </div>
            <div className="composer-toolbar">
              <div className="toolbar-left" />
              <div className="toolbar-right">
                <button className="toolbar-button clear-chat-button" type="button" onClick={handleClearChat} disabled={!hasConversation && !awaitingAnswer} aria-label="Clear chat" data-testid="button-clear-chat">
                  <Trash2 aria-hidden="true" />
                  Clear chat
                </button>
                <button className="submit-button" type="submit" disabled={!prompt.trim() || streaming} aria-label="Send prompt" data-testid="button-submit-prompt">
                  <ArrowUpIcon />
                </button>
              </div>
            </div>
          </form>
          <PromptStarters
            onSendPrompt={(text) => void submitPrompt(text)}
            onExplainProject={handleExplainProject}
            onArmResume={armResume}
            disabled={streaming}
          />
          <p className={`status-line ${statusTone}`} role="status" data-testid="status-prompt">{statusMessage}</p>
        </div>

        <section className="connect-section" aria-labelledby="connect-title">
          <p className="connect-label" id="connect-title">The context behind these answers.</p>
          <div className="connection-grid">
            <div className="connection-item">
              <span className="connection-name"><span className="source-dot is-live" aria-hidden="true" /> Profile</span>
              <span className="source-status is-live" data-testid="source-profile"><Check aria-hidden="true" /> Live</span>
            </div>
            <div className="connection-item">
              <span className="connection-name"><span className="source-dot" aria-hidden="true" /> GitHub</span>
              <span className="source-status" data-testid="source-github">Planned</span>
            </div>
            <div className="connection-item">
              <span className="connection-name"><span className="source-dot" aria-hidden="true" /> Drive</span>
              <span className="source-status" data-testid="source-drive">Planned</span>
            </div>
          </div>
          <p className="connection-note">
            Answers draw on a curated profile today; live repositories and documents are on the way.
          </p>
        </section>

        <section className="portfolio" aria-labelledby="portfolio-title">
          <div className="portfolio-header">
            <div>
              <p className="portfolio-kicker">
                Selected work / {String(PORTFOLIO_PROJECTS.length).padStart(2, '0')}
              </p>
              <h2 className="portfolio-title" id="portfolio-title">What I'm building.</h2>
            </div>
          </div>

          <ProjectCards />
        </section>

        <div className="footer-contact" aria-label="Contact Jeremy">
          <a href="mailto:jeremy@nycwork.space" data-testid="link-email">
            <Mail aria-hidden="true" /> jeremy@nycwork.space
          </a>
          <a href="https://www.linkedin.com/in/jeremycapps" target="_blank" rel="noreferrer noopener" data-testid="link-linkedin">
            <Linkedin aria-hidden="true" /> LinkedIn
          </a>
        </div>

        <p className="footer-note"><Sparkles aria-hidden="true" /> A small surface for big thinking.</p>
      </section>

      {toastMessage && <div className="toast-message" role="status" data-testid="status-toast">{toastMessage}</div>}
    </main>
  );
}

function ArrowUpIcon() {
  return <Send aria-hidden="true" />;
}

// Lazy-loaded so the StratOS instrument (and its recipe map) ships in its own
// chunk, never in the homepage bundle.
const StratosPage = lazy(() => import('@/pages/stratos'));
const BlogPage = lazy(() => import('@/pages/blog'));
const BlogPostPage = lazy(() => import('@/pages/blog-post'));
const AboutPage = lazy(() => import('@/pages/about'));

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about">
          {() => <Suspense fallback={null}><AboutPage /></Suspense>}
        </Route>
        <Route path="/stratos">
          {() => <Suspense fallback={null}><StratosPage /></Suspense>}
        </Route>
        <Route path="/blog">
          {() => <Suspense fallback={null}><BlogPage /></Suspense>}
        </Route>
        <Route path="/blog/:slug">
          {(params) => <Suspense fallback={null}><BlogPostPage slug={params.slug} /></Suspense>}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
