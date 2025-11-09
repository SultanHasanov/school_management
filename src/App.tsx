import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import ruRU from "antd/locale/ru_RU";
import { observer } from "mobx-react-lite";
import { LoginPage } from "./pages/LoginPage";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { StudentsPage } from "./pages/StudentsPage";
import { TeachersPage } from "./pages/TeachersPage";
import { ClassesPage } from "./pages/ClassesPage";
import { SchoolsPage } from "./pages/SchoolsPage";
import { authStore } from "./stores/auth.store"; // путь к вашему store

// Кастомный хук для проверки авторизации через MobX store
function useAuth() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Store уже сам инициализируется из localStorage, просто даем время
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const signOut = () => {
    authStore.logout();
  };

  return {
    user: authStore.isAuthenticated
      ? {
          name: "Admin",
          role: authStore.role,
          userId: authStore.userId,
        }
      : null,
    loading,
    signOut,
  };
}

// Компонент для защищенных маршрутов
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const AppContent = observer(() => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/students" element={<StudentsPage />} />
                  <Route path="/teachers" element={<TeachersPage />} />
                  <Route path="/classes" element={<ClassesPage />} />
                  <Route path="/schools" element={<SchoolsPage />} />
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
});

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-[1600px] mx-auto w-full">
        <ConfigProvider
          locale={ruRU}
          theme={{
            token: {
              colorPrimary: "#1890ff",
              borderRadius: 6,
            },
            algorithm: theme.defaultAlgorithm,
          }}
        >
          <AppContent />
        </ConfigProvider>
      </div>
    </div>
  );
}

export default App;
