import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CompletionProvider } from './context/CompletionContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { SidebarProvider } from './context/SidebarContext';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Questions } from './pages/Questions';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { NotFound } from './pages/NotFound';
import './styles/global.css';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <CompletionProvider>
            <FavoritesProvider>
              <SidebarProvider>
                <Routes>
                  <Route path="/" element={<AppLayout><Home /></AppLayout>} />
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  <Route path="/questions" element={<Navigate to="/questions/two-sum" replace />} />
                  <Route path="/questions/:name" element={<AppLayout><Questions /></AppLayout>} />
                  <Route path="/courses" element={<AppLayout><Courses /></AppLayout>} />
                  <Route path="/courses/:filename" element={<AppLayout><CourseDetail /></AppLayout>} />
                  <Route path="/auth/sign-in" element={<AppLayout><SignIn /></AppLayout>} />
                  <Route path="/auth/sign-up" element={<AppLayout><SignUp /></AppLayout>} />
                  <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
                </Routes>
              </SidebarProvider>
            </FavoritesProvider>
          </CompletionProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
