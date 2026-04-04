/**
 * Page de paramètres de l'application.
 * Les paramètres sont persistés dans le localStorage sous la clé 'college-sully-settings'.
 */
import React from 'react';
import { Save, School, Bell, Users, CheckCircle } from 'lucide-react';
import { PromotionPanel } from './PromotionPanel';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { useToast } from '../../contexts/ToastContext';
import { SCHOOL_YEARS } from '../../utils/schoolYears';
import { FR } from '../../constants/translations';

// Clé de stockage pour les paramètres
const SETTINGS_KEY = 'college-sully-settings';

interface AppSettings {
  schoolName: string;
  emailNotifications: boolean;
  parentAccess: boolean;
}

/** Charge les paramètres depuis le localStorage */
function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignorer les erreurs de parsing
  }
  return { schoolName: 'Collège Sully', emailNotifications: false, parentAccess: false };
}

export function Settings() {
  const { currentYear, setCurrentYear } = useSchoolYear();
  const { showToast } = useToast();

  // Charger les paramètres sauvegardés au montage du composant
  const [settings, setSettings] = React.useState<AppSettings>(loadSettings);
  const [saved, setSaved] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Persister dans le localStorage
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      showToast('Paramètres enregistrés avec succès', 'success');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      showToast('Erreur lors de la sauvegarde des paramètres', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de l'école */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <School className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">{FR.settings.title}</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Infos école */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{FR.settings.schoolInfo}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {FR.settings.schoolName}
                </label>
                <input
                  type="text"
                  value={settings.schoolName}
                  onChange={(e) => setSettings(s => ({ ...s, schoolName: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nom de l'établissement"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {FR.settings.academicYear}
                </label>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {SCHOOL_YEARS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Préférences système */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{FR.settings.systemPreferences}</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings(s => ({ ...s, emailNotifications: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Bell size={16} className="text-gray-400 group-hover:text-indigo-500" />
                  <span className="text-sm text-gray-900">{FR.settings.enableEmailNotifications}</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.parentAccess}
                    onChange={(e) => setSettings(s => ({ ...s, parentAccess: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Users size={16} className="text-gray-400 group-hover:text-indigo-500" />
                  <span className="text-sm text-gray-900">{FR.settings.allowParentAccess}</span>
                </div>
              </label>
            </div>
          </section>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle size={20} />
                  <span>Enregistré !</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>{FR.common.save}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Passage en classe supérieure */}
      <PromotionPanel />

      {/* Informations sur le stockage */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Note :</strong> Les données sont stockées localement dans votre navigateur (IndexedDB + localStorage).
          Elles sont conservées entre les sessions mais spécifiques à ce navigateur.
        </p>
      </div>
    </form>
  );
}
