import type { Metadata } from "next";
import ThankYou from "@/components/ThankYou";

// Shown after an enquiry is sent. Kept out of Google (it is not a page people should land on from search),
// and it gives analytics / ad tools a clean URL to count enquiries ("conversions").
export const metadata: Metadata = {
  title: "Thank you – Enquiry received",
  description: "Your enquiry has reached Hotel Videh & Marriage Hall, Madhubani.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/thank-you" },
};

export default function ThankYouPage() {
  return <ThankYou />;
}
