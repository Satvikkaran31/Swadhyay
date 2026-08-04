import { useState } from "react";
import "../styles/LinkedInModal.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface Props {
  onDone: (linkedin_url: string | null) => void;
}

export default function LinkedInModal({ onDone }: Props) {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isValidLinkedIn = (val: string) => {
    if (!val) return true;
    return val.includes("linkedin.com/in/");
  };

  const handleSave = async () => {
    const trimmed = url.trim();
    if (trimmed && !isValidLinkedIn(trimmed)) {
      setError("Please enter a valid LinkedIn profile URL (e.g. https://linkedin.com/in/yourname)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedin_url: trimmed || null }),
      });
      const data = await res.json();
      onDone(data.linkedin_url ?? null);
    } catch {
      setError("Something went wrong. You can update this later from your profile.");
      onDone(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="li-modal-overlay">
      <div className="li-modal">
        <div className="li-modal-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </div>

        <h2 className="li-modal-title">One quick thing</h2>
        <p className="li-modal-sub">
          Adding your LinkedIn helps Neha understand your background and tailor your experience. Completely optional — you can skip anytime.
        </p>

        <div className="li-modal-field">
          <label htmlFor="li-url">Your LinkedIn profile URL</label>
          <input
            id="li-url"
            type="url"
            placeholder="https://linkedin.com/in/yourname"
            value={url}
            onChange={e => { setUrl(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            autoFocus
          />
          {error && <span className="li-modal-error">{error}</span>}
        </div>

        <div className="li-modal-actions">
          <button className="li-modal-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save & Continue"}
          </button>
          <button className="li-modal-skip" onClick={() => onDone(null)} disabled={saving}>
            Skip for now
          </button>
        </div>

        <p className="li-modal-privacy">
          Your LinkedIn URL is only visible to Neha and is never shared with third parties.
        </p>
      </div>
    </div>
  );
}
