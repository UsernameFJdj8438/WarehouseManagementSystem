import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { EmployeeRole } from '../../inventory/types/inventory.types';
import { GoogleLogin } from '@react-oauth/google';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, loginWithRealGoogle, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const demoUsers = [
    { employeeID: 1, name: 'Alice (Manager)', role: EmployeeRole.Manager },
    { employeeID: 2, name: 'Bob (Worker)', role: EmployeeRole.Worker },
    { employeeID: 3, name: 'Charlie (Worker)', role: EmployeeRole.Worker },
  ];

  // if already authenticated then redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);


  const handleDemoLogin = async (user: typeof demoUsers[0]) => {
    try {
      await loginWithGoogle(user);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        await loginWithRealGoogle(credentialResponse.credential);
      } catch (error) {
        console.error("Google Login failed", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          WMS Control Center
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <div className="space-y-6">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.log('Login Failed')}
                useOneTap
                theme="filled_blue"
                shape="rectangular"
                width="100%"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 uppercase tracking-wider text-xs font-bold">
                  Or continue with Demo Accounts
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {demoUsers.map((user) => (
                <button
                  key={user.employeeID}
                  onClick={() => handleDemoLogin(user)}
                  disabled={isLoading}
                  className="w-full flex justify-between items-center py-2 px-4 border border-gray-200 rounded-md shadow-sm bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="text-left">
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-tighter">{EmployeeRole[user.role]}</div>
                    </div>
                  </div>
                  {isLoading && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
