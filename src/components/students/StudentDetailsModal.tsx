import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Edit2, Trash2, Phone, Mail, MapPin,
  Camera, FileText, User, Image, AlertCircle, Save, X,
  Upload, Check, BookOpen, Users, Heart, Shield, GraduationCap,
  Calendar, Hash, CheckCircle2, XCircle, Printer, Menu,
} from 'lucide-react';
import type { Student } from '../../types/student';
import { SiblingsSection } from './SiblingsSection';
import { CertificatePreview } from '../classes/certificates/CertificatePreview';
import { IdentityCardPreview } from '../classes/identity-cards/IdentityCardPreview';
import { BadgePreview } from '../badges/BadgePreview';
import { studentApi } from '../../services/api';

type Tab = 'classe' | 'adresse' | 'parents' | 'fratrie' | 'sante' | 'photos' | 'documents';
type DocPreview = 'scolarite' | 'radiation' | 'scolarite-doublon' | 'radiation-doublon' | 'identity' | 'badge' | null;

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'classe',    label: 'Classe',            icon: <GraduationCap size={15} /> },
  { key: 'adresse',   label: 'Adresse',           icon: <MapPin size={15} /> },
  { key: 'parents',   label: 'Parents',           icon: <Users size={15} /> },
  { key: 'fratrie',   label: 'Fratrie',           icon: <Heart size={15} /> },
  { key: 'sante',     label: 'Santé',             icon: <Shield size={15} /> },
  { key: 'photos',    label: 'Photos',            icon: <Image size={15} /> },
  { key: 'documents', label: 'Documents',         icon: <FileText size={15} /> },
];

interface Props {
  student: Student;
  allStudents: Student[];
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

function dossierScore(s: Student): number {
  const fields = [s.photoUrl, s.dateOfBirth, s.parentInfo?.fatherName, s.parentInfo?.motherName,
    s.parentInfo?.fatherPhone, s.parentInfo?.motherPhone, s.parentInfo?.address, s.parentInfo?.email, s.issNumber];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
}

export function StudentDetailsModal({ student, allStudents, onClose, onEdit, onDelete }: Props) {
  const [current, setCurrent] = useState<Student>(student);
  const [activeTab, setActiveTab] = useState<Tab>('classe');
  const [docPreview, setDocPreview] = useState<DocPreview>(null);
  const [editIss, setEditIss] = useState(false);
  const [issVal, setIssVal] = useState(current.issNumber ?? '');
  const [savingIss, setSavingIss] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingFresh, setLoadingFresh] = useState(false);

  // Charger les données fraîches depuis le serveur à chaque ouverture
  useEffect(() => {
    let cancelled = false;
    setLoadingFresh(true);
    studentApi.getById(student.id)
      .then(fresh => {
        if (!cancelled) {
          setCurrent(fresh);
          setIssVal(fresh.issNumber ?? '');
          onEdit(fresh);
        }
      })
      .catch(() => { /* utiliser les données du prop si l'appel échoue */ })
      .finally(() => { if (!cancelled) setLoadingFresh(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  const savePartial = async (patch: Partial<Omit<Student, 'id'>>) => {
    const payload = { ...current, ...patch };
    const updated = await studentApi.update(current.id, payload);
    setCurrent(updated);
    onEdit(updated);
    return updated;
  };

  // ── Prévisualisations documents ──────────────────────────────────────────
  if (docPreview === 'scolarite' || docPreview === 'radiation')
    return <CertificatePreview type={docPreview} student={current} onClose={() => setDocPreview(null)} />;
  if (docPreview === 'scolarite-doublon')
    return <CertificatePreview type="scolarite" student={current} onClose={() => setDocPreview(null)} />;
  if (docPreview === 'radiation-doublon')
    return <CertificatePreview type="radiation" student={current} onClose={() => setDocPreview(null)} />;
  if (docPreview === 'identity')
    return <IdentityCardPreview students={[current]} onClose={() => setDocPreview(null)} />;
  if (docPreview === 'badge')
    return <BadgePreview students={[current]} onClose={() => setDocPreview(null)} />;

  const score = dossierScore(current);
  const initials = `${current.firstName[0] ?? ''}${current.lastName[0] ?? ''}`.toUpperCase();

  const handleSaveIss = async () => {
    setSavingIss(true);
    try { await savePartial({ issNumber: issVal }); setEditIss(false); }
    finally { setSavingIss(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Barre supérieure ── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 flex items-center gap-2 sm:gap-3 shadow-sm print:hidden">
        {/* Burger mobile */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={18} />
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={15} /> <span className="hidden sm:inline">Retour</span>
        </button>
        <div className="h-5 w-px bg-slate-200 hidden sm:block" />
        <span className="text-sm text-slate-400 hidden sm:block truncate">
          {current.firstName} <span className="uppercase font-semibold text-slate-600">{current.lastName}</span>
        </span>
        {/* Nom compact sur mobile */}
        <span className="text-sm font-semibold text-slate-700 lg:hidden flex-1 truncate">
          {current.firstName} {current.lastName.toUpperCase()}
        </span>
        <div className="flex-1 hidden lg:block" />
        <button
          onClick={() => onDelete(current)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
        >
          <Trash2 size={13} /> <span className="hidden sm:inline">Supprimer</span>
        </button>
      </header>

      {/* ── Corps principal ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* Backdrop mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ════════════════ SIDEBAR ════════════════ */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 flex flex-col overflow-y-auto w-72 transition-transform duration-300
            lg:relative lg:translate-x-0 lg:z-auto lg:flex-shrink-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{ background: 'linear-gradient(160deg, #1e3a5f 0%, #1e2d4f 50%, #0f172a 100%)' }}
        >
          {/* Bouton fermer (mobile only) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 transition-colors z-10"
          >
            <X size={16} />
          </button>

          {/* ── Avatar + identité ── */}
          <div className="flex flex-col items-center pt-8 pb-6 px-5 border-b border-white/10">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl bg-indigo-800 flex items-center justify-center">
                {current.photoUrl
                  ? <img src={current.photoUrl} alt="" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-white/80">{initials}</span>}
              </div>
              {/* Indicateur de score */}
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg text-white text-xs font-bold ring-2 ring-slate-900 ${score === 100 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}>
                {score < 100 ? <span style={{ fontSize: 9 }}>{score}%</span> : <Check size={13} />}
              </div>
            </div>

            <p className="text-base font-bold text-white text-center leading-snug">
              {current.firstName}{' '}
              <span className="uppercase">{current.lastName}</span>
            </p>
            {current.commonName && (
              <p className="text-xs text-amber-300 mt-0.5">« {current.commonName} »</p>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
              <span className="bg-indigo-500/30 text-indigo-200 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-400/30">
                {current.grade}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                current.gender === 'male'
                  ? 'bg-sky-500/20 text-sky-200 border-sky-400/30'
                  : 'bg-pink-500/20 text-pink-200 border-pink-400/30'
              }`}>
                {current.gender === 'male' ? 'Garçon' : 'Fille'}
              </span>
            </div>

            <button
              onClick={() => setActiveTab('photos')}
              className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl transition-colors border border-white/10"
            >
              <Camera size={13} /> Modifier la photo
            </button>
          </div>

          {/* Indicateur de chargement */}
          {loadingFresh && (
            <div className="mx-4 mt-3 flex items-center gap-2 text-white/40 text-xs">
              <span className="w-3 h-3 border border-white/30 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Actualisation…
            </div>
          )}

          {/* ── Barre de complétion ── */}
          <div className="mx-4 mt-4 mb-2 bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60 font-medium">Dossier complet</span>
              <span className={`text-xs font-bold ${score === 100 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                {score}%
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${score === 100 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* ── Infos rapides ── */}
          <div className="px-4 py-3 space-y-2">
            <SidebarRow icon={<Calendar size={13} />} label="Naissance"
              value={current.dateOfBirth ? new Date(current.dateOfBirth).toLocaleDateString('fr-FR') : '—'} />
            <SidebarRow icon={<BookOpen size={13} />} label="Année"
              value={current.schoolYear || '—'} />
            <SidebarRow icon={<Hash size={13} />} label="Matricule"
              value={current.matricule || '—'} />
            <SidebarRow icon={<Calendar size={13} />} label="Inscrit le"
              value={current.enrollmentDate ? new Date(current.enrollmentDate).toLocaleDateString('fr-FR') : '—'} />
          </div>

          {/* ── Séparateur ── */}
          <div className="mx-4 my-1 border-t border-white/10" />

          {/* ── ISS éditable ── */}
          <div className="px-4 py-3">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2">Numéro ISS</p>
            {editIss ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  value={issVal}
                  onChange={e => setIssVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveIss(); if (e.key === 'Escape') setEditIss(false); }}
                  className="flex-1 min-w-0 bg-white/10 border border-white/30 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="ISS-2024-001"
                />
                <button onClick={handleSaveIss} disabled={savingIss}
                  className="p-1.5 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-300 transition-colors">
                  <Check size={13} />
                </button>
                <button onClick={() => { setEditIss(false); setIssVal(current.issNumber ?? ''); }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 transition-colors">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <span className={`text-sm font-medium ${current.issNumber ? 'text-white' : 'text-white/30 italic'}`}>
                  {current.issNumber || 'Non renseigné'}
                </span>
                <button
                  onClick={() => { setIssVal(current.issNumber ?? ''); setEditIss(true); }}
                  className="p-1 rounded text-white/30 hover:text-white/70 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Edit2 size={11} />
                </button>
              </div>
            )}
          </div>

          {/* ── Navigation (onglets verticaux) ── */}
          <div className="px-3 pb-6 mt-2">
            <p className="text-xs text-white/30 font-semibold uppercase tracking-wider px-2 mb-2">Navigation</p>
            <nav className="space-y-0.5">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-indigo-500/40 text-white border border-indigo-400/40 shadow-inner'
                      : 'text-white/50 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <span className={activeTab === tab.key ? 'text-indigo-300' : 'text-white/40'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {tab.key === 'documents' && score < 100 && (
                    <span className="ml-auto bg-red-500/70 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                      !
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ════════════════ CONTENU PRINCIPAL ════════════════ */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">

          {/* ── Profil compact mobile (visible uniquement < lg) ── */}
          <div className="lg:hidden flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-800 flex items-center justify-center flex-shrink-0 ring-2 ring-indigo-200">
              {current.photoUrl
                ? <img src={current.photoUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-white">{initials}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{current.firstName} {current.lastName.toUpperCase()}</p>
              <p className="text-xs text-slate-400">{current.grade} · {current.schoolYear}</p>
            </div>
            <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${score === 100 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
              {score}%
            </div>
          </div>

          {/* ── Tabs horizontaux scrollables (mobile only) ── */}
          <div className="lg:hidden flex-shrink-0 flex overflow-x-auto bg-white border-b border-slate-200 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors relative ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500'
                }`}
              >
                {tab.icon}
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.key === 'documents' && score < 100 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* ── Bandeau titre desktop ── */}
          <div className="hidden lg:flex flex-shrink-0 bg-white border-b border-slate-200 px-6 py-3 items-center justify-between shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {TABS.find(t => t.key === activeTab)?.label}
              </h2>
              <p className="text-xs text-slate-400">
                {current.firstName} {current.lastName.toUpperCase()} · {current.grade}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            {activeTab === 'classe'    && <TabClasse student={current} onGenerate={setDocPreview} />}
            {activeTab === 'adresse'   && <TabAdresse student={current} onSave={p => savePartial(p)} />}
            {activeTab === 'parents'   && <TabParents student={current} onSave={p => savePartial(p)} />}
            {activeTab === 'fratrie'   && (
              <SiblingsSection
                student={current}
                allStudents={allStudents}
                onStudentUpdated={s => { if (s.id === current.id) setCurrent(s); }}
              />
            )}
            {activeTab === 'sante'     && <TabSante />}
            {activeTab === 'photos'    && <TabPhotos student={current} onSave={p => savePartial(p)} />}
            {activeTab === 'documents' && <TabDocuments student={current} onTabChange={setActiveTab} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Sidebar row ──────────────────────────────────────────────────────────────
function SidebarRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-indigo-300/60 flex-shrink-0">{icon}</span>
      <span className="text-xs text-white/40 w-16 flex-shrink-0">{label}</span>
      <span className="text-xs text-white/80 font-medium truncate">{value}</span>
    </div>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────
function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
    />
  );
}

function EditBar({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-5">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all"
      >
        {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
        Enregistrer
      </button>
      <button onClick={onCancel}
        className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
        Annuler
      </button>
    </div>
  );
}

// ─── Onglet Classe ────────────────────────────────────────────────────────────
function TabClasse({ student, onGenerate }: { student: Student; onGenerate: (d: DocPreview) => void }) {
  const docs: { label: string; key: DocPreview; color: string }[] = [
    { label: 'Certificat de scolarité',              key: 'scolarite',         color: 'indigo' },
    { label: 'Certificat de radiation',              key: 'radiation',         color: 'red' },
    { label: 'Certificat de scolarité (doublon)',    key: 'scolarite-doublon', color: 'indigo' },
    { label: 'Certificat de radiation (doublon)',    key: 'radiation-doublon', color: 'red' },
    { label: "Carte d'identité scolaire",            key: 'identity',          color: 'teal' },
    { label: 'Badge élève',                          key: 'badge',             color: 'amber' },
  ];

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
    red:    'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    teal:   'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100',
    amber:  'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
  };

  return (
    <div className="max-w-2xl">
      <SectionCard title="Scolarité actuelle">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
            <p className="text-xs text-indigo-400 font-medium mb-1">Classe</p>
            <p className="text-xl font-bold text-indigo-700">{student.grade}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-1">Année</p>
            <p className="text-sm font-bold text-slate-700">{student.schoolYear || '—'}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
            <p className="text-xs text-emerald-400 font-medium mb-1">Statut</p>
            <p className="text-sm font-bold text-emerald-600">En cours</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Documents à éditer" action={<Printer size={14} className="text-slate-400" />}>
        <div className="grid grid-cols-2 gap-2">
          {docs.map(doc => (
            <button
              key={doc.key}
              onClick={() => onGenerate(doc.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left ${colorMap[doc.color]}`}
            >
              <FileText size={14} className="flex-shrink-0" />
              {doc.label}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Onglet Adresse ───────────────────────────────────────────────────────────
function TabAdresse({ student, onSave }: { student: Student; onSave: (p: Partial<Omit<Student,'id'>>) => Promise<unknown> }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [address, setAddress] = useState(student.parentInfo?.address ?? '');
  const [email, setEmail]     = useState(student.parentInfo?.email ?? '');

  // Sync form state quand les données fraîches arrivent
  useEffect(() => {
    if (!editing) {
      setAddress(student.parentInfo?.address ?? '');
      setEmail(student.parentInfo?.email ?? '');
    }
  }, [student.parentInfo?.address, student.parentInfo?.email, editing]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave({ parentInfo: { ...student.parentInfo, address, email } }); setEditing(false); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    setAddress(student.parentInfo?.address ?? '');
    setEmail(student.parentInfo?.email ?? '');
    setEditing(false);
  };

  return (
    <div className="max-w-xl">
      <SectionCard
        title="Coordonnées"
        action={!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors">
            <Edit2 size={12} /> Modifier
          </button>
        ) : undefined}
      >
        {editing ? (
          <div className="space-y-4">
            <Field label="Adresse">
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Adresse complète"
              />
            </Field>
            <Field label="Email de contact">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </Field>
            <EditBar onSave={handleSave} onCancel={handleCancel} saving={saving} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={15} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">Adresse</p>
                <p className="text-sm text-slate-700">
                  {student.parentInfo?.address || <span className="text-slate-400 italic">Non renseignée</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Mail size={15} className="text-sky-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium mb-0.5">Email</p>
                <p className="text-sm text-slate-700">
                  {student.parentInfo?.email || <span className="text-slate-400 italic">Non renseigné</span>}
                </p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Onglet Parents ───────────────────────────────────────────────────────────
function TabParents({ student, onSave }: { student: Student; onSave: (p: Partial<Omit<Student,'id'>>) => Promise<unknown> }) {
  const pi = student.parentInfo ?? {} as typeof student.parentInfo;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({
    fatherName: pi.fatherName ?? '', fatherOccupation: pi.fatherOccupation ?? '',
    fatherPhone: pi.fatherPhone ?? '', fatherEmail: pi.fatherEmail ?? '',
    motherName: pi.motherName ?? '', motherOccupation: pi.motherOccupation ?? '',
    motherPhone: pi.motherPhone ?? '', motherEmail: pi.motherEmail ?? '',
  });

  // Sync form state quand les données fraîches arrivent
  useEffect(() => {
    if (!editing) {
      const p = student.parentInfo ?? {} as typeof student.parentInfo;
      setForm({
        fatherName: p.fatherName ?? '', fatherOccupation: p.fatherOccupation ?? '',
        fatherPhone: p.fatherPhone ?? '', fatherEmail: p.fatherEmail ?? '',
        motherName: p.motherName ?? '', motherOccupation: p.motherOccupation ?? '',
        motherPhone: p.motherPhone ?? '', motherEmail: p.motherEmail ?? '',
      });
    }
  }, [student.parentInfo, editing]);

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave({ parentInfo: { ...pi, ...form } }); setEditing(false); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    const p = student.parentInfo ?? {} as typeof student.parentInfo;
    setForm({
      fatherName: p.fatherName ?? '', fatherOccupation: p.fatherOccupation ?? '',
      fatherPhone: p.fatherPhone ?? '', fatherEmail: p.fatherEmail ?? '',
      motherName: p.motherName ?? '', motherOccupation: p.motherOccupation ?? '',
      motherPhone: p.motherPhone ?? '', motherEmail: p.motherEmail ?? '',
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="max-w-2xl">
        <SectionCard title="Informations parents — Édition">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                  <User size={11} className="text-white" />
                </div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Père</span>
              </div>
              <Field label="Nom complet"><Input value={form.fatherName} onChange={set('fatherName')} placeholder="Nom du père" /></Field>
              <Field label="Profession"><Input value={form.fatherOccupation} onChange={set('fatherOccupation')} placeholder="Profession" /></Field>
              <Field label="Téléphone"><Input value={form.fatherPhone} onChange={set('fatherPhone')} placeholder="+261..." /></Field>
              <Field label="Email">
                <input type="email" value={form.fatherEmail} onChange={e => set('fatherEmail')(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </Field>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                  <User size={11} className="text-white" />
                </div>
                <span className="text-xs font-bold text-pink-600 uppercase tracking-wide">Mère</span>
              </div>
              <Field label="Nom complet"><Input value={form.motherName} onChange={set('motherName')} placeholder="Nom de la mère" /></Field>
              <Field label="Profession"><Input value={form.motherOccupation} onChange={set('motherOccupation')} placeholder="Profession" /></Field>
              <Field label="Téléphone"><Input value={form.motherPhone} onChange={set('motherPhone')} placeholder="+261..." /></Field>
              <Field label="Email">
                <input type="email" value={form.motherEmail} onChange={e => set('motherEmail')(e.target.value)}
                  placeholder="email@exemple.com"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
              </Field>
            </div>
          </div>
          <EditBar onSave={handleSave} onCancel={handleCancel} saving={saving} />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <SectionCard
        title="Informations parents"
        action={
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors">
            <Edit2 size={12} /> Modifier
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParentCard title="Père" accent="indigo"
            name={pi.fatherName} job={pi.fatherOccupation} phone={pi.fatherPhone} email={pi.fatherEmail} />
          <ParentCard title="Mère" accent="pink"
            name={pi.motherName} job={pi.motherOccupation} phone={pi.motherPhone} email={pi.motherEmail} />
        </div>
      </SectionCard>
    </div>
  );
}

function ParentCard({ title, accent, name, job, phone, email }: {
  title: string; accent: 'indigo' | 'pink';
  name?: string; job?: string; phone?: string; email?: string;
}) {
  const accentClasses = accent === 'indigo'
    ? { border: 'border-l-indigo-400', bg: 'bg-indigo-600', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700' }
    : { border: 'border-l-pink-400',   bg: 'bg-pink-500',   text: 'text-pink-600',   badge: 'bg-pink-100 text-pink-700' };

  const Row = ({ icon, val }: { icon: React.ReactNode; val?: string }) => (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className={`${accentClasses.text} opacity-60`}>{icon}</span>
      <span>{val || <span className="text-slate-300 italic text-xs">—</span>}</span>
    </div>
  );

  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 ${accentClasses.border} p-4 bg-white shadow-sm`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-full ${accentClasses.bg} flex items-center justify-center shadow-sm`}>
          <User size={13} className="text-white" />
        </div>
        <span className={`text-xs font-bold uppercase tracking-wider ${accentClasses.text}`}>{title}</span>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Nom complet</p>
          <p className="text-sm font-semibold text-slate-800">{name || <span className="text-slate-300 italic">Non renseigné</span>}</p>
        </div>
        {job && <p className="text-xs text-slate-500 italic">{job}</p>}
        <Row icon={<Phone size={12} />} val={phone} />
        <Row icon={<Mail size={12} />} val={email} />
      </div>
    </div>
  );
}

// ─── Onglet Données de santé ──────────────────────────────────────────────────
function TabSante() {
  return (
    <div className="max-w-xl">
      <SectionCard title="Données de santé">
        <div className="flex flex-col items-center py-8 text-slate-400">
          <Shield size={40} className="mb-3 opacity-20" />
          <p className="text-sm italic">Aucune donnée de santé enregistrée.</p>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Onglet Photos ─────────────────────────────────────────────────────────────
function TabPhotos({ student, onSave }: { student: Student; onSave: (p: Partial<Omit<Student,'id'>>) => Promise<unknown> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try { await onSave({ photoUrl: preview }); setPreview(null); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-lg">
      <SectionCard title="Photo de l'élève">
        <div className="flex items-start gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Actuelle</p>
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center shadow-inner">
              {student.photoUrl
                ? <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                : <Image size={32} className="text-slate-300" />}
            </div>
          </div>

          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Nouvelle photo</p>
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="" className="w-32 h-32 object-cover rounded-2xl border-2 border-indigo-200 shadow-md" />
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm">
                    {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                    Enregistrer
                  </button>
                  <button onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 w-32 h-32 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all">
                  <Upload size={20} />
                  <span className="text-xs font-medium">Choisir</span>
                </button>
                <p className="text-xs text-slate-400 mt-2">JPG, PNG, WEBP</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Onglet Documents manquants ───────────────────────────────────────────────
function TabDocuments({ student, onTabChange }: { student: Student; onTabChange: (t: Tab) => void }) {
  const checks: { label: string; ok: boolean; tab?: Tab }[] = [
    { label: 'Photo de l\'élève',  ok: !!student.photoUrl,                 tab: 'photos' },
    { label: 'Date de naissance',  ok: !!student.dateOfBirth },
    { label: 'Nom du père',        ok: !!student.parentInfo?.fatherName,   tab: 'parents' },
    { label: 'Téléphone père',     ok: !!student.parentInfo?.fatherPhone,  tab: 'parents' },
    { label: 'Nom de la mère',     ok: !!student.parentInfo?.motherName,   tab: 'parents' },
    { label: 'Téléphone mère',     ok: !!student.parentInfo?.motherPhone,  tab: 'parents' },
    { label: 'Adresse',            ok: !!student.parentInfo?.address,      tab: 'adresse' },
    { label: 'Email de contact',   ok: !!student.parentInfo?.email,        tab: 'adresse' },
    { label: 'Numéro ISS',         ok: !!student.issNumber },
  ];
  const missing = checks.filter(c => !c.ok);
  const done    = checks.filter(c => c.ok);

  return (
    <div className="max-w-lg">
      {missing.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <p className="text-base font-bold text-emerald-700">Dossier complet !</p>
          <p className="text-sm text-emerald-600 mt-1">Tous les champs obligatoires sont renseignés.</p>
        </div>
      ) : (
        <SectionCard title={`${missing.length} champ${missing.length > 1 ? 's' : ''} manquant${missing.length > 1 ? 's' : ''}`}>
          <div className="space-y-2">
            {missing.map(c => (
              <div key={c.label}
                className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                <XCircle size={16} className="text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-700 font-medium flex-1">{c.label}</span>
                {c.tab && (
                  <button onClick={() => onTabChange(c.tab!)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap">
                    Renseigner →
                  </button>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {done.length > 0 && (
        <SectionCard title="Champs renseignés">
          <div className="grid grid-cols-2 gap-2">
            {done.map(c => (
              <div key={c.label} className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                {c.label}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
