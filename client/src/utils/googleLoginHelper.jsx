// utils/googleLoginHelper.js
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export function useTriggerGoogleLogin(setUser, navigateTo = "/") {
  return useGoogleLogin({
    flow: 'auth-code', // Use authorization code flow
    onSuccess: async (codeResponse) => {
      try {
        console.log('Authorization code received:', codeResponse.code);
        
        // Send authorization code to your backend
        const apiBase = import.meta.env.PROD
          ? "https://swadhyay-pa3f.onrender.com"
          : "http://localhost:5000";

        const response = await axios.post(`${apiBase}/api/auth/google`, {
          code: codeResponse.code, // Send code, not token
          redirect_uri: window.location.origin // Send current origin
        }, {
          withCredentials: true // Important for cookies
        });

        // Backend will return user data and set secure cookies
        const userData = response.data.user;
        
        // Only store non-sensitive user data in context
        setUser(userData);
        
        // Don't store tokens in localStorage anymore!
        // Backend handles all token management
        
        console.log('Login successful:', userData);
        
        // Navigate after successful login
        window.location.href = navigateTo;
        
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
    // PKCE is automatically handled by the library
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