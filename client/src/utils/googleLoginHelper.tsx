// utils/googleLoginHelper.js
import { useMemo } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getVisitorId } from './analytics';

export function useTriggerGoogleLogin(setUser, navigateTo?: string) {
  const navigate = useNavigate();
  // Generate once per mount — prevents CSRF code-substitution attacks
  const state = useMemo(() => crypto.randomUUID(), []);

  return useGoogleLogin({
    flow: 'auth-code',
    state,
    onSuccess: async (codeResponse) => {
      if (codeResponse.state !== state) {
        toast.error("Authentication error. Please try again.");
        return;
      }
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

        const response = await axios.post(`${apiBase}/api/auth/google`, {
          code: codeResponse.code,
          redirect_uri: 'postmessage',
          visitor_id: getVisitorId(),
        }, {
          withCredentials: true
        });

        const userData = response.data.user;
        setUser(userData);
        // Return the user to where they were (e.g. the course they wanted to
        // enroll in), not the homepage — unless a caller passed an explicit
        // destination. window.location is used so it reflects the current route
        // even if this login handler was created on an earlier render.
        const dest = navigateTo ?? (window.location.pathname + window.location.search);
        navigate(dest);
      } catch (err) {
        console.error("Login error:", err);
        toast.error("Google login failed. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Login Failed:", error);
      toast.error("Google login failed. Please try again.");
    },
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
  });
}


export const authHelpers = {
  // Check if user is authenticated (by checking with backend)
  checkAuth: async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        
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
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        
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