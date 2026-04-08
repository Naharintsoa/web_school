/**
 * Composant racine — navigation via React Router v6.
 * Les pages sont chargées en lazy pour réduire le bundle initial.
 */
import { lazy, Suspense, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthContext } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { Layout } from './components/layout/Layout';
import { NavigationContext, useNavigationProvider } from './contexts/NavigationContext';

// ── Chargement paresseux de toutes les pages ──────────────────────────────────
const StudentList   = lazy(() => import('./components/students/StudentList').then(m => ({ default: m.StudentList })));
const ClassList     = lazy(() => import('./components/classes/ClassList').then(m => ({ default: m.ClassList })));
const GradesList    = lazy(() => import('./components/grades/GradesList').then(m => ({ default: m.GradesList })));
const TeacherList   = lazy(() => import('./components/teachers/TeacherList').then(m => ({ default: m.TeacherList })));
const Settings      = lazy(() => import('./components/settings/Settings').then(m => ({ default: m.Settings })));
const ArchivePage   = lazy(() => import('./components/archive/ArchivePage').then(m => ({ default: m.ArchivePage })));
const ImportPage    = lazy(() => import('./components/import/ImportPage').then(m => ({ default: m.ImportPage })));
const AdminPage     = lazy(() => import('./components/admin/AdminPage').then(m => ({ default: m.AdminPage })));
const TemplatesPage = lazy(() => import('./components/options/TemplatesPage').then(m => ({ default: m.TemplatesPage })));
const PurgePage     = lazy(() => import('./components/options/PurgePage').then(m => ({ default: m.PurgePage })));
const BilanPage     = lazy(() => import('./components/bilan/BilanPage').then(m => ({ default: m.BilanPage })));

// ── Indicateur de chargement des pages ───────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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

  if (!user) return <LoginForm onLogin={login} />;

  return <AppRoutes user={user} onLogout={logout} />;
}

function AppRoutes({ user, onLogout }: { user: { name: string; role: string }; onLogout: () => void }) {
  const { hasPermission } = useAuthContext();
  const nav = useNavigationProvider();

  // Mémoïsé pour éviter de re-rendre tout l'arbre à chaque navigation
  const navValue = useMemo(() => nav, [
    nav.activePath,
    nav.preselectedGrade,
    // Les fonctions sont stables tant que le routeur ne change pas
  ]);

  return (
    <NavigationContext.Provider value={navValue}>
      <Layout
        userName={user.name}
        userRole={user.role}
        activePath={navValue.activePath}
        onNavigate={navValue.navigate}
        onLogout={onLogout}
      >
        <Suspense fallback={<PageLoader />}>
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

            <Route path="/bilan" element={
              hasPermission('grades:view') ? <BilanPage /> : <AccessDenied />
            } />

            <Route path="/options/templates" element={
              hasPermission('settings:view') ? <TemplatesPage /> : <AccessDenied />
            } />

            <Route path="/options/purge" element={
              hasPermission('settings:view') ? <PurgePage /> : <AccessDenied />
            } />

            <Route path="*" element={<Navigate to="/students" replace />} />
          </Routes>
        </Suspense>
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
