import { apiFetch } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Timeout côté client pour un aller-retour complet vers le serveur (Ollama peut être lent). */
const CLIENT_TIMEOUT_MS = 3 * 60_000; // 3 minutes
/** Nombre de tentatives en cas d'erreur réseau ou timeout. */
const CLIENT_MAX_RETRIES = 2;

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export const chatApi = {
  send: async (messages: ChatMessage[], schoolYear: string): Promise<string> => {
    let lastErr: Error | undefined;

    for (let attempt = 1; attempt <= CLIENT_MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

      try {
        const data = await apiFetch<{ reply: string }>('/chat', {
          method: 'POST',
          signal: controller.signal,
          body: JSON.stringify({ messages, schoolYear }),
        });
        clearTimeout(timer);
        return data.reply;
      } catch (err) {
        clearTimeout(timer);
        lastErr = err as Error;

        const isTimeout = lastErr.name === 'AbortError';
        const isNetwork = lastErr.message === 'Failed to fetch' || lastErr.message.includes('NetworkError');

        // Ne réessayer que sur timeout ou erreur réseau passagère
        if (!(isTimeout || isNetwork) || attempt === CLIENT_MAX_RETRIES) break;

        console.warn(`[chatApi] tentative ${attempt}/${CLIENT_MAX_RETRIES} échouée. Nouvel essai…`);
        await sleep(1500);
      }
    }

    if (lastErr?.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw lastErr;
  },
};
