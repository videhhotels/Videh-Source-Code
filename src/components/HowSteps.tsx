import Link from "next/link";
import { ArrowRight, ClipboardList, PhoneCall, Landmark, Handshake } from "lucide-react";
import Reveal from "./Reveal";

export const STEPS = [
  { icon: ClipboardList, title: "Share your details", text: "Lagan date, guest count, ceremonies and budget — one short form." },
  { icon: PhoneCall, title: "We call you back", text: "Within one working day, to understand exactly what you need." },
  { icon: Landmark, title: "Visit the hall", text: "Come and see the space, and talk through your ceremonies with us." },
  { icon: Handshake, title: "Finalise with us", text: "Confirm your date and the arrangements directly with the hall." },
];

/** The four enquiry steps. `more` adds a link to the full How it works page (used on the home page). */
export default function HowSteps({ more = false, headingLevel = 2, eyebrow = "How it works" }: { more?: boolean; headingLevel?: 1 | 2; eyebrow?: string }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return <section className="how-section container" id="how">
    <Reveal className="section-heading"><div><div className="eyebrow">{eyebrow}</div><H>One enquiry. <em>One call back.</em></H></div><p>No running around for dates and prices.<br />Tell us once — we do the checking.</p></Reveal>
    <ol className="how-steps">{STEPS.map((s, n) => <li key={s.title} style={{ transitionDelay: `${n * 90}ms` }}><span className="how-num">{n + 1}</span><span className="how-icon"><s.icon /></span><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol>
    <div className="how-cta">
      <Link className="button button-dark" href="/enquire">Start my enquiry <ArrowRight size={17} /></Link>
      {more && <Link className="button button-outline" href="/how-it-works">How it works in detail</Link>}
    </div>
  </section>;
}
