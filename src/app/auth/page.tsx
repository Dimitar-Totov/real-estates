"use client";

import { useState } from "react";

type Mode = "login" | "register";

const C = {
  login: {
    text: "#2d3e50",
    sub: "#4a5f7f",
    from: "#8bb4e0",
    to: "#a8a7e0",
    focus: "#8bb4e0",
    shadow: "rgba(139,180,224,0.3)",
    link: "#6a9fd0",
  },
  register: {
    text: "#1a5a5a",
    sub: "#3a7a7a",
    from: "#7ec9b8",
    to: "#8fd9c8",
    focus: "#7ec9b8",
    shadow: "rgba(126,201,184,0.3)",
    link: "#5ab9a8",
  },
} as const;

const SOCIAL = [
  { icon: "fab fa-google",     label: "Google",   color: "#ea4335" },
  { icon: "fab fa-github",     label: "GitHub",   color: "#24292e" },
  { icon: "fab fa-linkedin-in",label: "LinkedIn", color: "#0077b5" },
] as const;

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [visible, setVisible] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(false);

  const isLogin = mode === "login";
  const c = C[mode];

  const switchMode = () => {
    setVisible(false);
    setTimeout(() => {
      setMode((m) => (m === "login" ? "register" : "login"));
      setEmail(""); setUsername(""); setPassword(""); setConfirm("");
      setVisible(true);
    }, 380);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password !== confirm) { alert("Passwords do not match!"); return; }
    alert(isLogin ? "Signed in successfully!" : "Account created successfully!");
  };

  const fade: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(14px)",
    transition: "opacity 0.35s ease, transform 0.35s ease",
  };

  const LABEL: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#555",
    marginBottom: "8px",
  };

  const ICON: React.CSSProperties = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#c0c0c0",
    fontSize: "13px",
    pointerEvents: "none",
  };

  const mkInput = (): React.CSSProperties => ({
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 14px 11px 40px",
    borderRadius: "8px",
    border: "1.5px solid #e0e0e0",
    fontSize: "14px",
    fontFamily: "inherit",
    background: "#fff",
    outline: "none",
    transition: "border-color 0.25s ease, box-shadow 0.25s ease",
  });

  const Field = ({
    label, icon, type, value, onChange, placeholder, required = true,
  }: {
    label: string; icon: string; type: string;
    value: string; onChange: (v: string) => void;
    placeholder: string; required?: boolean;
  }) => (
    <div style={{ marginBottom: "20px" }}>
      <label style={LABEL}>{label}</label>
      <div style={{ position: "relative" }}>
        <i className={icon} style={ICON} />
        <input
          className="auth-input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{ "--fc": c.focus, "--fs": c.shadow, ...mkInput() } as React.CSSProperties}
        />
      </div>
    </div>
  );

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        crossOrigin="anonymous"
      />
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .auth-card { animation: slideUp 0.6s ease-out both; }
        .auth-input:focus {
          border-color: var(--fc) !important;
          box-shadow: 0 0 0 3px var(--fs) !important;
        }
        .auth-btn {
          transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
        }
        .auth-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.18);
          filter: brightness(1.06);
        }
        .auth-btn:active { transform: translateY(0); box-shadow: none; }
        .social-btn { transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; }
        .social-btn:hover { background: #f5f5f5 !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .switch-btn { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; }
        .switch-btn:hover { text-decoration: underline; }
        .forgot-link:hover { opacity: 0.7; }
      `}</style>

      <div
        style={{
          minHeight: "calc(100vh - 4rem)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
          background: "linear-gradient(135deg, #eef2ff 0%, #f0faf7 100%)",
        }}
      >
        <div
          className="auth-card w-full flex flex-col md:flex-row"
          style={{
            maxWidth: "900px",
            borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            overflow: "hidden",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* ── SIDEBAR ── */}
          <div
            className="md:w-2/5 flex flex-col items-center justify-center text-center relative"
            style={{ minHeight: "220px", padding: "40px 32px" }}
          >
            {/* Two gradient layers fade between each other */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, #a8d5ff 0%, #b8c5f6 100%)",
              opacity: isLogin ? 1 : 0,
              transition: "opacity 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, #c8f0e8 0%, #d8f5f0 100%)",
              opacity: isLogin ? 0 : 1,
              transition: "opacity 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
            }} />

            <div style={{ position: "relative", zIndex: 1, ...fade }}>
              <div
                className="text-[60px] md:text-[80px]"
                style={{ marginBottom: "20px", color: c.text, transition: "color 0.4s ease", lineHeight: 1 }}
              >
                <i className={isLogin ? "fas fa-building" : "fas fa-home"} />
              </div>
              <h2 style={{
                fontSize: "clamp(22px, 4vw, 32px)",
                fontWeight: 700,
                color: c.text,
                marginBottom: "12px",
                transition: "color 0.4s ease",
              }}>
                {isLogin ? "Welcome Back" : "Join Us Today"}
              </h2>
              <p style={{
                fontSize: "14px",
                lineHeight: "1.65",
                color: c.sub,
                maxWidth: "260px",
                margin: "0 auto",
                transition: "color 0.4s ease",
              }}>
                {isLogin
                  ? "Sign in to access your saved homes and personalized property alerts."
                  : "Create an account to track favorites and get tailored home recommendations."}
              </p>
            </div>
          </div>

          {/* ── FORM AREA ── */}
          <div
            className="flex-1 bg-white"
            style={{ padding: "clamp(32px, 5vw, 60px) clamp(24px, 6vw, 60px)" }}
          >
            <div style={fade}>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a2e", margin: "0 0 6px" }}>
                {isLogin ? "Sign In" : "Create Account"}
              </h1>
              <p style={{ fontSize: "14px", color: "#aaa", margin: "0 0 28px" }}>
                {isLogin ? "Enter your credentials to continue" : "Fill in your details to get started"}
              </p>

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <Field label="Username" icon="fas fa-user" type="text"
                    value={username} onChange={setUsername} placeholder="johndoe" />
                )}
                <Field label="Email Address" icon="fas fa-envelope" type="email"
                  value={email} onChange={setEmail} placeholder="you@example.com" />
                <Field label="Password" icon="fas fa-lock" type="password"
                  value={password} onChange={setPassword} placeholder="••••••••" />
                {!isLogin && (
                  <Field label="Confirm Password" icon="fas fa-lock" type="password"
                    value={confirm} onChange={setConfirm} placeholder="••••••••" />
                )}

                {isLogin && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#555", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        style={{ accentColor: c.focus, width: "15px", height: "15px" }}
                      />
                      Remember me
                    </label>
                    <a
                      href="#"
                      className="forgot-link"
                      style={{ fontSize: "13px", color: c.link, textDecoration: "none", fontWeight: 500, transition: "opacity 0.2s ease" }}
                    >
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-btn"
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "8px",
                    border: "none",
                    background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: "24px",
                    fontFamily: "inherit",
                    letterSpacing: "0.02em",
                  }}
                >
                  {isLogin ? "Sign In" : "Create Account"}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ flex: 1, height: "1px", background: "#ebebeb" }} />
                <span style={{ fontSize: "12px", color: "#c0c0c0", whiteSpace: "nowrap" }}>or continue with</span>
                <div style={{ flex: 1, height: "1px", background: "#ebebeb" }} />
              </div>

              {/* Social buttons */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
                {SOCIAL.map(({ icon, label, color }) => (
                  <button
                    key={label}
                    type="button"
                    className="social-btn"
                    onClick={() => alert(`${label} ${isLogin ? "login" : "signup"} coming soon!`)}
                    style={{
                      flex: 1,
                      padding: "9px 6px",
                      borderRadius: "8px",
                      border: "1.5px solid #e8e8e8",
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontSize: "13px",
                      color: "#555",
                      fontFamily: "inherit",
                    }}
                  >
                    <i className={icon} style={{ color, fontSize: "15px" }} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Switch mode */}
              <p style={{ textAlign: "center", fontSize: "14px", color: "#aaa", margin: 0 }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button className="switch-btn" onClick={switchMode} style={{ color: c.link }}>
                  {isLogin ? "Create one" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
