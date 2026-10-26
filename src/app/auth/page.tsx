"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { ArrowUpRight, Link2 } from "lucide-react";
import { firebase, firebaseConfigured } from "@/lib/firebase";
export default function Auth() {
  const [mode, setMode] = useState<"login" | "register" | "reset">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function run(google = false) {
    setBusy(true);
    setMessage("");
    try {
      const auth = firebase().auth;
      if (google) await signInWithPopup(auth, new GoogleAuthProvider());
      else if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setMessage("If an account exists, a reset link is on its way.");
        return;
      } else if (mode === "register") {
        const c = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(c.user);
      } else await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-art">
        <Link className="brand" href="/">
          <Link2 />
          linkfree<span>✳</span>
        </Link>
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>
            Big ideas.
            <br />
            One little link.
          </h1>
          <p>
            A space that feels like you.
            <br />
            Every feature. No subscription.
          </p>
        </div>
        <span>Made for people who make things.</span>
      </section>
      <section className="auth-form">
        <Link href="/" className="muted">
          ← Back home
        </Link>
        <h2>
          {mode === "register"
            ? "Make yourself at home."
            : mode === "reset"
              ? "Let’s get you back in."
              : "Welcome back."}
        </h2>
        <p>
          {mode === "register"
            ? "Create your free account. Your corner of the internet awaits."
            : "Your links are right where you left them."}
        </p>
        {!firebaseConfigured && (
          <div className="notice">
            Firebase setup is required for accounts. You can still{" "}
            <Link href="/studio">explore the local studio</Link>.
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {mode !== "reset" && (
            <label>
              Password
              <input
                type="password"
                minLength={8}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          )}
          <button
            className="btn primary wide"
            disabled={busy || !firebaseConfigured}
          >
            {busy
              ? "One moment…"
              : mode === "register"
                ? "Create free account"
                : mode === "reset"
                  ? "Send reset link"
                  : "Sign in"}
            <ArrowUpRight size={18} />
          </button>
        </form>
        {mode !== "reset" && (
          <button
            className="btn wide"
            disabled={busy || !firebaseConfigured}
            onClick={() => void run(true)}
          >
            Continue with Google
          </button>
        )}
        <p role="status" className="form-message">
          {message}
        </p>
        <div className="auth-switch">
          <button
            onClick={() => setMode(mode === "register" ? "login" : "register")}
          >
            {mode === "register"
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
          <button onClick={() => setMode("reset")}>Forgot password?</button>
        </div>
        <small>
          By continuing, you agree to our <Link href="/terms">terms</Link> and{" "}
          <Link href="/privacy">privacy notice</Link>.
        </small>
      </section>
    </main>
  );
}
