/**
 * Composant racine de l'application Collège Sully.
 * Gère la navigation entre les pages via un état simple (pas de React Router).
 * Fournit les contextes de navigation, d'authentification et de permissions.
 */
import React from 'react';
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
import { NavigationContext } from './contexts/NavigationContext';

function App() {
  const { user, loading, login, logout } = useAuth();
  const { hasPermission } = useAuthContext();

  const [activePath, setActivePath] = React.useState('/students');
  const [preselectedGrade, setPreselectedGrade] = React.useState<string | null>(null);

  const navigate = (path: string) => setActivePath(path);

  const navigateToGrades = (grade: string) => {
    setPreselectedGrade(grade);
    setActivePath('/grades');
  };

  const clearPreselectedGrade = () => setPreselectedGrade(null);

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

  const renderContent = () => {
    switch (activePath) {
      case '/students':
        return hasPermission('students:view') ? <StudentList /> : <AccessDenied />;
      case '/classes':
        return hasPermission('classes:view') ? <ClassList /> : <AccessDenied />;
      case '/teachers':
        return hasPermission('teachers:view') ? <TeacherList /> : <AccessDenied />;
      case '/grades':
        return hasPermission('grades:view') ? (
          <GradesList initialGrade={preselectedGrade} onGradeSelected={clearPreselectedGrade} />
        ) : <AccessDenied />;
      case '/import':
        return hasPermission('import:use') ? <ImportPage /> : <AccessDenied />;
      case '/archive':
        return hasPermission('archive:view') ? <ArchivePage /> : <AccessDenied />;
      case '/settings':
        return hasPermission('settings:view') ? <Settings /> : <AccessDenied />;
      case '/admin':
        return hasPermission('admin:users') || hasPermission('admin:roles')
          ? <AdminPage />
          : <AccessDenied />;
      case '/options/templates':
        return hasPermission('settings:view') ? <TemplatesPage /> : <AccessDenied />;
      case '/options/purge':
        return hasPermission('settings:view') ? <PurgePage /> : <AccessDenied />;
      default:
        return <StudentList />;
    }
  };

  return (
    <NavigationContext.Provider value={{
      navigate,
      navigateToGrades,
      activePath,
      preselectedGrade,
      clearPreselectedGrade,
    }}>
      <Layout
        userName={user.name}
        userRole={user.role}
        activePath={activePath}
        onNavigate={navigate}
        onLogout={logout}
      >
        {renderContent()}
      </Layout>
    </NavigationContext.Provider>
  );
}

/** Affiché quand l'utilisateur n'a pas accès à une page */
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
