import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import UserProvider from "./context/UserProvider.jsx"; 
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <UserProvider>
      <App />
    </UserProvider>
  </GoogleOAuthProvider>
);
