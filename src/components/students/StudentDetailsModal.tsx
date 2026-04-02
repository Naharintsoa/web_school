import { useState, useRef } from 'react';
import {
  ArrowLeft, Edit2, Trash2, Phone, Mail, MapPin,
  Camera, FileText, User, Image, AlertCircle, Save, X,
  Upload, Check,
} from 'lucide-react';
import type { Student } from '../../types/student';
import { SiblingsSection } from './SiblingsSection';
import { CertificatePreview } from '../classes/certificates/CertificatePreview';
import { IdentityCardPreview } from '../classes/identity-cards/IdentityCardPreview';
import { BadgePreview } from '../badges/BadgePreview';
import { studentApi } from '../../services/api';

type Tab = 'classe' | 'adresse' | 'parents' | 'fratrie' | 'sante' | 'photos' | 'documents';
type DocPreview = 'scolarite' | 'radiation' | 'scolarite-doublon' | 'radiation-doublon' | 'identity' | 'badge' | null;

const TABS: { key: Tab; label: string }[] = [
  { key: 'classe',    label: 'Classe' },
  { key: 'adresse',   label: 'Adresse' },
  { key: 'parents',   label: 'Parents' },
  { key: 'fratrie',   label: 'Fratrie' },
  { key: 'sante',     label: 'Données de santé' },
  { key: 'photos',    label: 'Photos' },
  { key: 'documents', label: 'Documents manquants' },
];

interface Props {
  student: Student;
  allStudents: Student[];
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

function isDossierComplet(s: Student): boolean {
  return !!(s.photoUrl && s.dateOfBirth && s.parentInfo?.fatherName && s.parentInfo?.motherName);
}

export function StudentDetailsModal({ student, allStudents, onClose, onEdit, onDelete }: Props) {
  const [current, setCurrent] = useState<Student>(student);
  const [activeTab, setActiveTab] = useState<Tab>('classe');
  const [docPreview, setDocPreview] = useState<DocPreview>(null);
  const [editIss, setEditIss] = useState(false);
  const [issVal, setIssVal] = useState(current.issNumber ?? '');
  const [savingIss, setSavingIss] = useState(false);

  // Sauvegarde partielle centralisée
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

  const complet = isDossierComplet(current);

  const handleSaveIss = async () => {
    setSavingIss(true);
    try { await savePartial({ issNumber: issVal }); setEditIss(false); }
    finally { setSavingIss(false); }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col">

        {/* Barre supérieure */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 print:hidden flex-shrink-0">
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
            <ArrowLeft size={15} /> Retour
          </button>
          <button onClick={() => setActiveTab('classe')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">
            <Edit2 size={13} /> Modifier
          </button>
          <button onClick={() => onDelete(current)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-red-500 rounded hover:bg-red-600">
            <Trash2 size={13} /> Supprimer
          </button>
        </div>

        {/* Corps principal */}
        <div className="flex flex-1 min-h-0">

          {/* ── Sidebar ── */}
          <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
            {/* Photo + nom */}
            <div className="flex flex-col items-center pt-6 pb-4 px-4 border-b border-gray-100">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center mb-3">
                {current.photoUrl
                  ? <img src={current.photoUrl} alt="" className="w-full h-full object-cover" />
                  : <User size={40} className="text-gray-400" />}
              </div>
              <p className="text-sm font-bold text-center text-gray-800 leading-snug">
                {current.firstName} <span className="uppercase">{current.lastName}</span>
                {current.commonName && <span className="text-orange-500"> ({current.commonName})</span>}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Classe en cours : <span className="font-semibold text-gray-700">{current.grade}</span>
              </p>
              <p className="text-xs text-gray-500">
                Numéro matricule : <span className="font-semibold text-gray-700">{current.matricule || '—'}</span>
              </p>
              <button
                onClick={() => setActiveTab('photos')}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded hover:bg-gray-700"
              >
                <Camera size={13} /> Créer/Modifier une photo
              </button>
            </div>

            {/* Infos rapides */}
            <div className="px-4 py-3 space-y-2 border-b border-gray-100 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Garçon/fille</span>
                <span className="text-orange-500 font-medium">{current.gender === 'male' ? 'garçon' : 'fille'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date de naissance</span>
                <span className="text-orange-500 font-medium">
                  {current.dateOfBirth ? new Date(current.dateOfBirth).toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Dossier complet</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${complet ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {complet ? 'Oui' : 'Non'}
                </span>
              </div>
            </div>

            {/* Informations générales */}
            <div className="bg-blue-600 px-4 py-2">
              <p className="text-white text-xs font-semibold">Informations générales</p>
            </div>
            <div className="px-4 py-3 space-y-4 text-xs">
              <div>
                <p className="text-gray-400 font-medium mb-1">Nationalité</p>
                <p className="text-orange-500 font-medium">Madagascar</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-1">Date d&apos;entrée</p>
                <p className="text-gray-700">
                  {current.enrollmentDate ? new Date(current.enrollmentDate).toLocaleDateString('fr-FR') : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium mb-1">Autre données</p>
                {/* ISS éditable inline */}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-gray-600">Numéro ISS</span>
                  {editIss ? (
                    <div className="flex items-center gap-1 flex-1 ml-2">
                      <input
                        autoFocus
                        value={issVal}
                        onChange={e => setIssVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveIss(); if (e.key === 'Escape') setEditIss(false); }}
                        className="flex-1 min-w-0 border border-blue-400 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button onClick={handleSaveIss} disabled={savingIss} className="text-green-600 hover:text-green-700">
                        <Check size={13} />
                      </button>
                      <button onClick={() => { setEditIss(false); setIssVal(current.issNumber ?? ''); }} className="text-gray-400 hover:text-gray-600">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-800 font-medium">{current.issNumber || '—'}</span>
                      <button onClick={() => { setIssVal(current.issNumber ?? ''); setEditIss(true); }} className="text-blue-500 hover:text-blue-700 ml-1">
                        <Edit2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-600">Année scolaire</span>
                  <span className="text-gray-800 font-medium">{current.schoolYear || '—'}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Contenu onglets ── */}
          <main className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Onglets */}
            <div className="flex border-b border-gray-200 overflow-x-auto flex-shrink-0">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'classe'    && <TabClasse student={current} onGenerate={setDocPreview} />}
              {activeTab === 'adresse'   && <TabAdresse student={current} onSave={patch => savePartial(patch)} />}
              {activeTab === 'parents'   && <TabParents student={current} onSave={patch => savePartial(patch)} />}
              {activeTab === 'fratrie'   && (
                <SiblingsSection
                  student={current}
                  allStudents={allStudents}
                  onStudentUpdated={s => { if (s.id === current.id) setCurrent(s); }}
                />
              )}
              {activeTab === 'sante'     && <TabSante />}
              {activeTab === 'photos'    && <TabPhotos student={current} onSave={patch => savePartial(patch)} />}
              {activeTab === 'documents' && <TabDocuments student={current} onTabChange={setActiveTab} />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
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
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );
}

function EditBar({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-4">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
        Enregistrer
      </button>
      <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
        Annuler
      </button>
    </div>
  );
}

// ─── Onglet Classe ─────────────────────────────────────────────────────────────
function TabClasse({ student, onGenerate }: { student: Student; onGenerate: (d: DocPreview) => void }) {
  const docs: { label: string; key: DocPreview }[] = [
    { label: 'Certificat de scolarité',              key: 'scolarite' },
    { label: 'Certificat de radiation',              key: 'radiation' },
    { label: 'Certificat de scolarité (en doublon)', key: 'scolarite-doublon' },
    { label: 'Certificat de radiation (en doublon)', key: 'radiation-doublon' },
    { label: "Carte d'identité",                     key: 'identity' },
    { label: 'Badge',                                key: 'badge' },
  ];
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Classe</h3>
      <div className="border border-gray-200 rounded-lg mb-5 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-700">Certificats à éditer</p>
        </div>
        <div className="px-4 py-3 grid grid-cols-2 gap-1">
          {docs.map(doc => (
            <button key={doc.key} onClick={() => onGenerate(doc.key)}
              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline py-1 text-left"
            >
              <FileText size={12} className="flex-shrink-0" /> {doc.label}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Classe</th>
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Année scolaire</th>
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">#</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-100">
            <td className="px-4 py-2 text-sm">{student.grade}</td>
            <td className="px-4 py-2 text-sm text-gray-600">{student.schoolYear}</td>
            <td className="px-4 py-2">
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">En cours</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Onglet Adresse ────────────────────────────────────────────────────────────
function TabAdresse({ student, onSave }: { student: Student; onSave: (p: Partial<Omit<Student,'id'>>) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [address, setAddress] = useState(student.parentInfo?.address ?? '');
  const [email, setEmail]   = useState(student.parentInfo?.email ?? '');

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ parentInfo: { ...student.parentInfo, address, email } });
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    setAddress(student.parentInfo?.address ?? '');
    setEmail(student.parentInfo?.email ?? '');
    setEditing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">Adresse</h3>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800">
            <Edit2 size={14} /> Modifier
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <Field label="Adresse">
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Adresse complète"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </Field>
          <EditBar onSave={handleSave} onCancel={handleCancel} saving={saving} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <span>{student.parentInfo?.address || <span className="text-gray-400 italic">Adresse non renseignée</span>}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Mail size={16} className="text-gray-400 flex-shrink-0" />
            <span>{student.parentInfo?.email || <span className="text-gray-400 italic">Email non renseigné</span>}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Parents ────────────────────────────────────────────────────────────
function TabParents({ student, onSave }: { student: Student; onSave: (p: Partial<Omit<Student,'id'>>) => Promise<void> }) {
  const pi = student.parentInfo ?? {};
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({
    fatherName:       pi.fatherName ?? '',
    fatherOccupation: pi.fatherOccupation ?? '',
    fatherPhone:      pi.fatherPhone ?? '',
    fatherEmail:      pi.fatherEmail ?? '',
    motherName:       pi.motherName ?? '',
    motherOccupation: pi.motherOccupation ?? '',
    motherPhone:      pi.motherPhone ?? '',
    motherEmail:      pi.motherEmail ?? '',
  });

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ parentInfo: { ...pi, ...form } });
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    setForm({
      fatherName: pi.fatherName ?? '', fatherOccupation: pi.fatherOccupation ?? '',
      fatherPhone: pi.fatherPhone ?? '', fatherEmail: (pi as any).fatherEmail ?? '',
      motherName: pi.motherName ?? '', motherOccupation: pi.motherOccupation ?? '',
      motherPhone: pi.motherPhone ?? '', motherEmail: (pi as any).motherEmail ?? '',
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Informations parents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Père */}
          <div className="border border-blue-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-bold text-blue-600 uppercase">Père</p>
            <Field label="Nom complet"><Input value={form.fatherName} onChange={set('fatherName')} placeholder="Nom du père" /></Field>
            <Field label="Profession"><Input value={form.fatherOccupation} onChange={set('fatherOccupation')} placeholder="Profession" /></Field>
            <Field label="Téléphone"><Input value={form.fatherPhone} onChange={set('fatherPhone')} placeholder="+261..." /></Field>
            <Field label="Email">
              <input type="email" value={form.fatherEmail} onChange={e => set('fatherEmail')(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </Field>
          </div>
          {/* Mère */}
          <div className="border border-pink-200 rounded-lg p-4 space-y-3">
            <p className="text-xs font-bold text-pink-600 uppercase">Mère</p>
            <Field label="Nom complet"><Input value={form.motherName} onChange={set('motherName')} placeholder="Nom de la mère" /></Field>
            <Field label="Profession"><Input value={form.motherOccupation} onChange={set('motherOccupation')} placeholder="Profession" /></Field>
            <Field label="Téléphone"><Input value={form.motherPhone} onChange={set('motherPhone')} placeholder="+261..." /></Field>
            <Field label="Email">
              <input type="email" value={form.motherEmail} onChange={e => set('motherEmail')(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
            </Field>
          </div>
        </div>
        <EditBar onSave={handleSave} onCancel={handleCancel} saving={saving} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">Informations parents</h3>
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800">
          <Edit2 size={14} /> Modifier
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ParentCard title="Père" color="blue" name={pi.fatherName} job={pi.fatherOccupation} phone={pi.fatherPhone} email={pi.fatherEmail} />
        <ParentCard title="Mère" color="pink" name={pi.motherName} job={pi.motherOccupation} phone={pi.motherPhone} email={pi.motherEmail} />
      </div>
    </div>
  );
}

function ParentCard({ title, color, name, job, phone, email }: { title: string; color: 'blue'|'pink'; name?: string; job?: string; phone?: string; email?: string }) {
  const border = color === 'blue' ? 'border-blue-200' : 'border-pink-200';
  const label  = color === 'blue' ? 'text-blue-600'  : 'text-pink-600';
  return (
    <div className={`border ${border} rounded-lg p-4`}>
      <p className={`text-xs font-bold ${label} uppercase mb-3 flex items-center gap-1`}><User size={12} /> {title}</p>
      <dl className="space-y-2 text-sm">
        <div><dt className="text-gray-400 text-xs">Nom</dt><dd className="font-medium">{name || <span className="text-gray-400 italic">—</span>}</dd></div>
        <div><dt className="text-gray-400 text-xs">Profession</dt><dd>{job || <span className="text-gray-400 italic">—</span>}</dd></div>
        <div className="flex items-center gap-1 text-gray-700"><Phone size={13} className="text-gray-400" /><span>{phone || <span className="text-gray-400 italic">—</span>}</span></div>
        <div className="flex items-center gap-1 text-gray-700"><Mail size={13} className="text-gray-400" /><span>{email || <span className="text-gray-400 italic">—</span>}</span></div>
      </dl>
    </div>
  );
}

// ─── Onglet Données de santé ───────────────────────────────────────────────────
function TabSante() {
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Données de santé</h3>
      <p className="text-sm text-gray-400 italic">Aucune donnée de santé enregistrée.</p>
    </div>
  );
}

// ─── Onglet Photos ─────────────────────────────────────────────────────────────
function TabPhotos({ student, onSave }: { student: Student; onSave: (p: Partial<Omit<Student,'id'>>) => Promise<void> }) {
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
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Photo de l&apos;élève</h3>
      <div className="flex items-start gap-6">
        {/* Photo actuelle */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Photo actuelle</p>
          <div className="w-36 h-36 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
            {student.photoUrl
              ? <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
              : <Image size={32} className="text-gray-300" />}
          </div>
        </div>

        {/* Nouvelle photo */}
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-2">Nouvelle photo</p>
          {preview ? (
            <div className="space-y-3">
              <img src={preview} alt="" className="w-36 h-36 object-cover rounded-lg border border-gray-200" />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                  Enregistrer
                </button>
                <button onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
              <Upload size={16} /> Choisir une photo
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <p className="text-xs text-gray-400 mt-2">Formats acceptés : JPG, PNG, WEBP</p>
        </div>
      </div>
    </div>
  );
}

// ─── Onglet Documents manquants ────────────────────────────────────────────────
function TabDocuments({ student, onTabChange }: { student: Student; onTabChange: (t: Tab) => void }) {
  const checks: { label: string; ok: boolean; tab?: Tab }[] = [
    { label: 'Photo',             ok: !!student.photoUrl,                          tab: 'photos' },
    { label: 'Date de naissance', ok: !!student.dateOfBirth },
    { label: 'Nom du père',       ok: !!student.parentInfo?.fatherName,            tab: 'parents' },
    { label: 'Téléphone père',    ok: !!student.parentInfo?.fatherPhone,           tab: 'parents' },
    { label: 'Nom de la mère',    ok: !!student.parentInfo?.motherName,            tab: 'parents' },
    { label: 'Téléphone mère',    ok: !!student.parentInfo?.motherPhone,           tab: 'parents' },
    { label: 'Adresse',           ok: !!student.parentInfo?.address,              tab: 'adresse' },
    { label: 'Email',             ok: !!student.parentInfo?.email,                tab: 'adresse' },
    { label: 'N° ISS',            ok: !!student.issNumber },
  ];
  const missing = checks.filter(c => !c.ok);

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Documents / champs manquants</h3>
      {missing.length === 0 ? (
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
          <Check size={16} /> Dossier complet
        </div>
      ) : (
        <ul className="space-y-2">
          {missing.map(c => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-red-600">{c.label}</span>
              {c.tab && (
                <button onClick={() => onTabChange(c.tab!)}
                  className="ml-auto text-xs text-blue-500 hover:text-blue-700 hover:underline">
                  Renseigner →
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
