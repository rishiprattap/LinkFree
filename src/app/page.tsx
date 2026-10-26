import Link from "next/link";
import {
  ArrowUpRight,
  Link2,
  Check,
  Palette,
  ChartNoAxesCombined,
  ShieldCheck,
} from "lucide-react";
import { admin, adminConfigured } from "@/lib/admin";
import { publicData } from "@/lib/server";
import { ProfileView } from "@/components/profile-view";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (process.env.CUSTOM_DOMAIN_OWNER_UID && adminConfigured) {
    const doc = await admin()
      .db.collection("profiles")
      .doc(process.env.CUSTOM_DOMAIN_OWNER_UID)
      .get();
    const username = doc.data()?.username;
    if (username) {
      const d = await publicData(username);
      if (d) return <ProfileView {...d} />;
    }
  }
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link href="/" className="brand">
          <Link2 />
          linkfree<span>✳</span>
        </Link>
        <div>
          <Link href="/studio">Explore the studio</Link>
          <Link href="/auth" className="btn primary">
            Create your page <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <i /> OPEN SOURCE. OPEN POSSIBILITIES.
          </span>
          <h1>
            Many sides of you.
            <br />
            <em>One beautiful link.</em>
          </h1>
          <p>
            Your work, your world, your next big thing.
            <br />
            Give it all a home that’s unmistakably yours.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" href="/auth">
              Find your space <ArrowUpRight size={18} />
            </Link>
            <Link className="btn" href="/studio">
              Try the editor
            </Link>
          </div>
          <div className="hero-facts">
            <span>
              <Check size={15} /> Every feature included
            </span>
            <span>
              <Check size={15} /> No subscriptions
            </span>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Illustration of a personalized link page"
        >
          <div className="floating-tag">✦ A little more you.</div>
          <div className="hero-profile">
            <div className="art-circle">
              a<span>✳</span>
            </div>
            <h2>Alex Morgan</h2>
            <p>Designing things. Taking the scenic route.</p>
            <div className="art-social">◎ &nbsp; ◇ &nbsp; ↗</div>
            <div className="art-link">
              My latest work <ArrowUpRight size={16} />
            </div>
            <div className="art-link">
              Notes from the studio <ArrowUpRight size={16} />
            </div>
            <div className="art-link">
              Let’s make something <ArrowUpRight size={16} />
            </div>
            <small>ILLUSTRATIVE PROFILE</small>
          </div>
          <div className="floating-note">
            <Palette size={22} /> Your style.
            <br />
            <strong>No limits.</strong>
          </div>
        </div>
      </section>
      <section className="feature-strip">
        <div>
          <Palette />
          <h3>Make it feel like you.</h3>
          <p>
            Themes, gradients, fonts and a live preview. Your page, your
            creative direction.
          </p>
        </div>
        <div>
          <ChartNoAxesCombined />
          <h3>Understand your audience.</h3>
          <p>
            Real views and clicks, with privacy-conscious daily visitor
            estimates.
          </p>
        </div>
        <div>
          <ShieldCheck />
          <h3>Keep control.</h3>
          <p>
            Schedule a launch, protect a link, and own the source. No feature
            paywalls.
          </p>
        </div>
      </section>
      <footer className="landing-footer">
        <span>✳ LinkFree — your internet, a little more personal.</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/studio">Local studio</Link>
        </div>
      </footer>
    </main>
  );
}
