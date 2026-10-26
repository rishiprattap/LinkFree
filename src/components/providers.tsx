"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { firebase, firebaseConfigured } from "@/lib/firebase";
import { MotionConfig } from "framer-motion";
const Context = createContext<{
  user: User | null;
  loading: boolean;
  toast: (message: string) => void;
}>({ user: null, loading: true, toast: () => {} });
export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(firebase().auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <Context.Provider value={{ user, loading, toast: setMessage }}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      {message && (
        <div className="toast" role="status">
          {message}
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export const useSession = () => useContext(Context);
