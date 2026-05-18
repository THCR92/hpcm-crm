// ============================================================
// HIGH PLAINS CUSTOM METAL — Production Calendar
// Phase 2: Job Due Date / Production Date views, drag & drop,
// capacity tracking (60,000 SF/day), customer info popups
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL  = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON = "YOUR_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const C = {
  steel: "#1C2B3A", steelMid: "#2E4057", steelLight: "#4A6580",
  copper: "#B87333", copperLight: "#D4943F",
  ash: "#E8E4DC", ashDark: "#C9C4BA", smoke: "#F4F2EE", white: "#FFFFFF",
  success: "#2D6A4F", successBg: "#D8F3DC",
  warn: "#9C6000", warnBg: "#FFF3CD",
  danger: "#842029", dangerBg: "#F8D7DA",
  info: "#0A4275", infoBg: "#CFE2FF",
};

const MAX_DAILY_SF = 60000;

const STATUS_COLORS = {
  "Draft":          { bg: "#E8E4DC", text: "#5F5E5A", border: "#C9C4BA" },
  "Sent":           { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  "Approved":       { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  "In Production":  { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  "Complete":       { bg: "#D8F3DC", text: "#2D6A4F", border: "#95D5A4" },
  "Declined":       { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
};

const CATEGORY_COLORS = {
  "Standing Seam":  { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  "PBR":            { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  "Tuf-Rib":        { bg: "#F0FDF4", text: "#166534", dot: "#22C55E" },
  "B&B":            { bg: "#FDF4FF", text: "#7E22CE", dot: "#A855F7" },
  "Trapezoidal":    { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
};

const PANEL_TYPES = {
  "ss-snaplock": { label: "SS Snap Lock", category: "Standing Seam" },
  "ss-mechseam": { label: "SS Mech Seam", category: "Standing Seam" },
  "ss-nailfin":  { label: "SS Nail Fin",  category: "Standing Seam" },
  "pbr-roof":    { label: "PBR Roof",     category: "PBR" },
  "pbr-wall":    { label: "PBR Wall",     category: "PBR" },
  "tufrib-roof": { label: "Tuf-Rib Roof", category: "Tuf-Rib" },
  "tufrib-wall": { label: "Tuf-Rib Wall", category: "Tuf-Rib" },
  "bb-6":        { label: "B&B 6\"",      category: "B&B" },
  "bb-8":        { label: "B&B 8\"",      category: "B&B" },
  "bb-12":       { label: "B&B 12\"",     category: "B&B" },
  "trap-45":     { label: "Trap 45mm",    category: "Trapezoidal" },
  "trap-75":     { label: "Trap 75mm",    category: "Trapezoidal" },
};

function fmt(n) { return "$" + (n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmtSF(n) { return (n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 }) + " SF"; }

function Spinner() {
  return <div style={{ width: 22, height: 22, border: `2px solid ${C.ash}`, borderTopColor: C.copper, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

// Build a 5-week grid starting from the Sunday before the given month
function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startSunday = new Date(firstDay);
  startSunday.setDate(firstDay.getDate() - firstDay.getDay());
  const days = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(startSunday);
    d.setDate(startSunday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isWeekend(d) { return d.getDay() === 0 || d.getDay() === 6; }
function isToday(d) { return isoDate(d) === isoDate(new Date()); }

// ─── CAPACITY BAR ─────────────────────────────────────────────
function CapacityBar({ used, max = MAX_DAILY_SF }) {
  const pct = Math.min((used / max) * 100, 100);
  const color = pct >= 100 ? C.danger : pct >= 80 ? C.warn : C.success;
  return (
    <div style={{ width: "100%", height: 4, background: C.ash, borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s" }} />
    </div>
  );
}

// ─── JOB CARD (on calendar) ──────────────────────────────────
function JobCard({ job, onDragStart, onClick, compact = false }) {
  const pt = PANEL_TYPES[job.panel_type_id] || { label: job.panel_type_id, category: "Standing Seam" };
  const catColor = CATEGORY_COLORS[pt.category] || CATEGORY_COLORS["Standing Seam"];
  const stColor = STATUS_COLORS[job.status] || STATUS_COLORS["Draft"];

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, job)}
      onClick={e => { e.stopPropagation(); onClick(job); }}
      style={{
        background: catColor.bg, border: `1px solid ${catColor.dot}40`,
        borderLeft: `3px solid ${catColor.dot}`, borderRadius: 5,
        padding: compact ? "3px 6px" : "5px 8px", marginBottom: 3,
        cursor: "grab", fontSize: 11, lineHeight: 1.4,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        transition: "transform 0.1s, box-shadow 0.1s",
        userSelect: "none",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = "0 3px 8px rgba(0,0,0,0.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)"; }}
    >
      <div style={{ fontWeight: 700, color: catColor.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {job.customers?.name || "Unknown"}
      </div>
      {!compact && (
        <>
          <div style={{ color: catColor.text, opacity: 0.8 }}>{pt.label}</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
            <span style={{ color: catColor.text, opacity: 0.7 }}>{fmtSF(job.total_sf_with_waste)}</span>
            <span style={{ padding: "1px 5px", borderRadius: 8, background: stColor.bg, color: stColor.text, fontSize: 9, fontWeight: 600 }}>{job.status}</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── JOB DETAIL POPUP ────────────────────────────────────────
function JobDetailPopup({ job, onClose, onReschedule, viewMode }) {
  const pt = PANEL_TYPES[job.panel_type_id] || { label: job.panel_type_id, category: "Standing Seam" };
  const catColor = CATEGORY_COLORS[pt.category] || CATEGORY_COLORS["Standing Seam"];
  const [reschedDate, setReschedDate] = useState(
    viewMode === "due" ? job.due_date : (job.production_date || job.due_date || "")
  );
  const [saving, setSaving] = useState(false);

  async function handleReschedule() {
    if (!reschedDate) return;
    setSaving(true);
    const field = viewMode === "due" ? "due_date" : "production_date";
    await supabase.from("quotes").update({ [field]: reschedDate }).eq("id", job.id);
    setSaving(false);
    onReschedule();
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,43,58,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 400, background: C.white, borderRadius: 14, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.25)" }}>
        <div style={{ background: catColor.bg, borderBottom: `2px solid ${catColor.dot}50`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: catColor.text, fontFamily: "'Georgia', serif" }}>{job.customers?.name}</div>
            <div style={{ fontSize: 12, color: catColor.text, opacity: 0.8, marginTop: 2 }}>{job.quote_number} · {pt.label}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: catColor.text, opacity: 0.6 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              ["Contact", job.customers?.contact],
              ["Email", job.customers?.email],
              ["Phone", job.customers?.phone],
              ["Total SF", fmtSF(job.total_sf_with_waste)],
              ["Quote Total", fmt(job.total_price)],
              ["Status", job.status],
              ["Due Date", job.due_date || "—"],
              ["Prod. Date", job.production_date || "Not set"],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.steel }}>{v}</div>
              </div>
            ))}
          </div>
          {job.panel_color && (
            <div style={{ padding: "8px 12px", background: C.smoke, borderRadius: 8, fontSize: 12, color: C.steelLight, marginBottom: 14 }}>
              Color: <strong style={{ color: C.steel }}>{job.panel_color}</strong>
              {job.gauge && <> · Gauge: <strong style={{ color: C.steel }}>{job.gauge}ga</strong></>}
              {job.striation && <> · {job.striation}</>}
            </div>
          )}
          <div style={{ borderTop: `1px solid ${C.ash}`, paddingTop: 14 }}>
            <label style={{ fontSize: 11, color: C.steelLight, display: "block", marginBottom: 6, fontWeight: 500 }}>
              Reschedule {viewMode === "due" ? "Due Date" : "Production Date"}
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="date" value={reschedDate} onChange={e => setReschedDate(e.target.value)}
                style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.ashDark}`, fontSize: 13 }} />
              <button onClick={handleReschedule} disabled={saving || !reschedDate}
                style={{ padding: "7px 16px", borderRadius: 6, background: C.copper, color: C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CALENDAR ────────────────────────────────────────────
export default function ProductionCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState("due"); // "due" | "production"
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [dragJob, setDragJob] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  const days = buildCalendarGrid(viewYear, viewMonth);

  useEffect(() => { loadJobs(); }, []);

  async function loadJobs() {
    setLoading(true);
    const { data } = await supabase
      .from("quotes")
      .select("*, customers(name, contact, email, phone)")
      .not("status", "eq", "Declined")
      .not("status", "eq", "Draft");
    setJobs(data || []);
    setLoading(false);
  }

  // Build date → jobs map
  const dateJobMap = {};
  jobs.forEach(job => {
    const dateKey = viewMode === "due" ? job.due_date : (job.production_date || job.due_date);
    if (!dateKey) return;
    const pt = PANEL_TYPES[job.panel_type_id] || {};
    const cat = pt.category || "Standing Seam";
    if (filterStatus !== "All" && job.status !== filterStatus) return;
    if (filterCategory !== "All" && cat !== filterCategory) return;
    if (!dateJobMap[dateKey]) dateJobMap[dateKey] = [];
    dateJobMap[dateKey].push(job);
  });

  // SF per day
  const dateSFMap = {};
  jobs.forEach(job => {
    const dateKey = viewMode === "due" ? job.due_date : (job.production_date || job.due_date);
    if (!dateKey) return;
    if (!dateSFMap[dateKey]) dateSFMap[dateKey] = 0;
    dateSFMap[dateKey] += parseFloat(job.total_sf_with_waste || 0);
  });

  // Drag handlers
  function handleDragStart(e, job) {
    setDragJob(job);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, dateStr) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate(dateStr);
  }

  function handleDragLeave() { setDragOverDate(null); }

  async function handleDrop(e, dateStr) {
    e.preventDefault();
    if (!dragJob) return;
    const field = viewMode === "due" ? "due_date" : "production_date";
    await supabase.from("quotes").update({ [field]: dateStr }).eq("id", dragJob.id);
    setDragJob(null);
    setDragOverDate(null);
    loadJobs();
  }

  function navMonth(dir) {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m); setViewYear(y);
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  // Unscheduled jobs (no date in current view mode)
  const unscheduled = jobs.filter(job => {
    const dateKey = viewMode === "due" ? job.due_date : job.production_date;
    return !dateKey;
  });

  // Stats for current month view
  const visibleDates = days.map(isoDate);
  const monthJobs = jobs.filter(job => {
    const dk = viewMode === "due" ? job.due_date : (job.production_date || job.due_date);
    return dk && visibleDates.includes(dk);
  });
  const monthSF = monthJobs.reduce((a, j) => a + parseFloat(j.total_sf_with_waste || 0), 0);
  const monthRevenue = monthJobs.reduce((a, j) => a + parseFloat(j.total_price || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: C.smoke, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      {/* Nav */}
      <div style={{ background: C.steel, display: "flex", alignItems: "center", padding: "0 24px", height: 56, flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 32 }}>
          <div style={{ width: 32, height: 32, background: C.copper, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: C.white }}>⚙</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Georgia', serif", lineHeight: 1.1, color: C.white }}>High Plains Custom Metal</div>
            <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 0.5, textTransform: "uppercase", color: C.white }}>Production Calendar</div>
          </div>
        </div>

        {/* View mode toggle */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: 3, gap: 2, marginRight: 20 }}>
          {[["due", "Job Due Date"], ["production", "Production Date"]].map(([k, l]) => (
            <button key={k} onClick={() => setViewMode(k)}
              style={{ padding: "5px 14px", borderRadius: 6, background: viewMode === k ? C.copper : "transparent", color: C.white, border: "none", fontSize: 12, fontWeight: viewMode === k ? 700 : 400, cursor: "pointer" }}>{l}</button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.12)", color: C.white, fontSize: 12, cursor: "pointer" }}>
            <option value="All">All Statuses</option>
            {["Sent", "Approved", "In Production", "Complete"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.12)", color: C.white, fontSize: 12, cursor: "pointer" }}>
            <option value="All">All Products</option>
            {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {loading && <Spinner />}
          <button onClick={loadJobs} style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer" }}>↻ Refresh</button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px" }}>

        {/* Month stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Jobs This View", val: monthJobs.length },
            { label: "Total SF This Month", val: fmtSF(monthSF) },
            { label: "Est. Revenue", val: fmt(monthRevenue) },
            { label: "Unscheduled", val: unscheduled.length, warn: unscheduled.length > 0 },
          ].map(s => (
            <div key={s.label} style={{ background: C.white, borderRadius: 10, padding: "12px 16px", border: `1px solid ${C.ash}` }}>
              <div style={{ fontSize: 11, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.warn ? C.danger : C.steel, fontFamily: "'Georgia', serif" }}>{s.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 20 }}>

          {/* Calendar */}
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.ash}`, overflow: "hidden" }}>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${C.ash}` }}>
              <button onClick={() => navMonth(-1)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.ashDark}`, background: C.white, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.steel, fontFamily: "'Georgia', serif" }}>{monthName}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.ashDark}`, background: C.white, fontSize: 12, cursor: "pointer", color: C.steelLight }}>Today</button>
                <button onClick={() => navMonth(1)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.ashDark}`, background: C.white, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
              </div>
            </div>

            {/* Day-of-week headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${C.ash}` }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} style={{ padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: C.steelLight, textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", minHeight: 600 }}>
              {days.map((day, idx) => {
                const dateStr = isoDate(day);
                const inMonth = day.getMonth() === viewMonth;
                const dayJobs = dateJobMap[dateStr] || [];
                const daySF = dateSFMap[dateStr] || 0;
                const isOver = dragOverDate === dateStr;
                const overCapacity = daySF >= MAX_DAILY_SF;
                const nearCapacity = daySF >= MAX_DAILY_SF * 0.8 && daySF < MAX_DAILY_SF;
                const weekend = isWeekend(day);
                const todayFlag = isToday(day);

                return (
                  <div key={dateStr}
                    onDragOver={e => handleDragOver(e, dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, dateStr)}
                    style={{
                      minHeight: 120, padding: "6px 6px 6px",
                      borderRight: (idx + 1) % 7 !== 0 ? `1px solid ${C.ash}` : "none",
                      borderBottom: idx < 28 ? `1px solid ${C.ash}` : "none",
                      background: isOver ? "#FFF3E0" : overCapacity ? "#FFF5F5" : nearCapacity ? "#FFFDF0" : weekend ? "#FAFAFA" : C.white,
                      transition: "background 0.15s",
                      opacity: inMonth ? 1 : 0.4,
                    }}>
                    {/* Date number */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: todayFlag ? C.copper : "transparent",
                        color: todayFlag ? C.white : inMonth ? C.steel : C.ashDark,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: todayFlag ? 700 : 500,
                      }}>{day.getDate()}</div>
                      {daySF > 0 && (
                        <div style={{ fontSize: 9, color: overCapacity ? C.danger : nearCapacity ? C.warn : C.steelLight, fontWeight: overCapacity ? 700 : 400, textAlign: "right", lineHeight: 1.2 }}>
                          {(daySF / 1000).toFixed(0)}k SF
                          {overCapacity && <div style={{ color: C.danger }}>OVER CAP</div>}
                        </div>
                      )}
                    </div>

                    {/* Capacity bar */}
                    {daySF > 0 && <CapacityBar used={daySF} />}

                    {/* Job cards */}
                    <div style={{ marginTop: 4 }}>
                      {dayJobs.slice(0, 3).map(job => (
                        <JobCard key={job.id} job={job} onDragStart={handleDragStart} onClick={setSelectedJob} compact={dayJobs.length > 2} />
                      ))}
                      {dayJobs.length > 3 && (
                        <div style={{ fontSize: 10, color: C.steelLight, textAlign: "center", paddingTop: 2, cursor: "pointer" }}>
                          +{dayJobs.length - 3} more
                        </div>
                      )}
                    </div>

                    {/* Drop target indicator */}
                    {isOver && dragJob && (
                      <div style={{ border: `2px dashed ${C.copper}`, borderRadius: 6, padding: "4px", marginTop: 4, textAlign: "center", fontSize: 10, color: C.copper }}>Drop here</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Legend */}
            <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.ash}`, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, marginBottom: 10 }}>Product Categories</div>
              {Object.entries(CATEGORY_COLORS).map(([cat, col]) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: col.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: C.steelLight }}>{cat}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${C.ash}`, marginTop: 10, paddingTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, marginBottom: 8 }}>Capacity</div>
                {[
                  { color: C.success, label: "< 80% capacity" },
                  { color: C.warn, label: "80–99% capacity" },
                  { color: C.danger, label: "At/over 60,000 SF" },
                ].map(i => (
                  <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 12, height: 4, borderRadius: 2, background: i.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: C.steelLight }}>{i.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Unscheduled jobs */}
            {unscheduled.length > 0 && (
              <div style={{ background: C.white, borderRadius: 12, border: `1.5px solid ${C.copper}40`, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, marginBottom: 10 }}>
                  Unscheduled ({unscheduled.length})
                  <div style={{ fontSize: 10, color: C.steelLight, fontWeight: 400, marginTop: 2 }}>Drag to calendar to schedule</div>
                </div>
                {unscheduled.map(job => {
                  const pt = PANEL_TYPES[job.panel_type_id] || { label: job.panel_type_id, category: "Standing Seam" };
                  const col = CATEGORY_COLORS[pt.category] || CATEGORY_COLORS["Standing Seam"];
                  return (
                    <div key={job.id}
                      draggable
                      onDragStart={e => handleDragStart(e, job)}
                      onClick={() => setSelectedJob(job)}
                      style={{ border: `1px solid ${col.dot}40`, borderLeft: `3px solid ${col.dot}`, borderRadius: 6, padding: "8px 10px", marginBottom: 8, cursor: "grab", background: col.bg }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: col.text }}>{job.customers?.name}</div>
                      <div style={{ fontSize: 11, color: col.text, opacity: 0.8 }}>{pt.label} · {fmtSF(job.total_sf_with_waste)}</div>
                      <div style={{ fontSize: 11, color: col.text, opacity: 0.7 }}>{fmt(job.total_price)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Status breakdown */}
            <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.ash}`, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.steel, marginBottom: 10 }}>Status Breakdown</div>
              {Object.keys(STATUS_COLORS).filter(s => s !== "Draft" && s !== "Declined").map(status => {
                const count = jobs.filter(j => j.status === status).length;
                if (count === 0) return null;
                const sc = STATUS_COLORS[status];
                return (
                  <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, background: sc.bg, color: sc.text, fontWeight: 500 }}>{status}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.steel }}>{count}</span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* Job detail popup */}
      {selectedJob && (
        <JobDetailPopup job={selectedJob} onClose={() => setSelectedJob(null)} onReschedule={loadJobs} viewMode={viewMode} />
      )}
    </div>
  );
}
