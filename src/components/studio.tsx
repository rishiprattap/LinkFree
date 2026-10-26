"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Palette,
  UserRound,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  Plus,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Trash2,
  Pencil,
  Eye,
  Copy,
  Check,
  Menu,
  LogOut,
  QrCode,
  Download,
  Mail,
  Lock,
  Clock,
  ArrowUp,
  ArrowDown,
  Save,
  Globe,
  Sparkles,
} from "lucide-react";
import { api, firebase, firebaseConfigured } from "@/lib/firebase";
import {
  defaultTheme,
  emptyProfile,
  LinkItem,
  linkSchema,
  Profile,
  profileSchema,
  Theme,
  usernameSchema,
  visible,
} from "@/lib/model";
import { useSession } from "./providers";
import { ProfileView } from "./profile-view";
import { Analytics } from "./analytics";
type Tab =
  | "links"
  | "appearance"
  | "profile"
  | "analytics"
  | "audience"
  | "share"
  | "settings";
const nav = [
  { id: "links", label: "My links", icon: Link2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { id: "audience", label: "Audience", icon: Mail },
  { id: "share", label: "Share & QR", icon: QrCode },
  { id: "settings", label: "Settings", icon: Settings },
] as const;
const presets: {
  id: Theme["preset"];
  name: string;
  bg: string;
  accent: string;
  text: string;
}[] = [
  {
    id: "mint",
    name: "Botanical",
    bg: "#e5f3e9",
    accent: "#174d3a",
    text: "#183e31",
  },
  {
    id: "midnight",
    name: "After hours",
    bg: "#222638",
    accent: "#b9b8ec",
    text: "#f4f1fc",
  },
  {
    id: "peach",
    name: "Golden hour",
    bg: "#f9e2d2",
    accent: "#894c36",
    text: "#512f25",
  },
  {
    id: "lavender",
    name: "Daydream",
    bg: "#eee7f9",
    accent: "#665088",
    text: "#423459",
  },
  {
    id: "paper",
    name: "Editorial",
    bg: "#f5f3ed",
    accent: "#343631",
    text: "#272923",
  },
];
const sampleLinks: LinkItem[] = [
  {
    id: "sample-1",
    title: "A place for your best work",
    url: "https://example.com",
    type: "link",
    enabled: true,
    order: 0,
    startsAt: "",
    endsAt: "",
  },
  {
    id: "sample-2",
    title: "Your next big idea",
    url: "https://example.org",
    type: "link",
    enabled: true,
    order: 100,
    startsAt: "",
    endsAt: "",
  },
  {
    id: "sample-3",
    title: "Say hello",
    url: "mailto:hello@example.com",
    type: "contact",
    enabled: true,
    order: 200,
    startsAt: "",
    endsAt: "",
  },
];
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}
function download(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Studio({ local = false }: { local?: boolean }) {
  const { user, loading, toast } = useSession();
  const [tab, setTab] = useState<Tab>("links");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<LinkItem | null>(null);
  const [qr, setQr] = useState("");
  const [origin, setOrigin] = useState("");
  const [audience, setAudience] = useState<
    { id: string; email: string; createdAt: string; unsubscribeToken: string }[]
  >([]);
  const [drag, setDrag] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const loaded = useRef(false);
  useEffect(() => {
    setOrigin(location.origin);
    if (local) {
      try {
        const saved = localStorage.getItem("linkfree-studio-v1");
        if (saved) {
          const d = JSON.parse(saved);
          setProfile({
            ...profileSchema.parse(d.profile),
            username: usernameSchema.parse(d.profile.username),
          });
          setLinks(
            d.links.map((l: LinkItem) => ({
              ...linkSchema.parse(l),
              id: l.id,
              protected: l.protected,
            })),
          );
        } else {
          setProfile({
            ...emptyProfile,
            displayName: "Alex Morgan",
            username: "alex-morgan",
            bio: "Making things with a little curiosity and a lot of heart. Designer, thinker, occasional overthinker.",
          });
          setLinks(sampleLinks);
        }
      } catch {
        toast("Could not restore local draft. Starting fresh.");
      }
      setReady(true);
      return;
    }
    if (!user || loaded.current) return;
    loaded.current = true;
    api("")
      .then((d) => {
        if (d.profile) setProfile(d.profile);
        else
          setProfile({
            ...emptyProfile,
            displayName: user.displayName || "Your name",
            username: "",
          });
        setLinks(d.links);
        setReady(true);
      })
      .catch((e) => {
        toast(e.message);
        setReady(true);
      });
  }, [local, user, toast]);
  useEffect(() => {
    if (!local || !ready) return;
    try {
      localStorage.setItem(
        "linkfree-studio-v1",
        JSON.stringify({ profile, links }),
      );
    } catch {
      toast(
        "Browser storage is unavailable; your draft will not survive a reload.",
      );
    }
  }, [local, ready, profile, links, toast]);
  useEffect(() => {
    if (tab === "audience" && !local && user)
      api("/subscribers")
        .then((d) => setAudience(d.subscribers))
        .catch((e) => toast(e.message));
  }, [tab, local, user, toast]);
  const shareUrl = `${origin}/${profile.username}`;
  useEffect(() => {
    if (tab === "share" && profile.username)
      QRCode.toDataURL(shareUrl, {
        width: 900,
        margin: 2,
        color: { dark: "#183e31", light: "#ffffff" },
      })
        .then(setQr)
        .catch(() => toast("Could not create QR code"));
  }, [tab, shareUrl, profile.username, toast]);
  useEffect(() => {
    if (!dirty || local) return;
    function before(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty, local]);
  function update(p: Partial<Profile>) {
    setProfile((v) => ({ ...v, ...p }));
    setDirty(true);
  }
  function theme(p: Partial<Theme>) {
    update({ theme: { ...profile.theme, ...p } });
  }
  async function saveProfile(p = profile) {
    setSaving(true);
    try {
      profileSchema.parse(p);
      usernameSchema.parse(p.username);
      if (!local) await api("", p);
      setProfile(p);
      setDirty(false);
      toast(local ? "Draft saved in this browser" : "Profile saved");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }
  async function saveLink(item: LinkItem) {
    setSaving(true);
    try {
      linkSchema.parse(item);
      let next = item;
      if (!local) {
        const d = await api("/links" + (item.id ? "/" + item.id : ""), item);
        next = { ...item, id: d.id, protected: d.protected };
      } else
        next = {
          ...item,
          id: item.id || crypto.randomUUID(),
          protected:
            item.password === undefined ? !!item.protected : !!item.password,
        };
      delete next.password;
      setLinks((v) =>
        [...v.filter((l) => l.id !== next.id), next].sort(
          (a, b) => a.order - b.order,
        ),
      );
      setEditing(null);
      toast("Link saved");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save link");
    } finally {
      setSaving(false);
    }
  }
  async function removeLink(id: string) {
    if (!confirm("Delete this link?")) return;
    try {
      if (!local) await api("/links/" + id, undefined, "DELETE");
      setLinks((v) => v.filter((l) => l.id !== id));
      toast("Link deleted");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete link");
    }
  }
  async function move(id: string, index: number) {
    const item = links.find((l) => l.id === id);
    if (!item || index < 0 || index >= links.length) return;
    const others = links.filter((l) => l.id !== id);
    const before = others[index - 1]?.order;
    const after = others[index]?.order;
    const order =
      before === undefined
        ? (after ?? 0) - 100
        : after === undefined
          ? before + 100
          : (before + after) / 2;
    await saveLink({ ...item, order });
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      toast("Choose a PNG, JPEG or WebP under 2 MiB");
      return;
    }
    setSaving(true);
    try {
      if (local) {
        toast(
          "Image uploads require Firebase. Theme and profile text can be edited locally.",
        );
        return;
      }
      const blob = await createImageBitmap(file);
      if (blob.width > 4096 || blob.height > 4096) {
        blob.close();
        throw new Error("Image dimensions must be at most 4096 × 4096");
      }
      blob.close();
      const target = ref(firebase().storage, `avatars/${user!.uid}/avatar`);
      await uploadBytes(target, file, { contentType: file.type });
      update({ avatar: await getDownloadURL(target) });
      toast("Image uploaded. Save your profile to apply it.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Profile link copied");
    } catch {
      toast("Clipboard unavailable. Copy the address shown on screen.");
    }
  }
  if (!local && (loading || (!ready && user)))
    return (
      <main className="loading-wrap">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </main>
    );
  if (!local && !user)
    return (
      <main className="center-page">
        <div className="brand">
          <Link2 />
          linkfree<span>✳</span>
        </div>
        <h1>Your space is waiting.</h1>
        <p>
          {firebaseConfigured
            ? "Sign in to manage your profile."
            : "Add your Firebase environment variables to enable accounts and publishing."}
        </p>
        <Link href="/auth" className="btn primary">
          Sign in or create an account
        </Link>
        <Link href="/studio" className="btn">
          Explore the local studio
        </Link>
      </main>
    );
  if (!ready)
    return (
      <main className="loading-wrap">
        <div className="skeleton" />
      </main>
    );
  return (
    <div className={`studio ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
        <button
          className="icon-button mobile-only nav-close"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        >
          ×
        </button>
        <Link href="/" className="brand">
          <Link2 />
          <span className="brand-word">linkfree</span>
          <span className="brand-star">✳</span>
        </Link>
        <button
          className="collapse-button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              aria-current={tab === n.id ? "page" : undefined}
              className={tab === n.id ? "active" : ""}
              onClick={() => {
                setTab(n.id);
                setMobileMenu(false);
              }}
              title={n.label}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.id === "links" && <small>{links.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="free-card">
            <Sparkles size={20} />
            <strong>A little link. No limits.</strong>
            <p>
              All the good stuff.
              <br />
              Always subscription-free.
            </p>
            <span>✦ FREE FOREVER</span>
          </div>
          <button className="account-row" onClick={() => setTab("settings")}>
            <div className="mini-avatar">{profile.displayName[0]}</div>
            <span>
              <strong>{local ? "Local studio" : profile.displayName}</strong>
              <small>
                {local ? "Draft saved on this device" : "Free creator account"}
              </small>
            </span>
            <Settings size={16} />
          </button>
        </div>
      </aside>
      <div className="studio-main">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="icon-button mobile-only"
              aria-label="Toggle navigation"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{nav.find((n) => n.id === tab)?.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className={`save-status ${dirty ? "unsaved" : ""}`}>
              <i />
              {local
                ? "Local draft"
                : dirty
                  ? "Unsaved changes"
                  : profile.published
                    ? "Your page is live"
                    : "Unpublished"}
            </span>
            {["links", "appearance", "profile"].includes(tab) && (
              <button
                className="btn compact mobile-only"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye size={16} />
                Preview
              </button>
            )}
            {!local && (
              <a
                className="btn compact"
                href={`/${profile.username}`}
                target="_blank"
                rel="noreferrer"
              >
                View page
                <ArrowUpRight size={15} />
              </a>
            )}
            <button
              className="btn primary compact"
              disabled={saving}
              onClick={() => void saveProfile()}
            >
              <Save size={15} />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </header>
        {local && (
          <div className="local-banner">
            <span>
              <span className="small-dot" /> LOCAL STUDIO{" "}
              <span className="banner-detail">
                · Try everything. Your draft stays in this browser.
              </span>
            </span>
            <Link href="/auth">
              Create a real page <ArrowUpRight size={14} />
            </Link>
          </div>
        )}
        <div
          className={`studio-body ${["analytics", "audience", "settings", "share"].includes(tab) ? "full-width" : ""}`}
        >
          <main className="editor">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {tab === "links" && (
                  <>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">
                          MAKE ROOM FOR WHAT MATTERS
                        </span>
                        <h1>Your world, linked.</h1>
                        <p>
                          Bring all the things you do into one little space.
                        </p>
                      </div>
                      <span className="heading-flower">✳</span>
                    </div>
                    <div className="page-address">
                      <Globe size={17} />
                      <span>
                        {origin.replace(/^https?:\/\//, "")}/
                        <strong>{profile.username || "your-name"}</strong>
                      </span>
                      <button
                        className="icon-button"
                        aria-label="Copy profile URL"
                        onClick={copy}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <button
                      className="add-link"
                      onClick={() =>
                        setEditing({
                          id: "",
                          title: "",
                          url: "",
                          type: "link",
                          enabled: true,
                          order: (links.at(-1)?.order ?? -100) + 100,
                          startsAt: "",
                          endsAt: "",
                        })
                      }
                    >
                      <Plus size={20} />
                      Add a new link <span>Let’s put it out there</span>
                    </button>
                    <div className="list-heading">
                      <span>
                        YOUR LINKS <small>{links.length}</small>
                      </span>
                      <span>Drag to reorder</span>
                    </div>
                    <div className="link-list">
                      {links.map((l, i) => (
                        <article
                          key={l.id}
                          className={`link-card ${!l.enabled ? "disabled-link" : ""}`}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (drag) void move(drag, i);
                            setDrag(null);
                          }}
                        >
                          <button
                            className="drag-handle"
                            draggable
                            onDragStart={() => setDrag(l.id)}
                            onDragEnd={() => setDrag(null)}
                            title="Drag to reorder; use arrow buttons for keyboard or touch"
                            aria-label={`Drag ${l.title}`}
                          >
                            <GripVertical size={19} />
                          </button>
                          <div
                            className={`link-type-icon ${l.type === "contact" ? "warm" : ""}`}
                          >
                            {l.type === "contact" ? (
                              <Mail size={21} />
                            ) : (
                              <ArrowUpRight size={22} />
                            )}
                          </div>
                          <div className="link-info">
                            <strong>{l.title}</strong>
                            <span>{l.url}</span>
                            <div className="link-meta">
                              {l.protected && (
                                <small>
                                  <Lock size={11} />
                                  Protected
                                </small>
                              )}
                              {(l.startsAt || l.endsAt) && (
                                <small>
                                  <Clock size={11} />
                                  {visible(l)
                                    ? "Scheduled"
                                    : "Outside schedule"}
                                </small>
                              )}
                              <small>
                                {l.type === "youtube" || l.type === "spotify"
                                  ? "Embedded content"
                                  : "Standard link"}
                              </small>
                            </div>
                          </div>
                          <div className="link-actions">
                            <Toggle
                              checked={l.enabled}
                              onChange={(v) =>
                                void saveLink({ ...l, enabled: v })
                              }
                              label={`Enable ${l.title}`}
                            />
                            <div>
                              <button
                                aria-label={`Move ${l.title} up`}
                                className="icon-button"
                                disabled={i === 0 || saving}
                                onClick={() => void move(l.id, i - 1)}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                aria-label={`Move ${l.title} down`}
                                className="icon-button"
                                disabled={i === links.length - 1 || saving}
                                onClick={() => void move(l.id, i + 1)}
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                aria-label={`Edit ${l.title}`}
                                className="icon-button"
                                onClick={() => setEditing(l)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                aria-label={`Delete ${l.title}`}
                                className="icon-button"
                                onClick={() => void removeLink(l.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    {!links.length && (
                      <div className="empty-state">
                        <Link2 size={32} />
                        <h3>A blank page. Endless possibilities.</h3>
                        <p>Add your first link to make this space your own.</p>
                      </div>
                    )}
                    <div className="editor-tip">
                      <span>✦</span>
                      <div>
                        <strong>A page that grows with you.</strong>
                        <p>
                          Add as many links as you need. Schedule a launch,
                          share a playlist, or keep something just for your
                          inner circle.
                        </p>
                      </div>
                    </div>
                  </>
                )}
                {tab === "profile" && (
                  <>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">A PROPER INTRODUCTION</span>
                        <h1>Hello, you.</h1>
                        <p>
                          Give people a feel for the person behind the links.
                        </p>
                      </div>
                    </div>
                    <section className="card form-stack">
                      <div className="upload-row">
                        <div className="mini-avatar large">
                          {profile.avatar ? (
                            <img src={profile.avatar} alt="Current avatar" />
                          ) : (
                            profile.displayName[0]
                          )}
                        </div>
                        <label className="btn compact upload-label">
                          Upload a photo
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => void upload(e.target.files?.[0])}
                          />
                        </label>
                        <button
                          className="text-button"
                          onClick={() => update({ avatar: "" })}
                        >
                          Remove
                        </button>
                      </div>
                      <small className="muted">
                        PNG, JPEG or WebP · up to 2 MiB · 4096 × 4096 maximum
                      </small>
                      <label>
                        Username
                        <input
                          value={profile.username}
                          placeholder="your-name"
                          onChange={(e) =>
                            update({ username: e.target.value.toLowerCase() })
                          }
                          maxLength={30}
                        />
                        <small>
                          3–30 lowercase letters, numbers, hyphens or
                          underscores.
                        </small>
                      </label>
                      <label>
                        Display name
                        <input
                          value={profile.displayName}
                          onChange={(e) =>
                            update({ displayName: e.target.value })
                          }
                          maxLength={60}
                        />
                      </label>
                      <label>
                        Bio
                        <textarea
                          value={profile.bio}
                          onChange={(e) => update({ bio: e.target.value })}
                          maxLength={280}
                          rows={3}
                        />
                        <small>{profile.bio.length}/280</small>
                      </label>
                      <div className="setting-row">
                        <div>
                          <strong>Email subscriptions</strong>
                          <p>Let visitors opt in to hear from you.</p>
                        </div>
                        <Toggle
                          checked={profile.subscribe}
                          onChange={(v) => update({ subscribe: v })}
                          label="Enable email subscriptions"
                        />
                      </div>
                    </section>
                    <section className="card form-stack">
                      <div className="card-heading">
                        <h3>Find you elsewhere</h3>
                        <button
                          className="btn compact"
                          disabled={profile.socials.length >= 12}
                          onClick={() =>
                            update({
                              socials: [
                                ...profile.socials,
                                {
                                  platform: "instagram",
                                  url: "https://instagram.com/",
                                },
                              ],
                            })
                          }
                        >
                          <Plus size={14} />
                          Add social
                        </button>
                      </div>
                      {profile.socials.map((s, i) => (
                        <div className="social-editor" key={i}>
                          <select
                            aria-label={`Social platform ${i + 1}`}
                            value={s.platform}
                            onChange={(e) =>
                              update({
                                socials: profile.socials.map((v, j) =>
                                  j === i
                                    ? {
                                        ...v,
                                        platform: e.target
                                          .value as typeof s.platform,
                                      }
                                    : v,
                                ),
                              })
                            }
                          >
                            {[
                              "instagram",
                              "youtube",
                              "github",
                              "linkedin",
                              "website",
                              "email",
                            ].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                          <input
                            aria-label={`Social URL ${i + 1}`}
                            value={s.url}
                            onChange={(e) =>
                              update({
                                socials: profile.socials.map((v, j) =>
                                  j === i ? { ...v, url: e.target.value } : v,
                                ),
                              })
                            }
                          />
                          <button
                            className="icon-button"
                            aria-label="Remove social"
                            onClick={() =>
                              update({
                                socials: profile.socials.filter(
                                  (_, j) => j !== i,
                                ),
                              })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </section>
                  </>
                )}
                {tab === "appearance" && (
                  <>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">
                          YOUR CREATIVE PLAYGROUND
                        </span>
                        <h1>A little more you.</h1>
                        <p>Find your feeling. Make it your own.</p>
                      </div>
                      <Palette className="heading-flower" />
                    </div>
                    <section className="card">
                      <div className="card-heading">
                        <h3>Start with a mood</h3>
                        <span className="free-badge">ALL FREE</span>
                      </div>
                      <div className="theme-grid">
                        {presets.map((p) => (
                          <button
                            key={p.id}
                            className={`theme-option ${profile.theme.preset === p.id ? "selected" : ""}`}
                            onClick={() =>
                              theme({
                                preset: p.id,
                                background: p.bg,
                                accent: p.accent,
                                text: p.text,
                              })
                            }
                          >
                            <div
                              className="theme-swatch"
                              style={{ background: p.bg }}
                            >
                              <i style={{ background: p.accent }} />
                              <span style={{ background: p.accent }} />
                              <span style={{ background: p.accent }} />
                              <span style={{ background: p.accent }} />
                              {profile.theme.preset === p.id && (
                                <Check size={15} />
                              )}
                            </div>
                            <strong>{p.name}</strong>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="card form-stack">
                      <h3>The finer details</h3>
                      <div className="color-grid">
                        {(["background", "accent", "text"] as const).map(
                          (k) => (
                            <label key={k}>
                              {k}
                              <div className="color-control">
                                <input
                                  type="color"
                                  value={profile.theme[k]}
                                  onChange={(e) =>
                                    theme({ [k]: e.target.value })
                                  }
                                />
                                <span>{profile.theme[k]}</span>
                              </div>
                            </label>
                          ),
                        )}
                      </div>
                      <div className="two-col">
                        <label>
                          Font
                          <select
                            value={profile.theme.font}
                            onChange={(e) =>
                              theme({ font: e.target.value as Theme["font"] })
                            }
                          >
                            <option value="sans">Modern sans</option>
                            <option value="serif">Editorial serif</option>
                            <option value="mono">Studio mono</option>
                          </select>
                        </label>
                        <label>
                          Button shape
                          <select
                            value={profile.theme.radius}
                            onChange={(e) =>
                              theme({
                                radius: e.target.value as Theme["radius"],
                              })
                            }
                          >
                            <option value="rounded">Soft corners</option>
                            <option value="pill">Pill</option>
                            <option value="square">Square</option>
                          </select>
                        </label>
                      </div>
                      {(
                        [
                          {
                            key: "gradient",
                            title: "Gradient background",
                            desc: "A soft wash of your accent color.",
                          },
                          {
                            key: "animated",
                            title: "A little movement",
                            desc: "Subtle motion. Respects reduced-motion preferences.",
                          },
                          {
                            key: "glass",
                            title: "Glass buttons",
                            desc: "Translucent layers with a frosted finish.",
                          },
                          {
                            key: "shadow",
                            title: "Soft shadows",
                            desc: "Give your links a little lift.",
                          },
                        ] as const
                      ).map((o) => (
                        <div className="setting-row" key={o.key}>
                          <div>
                            <strong>{o.title}</strong>
                            <p>{o.desc}</p>
                          </div>
                          <Toggle
                            checked={profile.theme[o.key]}
                            onChange={(v) => theme({ [o.key]: v })}
                            label={o.title}
                          />
                        </div>
                      ))}
                    </section>
                    <section className="card form-stack">
                      <h3>Your finishing touch</h3>
                      <label>
                        Restricted custom CSS
                        <textarea
                          rows={3}
                          placeholder={
                            "letter-spacing: 1px;\nfont-weight: 500;"
                          }
                          value={profile.theme.customCss}
                          onChange={(e) => theme({ customCss: e.target.value })}
                        />
                      </label>
                      <p className="fine-print">
                        Allowed declarations: letter-spacing (0–3px),
                        font-weight (400–800), border-width (0–4px). Selectors,
                        URLs and all other properties are ignored.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => update({ theme: defaultTheme })}
                      >
                        Reset appearance
                      </button>
                    </section>
                  </>
                )}
                {tab === "analytics" && <Analytics local={local} />}
                {tab === "audience" && (
                  <>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">REAL CONNECTIONS</span>
                        <h1>A growing circle.</h1>
                        <p>People who asked to hear more from you.</p>
                      </div>
                      <button
                        className="btn"
                        disabled={!audience.length}
                        onClick={() => {
                          const quote = (s: string) =>
                            '"' +
                            s.replace(/^[=+@-]/, "'").replace(/"/g, '""') +
                            '"';
                          download(
                            "linkfree-subscribers.csv",
                            "email,consented_at,unsubscribe_url\n" +
                              audience
                                .map((a) =>
                                  [
                                    a.email,
                                    a.createdAt,
                                    `${origin}/unsubscribe?username=${profile.username}&owner=${user?.uid}&email=${encodeURIComponent(a.email)}&token=${a.unsubscribeToken}`,
                                  ]
                                    .map(quote)
                                    .join(","),
                                )
                                .join("\n"),
                            "text/csv",
                          );
                        }}
                      >
                        <Download size={16} />
                        Export CSV
                      </button>
                    </div>
                    <section className="card">
                      {audience.length ? (
                        audience.map((a) => (
                          <div className="subscriber-row" key={a.id}>
                            <div>
                              <strong>{a.email}</strong>
                              <small>
                                Consented{" "}
                                {new Date(a.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                            <button
                              className="icon-button"
                              aria-label={`Delete subscriber ${a.email}`}
                              onClick={async () => {
                                if (!confirm("Delete this subscriber?")) return;
                                try {
                                  await api(
                                    "/subscribers/" + a.id,
                                    undefined,
                                    "DELETE",
                                  );
                                  setAudience((v) =>
                                    v.filter((s) => s.id !== a.id),
                                  );
                                  toast("Subscriber deleted");
                                } catch (e) {
                                  toast(
                                    e instanceof Error
                                      ? e.message
                                      : "Delete failed",
                                  );
                                }
                              }}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">
                          <Mail size={36} />
                          <h3>Make room for your people.</h3>
                          <p>
                            Enable email subscriptions in your profile.
                            Consenting subscribers will appear here.
                          </p>
                          <button
                            className="btn"
                            onClick={() => setTab("profile")}
                          >
                            Edit profile
                          </button>
                        </div>
                      )}
                    </section>
                    <p className="fine-print">
                      Email delivery is handled by your mailing provider.
                      Include each exported unsubscribe URL in messages. Consent
                      records and subscriber deletion are supported here.
                    </p>
                  </>
                )}
                {tab === "share" && (
                  <>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">PUT YOURSELF OUT THERE</span>
                        <h1>Good things are worth sharing.</h1>
                        <p>Your world is just one scan away.</p>
                      </div>
                    </div>
                    <div className="share-grid">
                      <section className="card qr-card">
                        {qr && <img src={qr} alt={`QR code for ${shareUrl}`} />}
                        <h3>{profile.displayName}</h3>
                        <p>{shareUrl}</p>
                        <a
                          className="btn primary"
                          href={qr || undefined}
                          download="linkfree-qr.png"
                        >
                          <Download size={17} />
                          Download QR code
                        </a>
                      </section>
                      <section className="card form-stack">
                        <h3>One link. Anywhere.</h3>
                        <p className="muted">
                          Your social bio, email signature, business card, or
                          the back of a very good napkin.
                        </p>
                        <div className="copy-box">
                          <span>{shareUrl}</span>
                          <button
                            className="icon-button"
                            onClick={copy}
                            aria-label="Copy URL"
                          >
                            <Copy size={17} />
                          </button>
                        </div>
                        <button
                          className="btn"
                          onClick={async () => {
                            try {
                              if (navigator.share)
                                await navigator.share({
                                  title: profile.displayName,
                                  url: shareUrl,
                                });
                              else await copy();
                            } catch {
                              toast("Sharing cancelled");
                            }
                          }}
                        >
                          Share profile
                          <ArrowUpRight size={17} />
                        </button>
                        <div className="notice">
                          {local
                            ? "Local draft: this URL is not published. Create an account and publish before sharing."
                            : profile.published
                              ? "Your profile is published."
                              : "Publish your profile in settings before sharing."}
                        </div>
                      </section>
                    </div>
                  </>
                )}
                {tab === "settings" && (
                  <>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">THE PRACTICAL THINGS</span>
                        <h1>Make yourself comfortable.</h1>
                        <p>Your account, your page, your call.</p>
                      </div>
                    </div>
                    <section className="card form-stack">
                      <h3>Page visibility</h3>
                      <div className="setting-row">
                        <div>
                          <strong>Public profile</strong>
                          <p>
                            {local
                              ? "Publishing requires a real Firebase account."
                              : "Unpublishing makes your page and links unavailable."}
                          </p>
                        </div>
                        <Toggle
                          checked={profile.published}
                          onChange={(v) => {
                            if (local) {
                              toast("Create an account to publish your page");
                              return;
                            }
                            void saveProfile({ ...profile, published: v });
                          }}
                          label="Publish profile"
                        />
                      </div>
                      <h3>Custom domain</h3>
                      <p className="muted">
                        Add a domain to your Vercel project and verify DNS
                        ownership. To serve your profile at its root, set{" "}
                        <code>CUSTOM_DOMAIN_OWNER_UID</code> to your account ID
                        in a dedicated deployment. See the included deployment
                        guide.
                      </p>
                      {user && (
                        <label>
                          Your account ID
                          <input readOnly value={user.uid} />
                        </label>
                      )}
                    </section>
                    <section className="card form-stack">
                      <h3>Account & security</h3>
                      {local ? (
                        <p className="muted">
                          You’re in the local studio. No account or server data
                          has been created.
                        </p>
                      ) : (
                        <>
                          <p>{user?.email}</p>
                          <div className="inline-actions">
                            <button
                              className="btn"
                              onClick={async () => {
                                try {
                                  await sendPasswordResetEmail(
                                    firebase().auth,
                                    user!.email!,
                                  );
                                  toast("Password reset email sent");
                                } catch (e) {
                                  toast(
                                    e instanceof Error
                                      ? e.message
                                      : "Could not send email",
                                  );
                                }
                              }}
                            >
                              Reset password
                            </button>
                            {!user?.emailVerified && (
                              <button
                                className="btn"
                                onClick={async () => {
                                  try {
                                    await sendEmailVerification(user!);
                                    toast("Verification email sent");
                                  } catch (e) {
                                    toast(
                                      e instanceof Error
                                        ? e.message
                                        : "Could not send email",
                                    );
                                  }
                                }}
                              >
                                Verify email
                              </button>
                            )}
                            <button
                              className="btn"
                              onClick={() => void signOut(firebase().auth)}
                            >
                              <LogOut size={16} />
                              Sign out
                            </button>
                          </div>
                        </>
                      )}
                      <button
                        className="btn"
                        onClick={() =>
                          download(
                            "linkfree-profile.json",
                            JSON.stringify({ profile, links }, null, 2),
                            "application/json",
                          )
                        }
                      >
                        <Download size={16} />
                        Export profile & links
                      </button>
                    </section>
                    <section className="card danger-zone">
                      <h3>{local ? "Clear local draft" : "Delete account"}</h3>
                      <p>
                        This permanently removes{" "}
                        {local
                          ? "this browser’s draft."
                          : "your profile, links, subscribers and statistics. Sign in again immediately before deleting."}
                      </p>
                      <button
                        className="btn danger"
                        onClick={async () => {
                          if (
                            prompt(
                              "Type DELETE to confirm permanent deletion",
                            ) !== "DELETE"
                          )
                            return;
                          try {
                            if (local) {
                              localStorage.removeItem("linkfree-studio-v1");
                              location.reload();
                            } else {
                              await api("/account", undefined, "DELETE");
                              await signOut(firebase().auth);
                              location.assign("/");
                            }
                          } catch (e) {
                            toast(
                              e instanceof Error
                                ? e.message
                                : "Deletion failed",
                            );
                          }
                        }}
                      >
                        <Trash2 size={16} />
                        {local ? "Clear draft" : "Delete account"}
                      </button>
                    </section>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
          {!["analytics", "audience", "settings", "share"].includes(tab) && (
            <aside
              className={`preview-panel ${showPreview ? "show-mobile-preview" : ""}`}
            >
              <div className="preview-title">
                <span>
                  <span className="live-dot" />
                  LIVE PREVIEW
                </span>
                <span>Changes look good on you.</span>
              </div>
              <div className="phone">
                <div className="phone-camera" />
                <div className="phone-screen">
                  <ProfileView profile={profile} links={links} preview />
                </div>
              </div>
              <div className="preview-footer">
                <Eye size={15} />
                <span>Your page, as the world sees it.</span>
              </div>
              <button
                className="text-button mobile-only"
                onClick={() => setShowPreview(false)}
              >
                Close preview
              </button>
              <div className="preview-note">
                Made to be <em>uniquely yours.</em>
                <span>✧</span>
              </div>
            </aside>
          )}
        </div>
        <footer className="studio-footer">
          <span>Made for your next chapter.</span>
          <span>✳ No paywalls. Just possibilities.</span>
        </footer>
      </div>
      {editing && (
        <LinkEditor
          link={editing}
          busy={saving}
          onClose={() => setEditing(null)}
          onSave={saveLink}
        />
      )}
    </div>
  );
}
function LinkEditor({
  link,
  busy,
  onClose,
  onSave,
}: {
  link: LinkItem;
  busy: boolean;
  onClose: () => void;
  onSave: (l: LinkItem) => Promise<void>;
}) {
  const [draft, setDraft] = useState(link);
  const [changePassword, setChangePassword] = useState(!link.protected);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function date(value: string) {
    if (!value) return "";
    const d = new Date(value);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }
  return (
    <dialog ref={dialog} className="modal native-dialog" onCancel={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const item = { ...draft, ...(changePassword ? { password } : {}) };
          const check = linkSchema.safeParse(item);
          if (!check.success) {
            setError(check.error.issues.map((i) => i.message).join(". "));
            return;
          }
          void onSave(item);
        }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close link editor"
        >
          ×
        </button>
        <span className="eyebrow">ONE MORE PIECE OF YOUR WORLD</span>
        <h2>{link.id ? "Edit your link" : "Make a new connection."}</h2>
        <div className="form-stack">
          <label>
            Title
            <input
              autoFocus
              value={draft.title}
              maxLength={100}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="My latest project"
              required
            />
          </label>
          <label>
            Link type
            <select
              value={draft.type}
              onChange={(e) =>
                setDraft({ ...draft, type: e.target.value as LinkItem["type"] })
              }
            >
              <option value="link">Website link</option>
              <option value="youtube">YouTube video</option>
              <option value="spotify">Spotify embed</option>
              <option value="contact">Contact (mailto or tel)</option>
            </select>
          </label>
          <label>
            Destination
            <input
              value={draft.url}
              maxLength={2048}
              onChange={(e) => setDraft({ ...draft, url: e.target.value })}
              placeholder="https://…"
              required
            />
          </label>
          <div className="two-col">
            <label>
              Available from
              <input
                type="datetime-local"
                value={date(draft.startsAt)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    startsAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
              />
            </label>
            <label>
              Available until
              <input
                type="datetime-local"
                value={date(draft.endsAt)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    endsAt: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : "",
                  })
                }
              />
            </label>
          </div>
          <small className="muted">
            Dates use your local timezone; stored and enforced in UTC.
          </small>
          {link.protected && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
              />
              Change or remove password
            </label>
          )}
          {changePassword && (
            <label>
              Link password{" "}
              <small>Optional · leave empty for public access</small>
              <input
                type="password"
                autoComplete="new-password"
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) =>
                setDraft({ ...draft, enabled: e.target.checked })
              }
            />
            Enable this link
          </label>
          <p role="alert" className="form-message">
            {error}
          </p>
          <button className="btn primary wide" disabled={busy}>
            {busy ? "Saving…" : "Save link"}
            <Check size={17} />
          </button>
        </div>
      </form>
    </dialog>
  );
}
