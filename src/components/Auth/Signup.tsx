import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export interface SignupProps {
  onSwitchToLogin: () => void;
  onClose: () => void;
  isVisible?: boolean;
}

export default function Signup(props: SignupProps) {
  const { onSwitchToLogin, onClose, isVisible = true } = props;
  const { loginWithGoogle, loginWithFacebook, loginWithX, signUpWithEmail } =
    useAuth();
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSocialSignup = async (provider: "google" | "facebook" | "x") => {
    try {
      setLoading(true);
      setError("");
      if (provider === "google") await loginWithGoogle();
      else if (provider === "facebook") await loginWithFacebook();
      else if (provider === "x") await loginWithX();
      // Don't call onClose - App.tsx will handle it via useEffect
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to sign up");
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await signUpWithEmail(email, password);
      // Don't call onClose - App.tsx will handle it via useEffect
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account already exists with this email");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak");
      } else {
        setError(err.message || "Failed to sign up");
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
    fontWeight: 500 as const,
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
          Create account
        </h2>

        <p
          style={{
            color: "#6B6B6B",
            marginBottom: "32px",
            fontSize: "15px",
            lineHeight: 1.6,
          }}
        >
          Start your fasting journey today.
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

        {showEmailForm ? (
          <>
            {/* Email form */}
            <form onSubmit={handleEmailSignup}>
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
                  }}
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    backgroundColor: "transparent",
                    border: "1px solid #1F1F24",
                    color: "#F5F5F5",
                    fontSize: "14px",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email || !password || !confirmPassword}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  backgroundColor: "#F5F5F5",
                  border: "none",
                  color: "#0B0B0C",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity:
                    loading || !email || !password || !confirmPassword
                      ? 0.5
                      : 1,
                  marginBottom: "16px",
                }}
              >
                {loading ? "Creating account..." : "Create Account"}
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
            {/* Social signup buttons */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <button
                onClick={() => handleSocialSignup("google")}
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
                onClick={() => handleSocialSignup("facebook")}
                disabled={loading}
                style={socialButtonStyle}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = "#1877F2";
                    e.currentTarget.style.backgroundColor =
                      "rgba(24,119,242,0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1F1F24";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </button>

              <button
                onClick={() => handleSocialSignup("x")}
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

        {/* Switch to login */}
        <div
          style={{
            marginTop: "32px",
            textAlign: "center",
            paddingTop: "24px",
            borderTop: "1px solid #1F1F24",
          }}
        >
          <span style={{ color: "#6B6B6B", fontSize: "14px" }}>
            Already have an account?{" "}
          </span>
          <button
            onClick={onSwitchToLogin}
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
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
