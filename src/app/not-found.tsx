import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "This page doesn’t exist at Hotel Videh & Marriage Hall, Madhubani. See the hall, the ceremonies we host, or send an enquiry for your wedding date.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <div className="not-found container"><div className="eyebrow">A LITTLE DETOUR</div><h1>This page wandered off.</h1><p>We couldn’t find the place you were looking for. Let’s find another one.</p><Link href="/" className="button button-dark">Back to Videh →</Link></div>;
}
