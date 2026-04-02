/**
 * Page de gestion des templates Twig pour les documents scolaires.
 * Permet de lister, éditer, prévisualiser et enregistrer les templates.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle, Check, ChevronRight, Code2, Eye,
  FileText, Loader2, RefreshCw, Save,
} from 'lucide-react';
import Twig from 'twig';
import { DEFAULT_TEMPLATES, getDefaultTemplate } from '../../constants/defaultTemplates';
import { templateService } from '../../services/templateService';
import type { TemplateDetail } from '../../services/templateService';

// ─── Données de prévisualisation fictives ─────────────────────────────────────

const MOCK_STUDENT = {
  firstName: 'Jean',
  lastName: 'RAKOTO',
  matricule: '2024-6EME-001',
  grade: '6EME',
  dateOfBirth: '12/05/2012',
  enrollmentDate: '03/09/2024',
  photoUrl: '',
  issNumber: 'ISS-2024-0042',
  schoolYear: '2024-2025',
  parentInfo: {
    fatherName: 'RAKOTO Marcel',
    motherName: 'RABE Claudine',
    fatherPhone: '034 00 000 00',
    motherPhone: '033 00 000 00',
    address: 'Antananarivo',
  },
};

const MOCK_CONTEXT = {
  student: MOCK_STUDENT,
  schoolYear: '2024-2025',
  today: new Date().toLocaleDateString('fr-FR'),
};

// ─── Rendu Twig ───────────────────────────────────────────────────────────────

function renderTwig(code: string): { html: string; error: string | null } {
  if (!code.trim()) {
    return { html: '<p style="color:#999;padding:16px;">Aucun contenu à prévisualiser.</p>', error: null };
  }
  try {
    const template = Twig.twig({ data: code, rethrow: true });
    const html = template.render(MOCK_CONTEXT);
    return { html, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { html: '', error: msg };
  }
}

// ─── Composant liste ──────────────────────────────────────────────────────────

interface TemplateListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function TemplateList({ selectedId, onSelect }: TemplateListProps) {
  return (
    <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Templates</h2>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {DEFAULT_TEMPLATES.map((tpl) => {
          const isActive = selectedId === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl.id)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${
                isActive
                  ? 'bg-indigo-50 border-r-2 border-indigo-500 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText size={16} className={isActive ? 'text-indigo-500' : 'text-slate-400'} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {tpl.name}
                </p>
                <p className="text-xs text-slate-400 truncate">{tpl.description}</p>
              </div>
              {isActive && <ChevronRight size={14} className="text-indigo-400 flex-shrink-0" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// ─── Éditeur + Aperçu ─────────────────────────────────────────────────────────

interface EditorPanelProps {
  template: TemplateDetail;
  onSaved: (updated: TemplateDetail) => void;
}

function EditorPanel({ template, onSaved }: EditorPanelProps) {
  const [code, setCode] = useState(template.code);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const defaultTpl = getDefaultTemplate(template.id);

  // Sync code when switching template
  useEffect(() => {
    setCode(template.code || defaultTpl?.code || '');
    setSaveMsg(null);
  }, [template.id]);

  // Update iframe preview
  useEffect(() => {
    if (activeTab !== 'preview') return;
    const { html, error } = renderTwig(code);
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(
      error
        ? `<html><body style="font-family:monospace;color:#dc2626;padding:16px;font-size:13px;"><strong>Erreur Twig :</strong><br><pre>${error}</pre></body></html>`
        : html
    );
    doc.close();
  }, [activeTab, code]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await templateService.save(template.id, code);
      onSaved(updated);
      setSaveMsg({ type: 'ok', text: 'Template enregistré.' });
    } catch (err: unknown) {
      setSaveMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erreur' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const handleReset = async () => {
    if (!defaultTpl) return;
    if (!confirm('Réinitialiser ce template au design par défaut ? Les modifications seront perdues.')) return;
    setResetting(true);
    setSaveMsg(null);
    try {
      const updated = await templateService.reset(template.id, defaultTpl.code);
      setCode(updated.code);
      onSaved(updated);
      setSaveMsg({ type: 'ok', text: 'Template réinitialisé.' });
    } catch (err: unknown) {
      setSaveMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erreur' });
    } finally {
      setResetting(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const twig = renderTwig(code);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-slate-800">{template.name}</h1>
          <p className="text-xs text-slate-400">
            Modifié le {new Date(template.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveMsg && (
            <span className={`flex items-center gap-1 text-xs font-medium ${saveMsg.type === 'ok' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {saveMsg.type === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />}
              {saveMsg.text}
            </span>
          )}
          <button
            onClick={handleReset}
            disabled={resetting || !defaultTpl}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {resetting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer
          </button>
        </div>
      </div>

      {/* Onglets Éditeur / Aperçu */}
      <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'editor'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Code2 size={15} />
          Éditeur Twig
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Eye size={15} />
          Aperçu
          {twig.error && <span className="ml-1 w-2 h-2 rounded-full bg-rose-500 inline-block" />}
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'editor' ? (
          <div className="h-full flex flex-col">
            {/* Aide variables */}
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex-shrink-0">
              <strong>Variables disponibles :</strong>{' '}
              <code className="bg-amber-100 px-1 rounded">{'{{ student.firstName }}'}</code>{' '}
              <code className="bg-amber-100 px-1 rounded">{'{{ student.lastName }}'}</code>{' '}
              <code className="bg-amber-100 px-1 rounded">{'{{ student.matricule }}'}</code>{' '}
              <code className="bg-amber-100 px-1 rounded">{'{{ student.grade }}'}</code>{' '}
              <code className="bg-amber-100 px-1 rounded">{'{{ student.dateOfBirth }}'}</code>{' '}
              <code className="bg-amber-100 px-1 rounded">{'{{ student.photoUrl }}'}</code>{' '}
              <code className="bg-amber-100 px-1 rounded">{'{{ student.issNumber }}'}</code>{' '}
              <code className="bg-amber-100 px-1 rounded">{'{{ schoolYear }}'}</code>{' '}
              <code className="bg-amber-100 px-1 rounded">{'{{ today }}'}</code>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full resize-none font-mono text-sm bg-slate-900 text-slate-100 p-4 focus:outline-none leading-relaxed"
              placeholder="Saisissez votre template Twig ici..."
            />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="Aperçu du template"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export function TemplatesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(DEFAULT_TEMPLATES[0].id);
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplate = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await templateService.get(id);
      // Si la DB n'a pas encore de code, utiliser le code par défaut
      if (!data.code) {
        const def = getDefaultTemplate(id);
        if (def) data.code = def.code;
      }
      setTemplate(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadTemplate(selectedId);
  }, [selectedId, loadTemplate]);

  return (
    <div className="flex h-full min-h-0">
      <TemplateList
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {loading && (
          <div className="flex-1 flex items-center justify-center text-indigo-500 gap-2">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Chargement…</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-rose-600">
            <AlertCircle size={32} />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => selectedId && loadTemplate(selectedId)}
              className="text-sm text-indigo-600 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && template && (
          <EditorPanel
            key={template.id}
            template={template}
            onSaved={(updated) => setTemplate(updated)}
          />
        )}

        {!loading && !error && !template && !selectedId && (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Sélectionnez un template dans la liste.
          </div>
        )}
      </div>
    </div>
  );
}
