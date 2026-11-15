import { useState, useMemo } from "react";

const EMPLOYEES = [
  { id: "yusuf", name: "Yusuf", role: "Staf Operasional", rate: 50000, bonus: 100000 },
  { id: "bili",  name: "Bili",  role: "Spesialis / Senior", rate: 100000, bonus: 100000, specialRule: true },
  { id: "nana",  name: "Nana",  role: "Staf Operasional", rate: 65000, bonus: 100000 },
  { id: "haha",  name: "Haha",  role: "Staf Operasional", rate: 65000, bonus: 100000 },
  { id: "jaha",  name: "Jaha",  role: "Staf Operasional", rate: 65000, bonus: 100000 },
];

function getBonusPct(absentCount) {
  if (absentCount <= 4) return 100;
  if (absentCount === 5) return 75;
  if (absentCount === 6) return 50;
  if (absentCount === 7) return 25;
  return 0;
}

function fmt(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const SHEET_URL = "https://script.google.com/macros/s/AKfycbzDv34j3nY8-c9jk376xJQAO1F9qqT-UHOJwpNm_7oPJyQHOGnRx69OrhVmfevxO9sWMg/exec";

// ── Clean Blue & White Professional Theme ──────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-main: #f0f4f8;
    --bg-card: #ffffff;
    --primary: #2563eb;
    --primary-light: #dbeafe;
    --primary-dark: #1e40af;

    --text-main: #1e293b;
    --text-muted: #64748b;
    --text-light: #94a3b8;

    --accent-emerald: #10b981;
    --accent-rose: #ef4444;
    --accent-amber: #f59e0b;

    --border-color: #cbd5e1; /* Sedikit lebih gelap dari dbeafe */
    --border-focus: #3b82f6;

    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;

    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

    --font-sans: 'Plus Jakarta Sans', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  body {
    background-color: var(--bg-main);
    color: var(--text-main);
    font-family: var(--font-sans);
    min-height: 100vh;
    line-height: 1.6;
  }

  .app-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 40px 20px;
  }

  /* Header */
  .header {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    box-shadow: var(--shadow-sm);
  }

  .brand-badge {
    color: var(--primary);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
    display: block;
  }
  .brand-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-main);
    letter-spacing: -0.02em;
  }

  /* Controls */
  .controls-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    gap: 16px;
    flex-wrap: wrap;
  }

  .tabs-wrapper {
    background: #e2e8f0;
    padding: 4px;
    border-radius: var(--radius-md);
    display: flex;
    gap: 2px;
  }
  .tab-btn {
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
    border-radius: calc(var(--radius-md) - 4px);
  }
  .tab-btn.active {
    background: var(--bg-card);
    color: var(--primary);
    box-shadow: var(--shadow-sm);
  }

  .period-selector {
    display: flex;
    gap: 8px;
    align-items: center;
    background: var(--bg-card);
    padding: 6px 12px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
  }
  .select-box {
    border: 1px solid var(--border-color);
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: 600;
    outline: none;
    color: var(--text-main);
  }
  .select-box:focus {
    border-color: var(--primary);
  }

  /* Employee Card */
  .emp-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    margin-bottom: 20px;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .emp-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
  }
  .emp-profile {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .emp-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
  .emp-name {
    font-weight: 700;
    font-size: 18px;
    color: var(--text-main);
  }
  .emp-role {
    font-size: 12px;
    color: var(--text-muted);
  }

  .emp-body {
    padding: 24px;
  }

  /* Calendar Grid */
  .days-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
    gap: 6px;
    margin-bottom: 24px;
  }
  .day-btn {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    font-family: var(--font-mono);
  }
  .day-btn:hover:not(.holiday) {
    background: var(--primary-light);
    border-color: var(--primary);
  }
  .day-btn.present {
    background: #ecfdf5;
    border-color: #10b981;
    color: #059669;
  }
  .day-btn.absent {
    background: #fef2f2;
    border-color: #ef4444;
    color: #dc2626;
  }
  .day-btn.holiday {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #94a3b8;
    cursor: not-allowed;
  }
  .day-num { font-size: 14px; font-weight: 600; }
  .day-status { font-size: 8px; font-weight: 700; margin-top: 2px; }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  .stat-card {
    background: #f8fafc;
    border: 1px solid var(--border-color);
    padding: 16px;
    border-radius: var(--radius-md);
  }
  .stat-card.total {
    background: var(--primary);
    border-color: var(--primary-dark);
    grid-column: span 2;
  }
  .stat-card.total .stat-label { color: rgba(255, 255, 255, 0.8); }
  .stat-card.total .stat-value { color: white; font-size: 20px; }

  .stat-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 4px;
    display: block;
  }
  .stat-value {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-main);
  }

  /* Table */
  .rekap-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .rekap-table {
    width: 100%;
    border-collapse: collapse;
  }
  .rekap-table th {
    background: #f8fafc;
    padding: 14px 20px;
    text-align: left;
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    border-bottom: 1px solid var(--border-color);
  }
  .rekap-table td {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    font-size: 14px;
  }
  .rekap-table .total-row td {
    background: #f1f5f9;
    font-weight: 800;
    color: var(--primary-dark);
  }

  /* Buttons */
  .btn {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 700;
    border-radius: var(--radius-sm);
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-primary {
    background: var(--primary);
    color: white;
  }
  .btn-primary:hover {
    background: var(--primary-dark);
  }
  .btn-secondary {
    background: white;
    border-color: var(--border-color);
    color: var(--text-main);
  }
  .btn-secondary:hover {
    background: #f8fafc;
  }
  .btn-danger {
    background: #fee2e2;
    color: #dc2626;
    border-color: #fecaca;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }
  .modal-content {
    background: white;
    border-radius: var(--radius-xl);
    max-width: 450px;
    width: 100%;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  .modal-header {
    padding: 24px;
    background: var(--primary);
    color: white;
  }
  .modal-body {
    padding: 24px;
  }
  .slip-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #f1f5f9;
    font-size: 14px;
  }
  .slip-total {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 2px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade { animation: fadeIn 0.3s ease-out both; }

  @media print {
    .modal-overlay { position: static; background: none; backdrop-filter: none; padding: 0; }
    .modal-content { border: 1px solid #000; box-shadow: none; }
    .header, .controls-bar, .emp-card, .rekap-card, .modal-footer { display: none !important; }
  }
`;

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch { /* ignore */ }
  };
  return [storedValue, setValue];
}

export default function App() {
  const now = new Date();
  const [tab, setTab] = useState("absensi");
  const [month, setMonth] = useLocalStorage("payroll_month", now.getMonth());
  const [year, setYear] = useLocalStorage("payroll_year", now.getFullYear());
  const [slipTarget, setSlipTarget] = useState(null);

  const [attendance, setAttendance] = useLocalStorage("payroll_attendance", {});
  const [holidays, setHolidays] = useLocalStorage("payroll_holidays", {});
  const [holidayInput, setHolidayInput] = useLocalStorage("payroll_holidayinput", {});

  const daysInMonth = getDaysInMonth(year, month);
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function getHolidaysForEmp(empId) {
    return (holidays[empId] || []);
  }

  function getAttendance(empId, day) {
    return attendance[empId]?.[day] || null;
  }

  function toggleDay(empId, day) {
    const hols = getHolidaysForEmp(empId);
    if (hols.includes(day)) return;
    const cur = getAttendance(empId, day);
    const next = cur === "present" ? "absent" : "present";
    setAttendance(prev => ({
      ...prev,
      [empId]: { ...(prev[empId] || {}), [day]: next }
    }));
  }

  function applyHolidays(empId, raw) {
    const parsed = raw.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= daysInMonth);
    setHolidays(prev => ({ ...prev, [empId]: parsed }));
    setHolidayInput(prev => ({ ...prev, [empId]: raw }));
  }

  function getGroupAbsentDays() {
    const dayCounts = {};
    for (const emp of EMPLOYEES) {
      if (emp.id === "bili") continue;
      const hols = getHolidaysForEmp(emp.id);
      for (const day of allDays) {
        if (hols.includes(day)) continue;
        const att = getAttendance(emp.id, day);
        if (att === "absent") {
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        }
      }
    }
    return new Set(Object.entries(dayCounts).filter(([,c]) => c >= 2).map(([d]) => +d));
  }

  function calcSummary(emp, groupAbsentDays) {
    const hols = getHolidaysForEmp(emp.id);
    let absentDays = 0;
    let bonusHangus = false;
    let presentDays = 0;
    let potonganHari = 0;
    let biliExtraAbsent = 0;

    for (const day of allDays) {
      const isHol = hols.includes(day);
      const att = getAttendance(emp.id, day);

      if (isHol) continue;

      if (att === "present") {
        presentDays++;
      } else if (att === "absent") {
        if (emp.id === "bili") {
          biliExtraAbsent++;
          if (biliExtraAbsent > 2) potonganHari++;
        } else {
          if (groupAbsentDays.has(day)) {
            bonusHangus = true;
          }
          absentDays++;
        }
      }
    }

    let paidDays = presentDays;
    if (emp.id === "bili") {
      paidDays = presentDays + Math.min(biliExtraAbsent, 2);
    }
    const baseGaji = paidDays * emp.rate;

    let bonusPct;
    if (emp.id === "bili") {
      bonusPct = 100;
    } else if (bonusHangus) {
      bonusPct = 0;
    } else {
      bonusPct = getBonusPct(absentDays);
    }

    const bonusValue = Math.round(emp.bonus * bonusPct / 100);
    const total = baseGaji + bonusValue;

    return {
      workDays: 30,
      presentDays,
      absentDays: emp.id === "bili" ? biliExtraAbsent : absentDays,
      potonganHari,
      baseGaji,
      bonusPct,
      bonusHangus,
      bonus: bonusValue,
      total
    };
  }

  const summaries = useMemo(() => {
    const groupAbsentDays = getGroupAbsentDays();
    const out = {};
    for (const emp of EMPLOYEES) out[emp.id] = calcSummary(emp, groupAbsentDays);
    return out;
  // eslint-disable-next-line
  }, [attendance, holidays, month, year]);

  const [syncStatus, setSyncStatus] = useState(null);

  async function syncToSheets() {
    setSyncStatus("loading");
    try {
      const kehadiranRows = [];
      for (const emp of EMPLOYEES) {
        const hols = getHolidaysForEmp(emp.id);
        for (const day of allDays) {
          if (hols.includes(day)) continue;
          const att = getAttendance(emp.id, day);
          if (!att) continue;
          kehadiranRows.push([
            MONTHS[month], year, emp.name, day,
            att === "present" ? "Hadir" : "Absen",
            ""
          ]);
        }
      }

      const rekapRows = EMPLOYEES.map(emp => {
        const s = summaries[emp.id];
        return [MONTHS[month], year, emp.name, s.presentDays, s.absentDays, s.baseGaji, s.bonusPct + "%", s.bonus, s.total];
      });

      const payload = { kehadiran: kehadiranRows, rekap: rekapRows };
      const encoded = encodeURIComponent(JSON.stringify(payload));
      await fetch(`${SHEET_URL}?data=${encoded}`, { method: "GET", mode: "no-cors" });

      setSyncStatus("ok");
      setTimeout(() => setSyncStatus(null), 3000);
    } catch {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus(null), 4000);
    }
  }

  async function syncSlipToSheets(emp) {
    const s = summaries[emp.id];
    const slip = [
      new Date().toLocaleDateString("id-ID"),
      MONTHS[month], year, emp.name,
      s.presentDays, s.absentDays, s.baseGaji, s.bonusPct + "%", s.bonus, s.total
    ];
    try {
      const encoded = encodeURIComponent(JSON.stringify({ slip }));
      await fetch(`${SHEET_URL}?data=${encoded}`, { method: "GET", mode: "no-cors" });
    } catch { /* ignore */ }
  }

  return (
    <>
      <style>{css}</style>
      <div className="app-container">
        {/* Header */}
        <header className="header animate-fade">
          <div>
            <span className="brand-badge">Payroll Management</span>
            <h1 className="brand-title">NOVI JAYA TELUR</h1>
          </div>
          <div>
            <button
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm("Reset semua data bulan ini?")) {
                  setAttendance({});
                  setHolidays({});
                  setHolidayInput({});
                }
              }}
            >
              Reset Data
            </button>
          </div>
        </header>

        {/* Controls */}
        <div className="controls-bar animate-fade">
          <div className="tabs-wrapper">
            <button className={`tab-btn ${tab === 'absensi' ? 'active' : ''}`} onClick={() => setTab('absensi')}>
              Absensi
            </button>
            <button className={`tab-btn ${tab === 'libur' ? 'active' : ''}`} onClick={() => setTab('libur')}>
              Atur Libur
            </button>
            <button className={`tab-btn ${tab === 'rekap' ? 'active' : ''}`} onClick={() => setTab('rekap')}>
              Rekap Gaji
            </button>
          </div>

          <div className="period-selector">
            <select className="select-box" value={month} onChange={e => setMonth(+e.target.value)}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select className="select-box" value={year} onChange={e => setYear(+e.target.value)}>
              {[2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Tab: Absensi */}
        {tab === "absensi" && (
          <div className="animate-fade">
            {EMPLOYEES.map(emp => {
              const hols = getHolidaysForEmp(emp.id);
              const s = summaries[emp.id];
              return (
                <div className="emp-card" key={emp.id}>
                  <div className="emp-header">
                    <div className="emp-profile">
                      <div className="emp-avatar">{emp.name.charAt(0)}</div>
                      <div>
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-role">{emp.role}</div>
                      </div>
                    </div>
                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                      {emp.specialRule && <span style={{fontSize:'10px', color:'var(--accent-amber)', fontWeight:700}}>⭐ KHUSUS</span>}
                      <span style={{fontSize:'13px', fontWeight:600, color: 'var(--primary)'}}>{fmt(emp.rate)} / hari</span>
                    </div>
                  </div>

                  <div className="emp-body">
                    <div className="days-grid">
                      {allDays.map(day => {
                        const isHol = hols.includes(day);
                        const att = getAttendance(emp.id, day);
                        let cls = "day-btn";
                        if (isHol) cls += " holiday";
                        else if (att === "present") cls += " present";
                        else if (att === "absent") cls += " absent";

                        return (
                          <button
                            key={day}
                            className={cls}
                            onClick={() => !isHol && toggleDay(emp.id, day)}
                          >
                            <span className="day-num">{day}</span>
                            <span className="day-status">
                              {isHol ? "LBR" : att === "present" ? "HADIR" : att === "absent" ? "ABSEN" : "—"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="stats-grid">
                      <div className="stat-card">
                        <span className="stat-label">Hadir</span>
                        <span className="stat-value" style={{color: 'var(--accent-emerald)'}}>{s.presentDays}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Absen</span>
                        <span className="stat-value" style={{color: 'var(--accent-rose)'}}>{s.absentDays}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Gaji Pokok</span>
                        <span className="stat-value">{fmt(s.baseGaji)}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Bonus</span>
                        <span className="stat-value">
                          {s.bonusHangus ? <span style={{color: "var(--accent-rose)"}}>0%</span> : `${s.bonusPct}%`}
                        </span>
                      </div>
                      <div className="stat-card total">
                        <span className="stat-label">Total Gaji</span>
                        <span className="stat-value">{fmt(s.total)}</span>
                      </div>
                    </div>

                    <div style={{marginTop: '16px', display: 'flex', justifyContent: 'flex-end'}}>
                      <button className="btn btn-secondary" onClick={() => setSlipTarget(emp)}>
                        Lihat Slip
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Libur */}
        {tab === "libur" && (
          <div className="emp-card animate-fade" style={{padding:'24px'}}>
            <h2 style={{fontSize: '18px', fontWeight: 700, marginBottom: '16px'}}>Atur Hari Libur</h2>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'16px'}}>
              {EMPLOYEES.map(emp => (
                <div key={emp.id} style={{padding:'16px', background:'#f8fafc', borderRadius:'12px', border:'1px solid var(--border-color)'}}>
                  <div style={{fontWeight: 700, marginBottom: '8px'}}>{emp.name}</div>
                  <input
                    className="select-box"
                    style={{width:'100%'}}
                    placeholder="Contoh: 5, 12, 19"
                    value={holidayInput[emp.id] || ""}
                    onChange={e => applyHolidays(emp.id, e.target.value)}
                  />
                  <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px'}}>
                    Libur: {(holidays[emp.id] || []).join(', ') || 'Belum ada'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Rekap */}
        {tab === "rekap" && (
          <div className="rekap-card animate-fade">
            <div style={{padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border-color)'}}>
              <h2 style={{fontSize:'18px', fontWeight:700}}>Rekapitulasi Gaji</h2>
              <button className="btn btn-primary" onClick={syncToSheets} disabled={syncStatus === 'loading'}>
                {syncStatus === 'loading' ? 'Menyinkronkan...' : 'Sync ke Sheets'}
              </button>
            </div>
            <table className="rekap-table">
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Absen</th>
                  <th>Gaji Pokok</th>
                  <th>Bonus</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {EMPLOYEES.map(emp => {
                  const s = summaries[emp.id];
                  return (
                    <tr key={emp.id}>
                      <td><strong>{emp.name}</strong></td>
                      <td>{s.absentDays} hari</td>
                      <td>{fmt(s.baseGaji)}</td>
                      <td>{s.bonusPct}%</td>
                      <td><strong>{fmt(s.total)}</strong></td>
                      <td style={{textAlign:'right'}}>
                        <button className="btn btn-secondary" style={{padding:'4px 12px', fontSize:'11px'}} onClick={() => setSlipTarget(emp)}>Slip</button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td>TOTAL</td>
                  <td></td>
                  <td colSpan={2}></td>
                  <td>{fmt(EMPLOYEES.reduce((a, e) => a + summaries[e.id].total, 0))}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slip Modal */}
      {slipTarget && (() => {
        const emp = slipTarget;
        const s = summaries[emp.id];
        return (
          <div className="modal-overlay" onClick={() => setSlipTarget(null)}>
            <div className="modal-content animate-fade" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div style={{fontSize:'10px', fontWeight:800, opacity:0.8}}>SLIP GAJI</div>
                  <div style={{fontSize:'20px', fontWeight:800}}>{emp.name}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'12px'}}>{MONTHS[month]} {year}</div>
                </div>
              </div>
              <div className="modal-body">
                <div className="slip-row"><span>Gaji Per Hari</span><strong>{fmt(emp.rate)}</strong></div>
                <div className="slip-row"><span>Hadir</span><strong>{s.presentDays} Hari</strong></div>
                <div className="slip-row"><span>Absen</span><strong style={{color:'var(--accent-rose)'}}>{s.absentDays} Hari</strong></div>
                <div className="slip-row"><span>Gaji Dasar</span><strong>{fmt(s.baseGaji)}</strong></div>
                <div className="slip-row"><span>Bonus ({s.bonusPct}%)</span><strong style={{color:'var(--accent-emerald)'}}>{fmt(s.bonus)}</strong></div>
                <div className="slip-total">
                  <span style={{fontWeight:700}}>TOTAL DITERIMA</span>
                  <span style={{fontSize:'20px', fontWeight:800, color:'var(--primary)'}}>{fmt(s.total)}</span>
                </div>
              </div>
              <div style={{padding:'0 24px 24px', display:'flex', gap:'8px'}}>
                <button className="btn btn-primary" style={{flex:1}} onClick={() => { syncSlipToSheets(emp); window.print(); }}>Cetak PDF</button>
                <button className="btn btn-secondary" onClick={() => setSlipTarget(null)}>Tutup</button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
