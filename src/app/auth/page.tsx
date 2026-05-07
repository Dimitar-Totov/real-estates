"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, Home, Building2 } from "lucide-react";

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

function Field({
  label, icon, type, value, onChange, placeholder, required = true, focusColor, focusShadow, trailing,
}: {
  label: string; icon: ReactNode; type: string;
  value: string; onChange: (v: string) => void;
  placeholder: string; required?: boolean;
  focusColor: string; focusShadow: string;
  trailing?: { icon: ReactNode; onClick: () => void; label: string };
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label style={{
        display: "block", fontSize: "13px", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.05em", color: "#555", marginBottom: "8px",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
          color: "#c0c0c0", fontSize: "14px", pointerEvents: "none", display: "inline-flex",
          alignItems: "center", justifyContent: "center",
        }}>{icon}</span>
        <input
          className="auth-input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{
            "--fc": focusColor, "--fs": focusShadow,
            width: "100%", boxSizing: "border-box",
            padding: trailing ? "11px 44px 11px 40px" : "11px 14px 11px 40px",
            borderRadius: "8px", border: "1.5px solid #e0e0e0", fontSize: "14px",
            fontFamily: "inherit", background: "#fff", outline: "none",
            transition: "border-color 0.25s ease, box-shadow 0.25s ease",
          } as React.CSSProperties}
        />
        {trailing && (
          <button
            type="button"
            aria-label={trailing.label}
            onClick={trailing.onClick}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "transparent",
              color: "#68707a",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {trailing.icon}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [visible, setVisible] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const c = C[mode];

  const switchMode = () => {
    setVisible(false);
    setError("");
    setTimeout(() => {
      setMode((m) => (m === "login" ? "register" : "login"));
      setEmail(""); setUsername(""); setPassword(""); setConfirm("");
      setVisible(true);
    }, 380);
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");

    if (!isLogin && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Login failed."); return; }
        router.push("/");
        router.refresh();
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Registration failed."); return; }
        // Auto-login with the just-registered credentials
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) { setError(loginData.error ?? "Login failed."); return; }
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fade: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(14px)",
    transition: "opacity 0.35s ease, transform 0.35s ease",
  };

  return (
    <>
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
        .auth-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.18);
          filter: brightness(1.06);
        }
        .auth-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
        .auth-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .switch-btn { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; }
        .switch-btn:hover { text-decoration: underline; }
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
                {isLogin ? <Building2 size={64} /> : <Home size={64} />}
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

              {error && (
                <div style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#fff0f0",
                  border: "1px solid #ffd0d0",
                  color: "#c0392b",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {!isLogin && (
<Field label="Username" icon={<User size={16} />} type="text"
                  value={username} onChange={setUsername} placeholder="johndoe"
                  focusColor={c.focus} focusShadow={c.shadow} />
                )}
                <Field label="Email Address" icon={<Mail size={16} />} type="email"
                  value={email} onChange={setEmail} placeholder="you@example.com"
                  focusColor={c.focus} focusShadow={c.shadow} />
                <Field label="Password" icon={<Lock size={16} />} type={showPassword ? "text" : "password"}
                  value={password} onChange={setPassword} placeholder="••••••••"
                  focusColor={c.focus} focusShadow={c.shadow}
                  trailing={{
                    icon: showPassword ? <Eye size={16} /> : <EyeOff size={16} />,
                    onClick: () => setShowPassword((prev) => !prev),
                    label: showPassword ? "Hide password" : "Show password",
                  }}
                />
                {!isLogin && (
                  <Field label="Confirm Password" icon={<Lock size={16} />} type={showConfirmPassword ? "text" : "password"}
                    value={confirm} onChange={setConfirm} placeholder="••••••••"
                    focusColor={c.focus} focusShadow={c.shadow}
                    trailing={{
                      icon: showConfirmPassword ? <Eye size={16} /> : <EyeOff size={16} />,
                      onClick: () => setShowConfirmPassword((prev) => !prev),
                      label: showConfirmPassword ? "Hide confirm password" : "Show confirm password",
                    }}
                  />
                )}

                <button
                  type="submit"
                  className="auth-btn"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "8px",
                    border: "none",
                    background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    marginBottom: "24px",
                    fontFamily: "inherit",
                    letterSpacing: "0.02em",
                  }}
                >
                  {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
                </button>
              </form>

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
