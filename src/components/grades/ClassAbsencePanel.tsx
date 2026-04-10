import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Clock, Save, Pencil, CheckCircle } from 'lucide-react';
import { bulletinRemarksApi, type BulletinRemark } from '../../services/api/bulletinRemarksApi';
import type { Student } from '../../types';

interface ClassAbsencePanelProps {
  students: Student[];
  term: 1 | 2 | 3;
}

type RemarksMap = Record<string, BulletinRemark>;

const EMPTY = (studentId: string, term: 1 | 2 | 3): BulletinRemark => ({
  studentId, term, observation: '', mention: '', absences: '', demiJournees: '', retards: '',
});

export function ClassAbsencePanel({ students, term }: ClassAbsencePanelProps) {
  const [open,    setOpen]    = useState(false);
  const [remarks, setRemarks] = useState<RemarksMap>({});
  const [loading, setLoading] = useState(false);
  const [dirty,   setDirty]   = useState<Record<string, boolean>>({});
  const [saving,  setSaving]  = useState<Record<string, boolean>>({});
  const [saved,   setSaved]   = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (students.length === 0) return;
    setLoading(true);
    try {
      const list = await bulletinRemarksApi.getBatch(students.map(s => s.id), term);
      const map: RemarksMap = {};
      for (const s of students) map[s.id] = EMPTY(s.id, term);
      for (const r of list)     map[r.studentId] = r;
      setRemarks(map);
      setDirty({});
      setSaved({});
    } finally {
      setLoading(false);
    }
  }, [students, term]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleChange = (
    studentId: string,
    field: keyof Omit<BulletinRemark, 'studentId' | 'term'>,
    value: string,
  ) => {
    setRemarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
    setDirty(prev  => ({ ...prev, [studentId]: true }));
    setSaved(prev  => ({ ...prev, [studentId]: false }));
  };

  const handleSave = async (studentId: string) => {
    const r = remarks[studentId];
    setSaving(prev => ({ ...prev, [studentId]: true }));
    try {
      await bulletinRemarksApi.save(studentId, term, {
        observation: r.observation, mention: r.mention,
        absences: r.absences, demiJournees: r.demiJournees, retards: r.retards,
      });
      setDirty(prev  => ({ ...prev, [studentId]: false }));
      setSaved(prev  => ({ ...prev, [studentId]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [studentId]: false })), 3000);
    } finally {
      setSaving(prev => ({ ...prev, [studentId]: false }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">

      {/* En-tête accordéon */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
            <Clock className="text-amber-600" size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Retards et Absences</p>
            <p className="text-xs text-gray-500">
              Trimestre {term} — {students.length} élève{students.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Corps */}
      <div className={`transition-all duration-300 overflow-hidden ${open ? 'max-h-[2000px]' : 'max-h-0'}`}>
        <div className="border-t border-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              Chargement…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[170px]">Élève</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Absences</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Demi-journées</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Retards</th>
                    <th className="px-3 py-3 w-36" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student, i) => {
                    const r = remarks[student.id];
                    if (!r) return null;
                    const isDirty  = dirty[student.id];
                    const isSaving = saving[student.id];
                    const isSaved  = saved[student.id];

                    return (
                      <tr key={student.id} className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-amber-50/30`}>

                        {/* Nom */}
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-900 text-sm leading-tight">{student.lastName} {student.firstName}</p>
                          <p className="text-xs text-gray-400">N°{student.studentNumber}</p>
                        </td>

                        {/* Absences */}
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={r.absences}
                            onChange={e => handleChange(student.id, 'absences', e.target.value)}
                            className="w-full text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition"
                            placeholder="0"
                          />
                        </td>

                        {/* Demi-journées */}
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={r.demiJournees}
                            onChange={e => handleChange(student.id, 'demiJournees', e.target.value)}
                            className="w-full text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition"
                            placeholder="0"
                          />
                        </td>

                        {/* Retards */}
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={r.retards}
                            onChange={e => handleChange(student.id, 'retards', e.target.value)}
                            className="w-full text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition"
                            placeholder="0"
                          />
                        </td>

                        {/* Bouton unique */}
                        <td className="px-3 py-2.5 text-right">
                          {isSaving ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-600">
                              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                              Enregistrement…
                            </div>
                          ) : isSaved && !isDirty ? (
                            <button
                              onClick={() => handleSave(student.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                              <Pencil size={13} />
                              Modifier
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSave(student.id)}
                              disabled={!isDirty}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Save size={13} />
                              Enregistrer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
