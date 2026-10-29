import Link from "next/link";
import { ArrowRight, Users, Clock, UtensilsCrossed } from "lucide-react";
import WeddingRituals from "@/components/WeddingRituals";
import { JsonLd, breadcrumbs, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Mithila Wedding Ceremonies We Host",
  description: "Plan every Mithila wedding ceremony at Hotel Videh & Marriage Hall, Madhubani: tilak, matkor and haldi, baraat, vivah and sindurdan, bhoj and chaturthi.",
  path: "/ceremonies",
});

// A short guide to each ceremony, and what to tell us when you enquire.
const GUIDE = [
  { id: "tilak", dev: "तिलक", name: "Tilak", fn: "Tilak",
    body: "The bride’s family visits the groom’s side to apply the tilak and formally fix the match. It is often the first big gathering of both families, with relatives, gifts and a meal.",
    ask: "Tell us roughly how many guests come with the bride’s family, and whether you need a meal served." },
  { id: "matkor-haldi", dev: "मटकोर · हल्दी", name: "Matkor & Haldi", fn: "Haldi & Matkor",
    body: "Matkor is led by the women of the family, with songs and the blessing of the earth; haldi follows, with turmeric for the bride or groom. These are joyful, musical gatherings, usually a day or two before the wedding.",
    ask: "Let us know the day and time of day you prefer, and how many family members will join." },
  { id: "baraat", dev: "बारात", name: "Baraat", fn: "Vivah",
    body: "The groom’s procession arrives and is welcomed by the bride’s family. It is the moment the two families meet in celebration, so space to receive guests matters.",
    ask: "Share the expected size of the baraat and its arrival time on the wedding evening." },
  { id: "vivah", dev: "विवाह · सिंदूरदान", name: "Vivah & Sindurdan", fn: "Vivah",
    body: "Kanyadaan and the rites under the mandap, and sindurdan at the auspicious moment — the heart of a Maithil wedding. The timing follows the lagan, which is often late into the night.",
    ask: "Tell us your lagan date and muhurat, and the number of guests expected for the ceremony." },
  { id: "bhoj-reception", dev: "भोज", name: "Bhoj & Reception", fn: "Reception",
    body: "The feast for every guest, and in many families a reception afterwards. It is usually the largest gathering of the wedding.",
    ask: "Give us an estimate of total guests and whether you need a separate reception evening." },
  { id: "chaturthi", dev: "चतुर्थी", name: "Chaturthi", fn: "Chaturthi",
    body: "The rituals of the fourth day after the wedding, kept with close family, closing the wedding celebrations.",
    ask: "Usually a smaller gathering — tell us the date and how many family members will attend." },
];

export default function CeremoniesPage() {
  return <div className="info-page subpage">
    <JsonLd data={breadcrumbs([["Ceremonies", "/ceremonies"]])} />
    <section className="listing-heading container">
      <div className="eyebrow"><span lang="hi">विवाह के विधि</span> · Ceremonies</div>
      <h1>Every Mithila ceremony, <em>one venue.</em></h1>
      <p>A wedding in Mithila is many ceremonies, not one evening. Plan each of them at Hotel Videh &amp; Marriage Hall, Ranti Road, Madhubani — tell us which ones you need and we will call you back.</p>
    </section>

    <WeddingRituals bare />

    <section className="container sub-guide">
      <h2>Planning each ceremony</h2>
      <p className="sub-intro">What each ceremony involves, and what to tell us when you enquire so we can check your date properly.</p>
      <div className="sub-guide-list">
        {GUIDE.map(g => <article key={g.id} id={g.id} className="sub-guide-item">
          <div className="sub-guide-dev" lang="hi">{g.dev}</div>
          <h3>{g.name}</h3>
          <p>{g.body}</p>
          <p className="sub-ask"><b>When you enquire:</b> {g.ask}</p>
          <Link className="ritual-link" href={`/enquire?ceremony=${encodeURIComponent(g.fn)}`}>Plan your {g.name.split(" ")[0]} <ArrowRight size={16} /></Link>
        </article>)}
      </div>
      <div className="sub-tips">
        <div><Users /><b>Guest count</b><span>An estimate is enough; it can change later.</span></div>
        <div><Clock /><b>Date &amp; time</b><span>Your lagan date, or “not fixed yet”.</span></div>
        <div><UtensilsCrossed /><b>Food &amp; extras</b><span>Mention meals or decoration you have in mind.</span></div>
      </div>
    </section>

    <section className="closing-cta"><div className="container closing-inner"><div><div className="eyebrow">Your lagan is coming</div><h2>Tell us your ceremonies. <em>We’ll check the dates.</em></h2></div><div className="closing-actions"><Link className="button button-dark" href="/enquire">Enquire for your date <ArrowRight size={17} /></Link><Link className="button button-outline" href="/hall">See the hall</Link></div></div></section>
  </div>;
}
