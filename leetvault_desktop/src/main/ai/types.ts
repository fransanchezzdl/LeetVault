export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type GroqError =
  | { kind: 'missing_key' }
  | { kind: 'auth'; message: string }
  | { kind: 'rate_limit'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'server'; message: string }
  | { kind: 'aborted' };

export function userFacingError(err: GroqError): string {
  switch (err.kind) {
    case 'missing_key':
      return 'No Groq API key configured. Open settings and add one.';
    case 'auth':
      return 'Groq rejected the API key. Check it and try again.';
    case 'rate_limit':
      return 'Rate limit reached. Wait a minute and try again.';
    case 'network':
      return `Network error: ${err.message}`;
    case 'server':
      return `Groq server error: ${err.message}`;
    case 'aborted':
      return 'Request aborted.';
  }
}
