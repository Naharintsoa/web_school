/**
 * Page de remise à zéro — suppression de tous les élèves.
 * Réservée au super admin. Demande une confirmation par mot de passe.
 */
import { useEffect, useState } from 'react';
import {
  AlertTriangle, Eye, EyeOff, Loader2, ShieldAlert, Trash2, Users,
} from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradeStats {
  grade: string;
  count: number;
}

// ─── Helpers API ──────────────────────────────────────────────────────────────

async function fetchStats(): Promise<GradeStats[]> {
  const res = await fetch('/api/students', { credentials: 'include' });
  if (!res.ok) throw new Error('Impossible de charger les données.');
  const students: { grade: string }[] = await res.json();
  const map: Record<string, number> = {};
  for (const s of students) {
    map[s.grade] = (map[s.grade] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => a.grade.localeCompare(b.grade));
}

async function purgeAll(password: string): Promise<{ deleted: number; message: string }> {
  const res = await fetch('/api/students/purge-all', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? 'Erreur serveur.');
  return body;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function PurgePage() {
  const { session } = useAuthContext();

  const [stats, setStats] = useState<GradeStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [checked, setChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: 'ok' | 'err'; message: string } | null>(null);

  const totalStudents = stats.reduce((acc, s) => acc + s.count, 0);
  const canSubmit = checked && password.trim().length > 0 && !submitting && totalStudents > 0;

  // Chargement des statistiques
  useEffect(() => {
    setLoadingStats(true);
    fetchStats()
      .then(setStats)
      .catch((err) => setStatsError(err.message))
      .finally(() => setLoadingStats(false));
  }, [result?.type === 'ok']); // Recharge après une purge réussie

  const handlePurge = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await purgeAll(password.trim());
      setResult({ type: 'ok', message: res.message });
      setPassword('');
      setChecked(false);
    } catch (err: unknown) {
      setResult({ type: 'err', message: err instanceof Error ? err.message : 'Erreur inconnue.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Accès refusé si pas super admin
  if (!session?.isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
          <ShieldAlert size={30} className="text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Accès refusé</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          Cette action est réservée au Super Administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* En-tête */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <Trash2 size={22} className="text-rose-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Remise à zéro des élèves</h1>
          <p className="text-sm text-slate-500 mt-1">
            Supprime définitivement tous les élèves et leurs notes de la base de données.
            Cette action est <strong className="text-rose-600">irréversible</strong>.
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <Users size={16} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Données qui seront supprimées</span>
        </div>

        {loadingStats ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : statsError ? (
          <div className="py-6 text-center text-sm text-rose-500">{statsError}</div>
        ) : totalStudents === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            Aucun élève enregistré — rien à supprimer.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.map(({ grade, count }) => (
              <div key={grade} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm font-medium text-slate-700">{grade}</span>
                <span className="text-sm text-slate-500">
                  {count} élève{count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-rose-50">
              <span className="text-sm font-bold text-rose-700">Total</span>
              <span className="text-sm font-bold text-rose-700">
                {totalStudents} élève{totalStudents > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Résultat */}
      {result && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
          result.type === 'ok'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">{result.message}</p>
        </div>
      )}

      {/* Formulaire de confirmation */}
      {totalStudents > 0 && (
        <div className="border border-rose-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-rose-50 border-b border-rose-200">
            <p className="text-sm font-semibold text-rose-700 flex items-center gap-2">
              <AlertTriangle size={15} />
              Confirmation requise
            </p>
          </div>

          <div className="px-4 py-5 space-y-5 bg-white">
            {/* Checkbox de compréhension */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-rose-600 flex-shrink-0"
              />
              <span className="text-sm text-slate-700">
                Je comprends que cette action va supprimer{' '}
                <strong className="text-rose-600">{totalStudents} élève{totalStudents > 1 ? 's' : ''}</strong>{' '}
                et toutes leurs notes de façon <strong>définitive et irréversible</strong>.
              </span>
            </label>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mot de passe du Super Administrateur
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePurge()}
                  placeholder="Saisissez votre mot de passe"
                  className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Bouton de suppression */}
            <button
              onClick={handlePurge}
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Suppression en cours…
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Supprimer tous les élèves ({totalStudents})
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
