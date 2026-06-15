import { Employee } from '../../inventory/types/inventory.types';

export interface AuthState {
  user: Employee | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  loginWithGoogle: (demoUser?: Employee) => Promise<void>;
  loginWithRealGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
}
