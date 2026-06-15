import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/Layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { ViewerPage } from './pages/ViewerPage';
import { AuthProvider } from './features/auth/context/AuthContext';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { LoginPage } from './features/auth/components/LoginPage';

import { RentShelvesPage } from './pages/RentShelvesPage';
import { MyContractsPage } from './pages/MyContractsPage';
import { ContractDetailPage } from './pages/ContractDetailPage';
import { EmployeeManagementPage } from './pages/EmployeeManagementPage';
import { CustomerManagementPage } from './pages/CustomerManagementPage';
import { useAppSelector } from './store/hooks';
import { useEffect } from 'react';

function App() {
  const darkMode = useAppSelector((state) => state.theme.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* protected routes */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/viewer" element={<ViewerPage />} />
                    <Route path="/rent" element={<RentShelvesPage />} />
                    <Route path="/contracts" element={<MyContractsPage />} />
                    <Route path="/contracts/:id" element={<ContractDetailPage />} />
                    <Route path="/admin/employees" element={<EmployeeManagementPage />} />
                    <Route path="/admin/customers" element={<CustomerManagementPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
