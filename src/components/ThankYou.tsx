"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, CalendarHeart, PhoneCall, Landmark, Navigation, ArrowRight, Mail } from "lucide-react";
import { BUSINESS as B } from "@/lib/business";

type Info = { first?: string; phone4?: string; date?: string | null; flexible?: boolean; ceremonies?: string[]; guests?: string; mail?: string };
export const THANKS_KEY = "videh-enquiry";

const fmt = (d?: string | null) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "";
const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${B.tradeName}, ${B.addressOneLine}`)}`;

export default function ThankYou() {
  const [info, setInfo] = useState<Info>({});
  useEffect(() => {
    // Details are passed from the form through this tab's session only (never in the web address).
    try { const raw = sessionStorage.getItem(THANKS_KEY); if (raw) setInfo(JSON.parse(raw)); } catch {}
    window.scrollTo(0, 0);
  }, []);

  return <div className="ty">
    <section className="ty-hero">
      <div className="ty-mark"><CheckCircle2 size={46} /></div>
      <div className="eyebrow ty-eyebrow"><span lang="hi">शुभ विवाह</span> · Enquiry received</div>
      <h1>Thank you{info.first ? `, ${info.first}` : ""}.</h1>
      <p className="ty-lead">
        Your enquiry has reached the team at <strong>{B.tradeName}</strong>.{" "}
        We will call you{info.phone4 ? <> on <strong>+91 ••••••{info.phone4}</strong></> : ""} within one working day.
      </p>
      {info.mail && <p className="ty-mailnote"><Mail size={15} /> A copy of your enquiry is on its way to <b>{info.mail}</b>. If you don’t see it in a few minutes, check Spam or Promotions.</p>}
      {(info.date || info.flexible || info.guests || info.ceremonies?.length) ? (
        <ul className="ty-summary" aria-label="Your enquiry">
          {(info.date || info.flexible) && <li><CalendarHeart size={16} /> {info.flexible ? "Date not fixed yet" : fmt(info.date)}</li>}
          {info.guests && <li>{info.guests} guests</li>}
          {info.ceremonies?.map(c => <li key={c}>{c}</li>)}
        </ul>
      ) : null}
    </section>

    <section className="ty-next container">
      <h2>What happens next</h2>
      <ol>
        <li><span><CalendarHeart /></span><b>We check your date</b><p>Our team checks that the hall is free on your lagan date.</p></li>
        <li><span><PhoneCall /></span><b>We call you back</b><p>Within one working day, to talk through guests, ceremonies, food and decoration.</p></li>
        <li><span><Landmark /></span><b>Visit the hall</b><p>Come and see the space, then confirm everything directly with us.</p></li>
      </ol>
      <div className="ty-actions">
        <Link className="button button-dark" href="/hall">See the hall <ArrowRight size={17} /></Link>
        <a className="button button-outline" href={directions} target="_blank" rel="noopener noreferrer"><Navigation size={16} /> Get directions</a>
        <Link className="button button-outline" href="/">Back to home</Link>
      </div>
      <p className="ty-note"><Mail size={15} /> Want to add something? Email <a href={`mailto:${B.email}`}>{B.email}</a>.</p>
    </section>
  </div>;
}
