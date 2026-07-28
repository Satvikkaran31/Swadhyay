import { createContext, useContext, useState, useEffect } from 'react';
import { authHelpers } from '../utils/googleLoginHelper';

interface UserData {
  id: number;
  google_id: string;
  name: string;
  email: string;
  picture: string;
  role: string;
  verified: boolean;
}

interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await authHelpers.checkAuth();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authHelpers.logout();
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value: UserContextType = { user, setUser, loading, logout, checkAuthStatus };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserProvider;
