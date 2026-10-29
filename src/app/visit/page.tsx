import Link from "next/link";
import { ArrowRight, CalendarCheck, Mail, MapPin } from "lucide-react";
import VisitUs from "@/components/VisitUs";
import { BUSINESS as B } from "@/lib/business";
import { JsonLd, breadcrumbs, pageMeta, venueSchema } from "@/lib/site";

export const metadata = pageMeta({
  title: "Visit Us – Directions to Ranti Road, Madhubani",
  description: "Find Hotel Videh & Marriage Hall: Khesra No. 2083, Ranti Road, near Gumti No. 13, Madhubani, Bihar 847211. Map, directions and tips for visiting the hall.",
  path: "/visit",
});

export default function VisitPage() {
  return <div className="info-page subpage">
    <JsonLd data={[venueSchema(), breadcrumbs([["Visit us", "/visit"]])]} />
    <section className="listing-heading container">
      <div className="eyebrow">Visit us</div>
      <h1>Come and see the hall <em>before you decide.</em></h1>
      <p>We are on Ranti Road in Madhubani, near Gumti No. 13. Walk through the hall, see the space and talk to us about your ceremonies.</p>
    </section>

    <VisitUs bare />

    <section className="container sub-tips sub-tips-3">
      <div><MapPin /><b>Address</b><span>{B.addressLines.join(", ")}</span></div>
      <div><CalendarCheck /><b>Plan your visit</b><span>Tell us when you are coming, so the right person is there to show you around.</span></div>
      <div><Mail /><b>Write to us</b><span><a href={`mailto:${B.email}`}>{B.email}</a> or use the <Link href="/contact">contact form</Link>.</span></div>
    </section>

    <section className="closing-cta"><div className="container closing-inner"><div><div className="eyebrow">Before you visit</div><h2>Check your date first. <em>It takes a minute.</em></h2></div><div className="closing-actions"><Link className="button button-dark" href="/enquire">Enquire for your date <ArrowRight size={17} /></Link><Link className="button button-outline" href="/hall">See the hall</Link></div></div></section>
  </div>;
}
