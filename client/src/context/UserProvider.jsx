  // context/UserProvider.jsx
  import  { createContext, useContext, useState, useEffect } from 'react';
  import { authHelpers } from '../utils/googleLoginHelper';

  export const UserContext = createContext();

  export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check authentication status on app load
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
        window.location.href = '/'; // Redirect to home
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };

    const value = {
      user,
      setUser,
      loading,
      logout,
      checkAuthStatus
    };

    return (
      <UserContext.Provider value={value}>
        {children}
      </UserContext.Provider>
    );
  }

  export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
      throw new Error('useUser must be used within a UserProvider');
    }
    return context;
  };

  export default UserProvider;