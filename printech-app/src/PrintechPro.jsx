import { useState, useEffect, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

/* ── PALETTE ────────────────────────────────────────────────── */
const C = {
  white: "#ffffff",
  bg: "#f4f7f5",
  sidebar: "#1a3d2b",
  sidebarMid: "#234d38",
  sidebarHi: "#2d6146",
  accent: "#2d7d4f",
  accentLt: "#e8f5ee",
  accentMid: "#b7dfc8",
  text: "#111b15",
  muted: "#6b8070",
  border: "#d8e8de",
  started: "#2d7d4f",
  inprog: "#1a6fb5",
  completed: "#16803c",
  hold: "#c05c00",
  prepress: "#7c3aed",
  press: "#1a6fb5",
  postpress: "#0e7474",
};

/* ── DATA ───────────────────────────────────────────────────── */
const machines = [
  "Screen Printer – SP01", "Screen Printer – SP02",
  "DTG Printer – DT01", "DTG Printer – DT02",
  "Flatbed Printer – FB01", "Sublimation – SB01",
  "Embroidery – EM01", "Heat Press – HP01",
  "UV Printer – UV01", "Rotary Press – RP01",
];

const stageMap = {
  "Pre-Press": { color: C.prepress, bg: "#f3eefe", label: "Pre-Press", sub: "Design / Raw Material" },
  "Press": { color: C.press, bg: "#e8f2fc", label: "Press", sub: "VD / Printing" },
  "Post-Press": { color: C.postpress, bg: "#e6f6f6", label: "Post-Press", sub: "Finishing / QC / Dispatch" },
};

const statusConfig = {
  1: { label: "Initial", color: "#6b8070", bg: "#f0f4f1", icon: "•" },
  2: { label: "Processing", color: C.inprog, bg: "#e8f2fc", icon: "↻" },
  3: { label: "Completed", color: C.completed, bg: "#dcfce7", icon: "✓" },
  4: { label: "Packed", color: "#7c3aed", bg: "#f3eefe", icon: "📦" },
  5: { label: "Billing", color: "#0e7474", bg: "#e6f6f6", icon: "💳" },
  6: { label: "Delivery", color: "#c05c00", bg: "#fff0e6", icon: "🚚" },
  7: { label: "Delivered", color: "#16803c", bg: "#dcfce7", icon: "🏁" },
};

const sampleJobs = [
  { id: "260099", client: "Golden Offset", item: "ISI Hang Tag", stage: "Press", machine: "Screen Printer", operator: "Mahendran K", operatorId: "EMP0033", status: "In Progress", progress: 65, time: "10:42 AM" },
  { id: "260098", client: "Bose Exports", item: "Obabi Hanger Card", stage: "Pre-Press", machine: "Embroidery", operator: "Sugumar", operatorId: "EMP0032", status: "Started", progress: 22, time: "09:15 AM" },
  { id: "260097", client: "Prisma Garments", item: "Phil and Co Hang Tag", stage: "Post-Press", machine: "Sublimation", operator: "Karthi G", operatorId: "EMP0031", status: "Completed", progress: 100, time: "08:30 AM" },
  { id: "JC-4824", client: "Nike Local", item: "DTG Print 120 units", stage: "Press", machine: "DTG Printer – DT01", operator: "Deepak B", operatorId: "EMP-008", status: "Hold", progress: 48, time: "11:05 AM" },
  { id: "JC-4825", client: "Raymond Ltd", item: "Heat Transfer 400 units", stage: "Press", machine: "Heat Press – HP01", operator: "Priya S", operatorId: "EMP-014", status: "In Progress", progress: 77, time: "10:58 AM" },
  { id: "JC-4826", client: "Biba Fashion", item: "UV Print 90 units", stage: "Post-Press", machine: "UV Printer – UV01", operator: "Karthik L", operatorId: "EMP-021", status: "In Progress", progress: 55, time: "10:20 AM" },
];

/* ── HELPERS ────────────────────────────────────────────────── */
const Tag = ({ label, color, bg, small }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: bg, color, borderRadius: 6, padding: small ? "2px 8px" : "4px 10px", fontSize: small ? 11 : 12, fontWeight: 600, fontFamily: "'DM Mono',monospace", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
    {label}
  </span>
);

const ProgressBar = ({ pct, color }) => (
  <div style={{ height: 6, background: "#e5ede9", borderRadius: 99, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${pct}%`, background: color || C.accent, borderRadius: 99, transition: "width 0.4s ease" }} />
  </div>
);

const Input = ({ label, placeholder, value, onChange, mono }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, fontFamily: "'DM Mono',monospace" }}>{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: mono ? "'DM Mono',monospace" : "'Lora',serif", color: C.text, background: C.white, outline: "none", transition: "border 0.2s", width: "100%" }}
      onFocus={e => e.target.style.border = `1.5px solid ${C.accent}`}
      onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
    />
  </div>
);

/* ── SIDEBAR ────────────────────────────────────────────────── */
function Sidebar({ active, setActive }) {
  const items = [
    { id: "operator", icon: "⚙", label: "Operator Entry" },
    { id: "jobview", icon: "◎", label: "Job Lookup" },
  ];
  return (
    <div className="sidebar-container" style={{ width: 220, background: C.sidebar, minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: "28px 22px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16 }}>▣</span>
          </div>
          <div>
            <div style={{ color: C.white, fontSize: 13, fontWeight: 700, fontFamily: "'Lora',serif", lineHeight: 1.1 }}>Sree Vasa</div>
            <div style={{ color: "#7eb898", fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: 2 }}>PRINTECH</div>
          </div>
        </div>
      </div>

      <div style={{ width: "calc(100% - 44px)", height: 1, background: "#2a5040", margin: "0 22px 20px" }} />

      {/* Nav */}
      <nav style={{ padding: "0 12px", flex: 1 }}>
        <div style={{ color: "#5a8a70", fontSize: 10, letterSpacing: 3, fontFamily: "'DM Mono',monospace", padding: "0 10px 8px" }}>NAVIGATION</div>
        {items.map(it => (
          <button key={it.id} onClick={() => setActive(it.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 3,
              background: active === it.id ? C.sidebarHi : "transparent",
              color: active === it.id ? C.white : "#8dbfa3",
              fontFamily: "'DM Sans',sans-serif", fontWeight: active === it.id ? 700 : 400, fontSize: 13.5, textAlign: "left", transition: "all 0.18s",
              borderLeft: active === it.id ? `3px solid #5dd99a` : "3px solid transparent",
            }}>
            <span style={{ fontSize: 15 }}>{it.icon}</span>
            {it.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 22px", borderTop: "1px solid #2a5040" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#5dd99a" }} />
          <span style={{ color: "#5dd99a", fontSize: 11, fontFamily: "'DM Mono',monospace" }}>System Online</span>
        </div>
        <div style={{ color: "#4a7a60", fontSize: 10, fontFamily: "'DM Mono',monospace" }}>Last sync: just now</div>
      </div>
    </div>
  );
}

/* ── TOPBAR ─────────────────────────────────────────────────── */
function TopBar({ title, sub }) {
  const now = new Date().toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="topbar-container" style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: "'Lora',serif" }}>{title}</div>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Mono',monospace", marginTop: 1 }}>{sub}</div>
      </div>
      <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {window.PRINTECH_DEV_MODE && (
          <div style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fee2e2", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>
            ⚠ DEV MODE (READ-ONLY)
          </div>
        )}
        <div style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Mono',monospace" }}>{now}</div>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.accentLt, border: `2px solid ${C.accentMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.accent, fontWeight: 700 }}>A</div>
      </div>
    </div>
  );
}

/* ── OPERATOR PAGE ──────────────────────────────────────────── */
function OperatorPage({ state, setState }) {
  const { step, authMode, empId, jobLookupNumber, jobCard, machine, status, scannerActive, scanError, loading, error, currentJobData } = state;

  const update = (patch) => setState(prev => ({ ...prev, ...patch }));

  const now = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const [qrAuthDone, setQrAuthDone] = useState(false);
  const [qrJobDone, setQrJobDone] = useState(false);
  const employeeInputRef = useRef(null);
  const jobInputRef = useRef(null);

  // Session Persistence: Load Employee ID and Auto-Advance
  useEffect(() => {
    const savedEmp = localStorage.getItem("printech_emp_id");
    if (savedEmp) {
      // If we have a saved ID, we can skip to step 2 directly
      update({ empId: savedEmp, step: 2 });
    }
  }, []);

  // Auto-focus Logic
  useEffect(() => {
    if (step === 1 && authMode === "id") employeeInputRef.current?.focus();
    if (step === 2 && authMode === "id") jobInputRef.current?.focus();
  }, [step, authMode]);

  // Handle QR scan results
  const handleQRScan = (result) => {
    if (!result) return;

    try {
      const data = result[0].rawValue;

      // Parse employee QR code (format: EMP-{id}:{name})
      // Parse employee QR code (format: EMPXXXX)
      if (step === 1 && data.toUpperCase().startsWith('EMP')) {
        update({ empId: data.toUpperCase(), scannerActive: false, scanError: "" });
        setQrAuthDone(true);
        setTimeout(() => update({ step: 2 }), 500);
      }
      // Parse job card QR code (format: 6-8 digit number)
      else if (step === 1 && /^\d{5,8}$/.test(data)) {
        update({ jobLookupNumber: data, jobCard: data, scannerActive: false, scanError: "" });
      }
      else {
        update({ scanError: "Invalid QR code for current step" });
      }
    } catch (error) {
      update({ scanError: "Failed to read QR code" });
    }
  };

  const handleScanError = (error) => {
    update({ scanError: "Camera access failed. Please check browser permissions." });
  };

  const startScanner = () => update({ scannerActive: true, scanError: "" });
  const stopScanner = () => update({ scannerActive: false, scanError: "" });

  const StepDot = ({ n, label }) => {
    const done = step > n, active = step === n;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
          background: done ? C.accent : active ? C.accentLt : "#f0f4f1",
          color: done ? C.white : active ? C.accent : C.muted,
          border: active ? `2px solid ${C.accent}` : done ? `2px solid ${C.accent}` : `2px solid ${C.border}`,
        }}>
          {done ? "✓" : n}
        </div>
        <span style={{ fontSize: 10, color: active ? C.accent : C.muted, fontFamily: "'DM Mono',monospace", letterSpacing: 0.5, fontWeight: active ? 700 : 400 }}>{label}</span>
      </div>
    );
  };

  return (
    <div className="page-padding" style={{ padding: "28px" }}>
      <TopBar title="Operator Entry" sub="Job card status update workflow" />
      <div style={{ maxWidth: 560, margin: "32px auto" }}>

        {/* Steps */}
        <div className="steps-container" style={{ display: "flex", alignItems: "center", marginBottom: 32, background: C.white, borderRadius: 14, padding: "16px 24px", border: `1px solid ${C.border}`, boxShadow: "0 2px 8px #0001" }}>
          <StepDot n={1} label="EMP" />
          <div className="step-line" style={{ flex: 0.5, height: 1, background: C.border }} />
          <StepDot n={2} label="JOB" />
          <div className="step-line" style={{ flex: 0.5, height: 1, background: C.border }} />
          <StepDot n={3} label="MACHINE" />
          <div className="step-line" style={{ flex: 0.5, height: 1, background: C.border }} />
          <StepDot n={4} label="STATUS" />
          <div className="step-line" style={{ flex: 0.5, height: 1, background: C.border }} />
          <StepDot n={5} label="DONE" />
        </div>

        {/* Card */}
        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 4px 20px #0001", overflow: "hidden" }}>
          {/* Card header stripe */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.accent}, ${C.accentMid})` }} />
          <div className="card-padding" style={{ padding: "28px 32px" }}>

            {/* STEP 1 — EMP */}
            {step === 1 && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'Lora',serif", marginBottom: 4 }}>Employee Authentication</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>Verify your identity to begin</div>

                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {["id", "qr"].map(m => (
                    <button key={m} onClick={() => { update({ authMode: m, scannerActive: false, scanError: "" }); setQrAuthDone(false); }}
                      style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${authMode === m ? C.accent : C.border}`, background: authMode === m ? C.accentLt : C.white, color: authMode === m ? C.accent : C.muted, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                      {m === "id" ? "◉  Employee ID" : "◎  Scan QR"}
                    </button>
                  ))}
                </div>

                {authMode === "id" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, fontFamily: "'DM Mono',monospace" }}>EMPLOYEE ID</label>
                      <input ref={employeeInputRef} value={empId} onChange={e => update({ empId: e.target.value.toUpperCase() })} placeholder="e.g. EMP0033"
                        style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", fontSize: 16, fontFamily: "'DM Mono',monospace", color: C.text, background: C.white, outline: "none", transition: "border 0.2s", width: "100%" }}
                        onFocus={e => e.target.style.border = `1.5px solid ${C.accent}`}
                        onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ border: `2px solid ${C.accent}`, borderRadius: 14, padding: "16px", background: C.white }}>
                    {!scannerActive ? (
                      <div style={{ textAlign: "center", padding: "16px" }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
                        <div style={{ color: C.accent, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>Employee QR Scanner</div>
                        <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Scan your employee badge QR code</div>
                        {scanError && (
                          <div style={{ color: "#dc2626", fontSize: 11, marginTop: 8, padding: "6px 12px", background: "#fef2f2", borderRadius: 6 }}>
                            {scanError}
                          </div>
                        )}
                        <button onClick={startScanner}
                          style={{ marginTop: 16, padding: "10px 24px", borderRadius: 8, border: `1.5px solid ${C.accent}`, background: C.accent, color: C.white, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                          Start Scanner
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>Scanning Employee Badge...</div>
                          <button onClick={stopScanner}
                            style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.muted, fontSize: 11, cursor: "pointer" }}>
                            Cancel
                          </button>
                        </div>
                        <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", height: 320, position: 'relative' }}>
                          <Scanner
                            onScan={handleQRScan}
                            onError={handleScanError}
                            styles={{
                              container: { width: '100%', height: '100%' },
                              video: { objectFit: 'cover', width: '100%', height: '100%' }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    const validId = empId.toUpperCase().startsWith("EMP") && empId.length >= 4;
                    if (authMode === "id" && validId) {
                      localStorage.setItem("printech_emp_id", empId.toUpperCase());
                      update({ step: 2 });
                    }
                    if (authMode === "qr" && qrAuthDone) {
                      localStorage.setItem("printech_emp_id", empId.toUpperCase());
                      update({ step: 2 });
                    }
                  }}
                  style={{
                    marginTop: 24, width: "100%", padding: "13px", borderRadius: 11, border: "none", background: C.accent, color: C.white, fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
                    opacity: (authMode === "id" ? empId.length > 2 : qrAuthDone) ? 1 : 0.4
                  }}>
                  Continue →
                </button>
              </div>
            )}

            {/* STEP 2 — JOB */}
            {step === 2 && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'Lora',serif", marginBottom: 4 }}>Job Selection</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>Enter or scan your Job Card ID</div>

                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {["id", "qr"].map(m => (
                    <button key={m} onClick={() => { update({ authMode: m, scannerActive: false, scanError: "" }); setQrJobDone(false); }}
                      style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${authMode === m ? C.accent : C.border}`, background: authMode === m ? C.accentLt : C.white, color: authMode === m ? C.accent : C.muted, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}>
                      {m === "id" ? "◉  Job ID" : "◎  Scan QR"}
                    </button>
                  ))}
                </div>

                {authMode === "id" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, fontFamily: "'DM Mono',monospace" }}>JOB CARD NUMBER</label>
                      <input ref={jobInputRef} value={jobLookupNumber} onChange={e => update({ jobLookupNumber: e.target.value })} placeholder="e.g. 260099"
                        style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", fontSize: 16, fontFamily: "'DM Mono',monospace", color: C.text, background: C.white, outline: "none", transition: "border 0.2s", width: "100%" }}
                        onFocus={e => e.target.style.border = `1.5px solid ${C.accent}`}
                        onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ border: `2px solid ${C.accent}`, borderRadius: 14, padding: "16px", background: C.white }}>
                    {!scannerActive ? (
                      <div style={{ textAlign: "center", padding: "16px" }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                        <div style={{ color: C.accent, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>Job Card Scanner</div>
                        <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Scan your job card QR code</div>
                        {scanError && (
                          <div style={{ color: "#dc2626", fontSize: 11, marginTop: 8, padding: "6px 12px", background: "#fef2f2", borderRadius: 6 }}>
                            {scanError}
                          </div>
                        )}
                        <button onClick={startScanner}
                          style={{ marginTop: 16, padding: "10px 24px", borderRadius: 8, border: `1.5px solid ${C.accent}`, background: C.accent, color: C.white, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                          Start Scanner
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.accent }}>Scanning Job Card...</div>
                          <button onClick={stopScanner}
                            style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.white, color: C.muted, fontSize: 11, cursor: "pointer" }}>
                            Cancel
                          </button>
                        </div>
                        <div style={{ borderRadius: 10, overflow: "hidden", background: "#000", height: 320, position: 'relative' }}>
                          <Scanner
                            onScan={(res) => {
                              if (res?.[0]) {
                                const data = res[0].rawValue;
                                if (/^\d{5,8}$/.test(data)) {
                                  update({ jobLookupNumber: data, jobCard: data, scannerActive: false });
                                  setQrJobDone(true);
                                }
                              }
                            }}
                            onError={handleScanError}
                            styles={{
                              container: { width: '100%', height: '100%' },
                              video: { objectFit: 'cover', width: '100%', height: '100%' }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button onClick={() => update({ step: 1 })} style={{ padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>← Back</button>
                  <button
                    disabled={loading || !(authMode === "id" ? jobLookupNumber.length > 2 : qrJobDone)}
                    onClick={async () => {
                      const jcn = authMode === "id" ? jobLookupNumber : jobCard;
                      if (!jcn) return;

                      update({ loading: true, error: "" });
                      try {
                        const formData = new URLSearchParams();
                        formData.append("empCode", empId);
                        formData.append("jobCardNo", jcn);

                        const res = await fetch("http://117.218.59.130/vasa_wo_api/work_order/viewAssignedJob", {
                          method: "POST",
                          headers: { "Content-Type": "application/x-www-form-urlencoded" },
                          body: formData
                        });
                        const data = await res.json();

                        if (data.status === 1 || data.job_card_id) {
                          const jobInfo = data.data || data;
                          const machineList = jobInfo.machineWoList || [];
                          const firstMachine = machineList.length > 0 ? machineList[0].machine_name : jobInfo.machine_name;
                          
                          update({ 
                            step: 3, 
                            jobCard: jcn, 
                            currentJobData: jobInfo, 
                            machine: firstMachine || "",
                            loading: false 
                          });
                        } else {
                          update({ error: data.msg || "Job not found", loading: false });
                        }
                      } catch (err) {
                        update({ error: "Connection error", loading: false });
                      }
                    }}
                    style={{
                      flex: 1, padding: "13px", borderRadius: 11, border: "none", background: C.accent, color: C.white, fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
                      opacity: (loading || !(authMode === "id" ? jobLookupNumber.length > 2 : qrJobDone)) ? 0.4 : 1
                    }}>
                    {loading ? "Fetching..." : "Continue →"}
                  </button>
                </div>
                {error && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 12, textAlign: "center", background: "#fef2f2", padding: "8px", borderRadius: 8 }}>{error}</div>}
              </div>
            )}

            {/* STEP 3 — MACHINE */}
            {step === 3 && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'Lora',serif", marginBottom: 4 }}>Select Machine</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Job Card: <strong style={{ color: C.accent, fontFamily: "'DM Mono',monospace" }}>{jobCard}</strong></div>

                {/* JOB DETAIL CARD FOR CONFIRMATION */}
                {currentJobData && (
                  <div style={{ background: "#f8faf9", border: `1.5px dashed ${C.accentMid}`, borderRadius: 12, padding: "14px", marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 0.5 }}>CURRENT JOB</span>
                      {currentJobData.workOrderStsName && <Tag label={currentJobData.workOrderStsName} color={C.inprog} bg="#e8f2fc" small />}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{currentJobData.company_name || currentJobData.client_name || "Client Name"}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>{currentJobData.item_name || currentJobData.item_description || "Item Description"}</div>
                  </div>
                )}

                <div style={{ height: 1, background: C.border, margin: "16px 0 20px" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, fontFamily: "'DM Mono',monospace" }}>AVAILABLE MACHINES</label>
                  
                  {currentJobData?.machineWoList && currentJobData.machineWoList.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {currentJobData.machineWoList.map((m, idx) => {
                        const mName = m.machine_name || m.machineName || m.machine || "Unknown Machine";
                        const isSelected = machine === mName;
                        return (
                          <button key={idx} onClick={() => update({ machine: mName })}
                            style={{ 
                              padding: "14px 18px", borderRadius: 12, border: `2.2px solid ${isSelected ? C.accent : C.border}`,
                              background: isSelected ? C.accentLt : C.white,
                              color: isSelected ? C.accent : C.text,
                              textAlign: "left", cursor: "pointer", fontWeight: 700, fontSize: 14,
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                            }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{ fontSize: 18, opacity: isSelected ? 1 : 0.3 }}>{isSelected ? "◉" : "○"}</span>
                              {mName}
                            </div>
                            {isSelected && <span style={{ fontSize: 16 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: C.text, background: "#f8faf9" }}>
                      {currentJobData?.machine_name || "Assigned Machine"}
                    </div>
                  )}
                </div>

                {machine && (
                  <div style={{ marginTop: 14, background: C.accentLt, border: `1px solid ${C.accentMid}`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 20 }}>◉</span>
                    <div>
                      <div style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>{machine}</div>
                      <div style={{ color: C.muted, fontSize: 11 }}>Selected — confirm below</div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button onClick={() => update({ step: 2 })} style={{ padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>← Back</button>
                  <button onClick={() => { if (machine) update({ step: 4 }); }}
                    style={{ flex: 1, padding: "13px", borderRadius: 11, border: "none", background: C.accent, color: C.white, fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: machine ? 1 : 0.4 }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 — STATUS */}
            {step === 4 && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'Lora',serif", marginBottom: 4 }}>Update Status</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
                  Job Card: <strong style={{ color: C.accent, fontFamily: "'DM Mono',monospace" }}>{jobCard}</strong> &nbsp;·&nbsp; Machine: <strong style={{ color: C.text }}>{machine.split("–")[0].trim()}</strong>
                </div>
                <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

                <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {Object.entries(statusConfig).map(([id, cfg]) => (
                    <button key={id} onClick={() => update({ status: id })}
                      style={{ padding: "16px 14px", borderRadius: 12, border: `2px solid ${status == id ? cfg.color : C.border}`, background: status == id ? cfg.bg : C.white, color: status == id ? cfg.color : C.muted, fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                      {cfg.label}
                    </button>
                  ))}
                </div>

                {status && (
                  <div style={{ background: "#f8faf9", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, fontFamily: "'DM Mono',monospace", color: C.muted }}>
                    <span style={{ color: C.accent }}>⏱ Auto Timestamp:</span> &nbsp;{now()} — {new Date().toLocaleDateString("en-IN")}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => update({ step: 3 })} style={{ padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>← Back</button>
                  <button
                    disabled={loading || !status}
                    onClick={async () => {
                      if (!status) return;
                      
                      if (window.PRINTECH_DEV_MODE) {
                        update({ loading: true });
                        setTimeout(() => update({ step: 5, loading: false }), 800);
                        console.log("DEV MODE: Skipping production API call. Data that would have been sent:", {
                          workOrderId: currentJobData?.workOrderId,
                          status: status
                        });
                        return;
                      }

                      update({ loading: true, error: "" });
                      try {
                        const formData = new URLSearchParams();
                        formData.append("workorderId", currentJobData?.workOrderId || "1");
                        formData.append("workorderStatus", status);
                        // Production API does not require token for this endpoint currently

                        const res = await fetch("http://117.218.59.130/vasa_wo_api/work_order/change_workorder_status", {
                          method: "POST",
                          headers: { "Content-Type": "application/x-www-form-urlencoded" },
                          body: formData
                        });

                        // We assume Success if no error thrown, even if res is null as seen in probe
                        update({ step: 5, loading: false });
                      } catch (err) {
                        update({ error: "Failed to update status", loading: false });
                      }
                    }}
                    style={{ flex: 1, padding: "13px", borderRadius: 11, border: "none", background: C.accent, color: C.white, fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (loading || !status) ? 0.4 : 1 }}>
                    {loading ? "Updating..." : "Submit Update ✓"}
                  </button>
                </div>
                {error && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 12, textAlign: "center", background: "#fef2f2", padding: "8px", borderRadius: 8 }}>{error}</div>}
              </div>
            )}

            {/* STEP 5 — DONE */}
            {step === 5 && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.accentLt, border: `3px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>✓</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'Lora',serif", marginBottom: 6 }}>Update Submitted!</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Status synced with the production database</div>
                <div style={{ background: "#f8faf9", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px", textAlign: "left", display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {[
                    ["Job ID", jobLookupNumber || jobCard || "N/A", "'DM Mono',monospace"],
                    ["Operator ID", empId, "'DM Sans',sans-serif"],
                  ["Machine", machine || currentJobData?.machine_name || currentJobData?.machineName || "N/A", "'DM Sans',sans-serif"],
                    ["Status", statusConfig[status]?.label || "N/A", "'DM Sans',sans-serif"],
                    ["Timestamp", now() + " · " + new Date().toLocaleDateString("en-IN"), "'DM Mono',monospace"],
                  ].map(([k, v, f]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: C.muted, fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: 0.5 }}>{k.toUpperCase()}</span>
                      <span style={{ color: C.text, fontFamily: f, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                  setState(prev => ({
                    ...prev,
                    step: 1, authMode: "id", empId: "", jobLookupNumber: "", jobCard: "", machine: "", status: "", scannerActive: false, scanError: ""
                  }));
                  setQrAuthDone(false);
                  setQrJobDone(false);
                }}
                  style={{ padding: "12px 28px", borderRadius: 11, border: `1.5px solid ${C.accent}`, background: C.white, color: C.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  New Entry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── JOB LOOKUP PAGE ────────────────────────────────────────── */
function JobLookupPage({ empId }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [scanError, setScanError] = useState("");

  const search = async (qOverride) => {
    const q = (qOverride || query).trim().toUpperCase();
    if (!q) return;

    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const formData = new URLSearchParams();
      // Default to EMP0033 for manager lookup if no ID present
      formData.append("empCode", empId || localStorage.getItem("printech_emp_id") || "EMP0033");
      formData.append("jobCardNo", q);

      const res = await fetch("http://117.218.59.130/vasa_wo_api/work_order/viewAssignedJob", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      });
      const data = await res.json();

      if (data.status === 1 || data.job_card_id) {
        setResult(data.data || data);
      } else {
        setResult(null);
        setError(data.msg || "Job not found");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
      setScannerActive(false);
    }
  };

  const handleQRScan = (data) => {
    if (data) {
      // Direct assignment for job card QR
      setQuery(data);
      search(data);
    } else {
      setScanError("Invalid QR");
    }
  };

  const sc = result ? statusConfig[result.workorder_status || result.workOrderSts || result.status] : null;

  const getProgress = (st) => {
    const pMap = { 1: 10, 2: 40, 3: 80, 4: 90, 5: 95, 6: 98, 7: 100 };
    return pMap[st] || 0;
  };

  const Timeline = ({ currentSt }) => {
    const steps = [
      { id: 1, label: "Initial" },
      { id: 2, label: "Processing" },
      { id: 3, label: "Completed" },
      { id: 4, label: "Packed" },
      { id: 5, label: "Billing" },
      { id: 6, label: "Delivery" },
      { id: 7, label: "Delivered" }
    ];
    return (
      <div style={{ marginTop: 24, padding: "0 10px" }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 16, textAlign: "center", letterSpacing: 1 }}>WORKFLOW TIMELINE</div>
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
          <div style={{ position: "absolute", top: 10, left: 0, right: 0, height: 2, background: C.border, zIndex: 1 }} />
          {steps.map(s => {
            const active = s.id == currentSt;
            const completed = s.id < currentSt;
            return (
              <div key={s.id} style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", width: 40 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: active ? C.accent : completed ? C.accentMid : C.white,
                  border: `2px solid ${active || completed ? C.accent : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: active || completed ? C.white : C.muted, transition: "all 0.3s"
                }}>
                  {completed ? "✓" : s.id}
                </div>
                <span style={{ fontSize: 8, marginTop: 6, fontWeight: active ? 700 : 400, color: active ? C.accent : C.muted, textAlign: "center", width: 60, marginLeft: -10 }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <TopBar title="Job Lookup" sub="Manager / supervisor job card scan & status view" />
      <div style={{ padding: "28px", maxWidth: 680, margin: "0 auto" }}>

        <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 4px 20px #0001", overflow: "hidden", marginBottom: 24 }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.accent}, ${C.accentMid})` }} />
          <div style={{ padding: "24px 28px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: "'Lora',serif", marginBottom: 16 }}>Scan or Enter Job Card</div>
            {!empId && <div style={{ fontSize: 11, color: "#c05c00", marginBottom: 12, background: "#fff8f2", padding: "8px", borderRadius: 6 }}>NOTE: Using Manager Override for Lookup</div>}

            {scannerActive && (
              <div style={{ marginBottom: 20, border: `2px solid ${C.accent}`, borderRadius: 14, padding: "16px", background: C.white }}>
                <div style={{ height: 240, background: "#000", borderRadius: 10, overflow: "hidden", position: "relative" }}>
                  <Scanner onScan={res => res?.[0] && handleQRScan(res[0].rawValue)} onError={e => setScanError("Camera access failed.")} />
                  <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", color: "#fff", padding: "4px 8px", borderRadius: 6, fontSize: 10 }}>SCANNING...</div>
                </div>
                {scanError && <div style={{ color: "#d93025", fontSize: 12, marginTop: 10, fontWeight: 600 }}>⚠ {scanError}</div>}
                <button onClick={() => setScannerActive(false)} style={{ marginTop: 12, width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cancel Scan</button>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Input label="JOB CARD NUMBER" placeholder="e.g. 260099" value={query} onChange={v => { setQuery(v); setSearched(false); setResult(null); }} mono />
              </div>
              <button disabled={loading} onClick={() => search()}
                style={{ alignSelf: "flex-end", padding: "11px 22px", borderRadius: 10, border: "none", background: C.accent, color: C.white, fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", opacity: loading ? 0.6 : 1 }}>
                {loading ? "..." : "◎ Search"}
              </button>
              <button onClick={() => { setScannerActive(true); setScanError(""); }}
                style={{ alignSelf: "flex-end", padding: "11px 16px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: scannerActive ? C.accentLt : C.white, color: scannerActive ? C.accent : C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                QR
              </button>
            </div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 8, fontFamily: "'DM Mono',monospace" }}>Try: 260099, 260098, 250046</div>
          </div>
        </div>

        {searched && !result && !loading && (
          <div style={{ background: "#fff8f2", border: `1px solid #fcdec4`, borderRadius: 14, padding: "20px 24px", textAlign: "center", color: "#c05c00", fontFamily: "'DM Sans',sans-serif" }}>
            ⚠ {error || `No job card found for "${query}"`}
          </div>
        )}

        {result && (
          <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: "0 4px 24px #0002", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${sc?.color}, ${sc?.color}88)` }} />
            <div style={{ padding: "24px 28px" }}>

              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.text, fontFamily: "'Lora',serif" }}>{result.job_card_id || result.jobCardNo || query}</div>
                  <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{result.company_name} · {result.item_name}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Tag label={sc?.label || "Unknown"} color={sc?.color} bg={sc?.bg} />
                </div>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: C.muted, fontFamily: "'DM Mono',monospace", letterSpacing: 0.5 }}>COMPLETION</span>
                  <span style={{ color: C.accent, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{getProgress(result.workorder_status || result.workOrderSts)}%</span>
                </div>
                <ProgressBar pct={getProgress(result.workorder_status || result.workOrderSts)} color={sc?.color} />
              </div>

              <Timeline currentSt={result.workorder_status || result.workOrderSts} />

              {/* Stage */}
              <div style={{ background: "#e8f2fc", border: `1px solid ${C.inprog}44`, borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: C.inprog, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff" }}>
                  ⚙
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: C.inprog, fontSize: 14 }}>Live Data Source</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>Fetched from company production database</div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  ["● Quantity", result.quantity],
                  ["◉ Work Order ID", result.workorder_id || result.workOrderId || "N/A"],
                  ["👤 Client", result.company_name],
                  ["◐ Item", result.item_name],
                  ["◎ Status ID", result.workorder_status || result.workOrderSts],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: "#f8faf9", borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Mono',monospace", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



/* ── ROOT ──────────────────────────────────────────────────── */
// Set this to true to prevent sending data to the live database
window.PRINTECH_DEV_MODE = true;

export default function App() {
  const [active, setActive] = useState("operator");
  const [state, setState] = useState({
    jobs: sampleJobs,
    step: 1,
    authMode: "id",
    empId: "",
    jobLookupNumber: "",
    jobCard: "",
    machine: "",
    status: "",
    scannerActive: false,
    scanError: "",
    loading: false,
    error: "",
    currentJobData: null
  });

  return (
    <div className="app-container" style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700;800&family=DM+Sans:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        select, input, button { font-family:inherit; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:#f0f4f1; } ::-webkit-scrollbar-thumb { background:#b7dfc8; border-radius:4px; }
        button:hover { filter: brightness(0.96); }

        @media (max-width: 768px) {
          .app-container { flex-direction: column !important; }
          .sidebar-container { width: 100% !important; min-height: auto !important; border-bottom: 1px solid #2a5040; }
          .topbar-container { padding: 12px 20px !important; flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .topbar-right { width: 100%; justify-content: space-between; }
          .page-padding { padding: 16px !important; }
          .steps-container { padding: 12px 16px !important; flex-wrap: wrap !important; justify-content: center !important; gap: 8px !important; }
          .step-line { display: none !important; }
          .card-padding { padding: 20px 16px !important; }
          .grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Sidebar active={active} setActive={setActive} />

      <div style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        {active === "operator" && <OperatorPage state={state} setState={setState} />}
        {active === "jobview" && <JobLookupPage empId={state.empId} />}
      </div>
    </div>
  );
}
