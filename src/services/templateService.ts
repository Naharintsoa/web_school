/**
 * Service API pour les templates de documents Twig.
 */

export interface TemplateListItem {
  id: string;
  name: string;
  description: string;
  updated_at: string;
}

export interface TemplateDetail extends TemplateListItem {
  code: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Erreur serveur');
  }
  return res.json();
}

export const templateService = {
  list(): Promise<TemplateListItem[]> {
    return apiFetch('/api/templates');
  },

  get(id: string): Promise<TemplateDetail> {
    return apiFetch(`/api/templates/${id}`);
  },

  save(id: string, code: string): Promise<TemplateDetail> {
    return apiFetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
  },

  reset(id: string, defaultCode: string): Promise<TemplateDetail> {
    return apiFetch(`/api/templates/${id}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultCode }),
    });
  },
};
