import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavePage } from './pages/LeavePage';
import { PayrollPage } from './pages/PayrollPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/employees" element={<ProtectedRoute roles={['admin', 'hr', 'manager']}><EmployeesPage /></ProtectedRoute>} />
                      <Route path="/departments" element={<ProtectedRoute roles={['admin', 'hr', 'manager']}><DepartmentsPage /></ProtectedRoute>} />
                      <Route path="/attendance" element={<ProtectedRoute roles={['admin', 'hr', 'manager']}><AttendancePage /></ProtectedRoute>} />
                      <Route path="/leave" element={<LeavePage />} />
                      <Route path="/payroll" element={<ProtectedRoute roles={['admin', 'hr']}><PayrollPage /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProfilePage />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
