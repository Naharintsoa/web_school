/**
 * Passage en classe supérieure — fin d'année scolaire.
 * Charge tous les élèves d'une année source, permet de définir
 * individuellement : Passe (classe suivante) | Redouble (même classe) | Ne pas réinscrire.
 * Puis crée les nouveaux enregistrements pour l'année cible.
 */
import { useState, useMemo } from 'react';
import { ArrowRight, RefreshCw, UserX, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from 'lucide-react';
import { studentApi } from '../../services/api/studentApi';
import type { Student, ClassLevel } from '../../types/student';
import { SCHOOL_YEARS } from '../../utils/schoolYears';
import { useToast } from '../../contexts/ToastContext';

type Decision = 'promoted' | 'repeat' | 'skip';

const NEXT_GRADE: Record<string, ClassLevel | null> = {
  PS: 'MS', MS: 'GS', GS: 'CP',
  CP: 'CE1', CE1: 'CE2', CE2: 'CM1',
  CM1: 'CM2', CM2: '6EME',
  '6EME': '5EME', '5EME': '4EME', '4EME': '3EME',
  '3EME': null,
};

const GRADE_ORDER: ClassLevel[] = [
  'PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6EME', '5EME', '4EME', '3EME',
];

function DecisionBadge({ d, onChange }: { d: Decision; onChange: (d: Decision) => void }) {
  const opts: { v: Decision; label: string; color: string }[] = [
    { v: 'promoted', label: 'Passe',           color: d === 'promoted' ? '#16a34a' : '#e2e8f0' },
    { v: 'repeat',   label: 'Redouble',         color: d === 'repeat'   ? '#d97706' : '#e2e8f0' },
    { v: 'skip',     label: 'Ne pas réinscrire', color: d === 'skip'     ? '#dc2626' : '#e2e8f0' },
  ];
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {opts.map(o => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          style={{
            padding: '3px 10px', borderRadius: '6px', border: 'none',
            fontSize: '12px', fontWeight: d === o.v ? 'bold' : 'normal',
            cursor: 'pointer',
            background: o.color,
            color: d === o.v ? '#fff' : '#64748b',
            transition: 'all 0.15s',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function avatar(s: Student) {
  if (s.photoUrl) {
    return <img src={s.photoUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff',
      color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '13px', fontWeight: 'bold',
    }}>
      {s.firstName?.[0]}{s.lastName?.[0]}
    </div>
  );
}

export function PromotionPanel() {
  const { showToast } = useToast();

  const [fromYear, setFromYear] = useState(SCHOOL_YEARS[0]);
  const [toYear, setToYear]     = useState(SCHOOL_YEARS[1] ?? SCHOOL_YEARS[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState<{ promoted: number; repeated: number; skipped: number } | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const loaded = students.length > 0;

  async function handleLoad() {
    setLoading(true);
    setDone(null);
    try {
      const list = await studentApi.getAll(fromYear);
      setStudents(list);
      // Par défaut : tous passent (sauf 3EME → skip car fin de cursus)
      const init: Record<string, Decision> = {};
      for (const s of list) {
        init[s.id] = NEXT_GRADE[s.grade] === null ? 'skip' : 'promoted';
      }
      setDecisions(init);
    } catch {
      showToast('Erreur lors du chargement des élèves', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Grouper par classe dans l'ordre
  const grouped = useMemo(() => {
    const map: Record<string, Student[]> = {};
    for (const s of students) {
      if (!map[s.grade]) map[s.grade] = [];
      map[s.grade].push(s);
    }
    return GRADE_ORDER.filter(g => map[g]).map(g => ({ grade: g, list: map[g] }));
  }, [students]);

  const counts = useMemo(() => {
    let p = 0, r = 0, sk = 0;
    for (const d of Object.values(decisions)) {
      if (d === 'promoted') p++;
      else if (d === 'repeat') r++;
      else sk++;
    }
    return { p, r, sk };
  }, [decisions]);

  function setAll(grade: string, d: Decision) {
    setDecisions(prev => {
      const next = { ...prev };
      for (const s of students.filter(s => s.grade === grade)) next[s.id] = d;
      return next;
    });
  }

  async function handleSubmit() {
    if (!window.confirm(
      `Confirmer le passage de ${counts.p} élève(s) en classe supérieure, ${counts.r} redoublant(s) et ${counts.sk} non-réinscrit(s) pour l'année ${toYear} ?`
    )) return;

    setSubmitting(true);
    try {
      const result = await studentApi.promote({
        fromYear,
        toYear,
        decisions: Object.entries(decisions).map(([studentId, decision]) => ({ studentId, decision })),
      });
      setDone(result);
      if (result.errors?.length) {
        showToast(`Passage effectué avec ${result.errors.length} erreur(s)`, 'error');
      } else {
        showToast(`Passage effectué : ${result.promoted} promu(s), ${result.repeated} redoublant(s)`, 'success');
      }
      setStudents([]);
    } catch {
      showToast('Erreur lors du passage en classe supérieure', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <ArrowRight className="h-6 w-6 text-emerald-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Passage en classe supérieure</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Prépare les inscriptions de la prochaine année scolaire en faisant passer les élèves.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Sélection des années */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Année source</label>
            <select
              value={fromYear}
              onChange={e => { setFromYear(e.target.value); setStudents([]); setDone(null); }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <ArrowRight size={20} className="text-gray-400 mb-2" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Année cible</label>
            <select
              value={toYear}
              onChange={e => { setToYear(e.target.value); setStudents([]); setDone(null); }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button
            type="button"
            onClick={handleLoad}
            disabled={loading || fromYear === toYear}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Charger les élèves
          </button>
        </div>

        {fromYear === toYear && (
          <p className="text-sm text-red-600">L'année source et l'année cible doivent être différentes.</p>
        )}

        {/* Résultat après soumission */}
        {done && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <span className="text-sm text-emerald-800">
              <strong>{done.promoted}</strong> promu(s) &bull; <strong>{done.repeated}</strong> redoublant(s) &bull; <strong>{done.skipped}</strong> non-réinscrit(s)
              — enregistrés pour l'année <strong>{toYear}</strong>.
            </span>
          </div>
        )}

        {/* Liste par classe */}
        {loaded && (
          <>
            <div className="space-y-3">
              {grouped.map(({ grade, list }) => {
                const next = NEXT_GRADE[grade];
                const open = !collapsed[grade];
                return (
                  <div key={grade} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* En-tête de classe */}
                    <div
                      className="flex items-center justify-between px-4 py-2 bg-gray-50 cursor-pointer select-none"
                      onClick={() => setCollapsed(p => ({ ...p, [grade]: !p[grade] }))}
                    >
                      <div className="flex items-center gap-3">
                        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span className="font-semibold text-gray-800">{grade}</span>
                        <span className="text-xs text-gray-500">{list.length} élève(s)</span>
                        {next && (
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            → {next}
                          </span>
                        )}
                        {!next && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Fin de cursus
                          </span>
                        )}
                      </div>
                      {/* Boutons "Tout…" pour la classe */}
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => setAll(grade, 'promoted')}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                          Tous passent
                        </button>
                        <button type="button" onClick={() => setAll(grade, 'repeat')}
                          className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200">
                          Tous redoublent
                        </button>
                        <button type="button" onClick={() => setAll(grade, 'skip')}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                          Aucun réinscrit
                        </button>
                      </div>
                    </div>

                    {/* Lignes élèves */}
                    {open && (
                      <div className="divide-y divide-gray-100">
                        {list.map(s => {
                          const d = decisions[s.id] ?? 'promoted';
                          const nextG = d === 'promoted' ? (NEXT_GRADE[s.grade] ?? s.grade) : d === 'repeat' ? s.grade : null;
                          return (
                            <div key={s.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
                              <div className="flex items-center gap-3 min-w-0">
                                {avatar(s)}
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-800 truncate">
                                    {s.lastName?.toUpperCase()} {s.firstName}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <span>{s.grade}</span>
                                    {nextG && d !== 'skip' && (
                                      <>
                                        <ArrowRight size={10} />
                                        <span className={d === 'repeat' ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
                                          {nextG}{d === 'repeat' ? ' (redouble)' : ''}
                                        </span>
                                      </>
                                    )}
                                    {d === 'skip' && (
                                      <span className="text-red-500 font-medium ml-1 flex items-center gap-1">
                                        <UserX size={10} /> Non réinscrit
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <DecisionBadge d={d} onChange={nd => setDecisions(p => ({ ...p, [s.id]: nd }))} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Résumé + bouton confirmer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="text-sm text-gray-600 flex gap-4">
                <span className="text-green-700 font-medium">{counts.p} passent</span>
                <span className="text-amber-700 font-medium">{counts.r} redoublent</span>
                <span className="text-red-700 font-medium">{counts.sk} non réinscrits</span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || students.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                Confirmer le passage vers {toYear}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
