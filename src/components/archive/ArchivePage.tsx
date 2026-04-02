/**
 * Page dédiée à la gestion des archives d'élèves.
 * Permet de consulter, rechercher et restaurer des élèves archivés.
 */
import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Clock, Archive, Loader2, UserX } from 'lucide-react';
import type { ArchivedStudent } from '../../types/archive';
import { archiveApi } from '../../services/archiveApi';
import { studentApi } from '../../services/api';

import { useToast } from '../../contexts/ToastContext';
import { FR } from '../../constants/translations';

export function ArchivePage() {
  const { showToast } = useToast();
  const [archivedStudents, setArchivedStudents] = useState<ArchivedStudent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArchive();
  }, []);

  const loadArchive = async () => {
    setIsLoading(true);
    try {
      const data = await archiveApi.getAll();
      setArchivedStudents(data);
    } catch {
      showToast('Erreur lors du chargement des archives', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (archived: ArchivedStudent) => {
    if (!window.confirm(FR.archive.confirmRestore)) return;
    try {
      const restored = await archiveApi.restoreStudent(archived);
      await studentApi.create(restored);
      await loadArchive();
      showToast(FR.archive.restoreSuccess, 'success');
    } catch {
      showToast('Erreur lors de la restauration', 'error');
    }
  };

  const filtered = archivedStudents.filter(({ student }) =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.matricule && student.matricule.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3">
          <Archive className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{FR.archive.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {archivedStudents.length} élève{archivedStudents.length !== 1 ? 's' : ''} archivé{archivedStudents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Recherche + liste */}
      <div className="bg-white rounded-lg shadow">
        {/* Barre de recherche */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={FR.archive.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Contenu */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={32} className="animate-spin mr-3" />
            <span>Chargement des archives…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UserX size={48} className="mb-4 opacity-30" />
            <p className="text-lg">
              {searchTerm ? FR.common.noResults : 'Aucun élève archivé'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-sm text-indigo-600 hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((archived) => (
              <div key={archived.student.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                      {archived.student.firstName[0]}{archived.student.lastName[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {archived.student.firstName} {archived.student.lastName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                        <span>N°{archived.student.studentNumber}</span>
                        {archived.student.matricule && (
                          <span>{archived.student.matricule}</span>
                        )}
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                          {archived.student.grade}
                        </span>
                      </div>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <Clock size={12} className="mr-1.5" />
                        Archivé le {new Date(archived.archivedAt).toLocaleDateString('fr-FR', {
                          year: 'numeric', month: 'long', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      {archived.reason && (
                        <p className="mt-1 text-xs text-gray-500">
                          <span className="font-medium">Motif :</span> {archived.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bouton restaurer */}
                  <button
                    onClick={() => handleRestore(archived)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium flex-shrink-0"
                  >
                    <RotateCcw size={14} />
                    <span>{FR.archive.restore}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
