import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SITE } from "../config/siteConfig";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const googleButtonRef = useRef(null);
  const googleBusyRef = useRef(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;

    let cancelled = false;
    const initializeGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          if (googleBusyRef.current) return;
          if (!credential) {
            setGoogleError("Google did not return a sign-in credential. Please try again.");
            return;
          }
          googleBusyRef.current = true;
          setGoogleError("");
          setGoogleSubmitting(true);
          const result = await loginWithGoogle(credential);
          googleBusyRef.current = false;
          setGoogleSubmitting(false);
          if (result.success) navigate(`/${result.user.role}`);
          else setGoogleError(result.message);
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 360,
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogleButton();
      return () => { cancelled = true; };
    }

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", initializeGoogleButton);
    script.addEventListener("error", () => {
      if (!cancelled) setGoogleError("Google sign-in could not load. Check your internet connection and try again.");
    }, { once: true });
    return () => {
      cancelled = true;
      script.removeEventListener("load", initializeGoogleButton);
    };
  }, [loginWithGoogle, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await login(identifier, password);
      if (result.success) navigate(`/${result.user.role}`);
      else setError(result.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-welcome">
          <Link to="/" className="login-brand">
            <span>{SITE.logoMark}</span>
            <strong>{SITE.shortName}<small>College Portal</small></strong>
          </Link>
          <div className="login-welcome-copy">
            <span className="login-welcome-kicker">YOUR CAMPUS, CONNECTED</span>
            <h1>Welcome to your<br /><span>next chapter.</span></h1>
            <p>One secure place for classes, campus updates, results, and the tools you need to move forward.</p>
          </div>
          <div className="login-welcome-foot">Bhaskar Institute of Technology and Science</div>
        </section>

        <section className="login-card">
          <div className="login-heading">
            <span className="login-heading-mark">{SITE.logoMark}</span>
            <h2>Sign in to your portal</h2>
            <p>Use your college email or student roll number.</p>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="login-identifier">Email / Roll Number</label>
              <input
                id="login-identifier"
                type="text"
                required
                autoFocus
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="you@college.edu or 21CSE045"
              />
            </div>
            <div className="field">
              <div className="login-password-label">
                <label htmlFor="login-password">Password</label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <button
              className={`btn btn-primary login-submit${submitting ? " is-loading" : ""}`}
              type="submit"
              disabled={submitting || googleSubmitting}
              aria-busy={submitting}
            >
              {submitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="login-divider"><span>or continue with</span></div>
          {GOOGLE_CLIENT_ID ? (
            <div className={`login-google-wrap${googleSubmitting ? " is-busy" : ""}`}>
              <div ref={googleButtonRef} className="login-google-button" />
              {googleSubmitting && <span className="login-google-busy" role="status">Signing in with Google...</span>}
            </div>
          ) : (
            <button
              type="button"
              className="login-google-fallback"
              onClick={() => setGoogleError("Google sign-in needs to be configured by the administrator.")}
              disabled={submitting}
            >
              <svg aria-hidden="true" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z" />
                <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.5H5.8v5.3A20 20 0 0 0 24 44Z" />
                <path fill="#FBBC05" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z" />
                <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z" />
              </svg>
              Continue with Google
            </button>
          )}
          {googleError && <p className="login-google-error" role="alert">{googleError}</p>}

          <div className="login-help">
            Need help accessing your account? <a href={`mailto:${SITE.contactEmail}`}>Contact the college</a>
          </div>
          <Link to="/" className="login-home-link">← Back to homepage</Link>
        </section>
      </div>
    </main>
  );
};

export default Login;
