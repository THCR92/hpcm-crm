// ============================================================
// HIGH PLAINS CUSTOM METAL — Quoting & Cutlist System
// Phase 1: Quotes, Orders, Price Table, QB Invoice Export
// ============================================================
// Add your Supabase credentials below (same as hpcm-crm.jsx)
// ============================================================

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL  = "https://ygpueqfbhlgyeqgmchfb.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncHVlcWZiaGxneWVxZ21jaGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzIyMzAsImV4cCI6MjA5NDQ0ODIzMH0.-Y4zUFN8q4lCzx5wa90AgmILpQicQ2LpWbHqQ6Dy5-w";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── THEME ────────────────────────────────────────────────────
const C = {
  steel: "#1C2B3A", steelMid: "#2E4057", steelLight: "#4A6580",
  copper: "#B87333", copperLight: "#D4943F",
  ash: "#E8E4DC", ashDark: "#C9C4BA", smoke: "#F4F2EE", white: "#FFFFFF",
  success: "#2D6A4F", successBg: "#D8F3DC",
  warn: "#9C6000", warnBg: "#FFF3CD",
  danger: "#842029", dangerBg: "#F8D7DA",
  info: "#0A4275", infoBg: "#CFE2FF",
};

// ─── STATIC REFERENCE DATA ────────────────────────────────────
const GAUGES = ["26", "24", "22"];

const PANEL_TYPES = [
  { id: "ss-snaplock",  label: "Standing Seam – 1.5\" Snap Lock", category: "Standing Seam", hasPanelWidth: true,  hasStriations: true,  throughFastener: false },
  { id: "ss-mechseam",  label: "Standing Seam – 2\" Mech Seam",   category: "Standing Seam", hasPanelWidth: true,  hasStriations: true,  throughFastener: false },
  { id: "ss-nailfin",   label: "Standing Seam – 1\" Nail Fin",    category: "Standing Seam", hasPanelWidth: true,  hasStriations: true,  throughFastener: false },
  { id: "pbr-roof",     label: "PBR Roofing Panel",               category: "PBR",           hasPanelWidth: false, hasStriations: false, throughFastener: true  },
  { id: "pbr-wall",     label: "PBR Wall Panel",                  category: "PBR",           hasPanelWidth: false, hasStriations: false, throughFastener: true  },
  { id: "tufrib-roof",  label: "Tuf-Rib Roofing Panel",           category: "Tuf-Rib",       hasPanelWidth: false, hasStriations: false, throughFastener: true  },
  { id: "tufrib-wall",  label: "Tuf-Rib Siding Panel",            category: "Tuf-Rib",       hasPanelWidth: false, hasStriations: false, throughFastener: true  },
  { id: "bb-6",         label: "Board & Batten – 6\" Board",      category: "B&B",           hasPanelWidth: false, hasStriations: false, throughFastener: true  },
  { id: "bb-8",         label: "Board & Batten – 8\" Board",      category: "B&B",           hasPanelWidth: false, hasStriations: false, throughFastener: true  },
  { id: "bb-12",        label: "Board & Batten – 12\" Board",     category: "B&B",           hasPanelWidth: false, hasStriations: false, throughFastener: true  },
  { id: "trap-45",      label: "Trapezoidal – 45mm",              category: "Trapezoidal",   hasPanelWidth: false, hasStriations: false, throughFastener: true  },
  { id: "trap-75",      label: "Trapezoidal – 75mm",              category: "Trapezoidal",   hasPanelWidth: false, hasStriations: false, throughFastener: true  },
];

const PANEL_WIDTHS = ["15\" Standard", "16\" Standard", "Custom (call for pricing)"];
const STRIATION_OPTIONS = ["Striations", "Bead Rib", "No Striations"];

const TRIM_ITEMS_SS = [
  { id: "style-d",         label: "Style D",              stickLF: 10 },
  { id: "low-profile-gable", label: "Low Profile Gable",  stickLF: 10 },
  { id: "overlap-gable",   label: "Overlap Gable",        stickLF: 10 },
  { id: "sidewall-flash",  label: "Side Wall Flashing",   stickLF: 10 },
  { id: "headwall-flash",  label: "Headwall Flashing",    stickLF: 10 },
  { id: "locking-valley",  label: "Locking Valley",       stickLF: 10 },
  { id: "raised-cleat",    label: "Raised Cleat",         stickLF: 10 },
  { id: "ridge-cap",       label: "Ridge Cap",            stickLF: 10 },
  { id: "z-bar",           label: "Z Bar",                stickLF: 10 },
  { id: "transition",      label: "Transition",           stickLF: 10 },
  { id: "custom",          label: "Custom",               stickLF: 10 },
];

const TRIM_ITEMS_TF = [
  { id: "ridge-cap",       label: "Ridge Cap",            stickLF: 10 },
  { id: "eave-trim",       label: "Eave Trim / Drip Edge",stickLF: 10 },
  { id: "rake-trim",       label: "Rake Trim",            stickLF: 10 },
  { id: "corner-inside",   label: "Corner Trim – Inside", stickLF: 10 },
  { id: "corner-outside",  label: "Corner Trim – Outside",stickLF: 10 },
  { id: "sidewall-flash",  label: "Sidewall Flashing",    stickLF: 10 },
  { id: "headwall-flash",  label: "Headwall Flashing",    stickLF: 10 },
  { id: "valley",          label: "Valley Flashing",      stickLF: 10 },
  { id: "z-bar",           label: "Z Bar / Z Closure",    stickLF: 10 },
  { id: "custom",          label: "Custom",               stickLF: 10 },
];

const HARDWARE_ITEMS_SS = [
  { id: "clips",        label: "Clips",               packSize: 500, unit: "box",  autoCalc: false },
  { id: "pan-head",     label: "Pan Head Screws",     packSize: 250, unit: "bag",  autoCalc: false },
  { id: "wood-screws",  label: "1-1/2\" Wood Screws", packSize: 250, unit: "bag",  autoCalc: false },
  { id: "rivets",       label: "Rivets",              packSize: 250, unit: "bag",  autoCalc: false },
];

const HARDWARE_ITEMS_TF = [
  { id: "screws-tf",    label: "Screws (Through Fastener)", packSize: 250, unit: "bag", autoCalc: true, perSquare: 110 },
  { id: "wood-screws",  label: "1-1/2\" Wood Screws",       packSize: 250, unit: "bag", autoCalc: false },
  { id: "rivets",       label: "Rivets",                    packSize: 250, unit: "bag", autoCalc: false },
  { id: "closure-foam", label: "Foam Closure Strips",       packSize: 1,   unit: "each",autoCalc: false },
  { id: "butyl-tape",   label: "Butyl Tape",                packSize: 1,   unit: "roll",autoCalc: false },
];

// Default price table structure — overridden by DB values
const DEFAULT_PRICES = {
  panels: {}, // key: `${panelTypeId}|${gauge}|${striation}` => price per LF
  trim: {},   // key: trimItemId => price per 10LF stick
  hardware: {},// key: hardwareItemId => price per pack
};

// ─── HELPERS ──────────────────────────────────────────────────
function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return "$0.00";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
function ceilToWhole(n) { return Math.ceil(n); }

function Spinner() {
  return (
    <div style={{ width: 20, height: 20, border: `2px solid ${C.ash}`, borderTopColor: C.copper, borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
  );
}

function SectionHead({ title, sub }) {
  return (
    <div style={{ borderBottom: `2px solid ${C.copper}`, paddingBottom: 8, marginBottom: 16, marginTop: 28 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.steel, fontFamily: "'Georgia', serif" }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: C.steelLight, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SelectBtn({ label, selected, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${selected ? C.copper : C.ashDark}`, background: selected ? "#FFF8F2" : C.white, color: selected ? C.copper : C.steelLight, fontSize: 12, fontWeight: selected ? 700 : 400, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

function CustomerSearch({ customers, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = customers.find(c => c.id === value);
  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.contact || "").toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div style={{ position: "relative" }}>
      <input
        value={open ? query : (selected ? selected.name : "")}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange(""); }}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="Search customers…"
        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box" }}
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.white, border: `1px solid ${C.ashDark}`, borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999, maxHeight: 220, overflowY: "auto", marginTop: 2 }}>
          {filtered.length === 0 && (
            <div style={{ padding: "10px 14px", fontSize: 13, color: C.steelLight }}>No customers found</div>
          )}
          {filtered.map(c => (
            <div key={c.id}
              onMouseDown={() => { onChange(c.id); setQuery(""); setOpen(false); }}
              style={{ padding: "9px 14px", cursor: "pointer", borderBottom: `1px solid ${C.ash}` }}
              onMouseEnter={e => e.currentTarget.style.background = C.smoke}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{c.name}</div>
              <div style={{ fontSize: 11, color: C.steelLight }}>{c.contact} · {c.type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Field({ label, children, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder = "", readOnly = false, min, style = {} }) {
  return (
    <input value={value ?? ""} onChange={onChange} type={type} placeholder={placeholder} readOnly={readOnly} min={min}
      style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box", background: readOnly ? C.smoke : C.white, color: C.steel, ...style }} />
  );
}

// ─── LF → FEET & INCHES DISPLAY ─────────────────────────────
function feetIn(decimalFt) {
  const ft = Math.floor(decimalFt);
  const inches = Math.round((decimalFt - ft) * 12);
  return inches === 0 ? `${ft}'` : `${ft}' ${inches}"`;
}

// Parse "14'6" or "14.5" or "14 6" into decimal feet
function parseLengthInput(str) {
  if (!str) return 0;
  str = str.trim();
  // Decimal feet
  if (/^\d+(\.\d+)?$/.test(str)) return parseFloat(str);
  // Feet'Inches" or feet inches
  const m = str.match(/^(\d+)['\s]+(\d+)"?$/);
  if (m) return parseInt(m[1]) + parseInt(m[2]) / 12;
  // Just feet with apostrophe
  const m2 = str.match(/^(\d+)'$/);
  if (m2) return parseInt(m2[1]);
  return parseFloat(str) || 0;
}

// ─── QUOTE STATUS BADGE ──────────────────────────────────────
const QUOTE_STATUSES = {
  "Draft":     { bg: "#E8E4DC", text: "#5F5E5A" },
  "Sent":      { bg: "#CFE2FF", text: "#0A4275" },
  "Approved":  { bg: "#D8F3DC", text: "#2D6A4F" },
  "In Production": { bg: "#FFF3CD", text: "#9C6000" },
  "Complete":  { bg: "#D8F3DC", text: "#2D6A4F" },
  "Declined":  { bg: "#F8D7DA", text: "#842029" },
};

function StatusBadge({ status }) {
  const s = QUOTE_STATUSES[status] || QUOTE_STATUSES["Draft"];
  return <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: s.bg, color: s.text, fontWeight: 600, whiteSpace: "nowrap" }}>{status}</span>;
}

// ─── PRICE TABLE EDITOR ──────────────────────────────────────
function PriceTableEditor({ onClose }) {
  const [prices, setPrices] = useState({ panels: {}, trim: {}, hardware: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("panels");

  useEffect(() => { loadPrices(); }, []);

  async function loadPrices() {
    setLoading(true);
    const { data } = await supabase.from("price_table").select("*");
    const p = { panels: {}, trim: {}, hardware: {} };
    (data || []).forEach(row => { p[row.category][row.item_key] = row.price; });
    setPrices(p);
    setLoading(false);
  }

  async function savePrices() {
    setSaving(true);
    const rows = [];
    Object.entries(prices.panels).forEach(([k, v]) => rows.push({ category: "panels", item_key: k, price: parseFloat(v) || 0 }));
    Object.entries(prices.trim).forEach(([k, v]) => rows.push({ category: "trim", item_key: k, price: parseFloat(v) || 0 }));
    Object.entries(prices.hardware).forEach(([k, v]) => rows.push({ category: "hardware", item_key: k, price: parseFloat(v) || 0 }));
    await supabase.from("price_table").upsert(rows, { onConflict: "category,item_key" });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function setPrice(cat, key, val) {
    setPrices(p => ({ ...p, [cat]: { ...p[cat], [key]: val } }));
  }

  const tabStyle = t => ({ padding: "8px 16px", fontSize: 13, fontWeight: activeTab === t ? 600 : 400, color: activeTab === t ? C.steel : C.steelLight, background: "none", border: "none", borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: activeTab === t ? C.copper : "transparent", cursor: "pointer", fontFamily: "inherit" });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.65)", zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 40, overflowY: "auto" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 780, background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", marginBottom: 40 }}>
        <div style={{ background: C.steel, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 16, fontWeight: 700 }}>Price Table</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>Set selling prices by gauge, panel type, and striation. Trim per 10LF stick. Hardware per pack/bag/box.</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.ash, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "flex", borderBottom: `1px solid ${C.ash}`, padding: "0 24px" }}>
          {["panels", "trim", "hardware"].map(t => <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
        </div>

        <div style={{ padding: "20px 24px", maxHeight: "60vh", overflowY: "auto" }}>
          {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div> : (
            <>
              {activeTab === "panels" && (
                <div>
                  <p style={{ fontSize: 12, color: C.steelLight, marginTop: 0 }}>Price is per linear foot of formed panel.</p>
                  {PANEL_TYPES.map(pt => (
                    <div key={pt.id} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.steel, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${C.ash}` }}>{pt.label}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                        {GAUGES.map(g => {
                          const striations = pt.hasStriations ? STRIATION_OPTIONS : ["standard"];
                          return striations.map(str => {
                            const key = `${pt.id}|${g}|${str}`;
                            const label = pt.hasStriations ? `${g}ga · ${str}` : `${g} gauge`;
                            return (
                              <div key={key}>
                                <label style={{ fontSize: 10, color: C.steelLight, display: "block", marginBottom: 3 }}>{label}</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 13, color: C.steelLight }}>$</span>
                                  <input value={prices.panels[key] ?? ""} onChange={e => setPrice("panels", key, e.target.value)}
                                    type="number" min="0" step="0.01" placeholder="0.00"
                                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                                  <span style={{ fontSize: 10, color: C.steelLight, whiteSpace: "nowrap" }}>/ LF</span>
                                </div>
                              </div>
                            );
                          });
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "trim" && (
                <div>
                  <p style={{ fontSize: 12, color: C.steelLight, marginTop: 0 }}>Price is per 10LF stick.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[...new Map([...TRIM_ITEMS_SS, ...TRIM_ITEMS_TF].map(t => [t.id, t])).values()].map(item => (
                      <div key={item.id}>
                        <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>{item.label}</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, color: C.steelLight }}>$</span>
                          <input value={prices.trim[item.id] ?? ""} onChange={e => setPrice("trim", item.id, e.target.value)}
                            type="number" min="0" step="0.01" placeholder="0.00"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                          <span style={{ fontSize: 10, color: C.steelLight, whiteSpace: "nowrap" }}>/ stick</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "hardware" && (
                <div>
                  <p style={{ fontSize: 12, color: C.steelLight, marginTop: 0 }}>Price is per pack/box/bag/roll.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[...new Map([...HARDWARE_ITEMS_SS, ...HARDWARE_ITEMS_TF].map(h => [h.id, h])).values()].map(item => (
                      <div key={item.id}>
                        <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>{item.label} <span style={{ opacity: 0.6 }}>({item.packSize} per {item.unit})</span></label>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, color: C.steelLight }}>$</span>
                          <input value={prices.hardware[item.id] ?? ""} onChange={e => setPrice("hardware", item.id, e.target.value)}
                            type="number" min="0" step="0.01" placeholder="0.00"
                            style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                          <span style={{ fontSize: 10, color: C.steelLight, whiteSpace: "nowrap" }}>/ {item.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.ash}`, display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 13, color: C.success }}>✓ Prices saved</span>}
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelLight, fontSize: 13, cursor: "pointer" }}>Close</button>
          <button onClick={savePrices} disabled={saving} style={{ padding: "8px 22px", borderRadius: 6, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{saving ? "Saving…" : "Save Prices"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── QUOTE PRINT VIEW ─────────────────────────────────────────
function QuotePrintView({ quote, customer, onClose }) {
  const [sigName, setSigName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleApprove() {
    if (!sigName || !agreed) return;
    setSubmitted(true);
  }

  const pt = PANEL_TYPES.find(p => p.id === quote.panel_type_id) || {};
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.7)", zIndex: 3000, overflowY: "auto", display: "flex", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: 760, background: C.white, borderRadius: 12, boxShadow: "0 24px 64px rgba(0,0,0,0.35)", marginBottom: 40 }}>
        {/* Header */}
        <div style={{ background: C.steel, padding: "24px 36px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "12px 12px 0 0" }}>
          <div>
            <div style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 22, fontWeight: 700 }}>High Plains Custom Metal</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>Cheyenne, Wyoming · hpcmcrm.net</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.copperLight, fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: 700 }}>QUOTE</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>#{quote.quote_number}</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{today}</div>
          </div>
        </div>

        <div style={{ padding: "28px 36px" }}>
          {/* Customer info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.ash}` }}>
            <div>
              <div style={{ fontSize: 11, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Quote For</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.steel }}>{customer?.name}</div>
              <div style={{ fontSize: 13, color: C.steelLight }}>{customer?.contact}</div>
              <div style={{ fontSize: 13, color: C.steelLight }}>{customer?.email}</div>
              <div style={{ fontSize: 13, color: C.steelLight }}>{customer?.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Job Site</div>
              <div style={{ fontSize: 13, color: C.steel }}>{quote.job_site_address || customer?.address}</div>
              {quote.po_number && <div style={{ fontSize: 13, color: C.steelLight, marginTop: 4 }}>PO: {quote.po_number}</div>}
            </div>
          </div>

          {/* Panel specs */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Panel Specifications</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                ["Profile", pt.label],
                ["Gauge", `${quote.gauge} gauge`],
                ...(pt.hasStriations ? [["Striations", quote.striation]] : []),
                ...(pt.hasPanelWidth ? [["Panel Width", quote.panel_width]] : []),
                ["Color", quote.panel_color],
              ].map(([l, v]) => v ? (
                <div key={l} style={{ padding: "6px 14px", background: C.smoke, borderRadius: 8, border: `1px solid ${C.ash}` }}>
                  <div style={{ fontSize: 10, color: C.steelLight }}>{l}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.steel }}>{v}</div>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Panel cut list */}
          {quote.panel_rows?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Panel Cut List</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.smoke }}>
                    {["Qty", "Length", "LF Each", "Total LF", "Price/LF", "Line Total"].map(h => (
                      <th key={h} style={{ padding: "7px 12px", textAlign: h === "Qty" || h === "Length" ? "left" : "right", fontSize: 11, color: C.steelLight, fontWeight: 600, border: `1px solid ${C.ash}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quote.panel_rows.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                      <td style={{ padding: "7px 12px", border: `1px solid ${C.ash}` }}>{row.qty}</td>
                      <td style={{ padding: "7px 12px", border: `1px solid ${C.ash}` }}>{row.lengthDisplay}</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", border: `1px solid ${C.ash}` }}>{round2(row.lengthFt).toFixed(2)}'</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", border: `1px solid ${C.ash}` }}>{round2(row.qty * row.lengthFt).toFixed(2)} LF</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", border: `1px solid ${C.ash}` }}>{fmt(row.pricePerLF)}</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 600, border: `1px solid ${C.ash}` }}>{fmt(row.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: C.smoke }}>
                    <td colSpan={3} style={{ padding: "8px 12px", fontWeight: 600, fontSize: 12, border: `1px solid ${C.ash}` }}>Totals</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, border: `1px solid ${C.ash}` }}>{round2(quote.total_panel_lf).toFixed(2)} LF</td>
                    <td style={{ border: `1px solid ${C.ash}` }}></td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, border: `1px solid ${C.ash}` }}>{fmt(quote.panel_subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
              <div style={{ fontSize: 11, color: C.steelLight, marginTop: 6 }}>
                Total SF (with {quote.waste_pct}% waste): <strong>{round2(quote.total_sf_with_waste).toFixed(0)} SF</strong>
              </div>
            </div>
          )}

          {/* Trim */}
          {quote.trim_rows?.filter(r => r.actualLF > 0).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Trim & Accessories</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.smoke }}>
                    {["Item", "Actual LF", "Sticks (waste)", "Total Sticks", "Price/Stick", "Line Total"].map(h => (
                      <th key={h} style={{ padding: "7px 12px", textAlign: h === "Item" ? "left" : "right", fontSize: 11, color: C.steelLight, fontWeight: 600, border: `1px solid ${C.ash}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quote.trim_rows.filter(r => r.actualLF > 0).map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                      <td style={{ padding: "7px 12px", border: `1px solid ${C.ash}` }}>{row.label}{row.customLabel ? ` — ${row.customLabel}` : ""}</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", border: `1px solid ${C.ash}` }}>{row.actualLF} LF</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", border: `1px solid ${C.ash}` }}>{row.sticksWaste}</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 600, border: `1px solid ${C.ash}` }}>{row.totalSticks}</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", border: `1px solid ${C.ash}` }}>{fmt(row.pricePerStick)}</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 600, border: `1px solid ${C.ash}` }}>{fmt(row.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Hardware */}
          {quote.hardware_rows?.filter(r => r.packsNeeded > 0).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Hardware & Fasteners</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.smoke }}>
                    {["Item", "Pack Size", "Qty Needed", "Packs", "Price/Pack", "Line Total"].map(h => (
                      <th key={h} style={{ padding: "7px 12px", textAlign: h === "Item" ? "left" : "right", fontSize: 11, color: C.steelLight, fontWeight: 600, border: `1px solid ${C.ash}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quote.hardware_rows.filter(r => r.packsNeeded > 0).map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                      <td style={{ padding: "7px 12px", border: `1px solid ${C.ash}` }}>{row.label}{row.autoCalc ? " (auto)" : ""}</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", border: `1px solid ${C.ash}` }}>{row.packSize} / {row.unit}</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", border: `1px solid ${C.ash}` }}>{row.qtyNeeded}</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 600, border: `1px solid ${C.ash}` }}>{row.packsNeeded}</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", border: `1px solid ${C.ash}` }}>{fmt(row.pricePerPack)}</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 600, border: `1px solid ${C.ash}` }}>{fmt(row.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 28 }}>
            <div style={{ width: 280 }}>
              {[
                ["Panels Subtotal", fmt(quote.panel_subtotal)],
                ["Trim Subtotal", fmt(quote.trim_subtotal)],
                ["Hardware Subtotal", fmt(quote.hardware_subtotal)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: C.steelLight, borderBottom: `1px solid ${C.ash}` }}>
                  <span>{l}</span><span>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 5px", fontSize: 16, fontWeight: 700, color: C.steel }}>
                <span>TOTAL</span><span>{fmt(quote.total_price)}</span>
              </div>
              <div style={{ fontSize: 11, color: C.steelLight }}>Quote valid for 30 days. Prices subject to material availability.</div>
            </div>
          </div>

          {/* Approval */}
          {!submitted ? (
            <div style={{ borderTop: `2px solid ${C.ash}`, paddingTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.steel, marginBottom: 12 }}>Customer Approval</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, cursor: "pointer" }} />
                <label style={{ fontSize: 13, color: C.steelLight, cursor: "pointer", lineHeight: 1.5 }} onClick={() => setAgreed(!agreed)}>
                  I agree to the pricing and specifications listed in this quote. I understand that final panel lengths must be customer-provided measurements and that this quote is valid for 30 days.
                </label>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Full Name (typed signature)</label>
                  <input value={sigName} onChange={e => setSigName(e.target.value)} placeholder="Type your full name to approve"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${C.ashDark}`, fontSize: 14, boxSizing: "border-box", fontFamily: "cursive" }} />
                </div>
                <button onClick={handleApprove} disabled={!agreed || !sigName}
                  style={{ padding: "9px 24px", borderRadius: 8, background: agreed && sigName ? C.success : C.ashDark, color: C.white, border: "none", fontSize: 13, fontWeight: 700, cursor: agreed && sigName ? "pointer" : "default" }}>
                  Approve Quote
                </button>
              </div>
            </div>
          ) : (
            <div style={{ borderTop: `2px solid ${C.ash}`, paddingTop: 20, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.success }}>Quote Approved by {sigName}</div>
              <div style={{ fontSize: 13, color: C.steelLight, marginTop: 4 }}>Approved on {today}. High Plains Custom Metal will contact you to schedule production.</div>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 36px", borderTop: `1px solid ${C.ash}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelLight, fontSize: 13, cursor: "pointer" }}>Close</button>
          <button onClick={() => window.print()} style={{ padding: "8px 18px", borderRadius: 6, border: `1px solid ${C.steelMid}`, background: C.steelMid, color: C.white, fontSize: 13, cursor: "pointer" }}>🖨 Print / Save PDF</button>
        </div>
      </div>
    </div>
  );
}

// ─── QUOTE BUILDER ────────────────────────────────────────────
function QuoteBuilder({ customers, quoteToEdit, prices, onClose, onSaved }) {
  const isEdit = !!quoteToEdit;

  // Header state
  const [customerId, setCustomerId] = useState(quoteToEdit?.customer_id || "");
  const [jobSiteAddress, setJobSiteAddress] = useState(quoteToEdit?.job_site_address || "");
  const [poNumber, setPoNumber] = useState(quoteToEdit?.po_number || "");
  const [dueDate, setDueDate] = useState(quoteToEdit?.due_date || "");

  // Panel spec state
  const [panelTypeId, setPanelTypeId] = useState(quoteToEdit?.panel_type_id || PANEL_TYPES[0].id);
  const [gauge, setGauge] = useState(quoteToEdit?.gauge || "26");
  const [striation, setStriation] = useState(quoteToEdit?.striation || "No Striations");
  const [panelWidth, setPanelWidth] = useState(quoteToEdit?.panel_width || "16\" Standard");
  const [panelColor, setPanelColor] = useState(quoteToEdit?.panel_color || "");
  const [wastePct, setWastePct] = useState(quoteToEdit?.waste_pct ?? 10);

  // Panel cut list rows: { qty, lengthInput, lengthFt, lengthDisplay }
  const [panelRows, setPanelRows] = useState(quoteToEdit?.panel_rows || [
    { qty: 1, lengthInput: "", lengthFt: 0, lengthDisplay: "" }
  ]);

  // Trim rows
  const [trimRows, setTrimRows] = useState(() => {
    const pt = PANEL_TYPES.find(p => p.id === panelTypeId);
    const baseItems = pt?.throughFastener ? TRIM_ITEMS_TF : TRIM_ITEMS_SS;
    if (quoteToEdit?.trim_rows) return quoteToEdit.trim_rows;
    return baseItems.map(t => ({ ...t, actualLF: 0, sticksWaste: 0, totalSticks: 0, customLabel: "" }));
  });

  // Hardware rows
  const [hardwareRows, setHardwareRows] = useState(() => {
    const pt = PANEL_TYPES.find(p => p.id === panelTypeId);
    const baseItems = pt?.throughFastener ? HARDWARE_ITEMS_TF : HARDWARE_ITEMS_SS;
    if (quoteToEdit?.hardware_rows) return quoteToEdit.hardware_rows;
    return baseItems.map(h => ({ ...h, qtyNeeded: 0, packsNeeded: 0 }));
  });

  const [notes, setNotes] = useState(quoteToEdit?.notes || "");
  const [saving, setSaving] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [savedQuote, setSavedQuote] = useState(null);

  const pt = PANEL_TYPES.find(p => p.id === panelTypeId) || PANEL_TYPES[0];

  // When panel type changes, reset trim/hardware
  useEffect(() => {
    const newPt = PANEL_TYPES.find(p => p.id === panelTypeId);
    const baseItems = newPt?.throughFastener ? TRIM_ITEMS_TF : TRIM_ITEMS_SS;
    setTrimRows(baseItems.map(t => ({ ...t, actualLF: 0, sticksWaste: 0, totalSticks: 0, customLabel: "" })));
    const hwItems = newPt?.throughFastener ? HARDWARE_ITEMS_TF : HARDWARE_ITEMS_SS;
    setHardwareRows(hwItems.map(h => ({ ...h, qtyNeeded: 0, packsNeeded: 0 })));
  }, [panelTypeId]);

  // Computed values
  const priceKey = `${panelTypeId}|${gauge}|${pt.hasStriations ? striation : "standard"}`;
  const pricePerLF = parseFloat(prices.panels?.[priceKey] || 0);

  const computedPanelRows = useMemo(() => panelRows.map(row => {
    const lf = row.lengthFt * row.qty;
    const lineTotal = lf * pricePerLF;
    return { ...row, totalLF: round2(lf), pricePerLF, lineTotal: round2(lineTotal) };
  }), [panelRows, pricePerLF]);

  const totalPanelLF = useMemo(() => computedPanelRows.reduce((a, r) => a + r.totalLF, 0), [computedPanelRows]);

  // Panel width in feet for SF calculation
  const panelWidthFt = useMemo(() => {
    if (panelWidth === "15\" Standard") return 15 / 12;
    if (panelWidth === "16\" Standard") return 16 / 12;
    return 1; // fallback for custom
  }, [panelWidth]);

  const totalSF = useMemo(() => totalPanelLF * panelWidthFt, [totalPanelLF, panelWidthFt]);
  const totalSFWithWaste = useMemo(() => totalSF * (1 + wastePct / 100), [totalSF, wastePct]);

  const panelSubtotal = useMemo(() => computedPanelRows.reduce((a, r) => a + r.lineTotal, 0), [computedPanelRows]);

  // Auto-calculate through-fastener screws
  useEffect(() => {
    if (!pt.throughFastener) return;
    setHardwareRows(rows => rows.map(h => {
      if (h.autoCalc && h.id === "screws-tf") {
        const squares = totalSFWithWaste / 100;
        const qtyNeeded = Math.ceil(squares * 110);
        const packsNeeded = Math.ceil(qtyNeeded / h.packSize);
        return { ...h, qtyNeeded, packsNeeded };
      }
      return h;
    }));
  }, [totalSFWithWaste, pt.throughFastener]);

  // Trim computations
  const computedTrimRows = useMemo(() => trimRows.map(row => {
    const pricePerStick = parseFloat(prices.trim?.[row.id] || 0);
    const totalSticks = ceilToWhole((row.actualLF || 0) / 10) + (parseInt(row.sticksWaste) || 0);
    const lineTotal = totalSticks * pricePerStick;
    return { ...row, totalSticks, pricePerStick, lineTotal: round2(lineTotal) };
  }), [trimRows, prices.trim]);

  const trimSubtotal = useMemo(() => computedTrimRows.reduce((a, r) => a + r.lineTotal, 0), [computedTrimRows]);

  // Hardware computations
  const computedHardwareRows = useMemo(() => hardwareRows.map(row => {
    const pricePerPack = parseFloat(prices.hardware?.[row.id] || 0);
    const lineTotal = row.packsNeeded * pricePerPack;
    return { ...row, pricePerPack, lineTotal: round2(lineTotal) };
  }), [hardwareRows, prices.hardware]);

  const hardwareSubtotal = useMemo(() => computedHardwareRows.reduce((a, r) => a + r.lineTotal, 0), [computedHardwareRows]);
  const totalPrice = useMemo(() => round2(panelSubtotal + trimSubtotal + hardwareSubtotal), [panelSubtotal, trimSubtotal, hardwareSubtotal]);

  // Panel row handlers
  function updatePanelRow(i, field, val) {
    setPanelRows(rows => {
      const updated = [...rows];
      updated[i] = { ...updated[i], [field]: val };
      if (field === "lengthInput") {
        const lf = parseLengthInput(val);
        updated[i].lengthFt = lf;
        updated[i].lengthDisplay = val;
      }
      if (field === "qty") updated[i].qty = parseInt(val) || 0;
      return updated;
    });
  }
  function addPanelRow() { setPanelRows(r => [...r, { qty: 1, lengthInput: "", lengthFt: 0, lengthDisplay: "" }]); }
  function removePanelRow(i) { setPanelRows(r => r.filter((_, idx) => idx !== i)); }

  // Trim row handlers
  function updateTrimRow(i, field, val) {
    setTrimRows(rows => { const u = [...rows]; u[i] = { ...u[i], [field]: val }; return u; });
  }

  // Hardware row handlers
  function updateHardwareRow(i, field, val) {
    setHardwareRows(rows => {
      const u = [...rows];
      u[i] = { ...u[i], [field]: val };
      if (field === "qtyNeeded") {
        u[i].packsNeeded = Math.ceil((parseInt(val) || 0) / u[i].packSize);
      }
      return u;
    });
  }

  const customer = customers.find(c => c.id === customerId);
const requiresPO = customer?.type === "Contractor/Builder";

  async function handleSave(status = "Draft") {
    if (!customerId) return;
    if (requiresPO && !poNumber) return;
    setSaving(true);
    const quoteNum = quoteToEdit?.quote_number || "Q-" + Date.now().toString().slice(-6);
    const payload = {
      customer_id: customerId, quote_number: quoteNum, status,
      job_site_address: jobSiteAddress, po_number: poNumber, due_date: dueDate || null,
      panel_type_id: panelTypeId, gauge, striation: pt.hasStriations ? striation : null,
      panel_width: pt.hasPanelWidth ? panelWidth : null, panel_color: panelColor,
      waste_pct: parseFloat(wastePct) || 0,
      panel_rows: computedPanelRows, trim_rows: computedTrimRows, hardware_rows: computedHardwareRows,
      total_panel_lf: round2(totalPanelLF), total_sf: round2(totalSF),
      total_sf_with_waste: round2(totalSFWithWaste),
      panel_subtotal: round2(panelSubtotal), trim_subtotal: round2(trimSubtotal),
      hardware_subtotal: round2(hardwareSubtotal), total_price: totalPrice,
      notes,
    };
    let error;
    if (isEdit) {
      ({ error } = await supabase.from("quotes").update(payload).eq("id", quoteToEdit.id));
    } else {
      ({ error } = await supabase.from("quotes").insert(payload));
    }
    setSaving(false);
    if (!error) { onSaved(); if (status === "Draft") onClose(); }
  }

  async function handleSendQuote() {
    await handleSave("Sent");
    const q = {
      ...quoteToEdit, quote_number: quoteToEdit?.quote_number || "Q-" + Date.now().toString().slice(-6),
      panel_rows: computedPanelRows, trim_rows: computedTrimRows, hardware_rows: computedHardwareRows,
      total_panel_lf: totalPanelLF, total_sf_with_waste: totalSFWithWaste,
      panel_subtotal: panelSubtotal, trim_subtotal: trimSubtotal,
      hardware_subtotal: hardwareSubtotal, total_price: totalPrice,
      panel_type_id: panelTypeId, gauge, striation, panel_width: panelWidth,
      panel_color: panelColor, waste_pct: wastePct, job_site_address: jobSiteAddress, po_number: poNumber,
    };
    setSavedQuote(q);
    setShowPrint(true);
  }

  const inputStyle = { width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.65)", zIndex: 2000, overflowY: "auto", display: "flex", justifyContent: "center", padding: "30px 20px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 860, background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", marginBottom: 40 }}>
        {/* Header */}
        <div style={{ background: C.steel, padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 17, fontWeight: 700 }}>{isEdit ? "Edit Quote" : "New Quote / Takeoff Sheet"}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>Standing Seam · PBR · Tuf-Rib · B&B · Trapezoidal</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.ash, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: "20px 28px 100px", overflowY: "auto", maxHeight: "calc(100vh - 140px)" }}>

          {/* ── JOB INFO ── */}
          <SectionHead title="Job Information" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
            <Field label="Customer *" span={1}>
              <CustomerSearch customers={customers} value={customerId} onChange={setCustomerId} />
            </Field>
            <Field label={requiresPO ? "PO Number *  (required for Contractors)" : "PO Number"} span={1}>
              <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder={requiresPO ? "Required" : "Optional"}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1.5px solid ${requiresPO && !poNumber ? C.danger : C.ashDark}`, fontSize: 13, boxSizing: "border-box", background: requiresPO && !poNumber ? "#FFF5F5" : C.white, color: C.steel }} />
              {requiresPO && !poNumber && <div style={{ fontSize: 11, color: C.danger, marginTop: 3 }}>PO number is required for Contractor/Builder customers</div>}
            </Field>
            <Field label="Job Site Address" span={1}>
              <Input value={jobSiteAddress} onChange={e => setJobSiteAddress(e.target.value)} placeholder={customer?.address || ""} />
            </Field>
            <Field label="Required Due Date" span={1}>
              <Input value={dueDate} onChange={e => setDueDate(e.target.value)} type="date" />
            </Field>
          </div>
          {customer && (
            <div style={{ padding: "8px 12px", background: C.smoke, borderRadius: 8, fontSize: 12, color: C.steelLight, marginBottom: 4 }}>
              {customer.contact} · {customer.email} · {customer.phone}
            </div>
          )}

          {/* ── PANEL SPECS ── */}
          <SectionHead title="Panel Specifications" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>Panel Profile</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PANEL_TYPES.map(p => <SelectBtn key={p.id} label={p.label} selected={panelTypeId === p.id} onClick={() => setPanelTypeId(p.id)} />)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>Gauge</label>
              <div style={{ display: "flex", gap: 6 }}>
                {GAUGES.map(g => <SelectBtn key={g} label={`${g} ga`} selected={gauge === g} onClick={() => setGauge(g)} />)}
              </div>
            </div>
            {pt.hasStriations && (
              <div>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>Striations</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {STRIATION_OPTIONS.map(s => <SelectBtn key={s} label={s} selected={striation === s} onClick={() => setStriation(s)} />)}
                </div>
              </div>
            )}
            {pt.hasPanelWidth && (
              <div>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>Panel Width</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {PANEL_WIDTHS.map(w => <SelectBtn key={w} label={w} selected={panelWidth === w} onClick={() => setPanelWidth(w)} />)}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 4 }}>
            <Field label="Panel Color">
              <Input value={panelColor} onChange={e => setPanelColor(e.target.value)} placeholder="e.g. Charcoal Gray – MBCI" />
            </Field>
            <Field label="Waste % (manual per job)">
              <Input value={wastePct} onChange={e => setWastePct(e.target.value)} type="number" min="0" placeholder="10" />
            </Field>
            <Field label="Price per LF">
              <Input value={pricePerLF ? fmt(pricePerLF) : "Not set in price table"} readOnly />
            </Field>
          </div>

          {/* ── PANEL CUT LIST ── */}
          <SectionHead title="Panel Cut List" sub="Customer-provided measurements. Enter as feet (14.5) or feet & inches (14ft 6in)." />
          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.ash}`, marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 160px 100px 100px 110px 110px 36px", gap: 0, background: C.smoke, padding: "8px 14px", fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.ash}` }}>
              <span>Qty</span><span>Length</span><span>LF Each</span><span>Total LF</span><span>$/LF</span><span>Line Total</span><span></span>
            </div>
            {computedPanelRows.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 160px 100px 100px 110px 110px 36px", gap: 0, padding: "7px 14px", borderBottom: `1px solid ${C.ash}`, alignItems: "center", background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                <input value={row.qty} onChange={e => updatePanelRow(i, "qty", e.target.value)} type="number" min="1"
                  style={{ width: 60, padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                <input value={row.lengthInput} onChange={e => updatePanelRow(i, "lengthInput", e.target.value)}
                  placeholder="e.g. 14'6&quot;" style={{ width: 140, padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 8 }}>{row.lengthFt > 0 ? `${round2(row.lengthFt).toFixed(2)}'` : "—"}</span>
                <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 8 }}>{row.totalLF > 0 ? `${row.totalLF.toFixed(2)} LF` : "—"}</span>
                <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 8 }}>{fmt(pricePerLF)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.steel, paddingLeft: 8 }}>{row.lineTotal > 0 ? fmt(row.lineTotal) : "—"}</span>
                <button onClick={() => removePanelRow(i)} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
            ))}
            <div style={{ padding: "8px 14px", background: "#F9F7F4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={addPanelRow} style={{ fontSize: 12, color: C.copper, background: "none", border: `1px dashed ${C.copper}`, borderRadius: 6, padding: "4px 14px", cursor: "pointer" }}>+ Add Panel Row</button>
              <div style={{ display: "flex", gap: 24, fontSize: 12 }}>
                <span style={{ color: C.steelLight }}>Total LF: <strong style={{ color: C.steel }}>{totalPanelLF.toFixed(2)}</strong></span>
                <span style={{ color: C.steelLight }}>SF (no waste): <strong style={{ color: C.steel }}>{round2(totalSF).toFixed(0)}</strong></span>
                <span style={{ color: C.steelLight }}>SF (w/ {wastePct}% waste): <strong style={{ color: C.steel }}>{round2(totalSFWithWaste).toFixed(0)}</strong></span>
                <span style={{ color: C.steelLight }}>Panels Subtotal: <strong style={{ color: C.steel }}>{fmt(panelSubtotal)}</strong></span>
              </div>
            </div>
          </div>

          {/* ── TRIM & ACCESSORIES ── */}
          <SectionHead title="Trim & Accessories" sub="All trim sold in 10LF sticks. Enter actual LF needed and sticks to add for waste." />
          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.ash}`, marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 100px 100px 100px 110px 110px", gap: 0, background: C.smoke, padding: "8px 14px", fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.ash}` }}>
              <span>Item</span><span>Actual LF</span><span>+ Sticks Waste</span><span>Total Sticks</span><span>$/Stick</span><span>Line Total</span>
            </div>
            {computedTrimRows.map((row, i) => (
              <div key={row.id + i} style={{ display: "grid", gridTemplateColumns: "2fr 100px 100px 100px 110px 110px", gap: 0, padding: "7px 14px", borderBottom: i < computedTrimRows.length - 1 ? `1px solid ${C.ash}` : "none", alignItems: "center", background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                <div>
                  <span style={{ fontSize: 12, color: C.steel, fontWeight: 500 }}>{row.label}</span>
                  {row.id === "custom" && (
                    <input value={row.customLabel || ""} onChange={e => updateTrimRow(i, "customLabel", e.target.value)}
                      placeholder="Custom item name" style={{ marginLeft: 8, padding: "3px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 11, width: 150 }} />
                  )}
                </div>
                <input value={row.actualLF || ""} onChange={e => updateTrimRow(i, "actualLF", parseFloat(e.target.value) || 0)}
                  type="number" min="0" placeholder="0"
                  style={{ width: 80, padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                <input value={row.sticksWaste || ""} onChange={e => updateTrimRow(i, "sticksWaste", parseInt(e.target.value) || 0)}
                  type="number" min="0" placeholder="0"
                  style={{ width: 80, padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.steel, paddingLeft: 8 }}>{row.totalSticks}</span>
                <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 8 }}>{fmt(row.pricePerStick)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.steel, paddingLeft: 8 }}>{row.lineTotal > 0 ? fmt(row.lineTotal) : "—"}</span>
              </div>
            ))}
            <div style={{ padding: "8px 14px", background: "#F9F7F4", textAlign: "right", fontSize: 12 }}>
              Trim Subtotal: <strong style={{ color: C.steel, marginLeft: 8 }}>{fmt(trimSubtotal)}</strong>
            </div>
          </div>

          {/* ── HARDWARE ── */}
          <SectionHead title="Hardware & Fasteners" sub={pt.throughFastener ? "Screws auto-calculated at 110/square based on SF with waste." : "Enter quantities needed. Packs calculated automatically."} />
          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.ash}`, marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 120px 120px 80px 110px 110px", gap: 0, background: C.smoke, padding: "8px 14px", fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.ash}` }}>
              <span>Item</span><span>Pack Size</span><span>Qty Needed</span><span>Packs</span><span>$/Pack</span><span>Line Total</span>
            </div>
            {computedHardwareRows.map((row, i) => (
              <div key={row.id + i} style={{ display: "grid", gridTemplateColumns: "2fr 120px 120px 80px 110px 110px", gap: 0, padding: "7px 14px", borderBottom: i < computedHardwareRows.length - 1 ? `1px solid ${C.ash}` : "none", alignItems: "center", background: i % 2 === 0 ? C.white : "#FAFAF8" }}>
                <span style={{ fontSize: 12, color: C.steel, fontWeight: 500 }}>{row.label}{row.autoCalc ? <span style={{ fontSize: 10, color: C.success, marginLeft: 6 }}>auto</span> : ""}</span>
                <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 8 }}>{row.packSize} / {row.unit}</span>
                <input value={row.autoCalc ? row.qtyNeeded : (row.qtyNeeded || "")}
                  onChange={e => !row.autoCalc && updateHardwareRow(i, "qtyNeeded", e.target.value)}
                  readOnly={row.autoCalc} type="number" min="0" placeholder="0"
                  style={{ width: 100, padding: "5px 7px", borderRadius: 5, border: `1px solid ${C.ashDark}`, fontSize: 13, background: row.autoCalc ? C.smoke : C.white }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.steel, paddingLeft: 8 }}>{row.packsNeeded || 0}</span>
                <span style={{ fontSize: 12, color: C.steelLight, paddingLeft: 8 }}>{fmt(row.pricePerPack)}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.steel, paddingLeft: 8 }}>{row.lineTotal > 0 ? fmt(row.lineTotal) : "—"}</span>
              </div>
            ))}
            <div style={{ padding: "8px 14px", background: "#F9F7F4", textAlign: "right", fontSize: 12 }}>
              Hardware Subtotal: <strong style={{ color: C.steel, marginLeft: 8 }}>{fmt(hardwareSubtotal)}</strong>
            </div>
          </div>

          {/* Notes */}
          <SectionHead title="Notes" />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Internal notes, special instructions, delivery info…"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.ashDark}`, fontSize: 13, resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }} />
        </div>

        {/* Sticky footer */}
        <div style={{ position: "sticky", bottom: 0, background: C.white, borderTop: `1px solid ${C.ash}`, padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
            <span style={{ color: C.steelLight }}>Panels: <strong>{fmt(panelSubtotal)}</strong></span>
            <span style={{ color: C.steelLight }}>Trim: <strong>{fmt(trimSubtotal)}</strong></span>
            <span style={{ color: C.steelLight }}>Hardware: <strong>{fmt(hardwareSubtotal)}</strong></span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.steel }}>Total: <strong style={{ color: C.copper }}>{fmt(totalPrice)}</strong></span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelLight, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={() => handleSave("Draft")} disabled={!customerId || saving}
              style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.steelMid}`, background: C.steelMid, color: C.white, fontSize: 13, cursor: "pointer" }}>
              {saving ? "Saving…" : "Save Draft"}
            </button>
            <button onClick={handleSendQuote} disabled={!customerId || saving}
              style={{ padding: "8px 20px", borderRadius: 6, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Saving…" : "Generate Quote →"}
            </button>
          </div>
        </div>
      </div>

      {showPrint && savedQuote && (
        <QuotePrintView quote={savedQuote} customer={customer} onClose={() => { setShowPrint(false); onClose(); }} />
      )}
    </div>
  );
}

// ─── QUOTES LIST ─────────────────────────────────────────────
function QuotesList({ customers, prices, onNewQuote }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editQuote, setEditQuote] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [printQuote, setPrintQuote] = useState(null);

  useEffect(() => { loadQuotes(); }, []);

  async function loadQuotes() {
    setLoading(true);
    const { data } = await supabase.from("quotes").select("*, customers(name, contact, email, phone, address)").order("created_at", { ascending: false });
    setQuotes(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase.from("quotes").update({ status }).eq("id", id);
    loadQuotes();
  }

  const filtered = quotes.filter(q => filterStatus === "All" || q.status === filterStatus);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.steelLight }}>Filter:</span>
          {["All", ...Object.keys(QUOTE_STATUSES)].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, border: `1.5px solid ${filterStatus === s ? C.copper : C.ashDark}`, background: filterStatus === s ? "#FFF8F2" : C.white, color: filterStatus === s ? C.copper : C.steelLight, cursor: "pointer", fontWeight: filterStatus === s ? 600 : 400 }}>{s}</button>
          ))}
        </div>
        <button onClick={onNewQuote} style={{ padding: "7px 16px", borderRadius: 8, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ New Quote</button>
      </div>

      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.ash}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr 1fr auto", gap: 8, padding: "9px 20px", background: C.smoke, borderBottom: `1px solid ${C.ash}`, fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5 }}>
          <span>Quote #</span><span>Customer</span><span>Profile</span><span>Total</span><span>Due Date</span><span>Status</span><span></span>
        </div>
        {loading && <div style={{ padding: 40, display: "flex", justifyContent: "center" }}><Spinner /></div>}
        {!loading && filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.steelLight }}>No quotes found. Create your first one above.</div>}
        {!loading && filtered.map((q, i) => {
          const pt = PANEL_TYPES.find(p => p.id === q.panel_type_id);
          return (
            <div key={q.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center", padding: "12px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.ash}` : "none" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{q.quote_number}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.steel }}>{q.customers?.name}</div>
                <div style={{ fontSize: 11, color: C.steelLight }}>{q.customers?.contact}</div>
              </div>
              <div style={{ fontSize: 12, color: C.steelLight }}>{pt?.category || q.panel_type_id}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>{fmt(q.total_price)}</div>
              <div style={{ fontSize: 12, color: q.due_date ? C.steel : C.steelLight }}>{q.due_date || "—"}</div>
              <StatusBadge status={q.status} />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPrintQuote(q)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelMid, cursor: "pointer" }}>View</button>
                <button onClick={() => setEditQuote(q)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelMid, cursor: "pointer" }}>Edit</button>
                {q.status === "Sent" && (
                  <button onClick={() => updateStatus(q.id, "Approved")} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.success}`, background: C.successBg, color: C.success, cursor: "pointer", fontWeight: 600 }}>Approve</button>
                )}
                {q.status === "Approved" && (
                  <button onClick={() => updateStatus(q.id, "In Production")} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.warn}`, background: C.warnBg, color: C.warn, cursor: "pointer", fontWeight: 600 }}>→ Production</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editQuote && (
        <QuoteBuilder customers={customers} quoteToEdit={editQuote} prices={prices}
          onClose={() => setEditQuote(null)} onSaved={() => { setEditQuote(null); loadQuotes(); }} />
      )}
      {printQuote && (
        <QuotePrintView quote={printQuote} customer={printQuote.customers}
          onClose={() => setPrintQuote(null)} />
      )}
    </div>
  );
}

// ─── QB INVOICE EXPORT ───────────────────────────────────────
function QBInvoiceModal({ quote, customer, onClose }) {
  const [exported, setExported] = useState(false);
  const pt = PANEL_TYPES.find(p => p.id === quote.panel_type_id);

  // Group by product type for QB line items
  const lineItems = [
    { description: `${pt?.label} – ${quote.gauge}ga${quote.striation ? ` – ${quote.striation}` : ""} – ${quote.panel_color}`, qty: `${round2(quote.total_panel_lf).toFixed(2)} LF`, unitPrice: fmt(quote.panel_subtotal / (quote.total_panel_lf || 1)), total: fmt(quote.panel_subtotal) },
    ...((quote.trim_subtotal > 0) ? [{ description: "Trim & Accessories", qty: "—", unitPrice: "—", total: fmt(quote.trim_subtotal) }] : []),
    ...((quote.hardware_subtotal > 0) ? [{ description: "Hardware & Fasteners", qty: "—", unitPrice: "—", total: fmt(quote.hardware_subtotal) }] : []),
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.7)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 600, background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
        <div style={{ background: "#2CA01C", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: C.white }}>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 16, fontWeight: 700 }}>QuickBooks Invoice Export</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Quote {quote.quote_number} → QB Invoice</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.white, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 16, padding: "10px 14px", background: C.smoke, borderRadius: 8, fontSize: 13 }}>
            <div style={{ fontWeight: 600, color: C.steel }}>{customer?.name}</div>
            <div style={{ color: C.steelLight }}>{customer?.contact} · {customer?.email}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Invoice Line Items (grouped by product type)</div>
          <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.ash}`, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", gap: 8, padding: "8px 14px", background: C.smoke, fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.ash}` }}>
              <span>Description</span><span style={{ textAlign: "right" }}>Qty</span><span style={{ textAlign: "right" }}>Unit Price</span><span style={{ textAlign: "right" }}>Total</span>
            </div>
            {lineItems.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", gap: 8, padding: "10px 14px", borderBottom: i < lineItems.length - 1 ? `1px solid ${C.ash}` : "none", fontSize: 13 }}>
                <span style={{ color: C.steel, fontWeight: 500 }}>{item.description}</span>
                <span style={{ textAlign: "right", color: C.steelLight }}>{item.qty}</span>
                <span style={{ textAlign: "right", color: C.steelLight }}>{item.unitPrice}</span>
                <span style={{ textAlign: "right", fontWeight: 700, color: C.steel }}>{item.total}</span>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr", gap: 8, padding: "10px 14px", background: C.smoke, fontSize: 14, fontWeight: 700 }}>
              <span style={{ color: C.steel }}>TOTAL</span>
              <span></span><span></span>
              <span style={{ textAlign: "right", color: C.copper }}>{fmt(quote.total_price)}</span>
            </div>
          </div>
          {!exported ? (
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelLight, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setExported(true)}
                style={{ padding: "8px 22px", borderRadius: 6, background: "#2CA01C", color: C.white, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Push to QuickBooks
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.success }}>Invoice created in QuickBooks</div>
              <div style={{ fontSize: 12, color: C.steelLight, marginTop: 4 }}>Invoice #{Math.floor(Math.random() * 9000 + 1000)} · Wire up QB OAuth to activate live sync</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function QuotingApp() {
  const [customers, setCustomers] = useState([]);
  const [prices, setPrices] = useState({ panels: {}, trim: {}, hardware: {} });
  const [view, setView] = useState("quotes");
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [showPriceTable, setShowPriceTable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [{ data: custs }, { data: priceData }] = await Promise.all([
      supabase.from("customers").select("*").order("name"),
      supabase.from("price_table").select("*"),
    ]);
    setCustomers(custs || []);
    const p = { panels: {}, trim: {}, hardware: {} };
    (priceData || []).forEach(row => { p[row.category][row.item_key] = row.price; });
    setPrices(p);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.smoke, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: fixed; left: 0; top: 0; width: 100%; } }`}</style>

      {/* Nav */}
      <div style={{ background: C.steel, display: "flex", alignItems: "center", padding: "0 24px", height: 56, flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 32 }}>
          <div style={{ width: 32, height: 32, background: C.copper, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: C.white }}>⚙</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Georgia', serif", lineHeight: 1.1, color: C.white }}>High Plains Custom Metal</div>
            <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 0.5, textTransform: "uppercase", color: C.white }}>Quoting & Cutlist System</div>
          </div>
        </div>
        {["quotes"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ background: "none", border: "none", color: view === v ? C.copperLight : "rgba(255,255,255,0.55)", fontSize: 13, padding: "18px 13px", cursor: "pointer", fontWeight: view === v ? 600 : 400, borderBottom: `2px solid ${view === v ? C.copper : "transparent"}`, fontFamily: "inherit" }}>
            Quotes & Orders
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button onClick={() => setShowPriceTable(true)} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer" }}>⚙ Price Table</button>
          <button onClick={() => setShowNewQuote(true)} style={{ padding: "7px 16px", borderRadius: 8, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ New Quote</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>
        ) : (
          <QuotesList customers={customers} prices={prices} onNewQuote={() => setShowNewQuote(true)} />
        )}
      </div>

      {showNewQuote && (
        <QuoteBuilder customers={customers} prices={prices} quoteToEdit={null}
          onClose={() => setShowNewQuote(false)} onSaved={() => { setShowNewQuote(false); loadAll(); }} />
      )}
      {showPriceTable && <PriceTableEditor onClose={() => { setShowPriceTable(false); loadAll(); }} />}
    </div>
  );
}
