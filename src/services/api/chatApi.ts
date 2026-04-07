import { apiFetch } from './client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const chatApi = {
  send: async (messages: ChatMessage[], schoolYear: string): Promise<string> => {
    const data = await apiFetch<{ reply: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, schoolYear }),
    });
    return data.reply;
  },
};
