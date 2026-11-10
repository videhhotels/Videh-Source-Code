"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { PIXEL_ID } from "@/lib/pixel";

/* Meta Pixel: loads once, counts a PageView on every page change (the site switches pages without a full reload).
   Staff pages under /admin are never tracked. */
export default function MetaPixel() {
  const path = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }   // the base code below already counted the first page
    if (!PIXEL_ID || path.startsWith("/admin")) return;
    window.fbq?.("track", "PageView");
  }, [path]);

  if (!PIXEL_ID) return null;
  return <>
    <Script id="meta-pixel" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');
if(!location.pathname.startsWith('/admin'))fbq('track','PageView');`}</Script>
    <noscript><img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} /></noscript>
  </>;
}
