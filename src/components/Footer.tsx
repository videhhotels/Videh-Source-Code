import Link from "next/link";
import { Instagram } from "lucide-react";
import { BUSINESS as B } from "@/lib/business";
export default function Footer() {
  return <footer className="footer">
    <div className="footer-pattern" />
    <div className="container footer-grid">
      <div className="footer-brand"><Link href="/" className="brand footer-logo"><img className="brand-image" src="/videh-logo-128.webp" width={42} height={42} alt="Hotel Videh & Marriage Hall logo" /><span className="brand-word">videh<span className="brand-dot">.</span><small>HOTEL &amp; MARRIAGE HALL</small></span></Link><p>A home for every Mithila wedding — from tilak to reception. Send one enquiry and we’ll call you back.</p><div className="socials"><a href="https://www.instagram.com/videhhotels/" target="_blank" rel="noopener noreferrer me" aria-label="Hotel Videh on Instagram (@videhhotels)"><Instagram size={18} /></a><a className="socials-handle" href="https://www.instagram.com/videhhotels/" target="_blank" rel="noopener noreferrer">@videhhotels</a></div></div>
      <div><h4>The hall</h4><Link href="/hall">Hall &amp; photos</Link><Link href="/ceremonies">Ceremonies</Link><Link href="/how-it-works">How it works</Link><Link href="/enquire">Send an enquiry</Link><Link href="/visit">Find us &amp; directions</Link></div>
      <div><h4>Help</h4><Link href="/about">About Videh</Link><Link href="/contact">Contact us</Link><Link href="/faq">FAQs</Link><Link href="/policies">How enquiries work</Link></div>
    </div>
    <div className="container footer-legal">
      <p><strong>{B.tradeName}</strong> · GSTIN: <strong className="gstin">{B.gstin}</strong></p>
      <p>{B.addressOneLine} · <a href={`mailto:${B.email}`}>{B.email}</a></p>
    </div>
    <div className="container footer-bottom"><div className="footer-copy"><span>© {new Date().getFullYear()} {B.tradeName}. All rights reserved.</span><nav className="footer-policy" aria-label="Legal"><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms of use</Link><Link href="/policies">Enquiry policy</Link></nav></div><span className="footer-blessing">शुभ मंगल · Designed with the spirit of Mithila.</span></div>
  </footer>;
}
