// utils/googleLoginHelper.js
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export function useTriggerGoogleLogin(setUser, navigateTo = "/", navigate) {
  return useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        console.log('Authorization code received:', codeResponse.code);
        
        const apiBase = import.meta.env.PROD
          ? "https://swadhyay-pa3f.onrender.com"
          : "http://localhost:5000";

        const response = await axios.post(`${apiBase}/api/auth/google`, {
          code: codeResponse.code,
          redirect_uri: window.location.origin
        }, {
          withCredentials: true
        });

        const userData = response.data.user;
        setUser(userData);

        console.log('Login successful:', userData);
        navigate(navigateTo);

      } catch (err) {
        console.error("Login error:", err);
        alert("Google login failed. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Login Failed:", error);
      alert("Google login failed. Please try again.");
    },
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
  });
}

// utils/authHelpers.js - Helper functions for auth management
export const authHelpers = {
  // Check if user is authenticated (by checking with backend)
  checkAuth: async () => {
    try {
      const apiBase = import.meta.env.PROD
        ? "https://swadhyay-pa3f.onrender.com"
        : "http://localhost:5000";
        
      const response = await axios.get(`${apiBase}/api/auth/me`, {
        withCredentials: true
      });
      
      return response.data.user;
    } catch (error) {
      return null;
    }
  },

  // Logout function
  logout: async () => {
    try {
      const apiBase = import.meta.env.PROD
        ? "https://swadhyay-pa3f.onrender.com"
        : "http://localhost:5000";
        
      await axios.post(`${apiBase}/api/auth/logout`, {}, {
        withCredentials: true
      });
      
      // Clear local state
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }
};