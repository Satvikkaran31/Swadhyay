import * as Sentry from "@sentry/react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import UserProvider from "./context/UserProvider.jsx";
import "./styles/index.css";

// Apply the persisted theme at boot so every page — including Navbar-less ones
// like the LMS player — honours an explicit light/dark choice on a hard load.
try {
  const t = localStorage.getItem("sw-theme");
  if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
} catch { /* storage blocked */ }

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, tracesSampleRate: 0.1 });
}

function render() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <UserProvider>
        <App />
      </UserProvider>
    </GoogleOAuthProvider>
  );
}

// Offline preview build (VITE_DEMO): install the mock API BEFORE rendering so
// the very first auth/data request is answered from fixtures. Dead-code
// eliminated from the normal build, so fixtures are never bundled there.
if (import.meta.env.VITE_DEMO) {
  import("./demo/mock").then(({ installDemoMock }) => {
    installDemoMock();
    render();
  });
} else {
  render();
}
