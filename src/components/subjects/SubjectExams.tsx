import React, { useState } from 'react';
import { Upload, Download, Trash2, FileText, Loader, AlertCircle } from 'lucide-react';
import type { Subject } from '../../types/teacher';
import { useExams } from '../../hooks/useExams';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

interface SubjectExamsProps {
  subject: Subject;
  grade: string;
}

export function SubjectExams({ subject, grade }: SubjectExamsProps) {
  const { currentYear } = useSchoolYear();
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(1);
  const [selectedGrade, setSelectedGrade] = useState(grade);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    examSubjects,
    loading,
    error,
    uploadExam,
    deleteExam,
    downloadExam,
  } = useExams(subject.id);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simuler une progression de l'upload
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await uploadExam({
        subjectId: subject.id,
        year: currentYear,
        term: selectedTerm,
        grade: selectedGrade,
        fileName: file.name,
        fileUrl: '',
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'Current User'
      }, file);

      clearInterval(interval);
      setUploadProgress(100);
      
      // Réinitialiser après un court délai
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (examId: string) => {
    try {
      const file = await downloadExam(examId);
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const handleDelete = async (examId: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce sujet ?')) {
      try {
        await deleteExam(examId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Sélection du niveau */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-4 mb-4">
          {['6EME', '5EME', '4EME', '3EME'].map((gradeOption) => (
            <button
              key={gradeOption}
              onClick={() => setSelectedGrade(gradeOption)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                selectedGrade === gradeOption
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {gradeOption}
            </button>
          ))}
        </div>

        {/* Sélection du trimestre */}
        <div className="flex space-x-4">
          {[1, 2, 3].map((term) => (
            <button
              key={term}
              onClick={() => setSelectedTerm(term as 1 | 2 | 3)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                selectedTerm === term
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Trimestre {term}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des sujets */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Sujets d'examens</h3>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              isUploading ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}>
              <Upload size={20} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {isUploading ? 'Upload en cours...' : 'Ajouter un sujet'}
              </span>
            </div>
          </label>
        </div>

        {isUploading && (
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          {examSubjects
            .filter(exam => exam.term === selectedTerm && exam.grade === selectedGrade)
            .map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {exam.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ajouté le {new Date(exam.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(exam.id)}
                    className="p-1 text-gray-500 hover:text-indigo-600"
                    title="Télécharger"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}