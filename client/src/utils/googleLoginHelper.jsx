// utils/googleLoginHelper.js
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export function useTriggerGoogleLogin(setUser, navigateTo = "/") {
  return useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // 1. Get user info from Google
        const res = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });

        // 2. Add token to user object
        const userWithToken = {
          ...res.data,
          token: tokenResponse.access_token,
        };

        // 3. Save in context + localStorage
        setUser(userWithToken);
        localStorage.setItem("user", JSON.stringify(userWithToken));
        localStorage.setItem("auth_token", tokenResponse.access_token);

        // 4. Send token to backend to establish session
        const apiBase = import.meta.env.PROD
        ? "https://swadhyay-pa3f.onrender.com"
        : "http://localhost:5000";

        await axios.post(`${apiBase}/api/auth/google`, {
        token: tokenResponse.access_token
        }, {
        withCredentials: true
        });
        // 5. Navigate after session is established
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
  });
}
