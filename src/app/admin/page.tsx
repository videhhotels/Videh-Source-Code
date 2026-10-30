"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3, Table2, Download, LogOut, MessageCircle, Phone, RefreshCw, Search, X, Trash2, Mail,
  ChevronLeft, ChevronRight, ArrowUpDown, Database, Inbox, CalendarDays, PhoneCall, Landmark, Trophy, Ban, Menu,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { BUSINESS } from "@/lib/business";

/* Staff CRM in the style of the Supabase table editor.
   Access is enforced by the database (supabase/crm.sql): only the staff email can read, update or delete rows. */
const STAFF = [BUSINESS.email.toLowerCase()];
const STATUSES = ["new", "called", "site visit", "won", "lost"] as const;
type Status = (typeof STATUSES)[number];
type Lead = {
  id: string; created_at: string; updated_at?: string | null; name: string; phone: string; email: string | null; city: string | null;
  wedding_date: string | null; date_flexible: boolean; guests: string | null; ceremonies: string[] | null;
  budget: string | null; message: string | null; venue_name?: string | null; source: string | null; page_url?: string | null;
  status: Status; internal_notes: string | null;
};
type Col = { key: keyof Lead; type: string; w: number; sort?: boolean };
const COLS: Col[] = [
  { key: "created_at", type: "timestamptz", w: 170, sort: true },
  { key: "status", type: "text", w: 120, sort: true },
  { key: "name", type: "text", w: 180, sort: true },
  { key: "phone", type: "text", w: 130 },
  { key: "wedding_date", type: "date", w: 130, sort: true },
  { key: "guests", type: "text", w: 100 },
  { key: "ceremonies", type: "text[]", w: 220 },
  { key: "city", type: "text", w: 170 },
  { key: "budget", type: "text", w: 150 },
  { key: "internal_notes", type: "text", w: 220 },
  { key: "message", type: "text", w: 240 },
  { key: "email", type: "text", w: 190 },
  { key: "source", type: "text", w: 120 },
];
const PAGE = 50;
const STATUS_ICON: Record<Status, typeof Inbox> = { new: Inbox, called: PhoneCall, "site visit": Landmark, won: Trophy, lost: Ban };

const fmtDate = (d: string | null) => d ? new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
const fmtWhen = (d: string) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
const waLink = (p: string, name: string) => `https://wa.me/91${p}?text=${encodeURIComponent(`Namaste ${name}, this is Hotel Videh & Marriage Hall about your wedding enquiry.`)}`;
const cell = (l: Lead, k: keyof Lead): string => {
  const v = l[k];
  if (v === null || v === undefined || v === "") return "";
  if (k === "created_at") return fmtWhen(String(v));
  if (k === "wedding_date") return l.date_flexible ? "Not fixed" : fmtDate(String(v));
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
};

export default function AdminPage() {
  /* ---------- auth ---------- */
  const [session, setSession] = useState<"loading" | "out" | "in">("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [authMsg, setAuthMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { const u = data.session?.user; setUserEmail(u?.email || ""); setSession(u ? "in" : "out"); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setUserEmail(s?.user?.email || ""); setSession(s?.user ? "in" : "out"); });
    return () => sub.subscription.unsubscribe();
  }, []);
  const allowed = STAFF.includes(userEmail.toLowerCase());

  async function sendCode(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setAuthMsg("");
    const em = email.trim().toLowerCase();
    if (!STAFF.includes(em)) { setAuthMsg("This email is not on the staff list."); setBusy(false); return; }
    const { error } = await supabase.auth.signInWithOtp({ email: em, options: { shouldCreateUser: true, emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/admin" : undefined } });
    setBusy(false);
    if (error) setAuthMsg(error.message); else { setSent(true); setAuthMsg("We emailed you a 6-digit code. Enter it below (it can take a minute to arrive — check Spam too)."); }
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setAuthMsg("");
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setAuthMsg(error.message);
  }

  /* ---------- data ---------- */
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [updated, setUpdated] = useState<Date | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 2600); };

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setErr("");
    const { data, error } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(5000);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    const rows = (data || []) as Lead[];
    if (seen.current) { const n = rows.filter(r => !seen.current!.has(r.id)).length; if (n) flash(`${n} new enquir${n > 1 ? "ies" : "y"} arrived`); }
    seen.current = new Set(rows.map(r => r.id));
    setLeads(rows); setUpdated(new Date());
  }, []);
  useEffect(() => {
    if (session !== "in" || !allowed) return;
    load();
    const t = setInterval(() => load(true), 60_000);
    return () => clearInterval(t);
  }, [session, allowed, load]);

  /* ---------- view state ---------- */
  const [view, setView] = useState<"table" | "dashboard">("table");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: keyof Lead; dir: 1 | -1 }>({ key: "created_at", dir: -1 });
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | { ids: string[] }>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length };
    STATUSES.forEach(s => (c[s] = leads.filter(l => l.status === s).length));
    return c;
  }, [leads]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    const r = leads.filter(l => (filter === "all" || l.status === filter) &&
      (!n || [l.name, l.phone, l.email, l.city, l.guests, l.budget, l.internal_notes, l.message, l.source, (l.ceremonies || []).join(" ")].some(v => (v || "").toLowerCase().includes(n))));
    return r.sort((a, b) => { const av = String(a[sort.key] ?? ""), bv = String(b[sort.key] ?? ""); return av < bv ? -sort.dir : av > bv ? sort.dir : 0; });
  }, [leads, q, filter, sort]);
  useEffect(() => setPage(0), [q, filter, sort]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE);
  const open = leads.find(l => l.id === openId) || null;

  /* ---------- actions ---------- */
  async function patch(ids: string[], fields: Partial<Lead>) {
    setLeads(ls => ls.map(l => ids.includes(l.id) ? { ...l, ...fields } : l));
    const { error } = await supabase.from("enquiries").update({ ...fields, updated_at: new Date().toISOString() }).in("id", ids);
    if (error) { setErr("Could not save: " + error.message); load(true); return false; }
    flash(ids.length > 1 ? `${ids.length} rows updated` : "Saved");
    return true;
  }
  async function remove(ids: string[]) {
    const { error, count } = await supabase.from("enquiries").delete({ count: "exact" }).in("id", ids);
    setConfirm(null);
    if (error || count === 0) { setErr(error ? "Could not delete: " + error.message : "Delete is not enabled yet — run supabase/crm.sql (delete policy) in Supabase."); return; }
    setLeads(ls => ls.filter(l => !ids.includes(l.id)));
    setSel(new Set()); if (openId && ids.includes(openId)) setOpenId(null);
    flash(`${ids.length} row${ids.length > 1 ? "s" : ""} deleted`);
  }
  function exportCsv(list: Lead[]) {
    const head = ["created_at", "status", "name", "phone", "email", "wedding_date", "date_flexible", "guests", "ceremonies", "city", "budget", "internal_notes", "message", "source"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [head.join(",")].concat(list.map(l => head.map(h => esc(Array.isArray(l[h as keyof Lead]) ? (l[h as keyof Lead] as string[]).join("; ") : l[h as keyof Lead])).join(","))).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOnPage = shown.length > 0 && shown.every(l => sel.has(l.id));

  /* ---------- sign-in screen ---------- */
  if (session === "loading") return <div className="sb-app sb-center"><Database className="sb-spin" /></div>;
  if (session === "out" || !allowed) return (
    <div className="sb-app sb-center">
      <form className="sb-login" onSubmit={sent ? verify : sendCode}>
        <div className="sb-brand"><img src="/videh-logo-128.webp" alt="" width={28} height={28} /> Videh <span>CRM</span></div>
        <h1>Sign in to your dashboard</h1>
        <p>Staff only. We email you a one-time 6-digit code.</p>
        {session === "in" && !allowed && <p className="sb-err">{userEmail} is not on the staff list. <button type="button" className="sb-link" onClick={() => supabase.auth.signOut()}>Sign out</button></p>}
        <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={BUSINESS.email} autoComplete="email" disabled={sent} /></label>
        {sent && <label>6-digit code from the email<input inputMode="numeric" maxLength={10} autoFocus value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" autoComplete="one-time-code" /></label>}
        <button className="sb-btn sb-btn-green" disabled={busy}>{busy ? "Please wait…" : sent ? "Sign in" : "Email me a code"}</button>
        {sent && <button type="button" className="sb-link" onClick={() => { setSent(false); setCode(""); setAuthMsg(""); }}>Use a different email</button>}
        {authMsg && <p className="sb-msg">{authMsg}</p>}
      </form>
    </div>
  );

  /* ---------- app ---------- */
  return (
    <div className="sb-app">
      <aside className={`sb-side ${navOpen ? "is-open" : ""}`}>
        <div className="sb-brand"><img src="/videh-logo-128.webp" alt="" width={26} height={26} /> Videh <span>CRM</span></div>
        <nav>
          <div className="sb-group">Project</div>
          <button className={view === "dashboard" ? "on" : ""} onClick={() => { setView("dashboard"); setNavOpen(false); }}><BarChart3 size={16} /> Dashboard</button>
          <button className={view === "table" && filter === "all" ? "on" : ""} onClick={() => { setView("table"); setFilter("all"); setNavOpen(false); }}><Table2 size={16} /> enquiries <i>{counts.all}</i></button>
          <div className="sb-group">Views</div>
          {STATUSES.map(s => { const I = STATUS_ICON[s]; return <button key={s} className={view === "table" && filter === s ? "on" : ""} onClick={() => { setView("table"); setFilter(s); setNavOpen(false); }}><I size={15} /> {s} <i>{counts[s]}</i></button>; })}
        </nav>
        <div className="sb-user"><span title={userEmail}>{userEmail}</span><button onClick={() => supabase.auth.signOut()} title="Sign out"><LogOut size={15} /></button></div>
      </aside>
      {navOpen && <div className="sb-scrim" onClick={() => setNavOpen(false)} />}

      <main className="sb-main">
        <header className="sb-top">
          <button className="sb-icon sb-menu" onClick={() => setNavOpen(true)} aria-label="Menu"><Menu size={18} /></button>
          <div className="sb-crumb"><span>public</span> / <b>{view === "dashboard" ? "dashboard" : "enquiries"}</b>{view === "table" && filter !== "all" && <em>status = {filter}</em>}</div>
          <div className="sb-top-actions">
            <button className="sb-btn" onClick={() => load()} title="Refresh"><RefreshCw size={14} className={loading ? "sb-spin" : ""} /> <span>Refresh</span></button>
            <button className="sb-btn" onClick={() => exportCsv(sel.size ? leads.filter(l => sel.has(l.id)) : rows)}><Download size={14} /> <span>{sel.size ? `Export ${sel.size}` : "Export CSV"}</span></button>
          </div>
        </header>
        {err && <div className="sb-banner">{err}{/relation|schema cache|permission|policy|column/i.test(err) && " — run supabase/crm.sql in the Supabase SQL Editor."} <button onClick={() => setErr("")}><X size={14} /></button></div>}

        {view === "dashboard" ? <Dashboard leads={leads} counts={counts} go={(s) => { setView("table"); setFilter(s); }} open={(id) => { setView("table"); setOpenId(id); }} /> : <>
          <div className="sb-toolbar">
            <label className="sb-search"><Search size={14} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, phone, town, notes…" /></label>
            <label className="sb-sort"><ArrowUpDown size={14} />
              <select value={`${String(sort.key)}:${sort.dir}`} onChange={e => { const [k, d] = e.target.value.split(":"); setSort({ key: k as keyof Lead, dir: Number(d) as 1 | -1 }); }}>
                <option value="created_at:-1">Newest first</option><option value="created_at:1">Oldest first</option>
                <option value="wedding_date:1">Wedding date (soonest)</option><option value="wedding_date:-1">Wedding date (latest)</option>
                <option value="name:1">Name A–Z</option><option value="status:1">Status</option>
              </select>
            </label>
            {sel.size > 0 && <div className="sb-bulk">
              <b>{sel.size} selected</b>
              <select defaultValue="" onChange={e => { if (e.target.value) { patch(Array.from(sel), { status: e.target.value as Status }); e.target.value = ""; } }}>
                <option value="" disabled>Set status…</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="sb-btn sb-btn-danger" onClick={() => setConfirm({ ids: Array.from(sel) })}><Trash2 size={14} /> Delete</button>
              <button className="sb-btn" onClick={() => setSel(new Set())}>Clear</button>
            </div>}
          </div>

          <div className="sb-grid" role="region" aria-label="enquiries table" tabIndex={0}>
            <table>
              <thead><tr>
                <th className="sb-chk"><input type="checkbox" aria-label="Select all on this page" checked={allOnPage} onChange={() => setSel(s => { const n = new Set(s); shown.forEach(l => allOnPage ? n.delete(l.id) : n.add(l.id)); return n; })} /></th>
                {COLS.map(c => <th key={c.key} style={{ minWidth: c.w }} className={c.sort ? "is-sort" : ""} onClick={() => c.sort && setSort(s => ({ key: c.key, dir: s.key === c.key ? (s.dir === 1 ? -1 : 1) : 1 }))}>
                  <span className="sb-col">{c.key}</span><span className="sb-type">{c.type}</span>{sort.key === c.key && <span className="sb-dir">{sort.dir === 1 ? "↑" : "↓"}</span>}
                </th>)}
              </tr></thead>
              <tbody>
                {shown.map(l => <tr key={l.id} className={`${sel.has(l.id) ? "is-sel" : ""} ${openId === l.id ? "is-open" : ""}`} onClick={() => setOpenId(l.id)}>
                  <td className="sb-chk" onClick={e => e.stopPropagation()}><input type="checkbox" aria-label={`Select ${l.name}`} checked={sel.has(l.id)} onChange={() => toggle(l.id)} /></td>
                  {COLS.map(c => <td key={c.key} style={{ maxWidth: c.w }}>
                    {c.key === "status" ? <span className={`sb-pill st-${l.status.replace(" ", "-")}`}>{l.status}</span>
                      : c.key === "phone" ? <a href={`tel:+91${l.phone}`} onClick={e => e.stopPropagation()}>{l.phone}</a>
                      : cell(l, c.key) || <span className="sb-null">NULL</span>}
                  </td>)}
                </tr>)}
                {!shown.length && <tr><td colSpan={COLS.length + 1} className="sb-empty">{loading ? "Loading rows…" : leads.length ? "No rows match this view." : "No enquiries yet. New ones appear here automatically."}</td></tr>}
              </tbody>
            </table>
          </div>
          <footer className="sb-foot">
            <span>{rows.length ? `${page * PAGE + 1}–${Math.min(rows.length, (page + 1) * PAGE)} of ${rows.length} records` : "0 records"}{updated ? ` · updated ${updated.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : ""}</span>
            <div><button className="sb-icon" disabled={page === 0} onClick={() => setPage(p => p - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><span>Page {page + 1} of {pages}</span><button className="sb-icon" disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div>
          </footer>
        </>}
      </main>

      {open && <RowPanel key={open.id} lead={open} onClose={() => setOpenId(null)} onSave={(f) => patch([open.id], f)} onDelete={() => setConfirm({ ids: [open.id] })} />}

      {confirm && <div className="sb-modal-wrap" onClick={() => setConfirm(null)}>
        <div className="sb-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
          <h3>Delete {confirm.ids.length} row{confirm.ids.length > 1 ? "s" : ""}?</h3>
          <p>This permanently removes the enquir{confirm.ids.length > 1 ? "ies" : "y"} from the database. Export first if you might need {confirm.ids.length > 1 ? "them" : "it"}.</p>
          <div><button className="sb-btn" onClick={() => setConfirm(null)}>Cancel</button><button className="sb-btn sb-btn-danger" onClick={() => remove(confirm.ids)}><Trash2 size={14} /> Delete</button></div>
        </div>
      </div>}
      {toast && <div className="sb-toast">{toast}</div>}
    </div>
  );
}

/* ---------- right-hand row editor (like Supabase "Edit row") ---------- */
function RowPanel({ lead, onClose, onSave, onDelete }: { lead: Lead; onClose: () => void; onSave: (f: Partial<Lead>) => Promise<boolean>; onDelete: () => void }) {
  const [status, setStatus] = useState<Status>(lead.status);
  const [notes, setNotes] = useState(lead.internal_notes || "");
  const [saving, setSaving] = useState(false);
  const dirty = status !== lead.status || notes !== (lead.internal_notes || "");
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const ro: [string, string, string][] = [
    ["id", "uuid", lead.id], ["created_at", "timestamptz", fmtWhen(lead.created_at)], ["name", "text", lead.name], ["phone", "text", "+91 " + lead.phone],
    ["email", "text", lead.email || ""], ["wedding_date", "date", lead.date_flexible ? "Not fixed yet" : fmtDate(lead.wedding_date)],
    ["guests", "text", lead.guests || ""], ["ceremonies", "text[]", (lead.ceremonies || []).join(", ")], ["city", "text", lead.city || ""],
    ["budget", "text", lead.budget || ""], ["message", "text", lead.message || ""], ["source", "text", lead.source || ""],
  ];
  return <>
    <div className="sb-scrim sb-scrim-panel" onClick={onClose} />
    <aside className="sb-panel" role="dialog" aria-label={`Enquiry from ${lead.name}`}>
      <header><div><small>Edit row</small><b>{lead.name}</b></div><button className="sb-icon" onClick={onClose} aria-label="Close"><X size={18} /></button></header>
      <div className="sb-panel-actions">
        <a className="sb-btn sb-btn-green" href={`tel:+91${lead.phone}`} onClick={() => lead.status === "new" && onSave({ status: "called" })}><Phone size={14} /> Call</a>
        <a className="sb-btn" href={waLink(lead.phone, lead.name)} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
        {lead.email && <a className="sb-btn" href={`mailto:${lead.email}`}><Mail size={14} /> Email</a>}
      </div>
      <div className="sb-panel-body">
        <label className="sb-field"><span>status <em>text</em></span>
          <select value={status} onChange={e => setStatus(e.target.value as Status)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
        <label className="sb-field"><span>internal_notes <em>text</em></span>
          <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Called on…, visiting on…, quoted…" /></label>
        {ro.map(([k, t, v]) => <div key={k} className="sb-field sb-ro"><span>{k} <em>{t}</em></span><div>{v || <i className="sb-null">NULL</i>}</div></div>)}
      </div>
      <footer>
        <button className="sb-btn sb-btn-danger" onClick={onDelete}><Trash2 size={14} /> Delete row</button>
        <div><button className="sb-btn" onClick={onClose}>Cancel</button>
          <button className="sb-btn sb-btn-green" disabled={!dirty || saving} onClick={async () => { setSaving(true); const ok = await onSave({ status, internal_notes: notes }); setSaving(false); if (ok) onClose(); }}>{saving ? "Saving…" : "Save"}</button></div>
      </footer>
    </aside>
  </>;
}

/* ---------- dashboard ---------- */
function Dashboard({ leads, counts, go, open }: { leads: Lead[]; counts: Record<string, number>; go: (s: "all" | Status) => void; open: (id: string) => void }) {
  const now = Date.now();
  const week = leads.filter(l => now - new Date(l.created_at).getTime() < 7 * 864e5).length;
  const decided = counts.won + counts.lost;
  const conv = decided ? Math.round((counts.won / decided) * 100) : 0;
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return { k: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-IN", { month: "short" }) }; });
  const perMonth = months.map(m => ({ ...m, n: leads.filter(l => l.created_at.slice(0, 7) === m.k).length }));
  const maxM = Math.max(1, ...perMonth.map(m => m.n));
  const cer: Record<string, number> = {}; leads.forEach(l => (l.ceremonies || []).forEach(c => (cer[c] = (cer[c] || 0) + 1)));
  const cerList = Object.entries(cer).sort((a, b) => b[1] - a[1]);
  const maxC = Math.max(1, ...cerList.map(c => c[1]));
  const today = new Date().toISOString().slice(0, 10);
  const soon = leads.filter(l => l.wedding_date && l.wedding_date >= today && l.status !== "lost").sort((a, b) => (a.wedding_date! < b.wedding_date! ? -1 : 1)).slice(0, 8);
  const toCall = leads.filter(l => l.status === "new").slice(0, 8);
  const kpis: [string, string | number, string, "all" | Status][] = [
    ["Total enquiries", counts.all, "all time", "all"], ["To call back", counts.new, "status = new", "new"], ["Last 7 days", week, "new enquiries", "all"],
    ["Site visits", counts["site visit"], "booked visits", "site visit"], ["Booked", counts.won, "status = won", "won"], ["Win rate", `${conv}%`, "won ÷ (won + lost)", "won"],
  ];
  return <div className="sb-dash">
    <div className="sb-kpis">{kpis.map(([t, v, s, f]) => <button key={t} onClick={() => go(f)}><small>{t}</small><b>{v}</b><span>{s}</span></button>)}</div>
    <div className="sb-cards">
      <section className="sb-card"><h3>Enquiries per month</h3>
        <div className="sb-bars">{perMonth.map(m => <div key={m.k}><i style={{ height: `${(m.n / maxM) * 100}%` }} title={`${m.n}`} /><b>{m.n}</b><span>{m.label}</span></div>)}</div></section>
      <section className="sb-card"><h3>By status</h3>
        <ul className="sb-hbars">{STATUSES.map(s => <li key={s} onClick={() => go(s)}><span>{s}</span><i><em className={`st-${s.replace(" ", "-")}`} style={{ width: `${counts.all ? (counts[s] / counts.all) * 100 : 0}%` }} /></i><b>{counts[s]}</b></li>)}</ul></section>
      <section className="sb-card"><h3>Ceremonies asked for</h3>
        {cerList.length ? <ul className="sb-hbars">{cerList.map(([c, n]) => <li key={c}><span>{c}</span><i><em style={{ width: `${(n / maxC) * 100}%` }} /></i><b>{n}</b></li>)}</ul> : <p className="sb-muted">No data yet.</p>}</section>
      <section className="sb-card"><h3><CalendarDays size={15} /> Upcoming weddings</h3>
        {soon.length ? <ul className="sb-list">{soon.map(l => <li key={l.id} onClick={() => open(l.id)}><b>{fmtDate(l.wedding_date)}</b><span>{l.name} · {l.guests || "?"} guests</span><em className={`sb-pill st-${l.status.replace(" ", "-")}`}>{l.status}</em></li>)}</ul> : <p className="sb-muted">No upcoming dates yet.</p>}</section>
      <section className="sb-card sb-card-wide"><h3><PhoneCall size={15} /> To call back now</h3>
        {toCall.length ? <ul className="sb-list">{toCall.map(l => <li key={l.id} onClick={() => open(l.id)}><b>{l.name}</b><span>+91 {l.phone} · received {fmtWhen(l.created_at)}</span><a className="sb-btn sb-btn-green" href={`tel:+91${l.phone}`} onClick={e => e.stopPropagation()}><Phone size={13} /> Call</a></li>)}</ul> : <p className="sb-muted">Everyone has been called. 🎉</p>}</section>
    </div>
  </div>;
}
