import { useState } from 'react';
import {
  ArrowLeft, Edit2, Trash2, Phone, Mail, MapPin,
  Camera, FileText, CreditCard, Contact, User,
  Home, Heart, Image, AlertCircle,
} from 'lucide-react';
import type { Student } from '../../types/student';
import { EditStudentModal } from './EditStudentModal';
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

interface StudentDetailsModalProps {
  student: Student;
  allStudents: Student[];
  onClose: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

function isDossierComplet(s: Student): boolean {
  return !!(s.photoUrl && s.dateOfBirth && s.parentInfo?.fatherName && s.parentInfo?.motherName);
}

export function StudentDetailsModal({
  student, allStudents, onClose, onEdit, onDelete,
}: StudentDetailsModalProps) {
  const [current, setCurrent] = useState(student);
  const [activeTab, setActiveTab] = useState<Tab>('classe');
  const [showEdit, setShowEdit] = useState(false);
  const [docPreview, setDocPreview] = useState<DocPreview>(null);

  const handleSave = async (data: Omit<Student, 'id'>) => {
    const updated = await studentApi.update(current.id, data);
    setCurrent(updated);
    onEdit(updated);
    setShowEdit(false);
  };

  // ── Prévisualisations documents ────────────────────────────────────────────
  if (docPreview === 'scolarite' || docPreview === 'radiation') {
    return <CertificatePreview type={docPreview} student={current} onClose={() => setDocPreview(null)} />;
  }
  if (docPreview === 'scolarite-doublon') {
    return <CertificatePreview type="scolarite" student={current} onClose={() => setDocPreview(null)} />;
  }
  if (docPreview === 'radiation-doublon') {
    return <CertificatePreview type="radiation" student={current} onClose={() => setDocPreview(null)} />;
  }
  if (docPreview === 'identity') {
    return <IdentityCardPreview students={[current]} onClose={() => setDocPreview(null)} />;
  }
  if (docPreview === 'badge') {
    return <BadgePreview students={[current]} onClose={() => setDocPreview(null)} />;
  }

  if (showEdit) {
    return (
      <EditStudentModal
        student={current}
        onSave={handleSave}
        onClose={() => setShowEdit(false)}
      />
    );
  }

  const complet = isDossierComplet(current);

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col">

        {/* ── Barre supérieure ── */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 print:hidden">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={15} />
            Retour
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            <Edit2 size={13} />
            Modifier
          </button>
          <button
            onClick={() => onDelete(current)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
          >
            <Trash2 size={13} />
            Supprimer
          </button>
        </div>

        {/* ── Corps ── */}
        <div className="flex flex-1 gap-0">

          {/* ── Sidebar gauche ── */}
          <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
            {/* Photo + nom */}
            <div className="flex flex-col items-center pt-6 pb-4 px-4 border-b border-gray-100">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center mb-3">
                {current.photoUrl
                  ? <img src={current.photoUrl} alt="" className="w-full h-full object-cover" />
                  : <User size={40} className="text-gray-400" />}
              </div>
              <p className="text-sm font-bold text-center text-gray-800 leading-snug">
                {current.firstName}{' '}
                <span className="uppercase">{current.lastName}</span>
                {current.commonName && (
                  <span className="text-orange-500"> ({current.commonName})</span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">Classe en cours : <span className="font-semibold text-gray-700">{current.grade}</span></p>
              <p className="text-xs text-gray-500">Numéro matricule : <span className="font-semibold text-gray-700">{current.matricule || '—'}</span></p>

              <button
                onClick={() => setShowEdit(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded hover:bg-gray-700 transition-colors"
              >
                <Camera size={13} />
                Créer/Modifier une photo
              </button>
            </div>

            {/* Infos rapides */}
            <div className="px-4 py-3 space-y-2 border-b border-gray-100 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Garçon/fille</span>
                <span className="text-orange-500 font-medium">
                  {current.gender === 'male' ? 'garçon' : 'fille'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date de naissance</span>
                <span className="text-orange-500 font-medium">
                  {current.dateOfBirth
                    ? new Date(current.dateOfBirth).toLocaleDateString('fr-FR')
                    : '—'}
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
            <div className="flex-1 overflow-y-auto">
              <div className="bg-blue-600 px-4 py-2">
                <p className="text-white text-xs font-semibold">Informations générales</p>
              </div>
              <div className="px-4 py-3 space-y-4 text-xs">
                <div>
                  <p className="text-gray-400 font-medium mb-0.5 flex items-center gap-1">
                    <MapPin size={11} /> Nationalité
                  </p>
                  <p className="text-orange-500 font-medium">Madagascar</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-0.5 flex items-center gap-1">
                    <FileText size={11} /> Informations de naissance
                  </p>
                  <p className="text-gray-600">Ville de naissance : <span className="text-gray-800">—</span></p>
                  <p className="text-gray-600">Pays de naissance : <span className="text-gray-800">Madagascar</span></p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-0.5 flex items-center gap-1">
                    <FileText size={11} /> Informations sur la sortie/entrée
                  </p>
                  <p className="text-gray-600">
                    Date d&apos;entrée :{' '}
                    <span className="text-gray-800">
                      {current.enrollmentDate
                        ? new Date(current.enrollmentDate).toLocaleDateString('fr-FR')
                        : '—'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium mb-1 flex items-center gap-1">
                    <FileText size={11} /> Autre données
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Numéro ISS</span>
                    <span className="text-gray-800 font-medium">{current.issNumber || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-600">Année scolaire</span>
                    <span className="text-gray-800 font-medium">{current.schoolYear || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Contenu à onglets ── */}
          <main className="flex-1 flex flex-col bg-white">
            {/* Onglets */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenu de l'onglet actif */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'classe'    && <TabClasse student={current} onGenerate={setDocPreview} />}
              {activeTab === 'adresse'   && <TabAdresse student={current} />}
              {activeTab === 'parents'   && <TabParents student={current} />}
              {activeTab === 'fratrie'   && (
                <SiblingsSection
                  student={current}
                  allStudents={allStudents}
                  onStudentUpdated={s => { if (s.id === current.id) setCurrent(s); }}
                />
              )}
              {activeTab === 'sante'     && <TabSante />}
              {activeTab === 'photos'    && <TabPhotos student={current} />}
              {activeTab === 'documents' && <TabDocuments student={current} />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ── Onglet Classe ──────────────────────────────────────────────────────────────
function TabClasse({ student, onGenerate }: { student: Student; onGenerate: (d: DocPreview) => void }) {
  const docs: { label: string; key: DocPreview }[] = [
    { label: 'Certificat de scolarité',             key: 'scolarite' },
    { label: 'Certificat de radiation',             key: 'radiation' },
    { label: 'Certificat de scolarité (en doublon)', key: 'scolarite-doublon' },
    { label: 'Certificat de radiation (en doublon)', key: 'radiation-doublon' },
    { label: "Carte d'identité",                    key: 'identity' },
    { label: 'Badge',                               key: 'badge' },
  ];

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Classe</h3>

      {/* Certificats */}
      <div className="border border-gray-200 rounded mb-5">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-700">Certificats à éditer</p>
        </div>
        <div className="px-4 py-3 grid grid-cols-2 gap-1">
          {docs.map(doc => (
            <button
              key={doc.key}
              onClick={() => onGenerate(doc.key)}
              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline py-1 text-left"
            >
              <FileText size={12} />
              {doc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Historique des classes */}
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-gray-700"></p>
        <button className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors">
          Créer
        </button>
      </div>
      <table className="w-full text-sm border border-gray-200 rounded overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Classe</th>
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">Année scolaire</th>
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">#</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-100">
            <td className="px-4 py-2 text-sm text-gray-800">{student.grade}</td>
            <td className="px-4 py-2 text-sm text-gray-600">{student.schoolYear}</td>
            <td className="px-4 py-2">
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">
                En cours
              </span>
            </td>
            <td className="px-4 py-2 flex items-center gap-2 justify-end">
              <button className="text-gray-400 hover:text-blue-600"><FileText size={14} /></button>
              <button className="text-gray-400 hover:text-indigo-600"><Edit2 size={14} /></button>
              <button className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Onglet Adresse ─────────────────────────────────────────────────────────────
function TabAdresse({ student }: { student: Student }) {
  const p = student.parentInfo;
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Adresse</h3>
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-2 text-gray-700">
          <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <span>{p?.address || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Mail size={16} className="text-gray-400 flex-shrink-0" />
          <span>{p?.email || '—'}</span>
        </div>
      </div>
    </div>
  );
}

// ── Onglet Parents ─────────────────────────────────────────────────────────────
function TabParents({ student }: { student: Student }) {
  const p = student.parentInfo;
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Informations parents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Père */}
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center gap-1">
            <User size={13} /> Père
          </p>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500 text-xs">Nom</dt><dd className="font-medium">{p?.fatherName || '—'}</dd></div>
            <div><dt className="text-gray-500 text-xs">Profession</dt><dd>{p?.fatherOccupation || '—'}</dd></div>
            <div className="flex items-center gap-1 text-gray-700">
              <Phone size={13} className="text-gray-400" />
              <span>{p?.fatherPhone || '—'}</span>
            </div>
          </dl>
        </div>
        {/* Mère */}
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-bold text-pink-600 uppercase mb-3 flex items-center gap-1">
            <User size={13} /> Mère
          </p>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-500 text-xs">Nom</dt><dd className="font-medium">{p?.motherName || '—'}</dd></div>
            <div><dt className="text-gray-500 text-xs">Profession</dt><dd>{p?.motherOccupation || '—'}</dd></div>
            <div className="flex items-center gap-1 text-gray-700">
              <Phone size={13} className="text-gray-400" />
              <span>{p?.motherPhone || '—'}</span>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

// ── Onglet Données de santé ────────────────────────────────────────────────────
function TabSante() {
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Données de santé</h3>
      <p className="text-sm text-gray-400 italic">Aucune donnée de santé enregistrée.</p>
    </div>
  );
}

// ── Onglet Photos ──────────────────────────────────────────────────────────────
function TabPhotos({ student }: { student: Student }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Photos</h3>
      {student.photoUrl ? (
        <img
          src={student.photoUrl}
          alt=""
          className="w-40 h-40 object-cover rounded-lg border border-gray-200 shadow"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
          <Image size={32} />
          <p className="text-sm">Aucune photo.</p>
        </div>
      )}
    </div>
  );
}

// ── Onglet Documents manquants ────────────────────────────────────────────────
function TabDocuments({ student }: { student: Student }) {
  const checks = [
    { label: 'Photo',              ok: !!student.photoUrl },
    { label: 'Date de naissance',  ok: !!student.dateOfBirth },
    { label: 'Nom du père',        ok: !!student.parentInfo?.fatherName },
    { label: 'Téléphone père',     ok: !!student.parentInfo?.fatherPhone },
    { label: 'Nom de la mère',     ok: !!student.parentInfo?.motherName },
    { label: 'Téléphone mère',     ok: !!student.parentInfo?.motherPhone },
    { label: 'Adresse',            ok: !!student.parentInfo?.address },
    { label: 'N° ISS',             ok: !!student.issNumber },
  ];
  const missing = checks.filter(c => !c.ok);

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-4">Documents / champs manquants</h3>
      {missing.length === 0 ? (
        <p className="text-sm text-green-600 font-medium">Dossier complet ✓</p>
      ) : (
        <ul className="space-y-2">
          {missing.map(c => (
            <li key={c.label} className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={14} />
              {c.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
