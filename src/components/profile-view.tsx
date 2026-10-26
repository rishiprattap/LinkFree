"use client";
import { useEffect, useState, useRef, CSSProperties } from "react";
import {
  ArrowUpRight,
  Share2,
  Lock,
  Mail,
  Instagram,
  Youtube,
  Github,
  Linkedin,
  Globe,
  Play,
  Link2,
} from "lucide-react";
import { motion } from "framer-motion";
import { embedUrl, LinkItem, Profile, safeStyles, visible } from "@/lib/model";
import { useSession } from "./providers";
const socials = {
  instagram: Instagram,
  youtube: Youtube,
  github: Github,
  linkedin: Linkedin,
  website: Globe,
  email: Mail,
};
export function ProfileView({
  profile,
  links,
  preview = false,
}: {
  profile: Profile;
  links: LinkItem[];
  preview?: boolean;
}) {
  const { toast } = useSession();
  const [locked, setLocked] = useState<LinkItem | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [embeds, setEmbeds] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [subscription, setSubscription] = useState("");
  const [unsubscribe, setUnsubscribe] = useState("");
  const t = profile.theme;
  const lockDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (locked) lockDialog.current?.showModal();
  }, [locked]);
  useEffect(() => {
    if (preview) return;
    void fetch(`/api/public/${profile.username}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view", referrer: document.referrer }),
    }).catch(() => {});
  }, [profile.username, preview]);
  async function open(link: LinkItem, secret?: string) {
    if (preview && link.protected) {
      toast("Password checks run on the server after publishing.");
      return;
    }
    if (link.protected && secret === undefined) {
      setLocked(link);
      setError("");
      setPassword("");
      return;
    }
    setBusy(true);
    try {
      let url = link.url;
      if (!preview) {
        const res = await fetch(`/api/public/${profile.username}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "open",
            id: link.id,
            password: secret,
          }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        url = d.url;
      }
      const embed = embedUrl(link.type, url);
      if (embed) {
        setEmbeds((v) => ({ ...v, [link.id]: embed }));
        setLocked(null);
      } else window.location.assign(url);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not open link";
      setError(message);
      toast(message);
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    try {
      if (preview) {
        toast("Preview only. Publish your profile to share it.");
        return;
      }
      if (navigator.share)
        await navigator.share({
          title: profile.displayName,
          url: location.href,
        });
      else {
        await navigator.clipboard.writeText(location.href);
        toast("Profile link copied");
      }
    } catch {
      toast("Sharing was cancelled or unavailable");
    }
  }
  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (preview) {
      toast("Subscriptions become available on your published profile.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/public/${profile.username}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", email, consent }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSubscription("You’re on the list. Save your unsubscribe link below.");
      setUnsubscribe(d.unsubscribeUrl);
    } catch (e) {
      setSubscription(e instanceof Error ? e.message : "Unable to subscribe");
    } finally {
      setBusy(false);
    }
  }
  const style = {
    "--profile-bg": t.background,
    "--profile-accent": t.accent,
    "--profile-text": t.text,
    "--profile-radius":
      t.radius === "pill" ? "999px" : t.radius === "square" ? "2px" : "18px",
    fontFamily:
      t.font === "serif"
        ? "Georgia, serif"
        : t.font === "mono"
          ? "monospace"
          : "Arial, sans-serif",
    background: t.gradient
      ? `linear-gradient(145deg, ${t.background}, ${t.background} 35%, ${t.accent}55)`
      : t.background,
    ...safeStyles(t.customCss),
  } as CSSProperties;
  return (
    <div
      className={`profile-canvas ${t.animated ? "animated-bg" : ""} ${t.glass ? "glass-buttons" : ""} ${t.shadow ? "shadow-buttons" : ""} ${preview ? "is-preview" : ""}`}
      style={style}
    >
      <div className="profile-orb" />
      <div className="profile-inner">
        <div className="profile-top">
          <span className="tiny-dot" />
          <button
            aria-label="Share profile"
            className="round-icon"
            onClick={share}
          >
            <Share2 size={16} />
          </button>
        </div>
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="profile-heading"
        >
          {profile.avatar ? (
            <img
              className="avatar"
              src={profile.avatar}
              alt={profile.displayName}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="avatar avatar-art">
              <span>{profile.displayName.slice(0, 1)}</span>
              <i>✳</i>
            </div>
          )}
          <h1>{profile.displayName}</h1>
          <p>{profile.bio}</p>
          <div className="social-row">
            {profile.socials.map((s, i) => {
              const Icon = socials[s.platform];
              return (
                <a
                  key={i}
                  href={s.url}
                  aria-label={s.platform}
                  rel="noopener noreferrer"
                >
                  <Icon size={19} />
                </a>
              );
            })}
          </div>
        </motion.div>
        <div className="public-links">
          {links
            .filter((l) => visible(l))
            .map((l) => (
              <div key={l.id}>
                {embeds[l.id] ? (
                  <iframe
                    title={l.title}
                    src={embeds[l.id]}
                    loading="lazy"
                    allow="encrypted-media; fullscreen; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                  />
                ) : (
                  <button
                    className="public-link"
                    disabled={busy}
                    onClick={() => void open(l)}
                  >
                    <span className="public-link-icon">
                      {l.protected ? (
                        <Lock size={17} />
                      ) : l.type === "youtube" || l.type === "spotify" ? (
                        <Play size={18} />
                      ) : l.type === "contact" ? (
                        <Mail size={18} />
                      ) : (
                        <Link2 size={17} />
                      )}
                    </span>
                    <span>{l.title}</span>
                    <ArrowUpRight size={17} />
                  </button>
                )}
              </div>
            ))}
        </div>
        {links.filter((l) => visible(l)).length === 0 && (
          <p className="profile-empty">Good things are on their way.</p>
        )}
        {profile.subscribe && (
          <form className="subscribe-form" onSubmit={subscribe}>
            <h3>A little closer to the good stuff.</h3>
            <p>Get updates straight to your inbox.</p>
            <label
              className="sr-only"
              htmlFor={preview ? "preview-email" : "subscriber-email"}
            >
              Email address
            </label>
            <input
              id={preview ? "preview-email" : "subscriber-email"}
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              I agree to receive emails from this creator.
            </label>
            <button className="public-link" disabled={busy}>
              Keep me in the loop <ArrowUpRight size={16} />
            </button>
            <p role="status">{subscription}</p>
            {unsubscribe && <a href={unsubscribe}>Your unsubscribe link</a>}
            <a href="/privacy" className="small">
              Privacy notice
            </a>
          </form>
        )}
        <a className="profile-footer" href="/">
          ✳ made with linkfree
        </a>
      </div>
      {locked && (
        <dialog
          ref={lockDialog}
          className="modal native-dialog"
          aria-label="Unlock link"
          onCancel={() => setLocked(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void open(locked, password);
            }}
          >
            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={() => setLocked(null)}
            >
              ×
            </button>
            <Lock />
            <h2>A little privacy.</h2>
            <p>Enter the password to open {locked.title}.</p>
            <label>
              Password
              <input
                autoFocus
                type="password"
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <p role="alert">{error}</p>
            <button className="btn primary wide" disabled={busy}>
              {busy ? "Checking…" : "Unlock link"}
            </button>
          </form>
        </dialog>
      )}
    </div>
  );
}
