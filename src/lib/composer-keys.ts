// Which keypresses send the ask composer. Enter sends and Shift+Enter breaks the line,
// the chat convention. Resume mode takes a pasted, multi-line job description, so there
// plain Enter stays a newline and only Cmd/Ctrl+Enter sends. Never send mid IME
// composition — Enter there confirms the candidate text.
export interface ComposerKey {
  key: string;
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  isComposing: boolean;
}

export function shouldSubmitOnKey(event: ComposerKey, multiline: boolean): boolean {
  if (event.key !== 'Enter' || event.isComposing) return false;
  if (event.metaKey || event.ctrlKey) return true;
  return !multiline && !event.shiftKey;
}
