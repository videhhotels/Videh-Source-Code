import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Staff Dashboard – Enquiries & Blog",
  description: "Private staff area of Hotel Videh & Marriage Hall for managing wedding enquiries and blog posts. Sign-in required.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
