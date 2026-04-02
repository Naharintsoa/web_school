import { useState, useEffect } from 'react';
import { Users, Unlink, Link, X, Search } from 'lucide-react';
import type { Student } from '../../types/student';
import { studentApi } from '../../services/api';

interface SiblingsSectionProps {
  student: Student;
  allStudents: Student[];
  onStudentUpdated: (s: Student) => void;
}

export function SiblingsSection({ student, allStudents, onStudentUpdated }: SiblingsSectionProps) {
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

  // Élèves non membres de la fratrie actuelle (candidats au lien)
  const candidates = allStudents.filter(s =>
    s.id !== student.id &&
    s.familyId !== student.familyId &&
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(linkSearch.toLowerCase())
  );

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Users size={15} className="text-indigo-500" />
          Fratries
          {siblings.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {siblings.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowLinkModal(true)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <Link size={13} />
          Lier un élève
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 italic">Chargement…</p>
      ) : siblings.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Aucune fratrie détectée.</p>
      ) : (
        <ul className="space-y-2">
          {siblings.map(sib => (
            <li
              key={sib.id}
              className="flex items-center gap-3 bg-indigo-50 rounded-lg px-3 py-2"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {sib.photoUrl
                  ? <img src={sib.photoUrl} alt="" className="w-full h-full object-cover" />
                  : <span className="text-indigo-700 text-xs font-bold">
                      {sib.firstName[0]}{sib.lastName[0]}
                    </span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {sib.lastName.toUpperCase()} {sib.firstName}
                </p>
                <p className="text-xs text-gray-500">{sib.grade}</p>
              </div>
              <button
                onClick={() => handleDetach(sib)}
                title="Retirer de la fratrie"
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Unlink size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de liaison */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-800 text-sm">Lier un élève à cette fratrie</p>
              <button onClick={() => { setShowLinkModal(false); setLinkSearch(''); }}>
                <X size={17} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un élève…"
                  value={linkSearch}
                  onChange={e => setLinkSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>
              <ul className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                {candidates.length === 0 ? (
                  <li className="py-6 text-center text-xs text-gray-400">Aucun résultat.</li>
                ) : (
                  candidates.slice(0, 20).map(c => (
                    <li key={c.id}>
                      <button
                        onClick={() => handleLink(c)}
                        className="w-full flex items-center gap-3 px-2 py-2.5 hover:bg-indigo-50 rounded-lg text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {c.photoUrl
                            ? <img src={c.photoUrl} alt="" className="w-full h-full object-cover" />
                            : <span className="text-gray-500 text-xs font-bold">{c.firstName[0]}{c.lastName[0]}</span>
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {c.lastName.toUpperCase()} {c.firstName}
                          </p>
                          <p className="text-xs text-gray-500">{c.grade}</p>
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
