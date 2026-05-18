// ============================================================
// HIGH PLAINS CUSTOM METAL — CRM with Supabase Auth
// ============================================================
// SETUP: Replace the two placeholder values below with your
// actual Supabase project URL and anon key, found at:
// Supabase Dashboard → Project Settings → API
// ============================================================

import QuotingApp from "./hpcm-quotes.jsx";
import ProductionCalendar from "./hpcm-calendar.jsx";
import { useState, useEffect, useMemo, createContext, useContext, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

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

// ─── AUTH CONTEXT ────────────────────────────────────────────
const AuthContext = createContext(null);
function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const canWrite = profile?.role === "admin" || profile?.role === "staff";
  const isAdmin  = profile?.role === "admin";

  return (
    <AuthContext.Provider value={{ session, profile, signIn, signOut, canWrite, isAdmin, loading: session === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── PRODUCT CATALOG (static reference data) ─────────────────
const PRODUCT_CATEGORIES = {
  "Standing Seam Panels": { icon: "▰", desc: "Concealed fastener standing seam roofing panels",
    products: [
      { id: "ss-1", name: "1.5\" Snap-Lock Standing Seam", unit: "sq ft", notes: "12\", 16\", 18\" widths" },
      { id: "ss-2", name: "2\" Mechanical Lock Standing Seam", unit: "sq ft", notes: "Field or factory lock" },
      { id: "ss-3", name: "3\" Batten Standing Seam", unit: "sq ft", notes: "16\" coverage" },
      { id: "ss-4", name: "Nail Flange Standing Seam", unit: "sq ft", notes: "12\" coverage" },
    ]},
  "Tuf-Rib Panels": { icon: "▬", desc: "Through-fastener Tuf-Rib panels",
    products: [
      { id: "tr-1", name: "Tuf-Rib Roofing Panel", unit: "sq ft", notes: "36\" coverage, 7/8\" rib" },
      { id: "tr-2", name: "Tuf-Rib Siding Panel", unit: "sq ft", notes: "36\" coverage" },
    ]},
  "PBR Panels": { icon: "▭", desc: "Through-fastener PBR roof & wall panels",
    products: [
      { id: "pbr-1", name: "PBR Roofing Panel", unit: "sq ft", notes: "36\" coverage, 1.25\" rib" },
      { id: "pbr-2", name: "PBR Wall Panel", unit: "sq ft", notes: "36\" coverage" },
      { id: "pbr-3", name: "R-Panel (PBR Variant)", unit: "sq ft", notes: "Exposed fastener" },
    ]},
  "Trapezoidal Panels": { icon: "◿", desc: "Trapezoidal profile panels",
    products: [
      { id: "trap-1", name: "Trapezoidal Roof – 45mm", unit: "sq ft", notes: "1.5\" rib" },
      { id: "trap-2", name: "Trapezoidal Wall – 45mm", unit: "sq ft", notes: "Vert or horiz" },
      { id: "trap-3", name: "Deep Rib Trapezoidal – 75mm", unit: "sq ft", notes: "Long spans" },
    ]},
  "Board & Batten Siding": { icon: "▏", desc: "Steel board & batten siding",
    products: [
      { id: "bb-1", name: "B&B Siding – 6\" Board", unit: "sq ft", notes: "1.5\" batten" },
      { id: "bb-2", name: "B&B Siding – 8\" Board", unit: "sq ft", notes: "2\" batten" },
      { id: "bb-3", name: "B&B Siding – 12\" Board", unit: "sq ft", notes: "2\" batten, modern" },
    ]},
  "Trim & Accessories": { icon: "⌐", desc: "Trim, flashing, closures, accessories",
    products: [
      { id: "trim-1", name: "Ridge Cap", unit: "lin ft", notes: "Vented / non-vented" },
      { id: "trim-2", name: "Eave Trim / Drip Edge", unit: "lin ft", notes: "Profile-matched" },
      { id: "trim-3", name: "Rake Trim", unit: "lin ft", notes: "Gable end" },
      { id: "trim-4", name: "Corner Trim – Inside", unit: "lin ft", notes: "90° inside" },
      { id: "trim-5", name: "Corner Trim – Outside", unit: "lin ft", notes: "90° outside" },
      { id: "trim-6", name: "J-Channel / Sidewall Flashing", unit: "lin ft", notes: "Wall-to-roof" },
      { id: "trim-7", name: "Valley Flashing", unit: "lin ft", notes: "W-style open valley" },
      { id: "trim-8", name: "Foam Closure Strips", unit: "each", notes: "Profile-matched" },
      { id: "trim-9", name: "Pipe Flashing Boot", unit: "each", notes: "EPDM, 1\"–6\"" },
      { id: "trim-10", name: "Snow Guard", unit: "each", notes: "Bar or pad style" },
      { id: "trim-11", name: "Z-Closure / Z-Bar", unit: "lin ft", notes: "Lap joints" },
      { id: "trim-12", name: "Butyl Tape / Sealant Strip", unit: "roll", notes: "1\" and 2\" widths" },
    ]},
  "Gutters & Downspouts": { icon: "⌒", desc: "Custom roll-formed gutters and downspouts",
    products: [
      { id: "gut-1", name: "5\" K-Style Gutter", unit: "lin ft", notes: "Standard residential" },
      { id: "gut-2", name: "6\" K-Style Gutter", unit: "lin ft", notes: "Commercial" },
      { id: "gut-3", name: "4\" Half-Round Gutter", unit: "lin ft", notes: "Traditional profile" },
      { id: "gut-4", name: "6\" Half-Round Gutter", unit: "lin ft", notes: "Commercial" },
      { id: "gut-5", name: "3\" Round Downspout", unit: "lin ft", notes: "Standard" },
      { id: "gut-6", name: "4\" Round Downspout", unit: "lin ft", notes: "High-capacity" },
      { id: "gut-7", name: "3\"x4\" Rectangular Downspout", unit: "lin ft", notes: "K-style compatible" },
      { id: "gut-8", name: "Gutter Hanger / Bracket", unit: "each", notes: "Hidden hanger" },
      { id: "gut-9", name: "Gutter End Cap (L/R)", unit: "each", notes: "Mitered" },
      { id: "gut-10", name: "Downspout Elbow", unit: "each", notes: "A, B, C style" },
    ]},
  "Cupolas": { icon: "⌂", desc: "Custom fabricated steel cupolas",
    products: [
      { id: "cup-1", name: "Cupola – 16\" Base", unit: "each", notes: "Small barn / residential" },
      { id: "cup-2", name: "Cupola – 24\" Base", unit: "each", notes: "Standard barn" },
      { id: "cup-3", name: "Cupola – 36\" Base", unit: "each", notes: "Large commercial barn" },
      { id: "cup-4", name: "Cupola – 48\" Base", unit: "each", notes: "Extra-large / custom" },
      { id: "cup-5", name: "Cupola Weathervane", unit: "each", notes: "Arrow, rooster, horse" },
    ]},
};

const COLOR_PROVIDERS = {
  "MBCI": { full: "MBCI / Metallic Building Company", colors: [
    { id: "mbci-bk", name: "Black", hex: "#1A1A1A", finish: "Kynar 500" },
    { id: "mbci-cg", name: "Charcoal Gray", hex: "#4A4A4A", finish: "Kynar 500" },
    { id: "mbci-sg", name: "Slate Gray", hex: "#7A8A9A", finish: "Kynar 500" },
    { id: "mbci-bs", name: "Burnished Slate", hex: "#6B7A8A", finish: "Kynar 500" },
    { id: "mbci-pw", name: "Polar White", hex: "#F0EEE8", finish: "Kynar 500" },
    { id: "mbci-al", name: "Almond", hex: "#D4C5A0", finish: "Kynar 500" },
    { id: "mbci-az", name: "Arizona Tan", hex: "#C0A882", finish: "Kynar 500" },
    { id: "mbci-ts", name: "Terra Cotta", hex: "#B06040", finish: "Kynar 500" },
    { id: "mbci-cr", name: "Classic Red", hex: "#8B2020", finish: "Kynar 500" },
    { id: "mbci-rr", name: "Regal Red", hex: "#7A1818", finish: "Kynar 500" },
    { id: "mbci-fg", name: "Fern Green", hex: "#5A7A50", finish: "Kynar 500" },
    { id: "mbci-hw", name: "Hartford Green", hex: "#3A5A3A", finish: "Kynar 500" },
    { id: "mbci-lb", name: "Light Blue", hex: "#8EB4CC", finish: "Kynar 500" },
    { id: "mbci-oc", name: "Ocean Blue", hex: "#1A4A7A", finish: "Kynar 500" },
    { id: "mbci-dc", name: "Dark Bronze", hex: "#3C2A1A", finish: "Kynar 500" },
    { id: "mbci-mg", name: "Medium Bronze", hex: "#6B4820", finish: "Kynar 500" },
    { id: "mbci-bg", name: "Burnished Gold", hex: "#A08040", finish: "Kynar 500" },
    { id: "mbci-ag", name: "Aged Copper", hex: "#7A9A8A", finish: "Kynar 500" },
    { id: "mbci-gn", name: "Galvalume Plus", hex: "#C0C4C8", finish: "AZ50" },
    { id: "mbci-gy", name: "Galvalume", hex: "#B8BCBF", finish: "Standard" },
  ]},
  "Sherwin-Williams": { full: "Sherwin-Williams Coil Coatings", colors: [
    { id: "sw-dg", name: "Deep Gray", hex: "#3C3C3C", finish: "Fluropon®" },
    { id: "sw-gg", name: "Graphite Gray", hex: "#5A5A5A", finish: "Fluropon®" },
    { id: "sw-ig", name: "Iron Gray", hex: "#606060", finish: "Fluropon®" },
    { id: "sw-sr", name: "Slate Roof", hex: "#505868", finish: "Fluropon®" },
    { id: "sw-aw", name: "Alpine White", hex: "#ECECEC", finish: "Fluropon®" },
    { id: "sw-ow", name: "Off White", hex: "#E8E0D0", finish: "Fluropon®" },
    { id: "sw-le", name: "Linen", hex: "#D8CCAA", finish: "Fluropon®" },
    { id: "sw-wh", name: "Wheat", hex: "#C8AA70", finish: "Fluropon®" },
    { id: "sw-hs", name: "Harvest Sunset", hex: "#C07040", finish: "Fluropon®" },
    { id: "sw-rn", name: "Rustic Nutmeg", hex: "#7A5030", finish: "Fluropon®" },
    { id: "sw-br", name: "Brick Red", hex: "#8C3020", finish: "Fluropon®" },
    { id: "sw-eg", name: "Evergreen", hex: "#2A4A2A", finish: "Fluropon®" },
    { id: "sw-fv", name: "Forest View", hex: "#3A5030", finish: "Fluropon®" },
    { id: "sw-sb", name: "Sky Blue", hex: "#6090B8", finish: "Fluropon®" },
    { id: "sw-cb", name: "Colonial Blue", hex: "#304A6A", finish: "Fluropon®" },
    { id: "sw-mb", name: "Midnight Blue", hex: "#1A2840", finish: "Fluropon®" },
    { id: "sw-db", name: "Deep Bronze", hex: "#3A2818", finish: "Fluropon®" },
    { id: "sw-abk", name: "Aged Bronze", hex: "#5A4030", finish: "Fluropon®" },
    { id: "sw-cf", name: "Copper Penny", hex: "#B87040", finish: "Fluropon®" },
    { id: "sw-mg", name: "Mocha Gray", hex: "#8A7868", finish: "Fluropon®" },
  ]},
  "Valspar": { full: "Valspar Coil Coatings", colors: [
    { id: "val-cg", name: "Charcoal", hex: "#383838", finish: "Flurocarbon" },
    { id: "val-bp", name: "Burnished Pewter", hex: "#8A8A8A", finish: "Flurocarbon" },
    { id: "val-mt", name: "Mountain Mist", hex: "#909898", finish: "Flurocarbon" },
    { id: "val-bl", name: "Brite White", hex: "#F4F4F0", finish: "Flurocarbon" },
    { id: "val-nw", name: "Natural White", hex: "#E8E4DC", finish: "Flurocarbon" },
    { id: "val-dl", name: "Driftwood", hex: "#B0A888", finish: "Flurocarbon" },
    { id: "val-cs", name: "Classic Stone", hex: "#A0907A", finish: "Flurocarbon" },
    { id: "val-sb", name: "Sandstone Beige", hex: "#C8B890", finish: "Flurocarbon" },
    { id: "val-hw", name: "Harvest Wheat", hex: "#C09048", finish: "Flurocarbon" },
    { id: "val-cb", name: "Canyon Brown", hex: "#8A5838", finish: "Flurocarbon" },
    { id: "val-rv", name: "Russet Valley", hex: "#904828", finish: "Flurocarbon" },
    { id: "val-ab", name: "Antique Bronze", hex: "#6A4828", finish: "Flurocarbon" },
    { id: "val-ob", name: "Old Bronze", hex: "#786040", finish: "Flurocarbon" },
    { id: "val-fj", name: "Forest Jade", hex: "#3A5840", finish: "Flurocarbon" },
    { id: "val-ej", name: "Ember Jade", hex: "#5A7860", finish: "Flurocarbon" },
    { id: "val-pc", name: "Patina Copper", hex: "#6A9080", finish: "Flurocarbon" },
    { id: "val-tl", name: "Teal", hex: "#207878", finish: "Flurocarbon" },
    { id: "val-hb", name: "Harbor Blue", hex: "#286080", finish: "Flurocarbon" },
    { id: "val-bk", name: "Black Walnut", hex: "#282018", finish: "Flurocarbon" },
    { id: "val-ga", name: "Galvalume AZ55", hex: "#C4C8CC", finish: "AZ55" },
  ]},
  "AEP Span": { full: "AEP Span (BlueScope Steel)", colors: [
    { id: "aep-ch", name: "Charcoal", hex: "#404040", finish: "PVDF" },
    { id: "aep-gy", name: "Gray", hex: "#787878", finish: "PVDF" },
    { id: "aep-pg", name: "Pebble Gray", hex: "#908880", finish: "PVDF" },
    { id: "aep-sl", name: "Slate", hex: "#5A6878", finish: "PVDF" },
    { id: "aep-gw", name: "Gallery White", hex: "#F0EEE8", finish: "PVDF" },
    { id: "aep-lw", name: "Limestone White", hex: "#E0D8C8", finish: "PVDF" },
    { id: "aep-sm", name: "Sandstone", hex: "#C8B898", finish: "PVDF" },
    { id: "aep-rs", name: "Rustic Red", hex: "#904030", finish: "PVDF" },
    { id: "aep-br", name: "Barn Red", hex: "#7A2020", finish: "PVDF" },
    { id: "aep-cn", name: "Colonial Red", hex: "#6A1818", finish: "PVDF" },
    { id: "aep-ev", name: "Evergreen", hex: "#3A6038", finish: "PVDF" },
    { id: "aep-dg", name: "Dark Green", hex: "#284828", finish: "PVDF" },
    { id: "aep-hw", name: "Hartford Green", hex: "#2A4A2A", finish: "PVDF" },
    { id: "aep-lb", name: "Light Blue", hex: "#7098B8", finish: "PVDF" },
    { id: "aep-jb", name: "Journey Blue", hex: "#204868", finish: "PVDF" },
    { id: "aep-bz", name: "Bronze", hex: "#604020", finish: "PVDF" },
    { id: "aep-md", name: "Medium Bronze", hex: "#785030", finish: "PVDF" },
    { id: "aep-wb", name: "Washed Bronze", hex: "#504030", finish: "PVDF" },
    { id: "aep-yw", name: "Muted Yellow", hex: "#C0A848", finish: "PVDF" },
    { id: "aep-gl", name: "Galvalume", hex: "#B8C0C4", finish: "G90" },
  ]},
};

const CUSTOMER_TYPES = ["Contractor/Builder", "Homeowner", "Commercial", "Municipal"];
const typeColors = {
  "Contractor/Builder": { bg: "#E6F1FB", text: "#185FA5", border: "#B5D4F4" },
  "Homeowner":          { bg: "#EEEDFE", text: "#534AB7", border: "#CECBF6" },
  "Commercial":         { bg: "#FAEEDA", text: "#854F0B", border: "#FAC775" },
  "Municipal":          { bg: "#EAF3DE", text: "#3B6D11", border: "#C0DD97" },
};
const statusColors = {
  "Active":   { bg: "#D8F3DC", text: "#2D6A4F", border: "#95D5A4" },
  "Overdue":  { bg: "#F8D7DA", text: "#842029", border: "#F5A8AC" },
  "Inactive": { bg: "#E8E4DC", text: "#5F5E5A", border: "#C9C4BA" },
};
const jobStatusColors = {
  "Completed":   { bg: "#D8F3DC", text: "#2D6A4F" },
  "In Progress": { bg: "#CFE2FF", text: "#0A4275" },
  "Quoted":      { bg: "#FFF3CD", text: "#9C6000" },
  "On Hold":     { bg: "#E8E4DC", text: "#5F5E5A" },
};
const roleColors = {
  "admin":    { bg: "#FAEEDA", text: "#854F0B" },
  "staff":    { bg: "#E6F1FB", text: "#185FA5" },
  "readonly": { bg: "#E8E4DC", text: "#5F5E5A" },
};

// ─── HELPERS ──────────────────────────────────────────────────
function fmt(n) { return "$" + (n || 0).toLocaleString(); }
function Badge({ label, colors }) {
  return <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20, background: colors.bg, color: colors.text, border: `1px solid ${colors.border || colors.bg}`, whiteSpace: "nowrap" }}>{label}</span>;
}
function Avatar({ name, size = 36 }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hue = name.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0) % 360;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: `hsl(${hue},35%,75%)`, color: `hsl(${hue},35%,25%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 600, flexShrink: 0, fontFamily: "monospace" }}>{initials}</div>;
}
function Swatch({ hex, size = 14 }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: 3, background: hex, border: "1px solid rgba(0,0,0,0.18)", verticalAlign: "middle", flexShrink: 0 }} />;
}
function Spinner() {
  return <div style={{ width: 20, height: 20, border: `2px solid ${C.ash}`, borderTopColor: C.copper, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

// ─── LOGIN PAGE ───────────────────────────────────────────────
function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    const err = await signIn(email, password);
    setLoading(false);
    if (err) setError(err.message === "Invalid login credentials" ? "Invalid email or password." : err.message);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.steel, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 400, background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
        <div style={{ background: `linear-gradient(135deg, ${C.steel} 0%, ${C.steelMid} 100%)`, padding: "32px 32px 28px", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, background: C.copper, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>⚙</div>
          <div style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: 700 }}>High Plains Custom Metal</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>CRM & Order Management</div>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "28px 32px 32px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
              placeholder="you@example.com"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${C.ashDark}`, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${C.ashDark}`, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
          </div>
          {error && <div style={{ padding: "9px 12px", background: C.dangerBg, color: C.danger, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "11px", borderRadius: 8, background: C.copper, color: C.white, border: "none", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: loading ? 0.8 : 1 }}>
            {loading ? <><Spinner /> Signing in…</> : "Sign In"}
          </button>
          <p style={{ fontSize: 11, color: C.steelLight, textAlign: "center", marginTop: 18, marginBottom: 0 }}>
            Contact your administrator to create or reset your account.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── PRODUCT PICKER ───────────────────────────────────────────
function ProductPicker({ onClose, onAdd }) {
  const [step, setStep] = useState(1);
  const [cat, setCat] = useState(null);
  const [prodId, setProdId] = useState(null);
  const [provKey, setProvKey] = useState(Object.keys(COLOR_PROVIDERS)[0]);
  const [colorId, setColorId] = useState(null);
  const [qty, setQty] = useState("");

  const prod = cat ? PRODUCT_CATEGORIES[cat]?.products.find(p => p.id === prodId) : null;
  const colors = COLOR_PROVIDERS[provKey]?.colors || [];
  const selColor = colors.find(c => c.id === colorId);

  function doAdd() {
    if (!prod || !selColor || !qty) return;
    onAdd({ product_id: prod.id, product_name: prod.name, qty: parseFloat(qty), unit: prod.unit, provider: provKey, color_id: selColor.id, color_name: selColor.name, color_hex: selColor.hex });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 620, maxHeight: "88vh", background: C.white, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}>
        <div style={{ background: C.steel, padding: "15px 22px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 700 }}>Add Product</div>
          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {["Category", "Product", "Color & Qty"].map((l, i) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                {i > 0 && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>›</span>}
                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 10, background: step === i + 1 ? C.copper : "rgba(255,255,255,0.12)", color: C.white, fontWeight: step === i + 1 ? 700 : 400 }}>{i + 1}. {l}</span>
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: C.ash, fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: 20, flex: 1 }}>
          {step === 1 && (
            <div>
              <p style={{ fontSize: 13, color: C.steelLight, marginTop: 0, marginBottom: 14 }}>Select a product category:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {Object.entries(PRODUCT_CATEGORIES).map(([name, d]) => (
                  <div key={name} onClick={() => { setCat(name); setProdId(null); setStep(2); }}
                    style={{ border: `1.5px solid ${C.ashDark}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.copper}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.ashDark}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{d.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{name}</div>
                    <div style={{ fontSize: 11, color: C.steelLight, marginTop: 2 }}>{d.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 2 && cat && (
            <div>
              <button onClick={() => setStep(1)} style={{ fontSize: 12, color: C.steelLight, background: "none", border: "none", cursor: "pointer", marginBottom: 12, padding: 0 }}>← Back</button>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.steel, marginTop: 0, marginBottom: 12 }}>{cat}</p>
              {PRODUCT_CATEGORIES[cat].products.map(p => (
                <div key={p.id} onClick={() => { setProdId(p.id); setColorId(null); setStep(3); }}
                  style={{ border: `1.5px solid ${C.ashDark}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.smoke}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.steel }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.steelLight, marginTop: 2 }}>{p.notes} · per {p.unit}</div>
                  </div>
                  <span style={{ color: C.ashDark }}>›</span>
                </div>
              ))}
            </div>
          )}
          {step === 3 && prod && (
            <div>
              <button onClick={() => setStep(2)} style={{ fontSize: 12, color: C.steelLight, background: "none", border: "none", cursor: "pointer", marginBottom: 12, padding: 0 }}>← Back</button>
              <div style={{ padding: "9px 14px", background: C.smoke, borderRadius: 8, marginBottom: 16, fontSize: 13, color: C.steel }}>
                <strong>{prod.name}</strong><span style={{ color: C.steelLight, marginLeft: 8 }}>per {prod.unit}</span>
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.steelLight, marginBottom: 8, marginTop: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Metal Provider</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {Object.keys(COLOR_PROVIDERS).map(k => (
                  <button key={k} onClick={() => { setProvKey(k); setColorId(null); }}
                    style={{ fontSize: 11, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${provKey === k ? C.copper : C.ashDark}`, background: provKey === k ? "#FFF8F2" : C.white, color: provKey === k ? C.copper : C.steelLight, cursor: "pointer", fontWeight: provKey === k ? 600 : 400 }}>{k}</button>
                ))}
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.steelLight, marginBottom: 8, marginTop: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Color</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>
                {colors.map(col => (
                  <div key={col.id} onClick={() => setColorId(col.id)}
                    style={{ border: `2px solid ${colorId === col.id ? C.copper : "transparent"}`, borderRadius: 8, padding: 6, cursor: "pointer", background: colorId === col.id ? "#FFF8F2" : C.smoke, textAlign: "center" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FFF8F2"}
                    onMouseLeave={e => e.currentTarget.style.background = colorId === col.id ? "#FFF8F2" : C.smoke}>
                    <div style={{ width: "100%", height: 28, borderRadius: 4, background: col.hex, border: "1px solid rgba(0,0,0,0.12)", marginBottom: 4 }} />
                    <div style={{ fontSize: 9, fontWeight: 500, color: C.steel, lineHeight: 1.3 }}>{col.name}</div>
                  </div>
                ))}
              </div>
              {selColor && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "#FFF8F2", borderRadius: 8, marginBottom: 14, border: `1px solid ${C.copper}50` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 5, background: selColor.hex, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.steel }}>{selColor.name}</div>
                    <div style={{ fontSize: 11, color: C.steelLight }}>{COLOR_PROVIDERS[provKey].full} · {selColor.finish}</div>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Quantity ({prod.unit})</label>
                  <input value={qty} onChange={e => setQty(e.target.value)} type="number" min="0" placeholder="0"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.ashDark}`, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <button onClick={doAdd} disabled={!selColor || !qty}
                  style={{ padding: "9px 22px", borderRadius: 8, background: selColor && qty ? C.copper : C.ashDark, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: selColor && qty ? "pointer" : "default" }}>
                  Add to Job
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── USER MANAGEMENT (admin only) ────────────────────────────
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", password: "", role: "staff" });
  const [inviteMsg, setInviteMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    setUsers(data || []);
    setLoading(false);
  }

  async function handleInvite() {
    if (!inviteForm.email || !inviteForm.password || !inviteForm.full_name) return;
    setSaving(true);
    // Create user via Supabase Auth Admin API requires service role key
    // For self-hosted setup, use the Supabase dashboard to invite users
    // This form demonstrates the UI; wire up to your backend or Supabase Admin SDK
    const { data, error } = await supabase.auth.signUp({
      email: inviteForm.email,
      password: inviteForm.password,
      options: { data: { full_name: inviteForm.full_name, role: inviteForm.role } }
    });
    setSaving(false);
    if (error) { setInviteMsg({ type: "error", text: error.message }); }
    else {
      setInviteMsg({ type: "success", text: `User ${inviteForm.email} created. They can now log in.` });
      setInviteForm({ email: "", full_name: "", password: "", role: "staff" });
      setShowInvite(false);
      loadUsers();
    }
  }

  async function handleRoleChange(userId, newRole) {
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    loadUsers();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.steel, fontFamily: "'Georgia', serif" }}>User Accounts</div>
        <button onClick={() => setShowInvite(!showInvite)} style={{ padding: "7px 16px", borderRadius: 8, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{showInvite ? "Cancel" : "+ Add User"}</button>
      </div>

      {inviteMsg && <div style={{ padding: "10px 14px", borderRadius: 8, background: inviteMsg.type === "success" ? C.successBg : C.dangerBg, color: inviteMsg.type === "success" ? C.success : C.danger, fontSize: 13, marginBottom: 14 }}>{inviteMsg.text}</div>}

      {showInvite && (
        <div style={{ border: `1px solid ${C.ashDark}`, borderRadius: 12, padding: 18, marginBottom: 18, background: C.smoke }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.steel, marginTop: 0, marginBottom: 14 }}>New User</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[{ k: "full_name", l: "Full Name", ph: "Jane Smith" }, { k: "email", l: "Email", ph: "jane@hpcm.com" }, { k: "password", l: "Temporary Password", ph: "Min 6 characters" }].map(f => (
              <div key={f.k} style={{ gridColumn: f.k === "full_name" ? "span 1" : f.k === "email" ? "span 1" : "span 2" }}>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>{f.l}</label>
                <input value={inviteForm[f.k]} onChange={e => setInviteForm({ ...inviteForm, [f.k]: e.target.value })}
                  placeholder={f.ph} type={f.k === "password" ? "password" : "text"}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6 }}>Role</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["admin", "staff", "readonly"].map(r => {
                  const rc = roleColors[r];
                  return <button key={r} onClick={() => setInviteForm({ ...inviteForm, role: r })}
                    style={{ padding: "6px 16px", borderRadius: 20, border: `1.5px solid ${inviteForm.role === r ? rc.bg : C.ashDark}`, background: inviteForm.role === r ? rc.bg : C.white, color: inviteForm.role === r ? rc.text : C.steelLight, fontSize: 12, fontWeight: inviteForm.role === r ? 600 : 400, cursor: "pointer" }}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>;
                })}
              </div>
              <div style={{ fontSize: 11, color: C.steelLight, marginTop: 8 }}>
                <strong>Admin:</strong> full access + user management · <strong>Staff:</strong> read/write, no user management · <strong>Readonly:</strong> view only
              </div>
            </div>
          </div>
          <button onClick={handleInvite} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {saving ? "Creating…" : "Create User"}
          </button>
        </div>
      )}

      <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.ash}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 8, padding: "9px 20px", background: C.smoke, borderBottom: `1px solid ${C.ash}`, fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5 }}>
          <span>Name</span><span>Email</span><span>Role</span><span>Joined</span>
        </div>
        {loading && <div style={{ padding: 30, textAlign: "center" }}><Spinner /></div>}
        {!loading && users.map((u, i) => (
          <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr", gap: 8, alignItems: "center", padding: "12px 20px", borderBottom: i < users.length - 1 ? `1px solid ${C.ash}` : "none" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Avatar name={u.full_name || "?"} size={30} />
              <span style={{ fontSize: 13, fontWeight: 500, color: C.steel }}>{u.full_name || "—"}</span>
            </div>
            <div style={{ fontSize: 12, color: C.steelLight }}>{u.id.slice(0, 8)}…</div>
            <div>
              <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 12, background: C.white, color: C.steel, cursor: "pointer" }}>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="readonly">Readonly</option>
              </select>
            </div>
            <div style={{ fontSize: 11, color: C.steelLight }}>{new Date(u.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CUSTOMER DETAIL PANEL ────────────────────────────────────
function CustomerDetail({ customerId, onClose, onUpdated, onQuoteOpen, onQuoteClose }) {
  const { canWrite } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("jobs");
  const [expandedJob, setExpandedJob] = useState(null);
  const [jobProducts, setJobProducts] = useState({});
  const [showNewJob, setShowNewJob] = useState(false);
  const [showNewQuoteForCustomer, setShowNewQuoteForCustomer] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingProds, setPendingProds] = useState([]);
  const [newJob, setNewJob] = useState({ title: "", description: "", amount: "", status: "Quoted", job_date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => { load(); }, [customerId]);

  async function load() {
    setLoading(true);
    const [{ data: cust }, { data: jobData }] = await Promise.all([
      supabase.from("customers").select("*").eq("id", customerId).single(),
      supabase.from("jobs").select("*").eq("customer_id", customerId).order("job_date", { ascending: false }),
    ]);
    setCustomer(cust);
    setJobs(jobData || []);
    if (jobData?.length) {
      const { data: prods } = await supabase.from("job_products").select("*").in("job_id", jobData.map(j => j.id));
      const map = {};
      (prods || []).forEach(p => { if (!map[p.job_id]) map[p.job_id] = []; map[p.job_id].push(p); });
      setJobProducts(map);
    }
    setLoading(false);
  }

  async function toggleExpand(jobId) {
    setExpandedJob(expandedJob === jobId ? null : jobId);
  }

  async function saveJob() {
    if (!newJob.title || !newJob.amount) return;
    setSaving(true);
    const jobNum = "J-" + Math.floor(Math.random() * 9000 + 1000);
    const { data: created, error } = await supabase.from("jobs").insert({
      customer_id: customerId, job_number: jobNum, title: newJob.title,
      description: newJob.description, status: newJob.status,
      amount: parseFloat(newJob.amount), job_date: newJob.job_date,
    }).select().single();
    if (!error && pendingProds.length > 0) {
      await supabase.from("job_products").insert(pendingProds.map((p, i) => ({ ...p, job_id: created.id, sort_order: i })));
    }
    setSaving(false);
    if (!error) {
      setShowNewJob(false); setPendingProds([]);
      setNewJob({ title: "", description: "", amount: "", status: "Quoted", job_date: new Date().toISOString().slice(0, 10) });
      load(); onUpdated();
    }
  }

  async function createInvoice(job) {
    await supabase.from("jobs").update({ invoiced: true, qb_invoice: "INV-" + Math.floor(Math.random() * 9000 + 1000) }).eq("id", job.id);
    setMsg("QB invoice draft created. Sync to QuickBooks to finalize.");
    setTimeout(() => setMsg(null), 4000);
    load();
  }

  if (loading || !customer) return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  const uninvoiced = jobs.filter(j => !j.invoiced).reduce((a, j) => a + parseFloat(j.amount), 0);
  const tc = typeColors[customer.type] || typeColors["Commercial"];
  const ts = t => ({ padding: "8px 16px", fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? C.steel : C.steelLight, background: "none", border: "none", borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: tab === t ? C.copper : "transparent", cursor: "pointer", fontFamily: "inherit" });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.55)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 700, height: "100vh", background: C.white, overflowY: "auto", boxShadow: "-4px 0 32px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 28px 0", background: C.steel }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Avatar name={customer.name} size={48} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Georgia', serif", color: C.white }}>{customer.name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 5 }}>
                  <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 12, background: tc.bg, color: tc.text, fontWeight: 600 }}>{customer.type}</span>
                  <span style={{ fontSize: 12, opacity: 0.7, color: C.white }}>{customer.contact}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.ash, fontSize: 22, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "rgba(255,255,255,0.12)", borderRadius: "8px 8px 0 0", overflow: "hidden" }}>
            {[
              { l: "Total Billed", v: fmt(customer.total_billed) },
              { l: "Balance Due", v: fmt(customer.balance), warn: customer.balance > 0 },
              { l: "Uninvoiced", v: fmt(uninvoiced), warn: uninvoiced > 0 },
              { l: "Jobs", v: `${jobs.filter(j => j.status === "Completed").length}/${jobs.length}` },
            ].map(s => (
              <div key={s.l} style={{ padding: "11px 16px", background: "rgba(255,255,255,0.08)", textAlign: "center" }}>
                <div style={{ fontSize: 10, opacity: 0.65, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5, color: C.white }}>{s.l}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: s.warn ? "#FFD166" : C.white }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#2CA01C", display: "flex", alignItems: "center", padding: "7px 28px", fontSize: 12, color: C.white, gap: 10 }}>
          <span>● QuickBooks · {customer.qb_id}</span>
          <button style={{ marginLeft: "auto", fontSize: 11, padding: "3px 10px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.15)", color: C.white, cursor: "pointer" }}>Open in QB</button>
        </div>
        {msg && <div style={{ margin: "10px 28px 0", padding: "9px 14px", borderRadius: 8, background: C.successBg, color: C.success, fontSize: 13 }}>{msg}</div>}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.ash}`, padding: "0 28px", marginTop: 4 }}>
          {["jobs", "info", "notes"].map(t => <button key={t} style={ts(t)} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
        </div>
        <div style={{ padding: "16px 28px", flex: 1 }}>
          {tab === "jobs" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: C.steelLight }}>{jobs.length} job{jobs.length !== 1 ? "s" : ""}</span>
                {canWrite && <button onClick={() => { setShowNewQuoteForCustomer(customer.id); onQuoteOpen && onQuoteOpen(); }} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.copper}`, background: C.copper, color: C.white, cursor: "pointer", fontWeight: 500 }}>+ New Quote</button>}
              </div>

              {showNewJob && (
                <div style={{ border: `1px solid ${C.ashDark}`, borderRadius: 10, padding: 16, marginBottom: 14, background: C.smoke }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.steel, marginTop: 0, marginBottom: 12 }}>New Job</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    {[{ k: "title", l: "Job Title *", ph: "e.g. Barn Reroof – PBR", sp: 2 }, { k: "amount", l: "Amount ($) *", ph: "0.00", t: "number", sp: 1 }, { k: "job_date", l: "Date", t: "date", sp: 1 }].map(f => (
                      <div key={f.k} style={{ gridColumn: `span ${f.sp}` }}>
                        <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>{f.l}</label>
                        <input value={newJob[f.k]} onChange={e => setNewJob({ ...newJob, [f.k]: e.target.value })} placeholder={f.ph} type={f.t || "text"} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box" }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Status</label>
                      <select value={newJob.status} onChange={e => setNewJob({ ...newJob, status: e.target.value })} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, boxSizing: "border-box" }}>
                        {Object.keys(jobStatusColors).map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Description</label>
                      <textarea value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} rows={2} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.steel }}>Products</span>
                      <button onClick={() => setShowPicker(true)} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.steelMid}`, background: C.steelMid, color: C.white, cursor: "pointer" }}>+ Add Product</button>
                    </div>
                    {pendingProds.length === 0 && <p style={{ fontSize: 12, color: C.steelLight, fontStyle: "italic", margin: 0 }}>No products added.</p>}
                    {pendingProds.map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: C.white, borderRadius: 6, marginBottom: 6, border: `1px solid ${C.ash}` }}>
                        <Swatch hex={p.color_hex} size={18} />
                        <div style={{ flex: 1, fontSize: 12 }}><span style={{ fontWeight: 500, color: C.steel }}>{p.product_name}</span><span style={{ color: C.steelLight }}> · {p.qty} {p.unit} · {p.color_name} ({p.provider})</span></div>
                        <button onClick={() => setPendingProds(pp => pp.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={saveJob} disabled={saving} style={{ padding: "8px 22px", borderRadius: 6, background: C.copper, color: C.white, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{saving ? "Saving…" : "Save Job"}</button>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 20px", gap: 8, padding: "7px 14px", fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.ash}` }}>
                <span>Job</span><span>Status</span><span>Amount</span><span>QB Invoice</span><span></span>
              </div>
              {jobs.map(j => {
                const sc = jobStatusColors[j.status] || jobStatusColors["On Hold"];
                const prods = jobProducts[j.id] || [];
                const isExpanded = expandedJob === j.id;
                return (
                  <div key={j.id} style={{ borderBottom: `1px solid ${C.ash}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 20px", gap: 8, alignItems: "center", padding: "10px 14px", cursor: "pointer", background: isExpanded ? C.smoke : "" }} onClick={() => toggleExpand(j.id)}>
                      <div>
                        <div style={{ fontWeight: 500, color: C.steel, fontSize: 13 }}>{j.title}</div>
                        <div style={{ fontSize: 11, color: C.steelLight, marginTop: 2 }}>{j.job_number} · {j.job_date} · {prods.length} product line{prods.length !== 1 ? "s" : ""}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 12, background: sc.bg, color: sc.text, fontWeight: 500, width: "fit-content" }}>{j.status}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{fmt(j.amount)}</div>
                      <div style={{ fontSize: 11 }}>{j.invoiced ? <span style={{ color: C.success }}>✓ {j.qb_invoice}</span> : <span style={{ color: C.warn }}>Uninvoiced</span>}</div>
                      <span style={{ fontSize: 13, color: C.steelLight, display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "", transition: "transform 0.15s" }}>›</span>
                    </div>
                    {isExpanded && (
                      <div style={{ background: "#F9F7F4", borderTop: `1px solid ${C.ash}`, padding: "12px 14px" }}>
                        {j.description && <p style={{ fontSize: 12, color: C.steelLight, fontStyle: "italic", marginTop: 0, marginBottom: 12 }}>{j.description}</p>}
                        {prods.length > 0 ? (
                          <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${C.ash}` }}>
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1.5fr 1fr", gap: 6, padding: "6px 12px", fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, background: C.smoke }}>
                              <span>Product</span><span>Qty</span><span>Provider</span><span>Color</span><span>Finish</span>
                            </div>
                            {prods.map((p, i) => {
                              const fin = (COLOR_PROVIDERS[p.provider]?.colors || []).find(c => c.id === p.color_id)?.finish || "—";
                              return (
                                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1.5fr 1fr", gap: 6, padding: "8px 12px", fontSize: 12, borderTop: `1px solid ${C.ash}`, alignItems: "center" }}>
                                  <span style={{ fontWeight: 500, color: C.steel }}>{p.product_name}</span>
                                  <span style={{ color: C.steelLight }}>{parseFloat(p.qty).toLocaleString()} {p.unit}</span>
                                  <span style={{ fontSize: 11, color: C.steelLight }}>{p.provider}</span>
                                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Swatch hex={p.color_hex} /><span style={{ color: C.steel }}>{p.color_name}</span></span>
                                  <span style={{ fontSize: 10, color: C.steelLight }}>{fin}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : <p style={{ fontSize: 12, color: C.steelLight, marginTop: 0 }}>No products on this job.</p>}
                        {canWrite && !j.invoiced && <button onClick={() => createInvoice(j)} style={{ marginTop: 10, fontSize: 11, padding: "5px 14px", borderRadius: 6, border: `1px solid ${C.copper}`, background: C.copper, color: C.white, cursor: "pointer", fontWeight: 500 }}>Create QB Invoice</button>}
                        {j.invoiced && <span style={{ marginTop: 10, display: "inline-block", fontSize: 11, padding: "5px 14px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.smoke, color: C.steelLight }}>QB Invoice: {j.qb_invoice}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {tab === "info" && (
            <div style={{ display: "grid", gap: 14 }}>
              {[["Primary Contact", customer.contact], ["Email", customer.email], ["Phone", customer.phone], ["Address", customer.address], ["Customer Type", customer.type], ["QuickBooks ID", customer.qb_id], ["Status", customer.status]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", borderBottom: `1px solid ${C.ash}`, paddingBottom: 12 }}>
                  <div style={{ width: 150, fontSize: 12, color: C.steelLight, flexShrink: 0 }}>{l}</div>
                  <div style={{ fontSize: 13, color: C.steel, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {tab === "notes" && (
            <div>
              <textarea defaultValue={customer.notes} rows={8} readOnly={!canWrite}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.ashDark}`, fontSize: 13, resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }} />
              {canWrite && <button style={{ marginTop: 10, padding: "7px 18px", borderRadius: 6, background: C.steelMid, color: C.white, border: "none", fontSize: 13, cursor: "pointer" }}>Save Notes</button>}
            </div>
          )}
        </div>
      </div>
      {showNewQuoteForCustomer && <QuotingApp preselectedCustomerId={showNewQuoteForCustomer} onQuoteCreated={() => { setShowNewQuoteForCustomer(null); if (onQuoteClose) onQuoteClose(); load(); }} />}
    </div>
  );
}

// ─── NEW CUSTOMER MODAL ───────────────────────────────────────
function AddressAutocomplete({ value, onChange, required }) {
  const inputRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.google && window.google.maps) { initAutocomplete(); return; }
    if (document.getElementById("google-maps-script")) { 
      const interval = setInterval(() => {
        if (window.google && window.google.maps) { clearInterval(interval); initAutocomplete(); }
      }, 200);
      return () => clearInterval(interval);
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAUdOOZArkMQkCSTJ5oTpdt0r8C8U4b2w8&libraries=places`;
    script.async = true;
    script.onload = () => { setLoaded(true); initAutocomplete(); };
    document.head.appendChild(script);
  }, []);

  function initAutocomplete() {
    if (!inputRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"], componentRestrictions: { country: "us" },
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.formatted_address) onChange(place.formatted_address);
    });
  }

  return (
    <div>
      <input ref={inputRef} defaultValue={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Start typing address…"
        style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1.5px solid ${required ? C.danger : C.ashDark}`, fontSize: 13, boxSizing: "border-box", color: C.steel }} />
      {required && <div style={{ fontSize: 11, color: C.danger, marginTop: 3 }}>Required</div>}
    </div>
  );
}
function NewCustomerModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", contact: "", email: "", phone: "", address: "", type: "Contractor/Builder", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!form.name || !form.phone || !form.email || !form.address || !form.type) return;
    setSaving(true);
    const { error } = await supabase.from("customers").insert({ ...form, qb_id: "QB-" + Math.floor(Math.random() * 9000 + 1000) });
    setSaving(false);
    if (error) { setError(error.message); }
    else { onSaved(); onClose(); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 520, background: C.white, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ background: C.steel, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 16, fontWeight: 700 }}>New Customer</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.ash, fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[{ k: "name", l: "Company / Name *", ph: "ABC Builders or Jane Smith", sp: 2 }, { k: "contact", l: "Primary Contact", ph: "Jane Smith", sp: 1 }, { k: "phone", l: "Phone *", ph: "(307) 555-0000", sp: 1 }, { k: "email", l: "Email *", ph: "jane@example.com", sp: 2 }, { k: "address", l: "Address *", ph: "123 Main St, Cheyenne WY", sp: 2 }].map(f => (
              <div key={f.k} style={{ gridColumn: `span ${f.sp}` }}>
                <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>{f.l}</label>
                {f.k === "address"
                  ? <AddressAutocomplete value={form.address} onChange={val => setForm({ ...form, address: val })} required={!form.address} />
                  : <input value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.ph}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1.5px solid ${(f.k === "phone" || f.k === "email") && !form[f.k] ? C.danger : C.ashDark}`, fontSize: 13, boxSizing: "border-box", color: C.steel }} />
                }
                {(f.k === "phone" || f.k === "email") && !form[f.k] && <div style={{ fontSize: 11, color: C.danger, marginTop: 3 }}>Required</div>}
              </div>
            ))}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6 }}>Customer Type</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CUSTOMER_TYPES.map(t => { const tc = typeColors[t]; return <button key={t} onClick={() => setForm({ ...form, type: t })} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${form.type === t ? tc.border : C.ashDark}`, background: form.type === t ? tc.bg : C.white, color: form.type === t ? tc.text : C.steelLight, fontSize: 12, fontWeight: form.type === t ? 600 : 400, cursor: "pointer" }}>{t}</button>; })}
              </div>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 4 }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13, resize: "vertical", boxSizing: "border-box" }} />
            </div>
          </div>
{(!form.phone || !form.email || !form.address || !form.type) && form.name && <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, background: C.warnBg, color: C.warn, fontSize: 12 }}>Please fill in all required fields (*) before saving.</div>}          
{error && <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, background: C.dangerBg, color: C.danger, fontSize: 12 }}>{error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelLight, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "8px 22px", borderRadius: 6, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{saving ? "Saving…" : "Create Customer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CRM APP ─────────────────────────────────────────────
function CRMApp() {
  const { profile, signOut, canWrite, isAdmin } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showNew, setShowNew] = useState(false);
  const [customerQuoteOpen, setCustomerQuoteOpen] = useState(false);
  const [view, setView] = useState("customers");
  const [allJobs, setAllJobs] = useState([]);

  useEffect(() => { loadCustomers(); }, []);
  useEffect(() => { if (view === "jobs") loadAllJobs(); }, [view]);

  async function loadCustomers() {
    setLoading(true);
    const { data } = await supabase.from("customers").select("*").order("name");
    setCustomers(data || []);
    setLoading(false);
  }

  async function loadAllJobs() {
    const { data } = await supabase.from("jobs").select("*, customers(name)").order("job_date", { ascending: false });
    setAllJobs(data || []);
  }

  const filtered = useMemo(() => customers.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
      && (filterType === "All" || c.type === filterType)
      && (filterStatus === "All" || c.status === filterStatus);
  }), [customers, search, filterType, filterStatus]);

  const stats = useMemo(() => ({
    totalRevenue: customers.reduce((a, c) => a + parseFloat(c.total_billed || 0), 0),
    totalBalance: customers.reduce((a, c) => a + parseFloat(c.balance || 0), 0),
    overdueCount: customers.filter(c => c.status === "Overdue").length,
  }), [customers]);

  const rc = roleColors[profile?.role] || roleColors["readonly"];

  return (
    <div style={{ minHeight: "100vh", background: C.smoke, fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ background: C.steel, display: "flex", alignItems: "center", padding: "0 24px", height: 56, flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 32 }}>
          <div style={{ width: 32, height: 32, background: C.copper, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: C.white }}>⚙</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Georgia', serif", lineHeight: 1.1, color: C.white }}>High Plains Custom Metal</div>
            <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 0.5, textTransform: "uppercase", color: C.white }}>CRM & Order Management</div>
          </div>
        </div>
        {["customers", "jobs", "products", "quotes", "quickbooks", "calendar", ...(isAdmin ? ["users"] : [])].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ background: "none", border: "none", color: view === v ? C.copperLight : "rgba(255,255,255,0.55)", fontSize: 13, padding: "18px 13px", cursor: "pointer", fontWeight: view === v ? 600 : 400, borderBottom: `2px solid ${view === v ? C.copper : "transparent"}`, fontFamily: "inherit" }}>
            {v[0].toUpperCase() + v.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: C.white, fontWeight: 500 }}>{profile?.full_name || "User"}</div>
            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: rc.bg, color: rc.text, fontWeight: 600 }}>{profile?.role}</span>
          </div>
          <button onClick={signOut} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer" }}>Sign Out</button>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 1200, width: "100%", margin: "0 auto", padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Revenue", val: fmt(stats.totalRevenue), color: C.steel },
            { label: "Receivables", val: fmt(stats.totalBalance), color: stats.totalBalance > 0 ? C.warn : C.success },
            { label: "Customers", val: customers.length, color: C.steel },
            { label: "Overdue Accts", val: stats.overdueCount, color: stats.overdueCount > 0 ? C.danger : C.success },
          ].map(s => (
            <div key={s.label} style={{ background: C.white, borderRadius: 10, padding: "12px 16px", border: `1px solid ${C.ash}` }}>
              <div style={{ fontSize: 11, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontSize: 21, fontWeight: 700, color: s.color, fontFamily: "'Georgia', serif" }}>{s.val}</div>
            </div>
          ))}
        </div>

        {view === "customers" && (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…" style={{ flex: 1, padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.ashDark}`, fontSize: 13, background: C.white }}>
                <option>All</option>{CUSTOMER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.ashDark}`, fontSize: 13, background: C.white }}>
                <option>All</option><option>Active</option><option>Overdue</option><option>Inactive</option>
              </select>
              {canWrite && <button onClick={() => setShowNew(true)} style={{ padding: "8px 16px", borderRadius: 8, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>+ New Customer</button>}
            </div>
            <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.ash}`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1fr 1fr 1fr auto", gap: 8, padding: "9px 20px", background: C.smoke, borderBottom: `1px solid ${C.ash}`, fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5 }}>
                <span>Customer</span><span>Contact</span><span>Type</span><span>Billed</span><span>Balance</span><span>Status</span><span></span>
              </div>
              {loading && <div style={{ padding: 40, display: "flex", justifyContent: "center" }}><Spinner /></div>}
              {!loading && filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: C.steelLight }}>No customers match your search.</div>}
              {!loading && filtered.map((c, i) => {
                const sc = statusColors[c.status] || statusColors["Inactive"];
                const tc = typeColors[c.type] || typeColors["Commercial"];
                return (
                  <div key={c.id} onClick={() => setSelectedId(c.id)}
                    style={{ display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center", padding: "12px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.ash}` : "none", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.smoke}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                      <Avatar name={c.name} size={32} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: C.steel }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: C.steelLight }}>{c.qb_id}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: C.steelLight }}>{c.contact}</div>
                    <Badge label={c.type} colors={tc} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{fmt(c.total_billed)}</div>
                    <div style={{ fontSize: 13, fontWeight: c.balance > 0 ? 700 : 400, color: c.balance > 0 ? C.danger : C.steelLight }}>{c.balance > 0 ? fmt(c.balance) : "–"}</div>
                    <Badge label={c.status} colors={sc} />
                    <span style={{ fontSize: 16, color: C.ashDark }}>›</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === "jobs" && (
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.ash}`, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.ash}`, display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.steel, fontFamily: "'Georgia', serif" }}>All Jobs</div>
              <span style={{ fontSize: 12, color: C.steelLight }}>{allJobs.length} total</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto", gap: 8, padding: "8px 20px", background: C.smoke, borderBottom: `1px solid ${C.ash}`, fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <span>Job</span><span>Customer</span><span>Status</span><span>Amount</span><span>QB Invoice</span><span></span>
            </div>
            {allJobs.map((j, i) => {
              const sc = jobStatusColors[j.status] || jobStatusColors["On Hold"];
              return (
                <div key={j.id} onClick={() => setSelectedId(j.customer_id)}
                  style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center", padding: "11px 20px", borderBottom: i < allJobs.length - 1 ? `1px solid ${C.ash}` : "none", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.smoke}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13, color: C.steel }}>{j.title}</div>
                    <div style={{ fontSize: 11, color: C.steelLight }}>{j.job_number} · {j.job_date}</div>
                  </div>
                  <div style={{ fontSize: 12, color: C.steelMid }}>{j.customers?.name}</div>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 12, background: sc.bg, color: sc.text, fontWeight: 500, width: "fit-content" }}>{j.status}</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.steel }}>{fmt(j.amount)}</div>
                  <div style={{ fontSize: 12, color: j.invoiced ? C.success : C.warn }}>{j.invoiced ? j.qb_invoice : "Uninvoiced"}</div>
                  <span style={{ fontSize: 16, color: C.ashDark }}>›</span>
                </div>
              );
            })}
          </div>
        )}

        {view === "products" && (
          <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.ash}`, padding: 28, textAlign: "center", color: C.steelLight }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>▰▬▭◿▏</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.steel, marginBottom: 6 }}>Product Catalog</div>
            <p style={{ fontSize: 13, maxWidth: 400, margin: "0 auto" }}>All 8 product lines with color palettes from MBCI, Sherwin-Williams, Valspar, and AEP Span are available when adding products to a job. Open any customer → job → "Add Product" to browse the full catalog and color picker.</p>
          </div>
        )}

        {view === "quickbooks" && (
          <div>
            <div style={{ background: "#2CA01C", borderRadius: 12, padding: "18px 24px", color: C.white, marginBottom: 18, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 30 }}>✓</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Georgia', serif" }}>QuickBooks Online</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{customers.length} customers · wire up via QuickBooks Online API (OAuth 2.0)</div>
              </div>
              <button style={{ marginLeft: "auto", padding: "7px 18px", borderRadius: 8, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: C.white, fontSize: 13, cursor: "pointer" }}>Configure QB</button>
            </div>
            <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.ash}`, overflow: "hidden" }}>
              <div style={{ padding: "13px 20px", borderBottom: `1px solid ${C.ash}`, fontSize: 14, fontWeight: 600, color: C.steel, fontFamily: "'Georgia', serif" }}>Customer QB Links</div>
              {customers.map((c, i) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", padding: "10px 20px", borderBottom: i < customers.length - 1 ? `1px solid ${C.ash}` : "none", gap: 12 }}>
                  <Avatar name={c.name} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.steel }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: C.steelLight }}>QB ID: {c.qb_id} · {c.type}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: c.qb_id ? "#D8F3DC" : C.dangerBg, color: c.qb_id ? "#2D6A4F" : C.danger, fontWeight: 500 }}>{c.qb_id ? "Linked" : "Unlinked"}</span>
                  <button style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, color: C.steelMid, cursor: "pointer" }}>Open in QB</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "users" && isAdmin && <UserManagement />}
	{view === "quotes" && !customerQuoteOpen && <QuotingApp />}
	{view === "calendar" && <ProductionCalendar />}
      </div>

      {selectedId && <CustomerDetail customerId={selectedId} onClose={() => { setSelectedId(null); setCustomerQuoteOpen(false); }} onUpdated={loadCustomers} onQuoteOpen={() => setCustomerQuoteOpen(true)} onQuoteClose={() => setCustomerQuoteOpen(false)} />}
{view === "quotes" && selectedId && <QuotingApp preselectedCustomerId={selectedId} />}
      {showNew && <NewCustomerModal onClose={() => setShowNew(false)} onSaved={loadCustomers} />}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────
function Root() {
  const { session, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.steel, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Spinner />
    </div>
  );
  return session ? <CRMApp /> : <LoginPage />;
}

export default function App() {
  return <AuthProvider><Root /></AuthProvider>;
}
