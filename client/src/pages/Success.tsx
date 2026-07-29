import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const breatheKf = `
  @keyframes breathe {
    0%, 100% { transform: scale(1);   opacity: .55; }
    50%       { transform: scale(1.1); opacity: 1;   }
  }
`;

const pageBg = `
  radial-gradient(100% 90% at 90% -10%, #155E55 0%, rgba(21,94,85,0) 60%),
  linear-gradient(168deg, #123B2F 0%, #0F2E24 45%, #0C2419 100%)
`;

export default function Success() {
  return (
    <>
      <style>{breatheKf}</style>
      <Navbar />
      <div
        style={{
          minHeight: "100vh",
          background: pageBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 22px 60px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Teal glow orb */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "400px",
            height: "400px",
            borderRadius: "999px",
            background:
              "radial-gradient(circle, rgba(95,200,184,.35) 0%, rgba(95,200,184,0) 70%)",
            filter: "blur(24px)",
            pointerEvents: "none",
          }}
        />

        {/* Card */}
        <div
          style={{
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: "28px",
            padding: "60px 52px",
            textAlign: "center",
            maxWidth: "520px",
            width: "100%",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            position: "relative",
          }}
        >
          {/* Ring wrap */}
          <div
            style={{
              position: "relative",
              width: "120px",
              height: "120px",
              margin: "0 auto 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Ring 1 */}
            <div
              style={{
                position: "absolute",
                width: "120px",
                height: "120px",
                borderRadius: "999px",
                border: "1px solid rgba(143,224,212,.28)",
                animation: "breathe 3.2s ease-in-out infinite",
              }}
            />
            {/* Ring 2 */}
            <div
              style={{
                position: "absolute",
                width: "84px",
                height: "84px",
                borderRadius: "999px",
                border: "1px solid rgba(143,224,212,.4)",
                animation: "breathe 3.2s ease-in-out infinite .4s",
              }}
            />
            {/* Check icon */}
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "999px",
                background: "#0E9C8A",
                color: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 700,
                position: "relative",
                zIndex: 1,
              }}
            >
              ✓
            </div>
          </div>

          <h1
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 300,
              fontSize: "46px",
              color: "#F4F1E9",
              margin: "0 0 16px",
              lineHeight: 1.1,
            }}
          >
            Booking Confirmed
          </h1>

          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "17px",
              color: "#B9C6BC",
              lineHeight: 1.65,
              maxWidth: "400px",
              margin: "0 auto 32px",
            }}
          >
            You'll receive a confirmation email with your meeting details shortly.
            Check your inbox — and we'll see you soon.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <Link
              to="/my-sessions"
              style={{
                background: "#5FC8B8",
                color: "#0C241C",
                borderRadius: "999px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                padding: "15px 32px",
                textDecoration: "none",
                display: "block",
              }}
            >
              View my sessions →
            </Link>
            <Link
              to="/"
              style={{
                border: "1.5px solid rgba(255,255,255,.22)",
                color: "#CDD7CF",
                background: "transparent",
                borderRadius: "999px",
                fontFamily: "'Poppins', sans-serif",
                fontSize: "16px",
                padding: "15px 32px",
                textDecoration: "none",
                display: "block",
              }}
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
