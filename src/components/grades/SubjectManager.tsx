/**
 * Gestionnaire de matières avec drag-and-drop pour réordonner.
 * L'ordre est sauvegardé via subjectsApi.reorder() → display_order en base.
 */
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Save, X, BookOpen, GripVertical } from 'lucide-react';
import type { Subject } from '../../types';
import { subjectsApi } from '../../services/api/subjectsApi';
import { useToast } from '../../contexts/ToastContext';

interface SubjectManagerProps {
  subjects: Subject[];
  onSubjectsChange: () => void;
  onClose: () => void;
  /** Classe courante — les nouvelles matières seront spécifiques à cette classe */
  grade: string;
  school: string;
}

export function SubjectManager({ subjects, onSubjectsChange, onClose, grade, school }: SubjectManagerProps) {
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCoeff, setEditCoeff] = useState(1);
  const [editTeacher, setEditTeacher] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCoeff, setNewCoeff] = useState(1);
  const [newTeacher, setNewTeacher] = useState('');

  // ── Drag & drop state ──────────────────────────────────────────────────────
  const [localOrder, setLocalOrder] = useState<Subject[]>(subjects);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const dragNode = useRef<HTMLDivElement | null>(null);

  // Sync si subjects change depuis l'extérieur (ajout/suppression)
  React.useEffect(() => { setLocalOrder(subjects); }, [subjects]);

  // ── Handlers drag & drop ───────────────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, idx: number) => {
    dragNode.current = e.currentTarget as HTMLDivElement;
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (idx !== overIdx) setOverIdx(idx);
  };

  const onDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { resetDrag(); return; }
    const next = [...localOrder];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setLocalOrder(next);
    resetDrag();
  };

  const onDragEnd = () => resetDrag();

  const resetDrag = () => { setDragIdx(null); setOverIdx(null); };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      await subjectsApi.reorder(localOrder.map(s => s.id));
      onSubjectsChange();
      showToast('Ordre des matières enregistré', 'success');
    } finally {
      setSaving(false);
    }
  };

  const orderChanged = localOrder.map(s => s.id).join() !== subjects.map(s => s.id).join();

  // ── Ajout ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newName.trim()) { showToast('Le nom de la matière est requis', 'error'); return; }
    await subjectsApi.create({
      name: newName.trim().toUpperCase(),
      coefficient: Math.max(1, newCoeff),
      teacherName: newTeacher.trim(),
      school,
      grade,
    });
    setNewName(''); setNewCoeff(1); setNewTeacher(''); setShowAddForm(false);
    onSubjectsChange();
    showToast('Matière ajoutée', 'success');
  };

  // ── Édition ────────────────────────────────────────────────────────────────
  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setEditName(subject.name);
    setEditCoeff(subject.coefficient);
    setEditTeacher(subject.teacherName ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    const subject = subjects.find(s => s.id === editingId);
    if (!subject) return;
    await subjectsApi.update(editingId, {
      name: editName.trim().toUpperCase(),
      coefficient: Math.max(1, editCoeff),
      teacherName: editTeacher.trim(),
      school,
      grade: subject.grade ?? grade,
    });
    setEditingId(null);
    onSubjectsChange();
    showToast('Matière mise à jour', 'success');
  };

  // ── Suppression ────────────────────────────────────────────────────────────
  const handleDelete = async (subject: Subject) => {
    if (!window.confirm(
      `Supprimer la matière "${subject.name}" ?\n\nAttention : les notes associées resteront dans la base mais ne seront plus affichées.`
    )) return;
    await subjectsApi.delete(subject.id);
    onSubjectsChange();
    showToast(`"${subject.name}" supprimée`, 'success');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">

        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <BookOpen size={22} className="text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Gestion des matières</h2>
              <p className="text-xs text-indigo-600 font-medium">Classe : {grade}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Info */}
        <div className="mx-5 mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
          Glissez-déposez les matières pour changer leur ordre dans le bulletin.
          Les matières ajoutées sont propres à la classe <strong>{grade}</strong>.
        </div>

        {/* Bouton Enregistrer l'ordre (visible seulement si ordre modifié) */}
        {orderChanged && (
          <div className="mx-5 mt-3">
            <button
              onClick={handleSaveOrder}
              disabled={saving}
              className="w-full py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Save size={14} />
              {saving ? 'Enregistrement…' : 'Enregistrer l\'ordre'}
            </button>
          </div>
        )}

        {/* Liste des matières (drag & drop) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {localOrder.length === 0 && (
            <p className="text-center text-gray-400 py-8">Aucune matière. Ajoutez-en une ci-dessous.</p>
          )}

          {localOrder.map((subject, idx) => (
            <div
              key={subject.id}
              draggable={editingId !== subject.id}
              onDragStart={e => onDragStart(e, idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={e => onDrop(e, idx)}
              onDragEnd={onDragEnd}
              className={`border rounded-lg overflow-hidden transition-all ${
                dragIdx === idx
                  ? 'opacity-40 border-indigo-300 bg-indigo-50'
                  : overIdx === idx
                  ? 'border-indigo-400 shadow-md ring-2 ring-indigo-200'
                  : 'border-gray-200'
              }`}
            >
              {editingId === subject.id ? (
                /* Mode édition */
                <div className="p-3 bg-indigo-50 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Nom de la matière"
                      autoFocus
                      className="flex-1 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number" min="1" max="10"
                      value={editCoeff}
                      onChange={e => setEditCoeff(Number(e.target.value))}
                      title="Coefficient"
                      className="w-16 border border-indigo-300 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <input
                    value={editTeacher}
                    onChange={e => setEditTeacher(e.target.value)}
                    placeholder="Nom du professeur"
                    className="w-full border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                    >
                      <Save size={14} /> Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                /* Mode affichage */
                <div className="flex items-center px-3 py-3 hover:bg-gray-50 cursor-default">
                  {/* Poignée de drag */}
                  <div
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 mr-2 touch-none"
                    title="Glisser pour réordonner"
                  >
                    <GripVertical size={18} />
                  </div>
                  {/* Numéro d'ordre */}
                  <span className="text-xs text-gray-400 font-mono w-5 text-center mr-2 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 truncate">{subject.name}</span>
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        Coeff. {subject.coefficient}
                      </span>
                    </div>
                    {subject.teacherName && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{subject.teacherName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => startEdit(subject)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
                      title="Modifier"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(subject)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="Supprimer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Zone d'ajout */}
        <div className="p-4 border-t border-gray-100">
          {showAddForm ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ex: MATHÉMATIQUES"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number" min="1" max="10"
                  value={newCoeff}
                  onChange={e => setNewCoeff(Number(e.target.value))}
                  title="Coefficient"
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <input
                value={newTeacher}
                onChange={e => setNewTeacher(e.target.value)}
                placeholder="Nom du professeur (optionnel)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddForm(false); setNewName(''); setNewCoeff(1); setNewTeacher(''); }}
                  className="flex-1 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAdd}
                  className="flex-1 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-1"
                >
                  <Plus size={15} /> Ajouter
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Plus size={16} />
              Ajouter une matière
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
