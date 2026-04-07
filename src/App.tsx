/**
 * Composant racine — navigation via React Router v6.
 *
 * Routes :
 *   /              → redirect /students
 *   /students      → liste des élèves
 *   /classes       → gestion des classes
 *   /teachers      → liste des enseignants
 *   /grades        → notes (param ?classe= pour présélection)
 *   /import        → importation Excel
 *   /archive       → élèves archivés
 *   /settings      → paramètres
 *   /admin         → administration
 *   /options/templates → modèles de documents
 *   /options/purge     → suppression des données
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthContext } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { Layout } from './components/layout/Layout';
import { StudentList } from './components/students/StudentList';
import { ClassList } from './components/classes/ClassList';
import { GradesList } from './components/grades/GradesList';
import { TeacherList } from './components/teachers/TeacherList';
import { Settings } from './components/settings/Settings';
import { ArchivePage } from './components/archive/ArchivePage';
import { ImportPage } from './components/import/ImportPage';
import { AdminPage } from './components/admin/AdminPage';
import { TemplatesPage } from './components/options/TemplatesPage';
import { PurgePage } from './components/options/PurgePage';
import { NavigationContext, useNavigationProvider } from './contexts/NavigationContext';

function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50">
        <div className="flex items-center space-x-3 text-indigo-600">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Chargement…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  return <AppRoutes user={user} onLogout={logout} />;
}

/** Rendu des routes — séparé pour accéder aux hooks React Router */
function AppRoutes({ user, onLogout }: { user: { name: string; role: string }; onLogout: () => void }) {
  const { hasPermission } = useAuthContext();
  const navValue = useNavigationProvider();

  return (
    <NavigationContext.Provider value={navValue}>
      <Layout
        userName={user.name}
        userRole={user.role}
        activePath={navValue.activePath}
        onNavigate={navValue.navigate}
        onLogout={onLogout}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/students" replace />} />

          <Route path="/students" element={
            hasPermission('students:view') ? <StudentList /> : <AccessDenied />
          } />

          <Route path="/classes" element={
            hasPermission('classes:view') ? <ClassList /> : <AccessDenied />
          } />

          <Route path="/teachers" element={
            hasPermission('teachers:view') ? <TeacherList /> : <AccessDenied />
          } />

          <Route path="/grades" element={
            hasPermission('grades:view') ? (
              <GradesList
                initialGrade={navValue.preselectedGrade}
                onGradeSelected={navValue.clearPreselectedGrade}
              />
            ) : <AccessDenied />
          } />

          <Route path="/import" element={
            hasPermission('import:use') ? <ImportPage /> : <AccessDenied />
          } />

          <Route path="/archive" element={
            hasPermission('archive:view') ? <ArchivePage /> : <AccessDenied />
          } />

          <Route path="/settings" element={
            hasPermission('settings:view') ? <Settings /> : <AccessDenied />
          } />

          <Route path="/admin" element={
            hasPermission('admin:users') || hasPermission('admin:roles')
              ? <AdminPage />
              : <AccessDenied />
          } />

          <Route path="/options/templates" element={
            hasPermission('settings:view') ? <TemplatesPage /> : <AccessDenied />
          } />

          <Route path="/options/purge" element={
            hasPermission('settings:view') ? <PurgePage /> : <AccessDenied />
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/students" replace />} />
        </Routes>
      </Layout>
    </NavigationContext.Provider>
  );
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">🔒</span>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Accès refusé</h2>
      <p className="text-slate-500 text-sm max-w-sm">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        Contactez l'administrateur si vous pensez que c'est une erreur.
      </p>
    </div>
  );
}

export default App;
