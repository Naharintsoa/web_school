import { useState, useEffect } from 'react';
import { Users, Unlink, Link, X, Search, UserPlus } from 'lucide-react';
import type { Student } from '../../types/student';
import { studentApi } from '../../services/api';

interface SiblingsSectionProps {
  student: Student;
  allStudents: Student[];
  onStudentUpdated: (s: Student) => void;
  onOpenStudent: (s: Student) => void;
}

export function SiblingsSection({ student, allStudents, onStudentUpdated, onOpenStudent }: SiblingsSectionProps) {
  const [siblings, setSiblings] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');

  useEffect(() => {
    if (student.familyId) {
      setLoading(true);
      studentApi.getSiblings(student.familyId)
        .then(list => setSiblings(list.filter(s => s.id !== student.id)))
        .finally(() => setLoading(false));
    } else {
      setSiblings([]);
    }
  }, [student.familyId, student.id]);

  const handleDetach = async (sibling: Student) => {
    if (!confirm(`Retirer ${sibling.firstName} ${sibling.lastName} de cette fratrie ?`)) return;
    const updated = await studentApi.updateFamily(sibling.id, null);
    setSiblings(prev => prev.filter(s => s.id !== sibling.id));
    onStudentUpdated(updated);
  };

  const handleLink = async (target: Student) => {
    if (!student.familyId) return;
    const updated = await studentApi.updateFamily(target.id, student.familyId);
    setSiblings(prev => [...prev, updated]);
    onStudentUpdated(updated);
    setShowLinkModal(false);
    setLinkSearch('');
  };

  // Candidats : élèves qui ne font pas partie de la même fratrie
  const candidates = allStudents.filter(s => {
    if (s.id === student.id) return false;
    if (student.familyId && s.familyId === student.familyId) return false;
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    return name.includes(linkSearch.toLowerCase());
  });

  const initials = (s: Student) =>
    `${s.firstName?.[0] ?? ''}${s.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="max-w-2xl">

      {/* ── Carte fratrie ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-700">Fratrie</h4>
            {siblings.length > 0 && (
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {siblings.length}
              </span>
            )}
          </div>
          {student.familyId && (
            <button
              onClick={() => setShowLinkModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              <UserPlus size={12} /> Lier un élève
            </button>
          )}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-2 py-6 justify-center text-slate-400 text-sm">
              <span className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin" />
              Chargement…
            </div>
          ) : siblings.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Users size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">Aucune fratrie enregistrée</p>
              <p className="text-xs text-slate-400 mb-4">
                Cet élève n'est lié à aucun autre élève de l'établissement.
              </p>
              {!student.familyId && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Enregistrez d'abord l'élève avec les informations parents pour détecter automatiquement des fratries.
                </p>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {siblings.map(sib => (
                <li key={sib.id} className="group flex items-center gap-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl px-3 py-2.5 transition-colors">

                  {/* Avatar cliquable */}
                  <button
                    onClick={() => onOpenStudent(sib)}
                    className="w-10 h-10 rounded-full bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center flex-shrink-0 overflow-hidden transition-colors"
                    title={`Ouvrir la fiche de ${sib.firstName}`}
                  >
                    {sib.photoUrl
                      ? <img src={sib.photoUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="text-indigo-700 text-sm font-bold">{initials(sib)}</span>
                    }
                  </button>

                  {/* Nom cliquable */}
                  <button
                    onClick={() => onOpenStudent(sib)}
                    className="flex-1 min-w-0 text-left"
                    title={`Ouvrir la fiche de ${sib.firstName}`}
                  >
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">
                      {sib.lastName.toUpperCase()} {sib.firstName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">
                        {sib.grade}
                      </span>
                      {sib.schoolYear && (
                        <span className="text-xs text-slate-400">{sib.schoolYear}</span>
                      )}
                    </div>
                  </button>

                  {/* Bouton délier */}
                  <button
                    onClick={() => handleDetach(sib)}
                    title="Retirer de la fratrie"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                  >
                    <Unlink size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Bouton "Lier un élève" si pas encore de famille ── */}
      {!student.familyId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-indigo-700">Créer un lien de fratrie</p>
            <p className="text-xs text-indigo-500 mt-0.5">Associer cet élève à un frère ou une sœur</p>
          </div>
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            <Link size={13} /> Lier un élève
          </button>
        </div>
      )}

      {/* ── Modal de liaison ── */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="font-semibold text-slate-800 text-sm">Lier un élève à cette fratrie</p>
              <button onClick={() => { setShowLinkModal(false); setLinkSearch(''); }}>
                <X size={17} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un élève…"
                  value={linkSearch}
                  onChange={e => setLinkSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>
              <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                {candidates.length === 0 ? (
                  <li className="py-6 text-center text-xs text-slate-400">Aucun résultat.</li>
                ) : (
                  candidates.slice(0, 20).map(c => (
                    <li key={c.id}>
                      <button
                        onClick={() => handleLink(c)}
                        className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-indigo-50 rounded-lg text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {c.photoUrl
                            ? <img src={c.photoUrl} alt="" className="w-full h-full object-cover" />
                            : <span className="text-slate-500 text-xs font-bold">{initials(c)}</span>
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {c.lastName.toUpperCase()} {c.firstName}
                          </p>
                          <p className="text-xs text-slate-500">{c.grade}</p>
                        </div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
