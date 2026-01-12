import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export interface LoginProps {
  onSwitchToSignup: () => void;
  onClose: () => void;
  isVisible?: boolean;
}

export default function Login(props: LoginProps) {
  const { onSwitchToSignup, onClose, isVisible = true } = props;
  const { loginWithGoogle, loginWithX, loginWithEmail, sendPasswordReset } =
    useAuth();
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider: "google" | "x") => {
    try {
      setLoading(true);
      setError("");
      if (provider === "google") await loginWithGoogle();
      else if (provider === "x") await loginWithX();
      // Don't call onClose - App.tsx will handle it via useEffect
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to login");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError("");
      await loginWithEmail(email, password);
      // Don't call onClose - App.tsx will handle it via useEffect
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email");
      } else {
        setError(err.message || "Failed to login");
      }
      setLoading(false);
    }
  };

  const socialButtonStyle = {
    width: "100%",
    padding: "14px 24px",
    backgroundColor: "transparent",
    border: "1px solid #1F1F24",
    color: "#F5F5F5",
    fontSize: "14px",
    fontWeight: 500,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.5 : 1,
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: isVisible ? "rgba(0, 0, 0, 0.9)" : "rgba(0, 0, 0, 0)",
        backdropFilter: isVisible ? "blur(8px)" : "blur(0px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "24px",
        transition: "all 0.3s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#0B0B0C",
          border: "1px solid #1F1F24",
          padding: "48px",
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "translateY(0) scale(1)"
            : "translateY(20px) scale(0.95)",
          transition: "all 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - larger tap target for mobile */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid #2A2A2E",
            borderRadius: "50%",
            color: "#F5F5F5",
            fontSize: "18px",
            cursor: "pointer",
            padding: "0",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            transition: "all 0.2s ease",
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.2)";
            e.currentTarget.style.borderColor = "#F5F5F5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.borderColor = "#2A2A2E";
          }}
        >
          ✕
        </button>

        {/* Logo */}
        <div
          style={{
            fontSize: "18px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "12px",
            color: "#F5F5F5",
          }}
        >
          Interflow
        </div>

        {/* Heading */}
        <h2
          style={{
            fontSize: "32px",
            fontWeight: 600,
            marginBottom: "12px",
            letterSpacing: "-0.02em",
            color: "#F5F5F5",
          }}
        >
          Welcome back
        </h2>

        <p
          style={{
            color: "#6B6B6B",
            marginBottom: "32px",
            fontSize: "15px",
            lineHeight: 1.6,
          }}
        >
          Sign in to continue tracking your fasts.
        </p>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#EF4444",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {showForgotPassword ? (
          <>
            {/* Forgot Password Form */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#1F1F24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F5F5F5"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#F5F5F5",
                  marginBottom: "8px",
                }}
              >
                Reset Password
              </h3>
              <p style={{ fontSize: "13px", color: "#6B6B6B" }}>
                {resetSent
                  ? "Check your email for a reset link"
                  : "Enter your email and we'll send you a reset link"}
              </p>
            </div>

            {resetSent ? (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#10B98120",
                  border: "1px solid #10B981",
                  marginBottom: "24px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "#10B981",
                    fontSize: "14px",
                    marginBottom: "8px",
                  }}
                >
                  Password reset email sent!
                </p>
                <p style={{ color: "#6B6B6B", fontSize: "12px" }}>
                  Check your inbox for instructions to reset your password.
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: "24px" }}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    backgroundColor: "transparent",
                    border: "1px solid #1F1F24",
                    color: "#F5F5F5",
                    fontSize: "14px",
                    marginBottom: "16px",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={handleForgotPassword}
                  disabled={loading || !email}
                  style={{
                    width: "100%",
                    padding: "16px 24px",
                    backgroundColor: "#F5F5F5",
                    border: "none",
                    color: "#0B0B0C",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading || !email ? 0.5 : 1,
                  }}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetSent(false);
                setError("");
              }}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "transparent",
                border: "1px solid #1F1F24",
                color: "#6B6B6B",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Back to login
            </button>
          </>
        ) : showEmailForm ? (
          <>
            {/* Email form */}
            <form onSubmit={handleEmailLogin}>
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    backgroundColor: "transparent",
                    border: "1px solid #1F1F24",
                    color: "#F5F5F5",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    backgroundColor: "transparent",
                    border: "1px solid #1F1F24",
                    color: "#F5F5F5",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Forgot Password Link */}
              <div style={{ textAlign: "right", marginBottom: "24px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6B6B6B",
                    fontSize: "13px",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  backgroundColor: "#F5F5F5",
                  border: "none",
                  color: "#0B0B0C",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading || !email || !password ? 0.5 : 1,
                  marginBottom: "16px",
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            <button
              onClick={() => setShowEmailForm(false)}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "transparent",
                border: "1px solid #1F1F24",
                color: "#6B6B6B",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Back to other options
            </button>
          </>
        ) : (
          <>
            {/* Social login buttons */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <button
                onClick={() => handleSocialLogin("google")}
                disabled={loading}
                style={socialButtonStyle}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = "#F5F5F5";
                    e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1F1F24";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <button
                onClick={() => handleSocialLogin("x")}
                disabled={loading}
                style={socialButtonStyle}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = "#F5F5F5";
                    e.currentTarget.style.backgroundColor =
                      "rgba(255,255,255,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1F1F24";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Continue with X
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  margin: "8px 0",
                }}
              >
                <div
                  style={{ flex: 1, height: "1px", backgroundColor: "#1F1F24" }}
                />
                <span style={{ color: "#6B6B6B", fontSize: "12px" }}>or</span>
                <div
                  style={{ flex: 1, height: "1px", backgroundColor: "#1F1F24" }}
                />
              </div>

              <button
                onClick={() => setShowEmailForm(true)}
                style={socialButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#F5F5F5";
                  e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1F1F24";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
                Continue with Email
              </button>
            </div>
          </>
        )}

        {/* Switch to signup */}
        <div
          style={{
            marginTop: "32px",
            textAlign: "center",
            paddingTop: "24px",
            borderTop: "1px solid #1F1F24",
          }}
        >
          <span style={{ color: "#6B6B6B", fontSize: "14px" }}>
            Don't have an account?{" "}
          </span>
          <button
            onClick={onSwitchToSignup}
            style={{
              background: "none",
              border: "none",
              color: "#F5F5F5",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
