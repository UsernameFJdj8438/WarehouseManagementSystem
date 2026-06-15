import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee, EmployeeRole } from '../../inventory/types/inventory.types';
import { AuthContextType, AuthState } from '../types/auth.types';
import api from '../../../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // check for existing session
  useEffect(() => {
    const storedUser = localStorage.getItem('wms_user');
    const storedToken = localStorage.getItem('wms_token');
    if (storedUser && storedToken) {
      setState({
        user: JSON.parse(storedUser),
        token: storedToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const loginWithRealGoogle = async (idToken: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // send token in the request body
      const response = await api.post('/auth/google-login', {
        idToken: idToken
      });
      const { token, user } = response.data;

      localStorage.setItem('wms_user', JSON.stringify(user));
      localStorage.setItem('wms_token', token);

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Google login failed', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const loginWithGoogle = async (demoUser?: Employee) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const id = demoUser?.employeeID || 1;
      const response = await api.post('/auth/demo-login', id);
      const { token, user } = response.data;

      localStorage.setItem('wms_user', JSON.stringify(user));
      localStorage.setItem('wms_token', token);

      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Demo login failed', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('wms_user');
    localStorage.removeItem('wms_token');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, loginWithGoogle, loginWithRealGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
