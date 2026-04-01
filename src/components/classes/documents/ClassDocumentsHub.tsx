/**
 * Hub Documents de classe.
 *
 * Regroupe en un seul endroit :
 *  - Cartes d'identité scolaires (multi-sélection)
 *  - Badges (multi-sélection)
 *  - Certificat de scolarité (par élève)
 *  - Certificat de radiation  (par élève)
 *
 * Remplace les entrées éparpillées dans ClassCard et StudentListTable.
 */
import React, { useState, useMemo } from 'react';
import {
  X, Search, CreditCard, FileCheck, FileX, Contact,
  Users, CheckSquare, Square, Printer,
} from 'lucide-react';
import type { Student } from '../../../types';
import { BadgePreview } from '../../badges/BadgePreview';
import { CertificatePreview } from '../certificates/CertificatePreview';
import { IdentityCardPreview } from '../identity-cards/IdentityCardPreview';

type DocType = 'identity' | 'badge' | 'scolarite' | 'radiation';

interface DocOption {
  key: DocType;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  multi: boolean;
  color: string;
  bg: string;
}

const DOC_OPTIONS: DocOption[] = [
  {
    key: 'identity',
    label: "Carte d'identité scolaire",
    sublabel: 'Sélectionner des élèves',
    icon: <Contact size={22} />,
    multi: true,
    color: 'text-violet-700',
    bg: 'bg-violet-50 border-violet-200 hover:border-violet-400',
  },
  {
    key: 'badge',
    label: 'Badges',
    sublabel: 'Sélectionner des élèves',
    icon: <CreditCard size={22} />,
    multi: true,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
  },
  {
    key: 'scolarite',
    label: 'Certificat de scolarité',
    sublabel: 'Choisir un élève',
    icon: <FileCheck size={22} />,
    multi: false,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
  },
  {
    key: 'radiation',
    label: 'Certificat de radiation',
    sublabel: 'Choisir un élève',
    icon: <FileX size={22} />,
    multi: false,
    color: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200 hover:border-rose-400',
  },
];

interface ClassDocumentsHubProps {
  grade: string;
  students: Student[];
  onClose: () => void;
}

export function ClassDocumentsHub({ grade, students, onClose }: ClassDocumentsHubProps) {
  const [activeDoc, setActiveDoc] = useState<DocType>('identity');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Prévisualisation
  const [showBadgePreview, setShowBadgePreview] = useState(false);
  const [showIdentityPreview, setShowIdentityPreview] = useState(false);
  const [certStudent, setCertStudent] = useState<Student | null>(null);
  const [certType, setCertType] = useState<'scolarite' | 'radiation'>('scolarite');

  const option = DOC_OPTIONS.find(o => o.key === activeDoc)!;

  const filtered = useMemo(() =>
    students.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (s.matricule || '').includes(search)
    ), [students, search]);

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(s => s.id)));
    }
  };

  const handleChangeDoc = (key: DocType) => {
    setActiveDoc(key);
    setSearch('');
    setSelected(new Set());
  };

  const selectedStudents = students.filter(s => selected.has(s.id));

  const handleGenerate = () => {
    if (activeDoc === 'badge') { setShowBadgePreview(true); return; }
    if (activeDoc === 'identity') { setShowIdentityPreview(true); return; }
  };

  const handleCertClick = (student: Student, type: 'scolarite' | 'radiation') => {
    setCertStudent(student);
    setCertType(type);
  };

  // ── Prévisualisations ──────────────────────────────────────────────────────

  if (showBadgePreview) {
    return (
      <BadgePreview
        students={selectedStudents.length > 0 ? selectedStudents : students}
        onClose={() => setShowBadgePreview(false)}
      />
    );
  }

  if (showIdentityPreview) {
    return (
      <IdentityCardPreview
        students={selectedStudents.length > 0 ? selectedStudents : students}
        onClose={() => setShowIdentityPreview(false)}
      />
    );
  }

  if (certStudent) {
    return (
      <CertificatePreview
        type={certType}
        student={certStudent}
        onClose={() => setCertStudent(null)}
      />
    );
  }

  // ── Rendu principal ────────────────────────────────────────────────────────

  const isMulti = option.multi;
  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Printer size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">Documents de classe</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Users size={11} /> {grade} · {students.length} élève{students.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Sélection du type de document ── */}
        <div className="px-6 pt-4 pb-3 grid grid-cols-4 gap-2">
          {DOC_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => handleChangeDoc(opt.key)}
              className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all text-center ${
                activeDoc === opt.key
                  ? `${opt.bg} border-current ${opt.color} shadow-sm`
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <span className={activeDoc === opt.key ? opt.color : 'text-slate-400'}>{opt.icon}</span>
              <span className="text-[11px] font-semibold leading-tight">{opt.label}</span>
              <span className="text-[10px] text-slate-400 leading-tight">{opt.sublabel}</span>
            </button>
          ))}
        </div>

        {/* ── Barre recherche + sélection tout ── */}
        <div className="px-6 py-2 flex items-center gap-3 border-b border-slate-100">
          {isMulti && (
            <button
              onClick={toggleAll}
              className="flex-shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
              title={allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
            >
              {allSelected ? (
                <CheckSquare size={18} className="text-indigo-600" />
              ) : someSelected ? (
                <CheckSquare size={18} className="text-indigo-400" />
              ) : (
                <Square size={18} />
              )}
            </button>
          )}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un élève…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          {isMulti && selected.size > 0 && (
            <button
              onClick={handleGenerate}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white shadow-sm active:scale-95 transition-all ${
                activeDoc === 'identity'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
              }`}
            >
              <Printer size={15} />
              Générer ({selected.size})
            </button>
          )}
        </div>

        {/* ── Liste des élèves ── */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">Aucun élève trouvé.</div>
          ) : (
            filtered.map(student => {
              const isChecked = selected.has(student.id);
              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isMulti && isChecked ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Checkbox multi-sélection */}
                  {isMulti && (
                    <button
                      onClick={() => toggleOne(student.id)}
                      className="flex-shrink-0 text-slate-400 hover:text-indigo-600"
                    >
                      {isChecked
                        ? <CheckSquare size={17} className="text-indigo-600" />
                        : <Square size={17} />}
                    </button>
                  )}

                  {/* Infos élève */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => isMulti && toggleOne(student.id)}
                  >
                    <p className="font-semibold text-slate-800 text-sm">
                      {student.lastName.toUpperCase()} {student.firstName}
                    </p>
                    <p className="text-xs text-slate-400">
                      Mat. {student.matricule || '—'}
                      {student.issNumber ? ` · ISS ${student.issNumber}` : ''}
                    </p>
                  </div>

                  {/* Actions mono-sélection (certificats) */}
                  {!isMulti && (
                    <button
                      onClick={() => handleCertClick(student, activeDoc as 'scolarite' | 'radiation')}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all active:scale-95 ${
                        activeDoc === 'scolarite'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      <Printer size={13} />
                      Générer
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Pied de page : bouton générer tout (multi) ── */}
        {isMulti && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {selected.size} / {students.length} élève{students.length > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
            </p>
            <button
              onClick={handleGenerate}
              disabled={selected.size === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all"
            >
              <Printer size={15} />
              {selected.size === 0
                ? `Sélectionner des élèves`
                : `Générer ${selected.size} ${option.label.toLowerCase()}${selected.size > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
