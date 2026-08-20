export interface ContactMessage {
  message: string;
  email: string;
}

export async function sendContactMessage(payload: ContactMessage): Promise<void> {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = 'Your message could not be sent right now.';
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch { /* non-JSON */ }
    throw new Error(msg);
  }
}
