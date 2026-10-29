import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import HowSteps from "@/components/HowSteps";
import EnquiryForm from "@/components/EnquiryForm";
import { HALL } from "@/lib/data";
import { JsonLd, breadcrumbs, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "How Booking Works – Enquiry to Confirmation",
  description: "How to plan your wedding at Hotel Videh & Marriage Hall, Madhubani: one enquiry, a call back within a working day, a visit to the hall, then confirm.",
  path: "/how-it-works",
});

const READY = [
  "Your lagan date (or a rough month if it isn’t fixed yet)",
  "An estimate of guests for each ceremony",
  "Which ceremonies you need: tilak, haldi & matkor, vivah, reception, chaturthi",
  "A mobile number where we can reach you",
];

export default function HowItWorksPage() {
  return <div className="info-page subpage">
    <JsonLd data={breadcrumbs([["How it works", "/how-it-works"]])} />
    <section className="listing-heading container">
      <div className="eyebrow">How it works</div>
      <h1>From enquiry to <em>your wedding day.</em></h1>
      <p>There is nothing to pay and nothing to book online. You tell us your date once, we check it and call you back, and you decide after seeing the hall.</p>
    </section>

    <HowSteps eyebrow="Four simple steps" />

    <section className="container sub-two">
      <div className="sub-panel">
        <h2>Keep these ready</h2>
        <ul className="sub-checks">{READY.map(r => <li key={r}><CheckCircle2 size={18} /> {r}</li>)}</ul>
        <p className="sub-intro">Not sure about something yet? Send the enquiry anyway — we will work it out together on the call.</p>
        <p><Link className="text-link" href="/faq">Read the FAQs <ArrowRight size={15} /></Link> · <Link className="text-link" href="/policies">Enquiry, not booking</Link></p>
      </div>
      <div className="enquire-card"><EnquiryForm source="how-it-works" venue={HALL} title="Start your enquiry" /></div>
    </section>
  </div>;
}
