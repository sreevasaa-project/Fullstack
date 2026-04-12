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
  1: { label: "Pending", color: "#6b8070", bg: "#f0f4f1", icon: "•" },
  2: { label: "Ongoing", color: C.inprog, bg: "#e8f2fc", icon: "↻" },
  3: { label: "Completed", color: C.completed, bg: "#dcfce7", icon: "✓" },
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

const LargeErrorDisplay = ({ message, onClose }) => (
  <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(220, 38, 38, 0.95)", zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", padding: 40, textAlign: "center" }}>
    <div style={{ fontSize: 80, marginBottom: 20 }}>⚠</div>
    <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, fontFamily: "'Lora', serif" }}>SYSTEM ERROR</div>
    <div style={{ fontSize: 18, maxWidth: 600, lineHeight: 1.5, opacity: 0.9, marginBottom: 40, fontFamily: "'DM Mono', monospace" }}>{message}</div>
    <button onClick={onClose} style={{ padding: "18px 48px", borderRadius: 14, border: "none", background: "white", color: "#dc2626", fontWeight: 800, fontSize: 20, cursor: "pointer", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
      TAP TO DISMISS & RETRY
    </button>
  </div>
);

const ProgressBar = ({ pct, color }) => (
  <div style={{ height: 6, background: "#e5ede9", borderRadius: 99, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${pct}%`, background: color || C.accent, borderRadius: 99, transition: "width 0.4s ease" }} />
  </div>
);

const Input = ({ label, placeholder, value, onChange, mono, onKeyDown }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, fontFamily: "'DM Mono',monospace" }}>{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
      style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: mono ? "'DM Mono',monospace" : "'Lora',serif", color: C.text, background: C.white, outline: "none", transition: "border 0.2s", width: "100%" }}
      onFocus={e => e.target.style.border = `1.5px solid ${C.accent}`}
      onBlur={e => e.target.style.border = `1.5px solid ${C.border}`}
    />
  </div>
);

/* ── SIDEBAR ────────────────────────────────────────────────── */
function Sidebar({ active, setActive, isOnline, lastSync }) {
  const items = [
    { id: "operator", icon: "⚙", label: "Operator Entry" },
    { id: "jobview", icon: "◎", label: "Job Lookup" },
  ];
  return (
    <div className="sidebar-container" style={{ width: 220, background: C.sidebar, minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: "28px 22px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/vassa-logo.png" alt="VASSA Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ color: C.white, fontSize: 14, fontWeight: 700, fontFamily: "'Lora',serif", lineHeight: 1.1 }}>Sree Vasaa</div>
            <div style={{ color: "#7eb898", fontSize: 11, fontFamily: "'DM Mono',monospace", letterSpacing: 2 }}>PRINTECH</div>
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
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: isOnline ? "#5dd99a" : "#ff4d4d", transition: "background 0.3s" }} />
          <span style={{ color: isOnline ? "#5dd99a" : "#ff4d4d", fontSize: 11, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
            {isOnline ? "System Online" : "Server Disconnected"}
          </span>
        </div>
        <div style={{ color: "#4a7a60", fontSize: 10, fontFamily: "'DM Mono',monospace" }}>Last sync: {lastSync || "never"}</div>
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
function OperatorPage({ state, setState, onSync }) {
  const { step, authMode, empId, jobLookupNumber, jobCard, machine, status, scannerActive, scanError, loading, error, currentJobData, apiToken } = state;

  const update = (patch) => setState(prev => ({ ...prev, ...patch }));

  const now = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const [cdAuthDone, setQrAuthDone] = useState(false);
  const [qrJobDone, setQrJobDone] = useState(false);
  const [externalScanValue, setExternalScanValue] = useState("");
  const employeeInputRef = useRef(null);
  const jobInputRef = useRef(null);

  const readMachineWorkOrderId = (obj) => (
    obj?.machine_workorder_id ||
    obj?.machineWorkOrderId ||
    obj?.machineWorkId ||
    obj?.machine_work_order_id ||
    obj?.machine_work_orderId ||
    obj?.machine_work_id ||
    obj?.machine_wo_id ||
    obj?.machineWoId ||
    obj?.workorder_machine_id ||
    obj?.workorderMachineId ||
    obj?.id
  );

  const resolveMachineWorkOrderId = () => {
    const list = currentJobData?.machineWoList;
    const normalize = (v) => String(v || "").trim().toLowerCase();

    if (Array.isArray(list) && list.length > 0) {
      const selected = list.find((m) =>
        normalize(m.machine_name || m.machineName || m.machine) === normalize(machine)
      );
      return readMachineWorkOrderId(selected || list[0]);
    }

    return readMachineWorkOrderId(currentJobData);
  };

  // Session Persistence: Load Employee ID and Auto-Advance
  useEffect(() => {
    const savedEmp = localStorage.getItem("printech_emp_id");
    if (savedEmp) {
      // If we have a saved ID, we can skip to step 2 directly
      update({ empId: savedEmp, step: 2 });
    }
  }, []);

  // Auto-focus & Sticky Focus Logic
  useEffect(() => {
    const handleFocus = () => {
      if (step === 1 && authMode === "id") employeeInputRef.current?.focus();
      if (step === 2 && authMode === "id") jobInputRef.current?.focus();
    };
    handleFocus();
  }, [step, authMode]);

  const stickyFocus = (ref) => {
    // Small delay to ensure blur finishes before refocusing
    setTimeout(() => {
      if (ref.current && document.activeElement !== ref.current) {
        ref.current.focus();
      }
    }, 150);
  };

  // Common regex for job cards: exactly 6 digits
  const JOB_REGEX = /^\d{6}$/i;

  // Handle QR scan results
  const applyExternalScan = (raw) => {
    const data = String(raw || "").trim().toUpperCase();
    if (!data) {
      update({ scanError: "Scanner input is empty" });
      return;
    }

    if (step === 1) {
      if (data.startsWith("EMP")) {
        update({ empId: data, scanError: "" });
        setQrAuthDone(true);
        setExternalScanValue("");
        setTimeout(() => update({ step: 2 }), 250);
      } else {
        update({ scanError: "Employee scan must start with EMP" });
      }
      return;
    }

    if (step === 2) {
      if (/^\d{5,12}$/.test(data)) {
        update({ jobLookupNumber: data, jobCard: data, scanError: "" });
        setQrJobDone(true);
        setExternalScanValue("");
      } else {
        update({ scanError: "Job card scan must be numeric" });
      }
    }
  };

  const handleQRScan = (result) => {
    if (!result) return;
    try {
      const data = result[0].rawValue;
      if (step === 1 && data.toUpperCase().startsWith('EMP')) {
        const id = data.toUpperCase();
        update({ empId: id, scannerActive: false, scanError: "" });
        localStorage.setItem("printech_emp_id", id);
        setQrAuthDone(true);
        setTimeout(() => update({ step: 2 }), 300);
      }
      // Parse job card QR code (format: 6-8 digit number)
      else if (step === 2 && /^\d{5,12}$/.test(data)) {
        update({ jobLookupNumber: data, jobCard: data, scannerActive: false, scanError: "" });
        setQrJobDone(true);
      else if (step === 2 && JOB_REGEX.test(data)) {
        update({ jobLookupNumber: data, jobCard: data, scannerActive: false, scanError: "" });
        setQrJobDone(true);
        // Auto-fetch after QR scan
        setTimeout(() => handleJobLookup(data), 100);
      }
      else {
        update({ scanError: "Invalid code for current step" });
      }
    } catch (error) {
      update({ scanError: "Failed to read QR code" });
    }
  };

  const handleJobLookup = async (overrideNumber) => {
    const jcn = overrideNumber || (authMode === "id" ? jobLookupNumber : jobCard);
    if (!jcn || jcn.length !== 6) return;

    update({ loading: true, error: "" });
    try {
      const formData = new URLSearchParams();
      formData.append("empCode", empId || localStorage.getItem("printech_emp_id") || "EMP0033");
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
        const uniqueMachines = [];
        const seen = new Set();
        machineList.forEach(m => {
          const mName = m.machine_name || m.machineName || m.machine || "Unknown Machine";
          const pName = m.process_name || "";
          if (!seen.has(mName)) {
            seen.add(mName);
            uniqueMachines.push({ ...m, displayName: mName, processName: pName });
          }
        });

        const firstMachine = uniqueMachines.length > 0
          ? (uniqueMachines[0].processName ? `${uniqueMachines[0].displayName} (${uniqueMachines[0].processName})` : uniqueMachines[0].displayName)
          : (jobInfo.machine_name || "");

        update({
          step: 3,
          jobCard: jcn,
          currentJobData: { ...jobInfo, machineWoList: uniqueMachines },
          machine: firstMachine,
          selectedMachineObj: uniqueMachines.length > 0 ? uniqueMachines[0] : null,
          apiToken: data.token || "",
          loading: false
        });
        onSync(true);
      } else {
        update({ error: data.msg || "Job not found", loading: false });
        onSync(true);
      }
    } catch (err) {
      // OFFLINE ALTERNATIVE: Fallback to sample data for testing
      console.log("Server unreachable, using offline fallback for testing.");
      const mockJob = sampleJobs.find(j => j.id === jcn) || sampleJobs[0];
      update({
        error: "Server Offline — Using Demo Data",
        loading: false,
        step: 3,
        jobCard: jcn,
        currentJobData: { ...mockJob, machineWoList: [] },
        machine: mockJob.machine,
        apiToken: "MOCK_TOKEN"
      });
      onSync(false);
    }
  };

  // Automation: Auto-fetch on 6 digits
  useEffect(() => {
    if (step === 2 && jobLookupNumber.length === 6) {
      handleJobLookup(jobLookupNumber);
    }
  }, [jobLookupNumber]);

  // Automation: Auto-advance Step 1
  useEffect(() => {
    if (step === 1 && empId.toUpperCase().startsWith("EMP") && empId.length >= 7) {
      localStorage.setItem("printech_emp_id", empId.toUpperCase());
      update({ step: 2 });
    }
  }, [empId]);

  const handleScanError = (error) => {
    update({ scanError: "Camera access failed" });
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
      {error && <LargeErrorDisplay message={error} onClose={() => update({ error: "" })} />}
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
                    {!scannerActive && (
                      <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.7, fontFamily: "'DM Mono',monospace" }}>EXTERNAL SCANNER INPUT</label>
                        <input
                          value={externalScanValue}
                          onChange={e => setExternalScanValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              applyExternalScan(externalScanValue);
                            }
                          }}
                          placeholder="Scan employee QR (scanner types text here)"
                          style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'DM Mono',monospace", color: C.text, background: C.white, outline: "none" }}
                        />
                        <button
                          onClick={() => applyExternalScan(externalScanValue)}
                          style={{ alignSelf: "flex-end", padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.accent}`, background: C.accentLt, color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Apply Scan
                        </button>
                      </div>
                    )}
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
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>Scan your employee badge to begin</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, fontFamily: "'DM Mono',monospace" }}>EMPLOYEE ID</label>
                    <input id="operator-emp-input" ref={employeeInputRef} value={empId} onChange={e => update({ empId: e.target.value.toUpperCase() })} placeholder="Ready to scan..."
                      onBlur={() => stickyFocus(employeeInputRef)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && empId.toUpperCase().startsWith("EMP") && empId.length >= 4) {
                          localStorage.setItem("printech_emp_id", empId.toUpperCase());
                          update({ step: 2 });
                        }
                      }}
                      style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", fontSize: 16, fontFamily: "'DM Mono',monospace", color: C.text, background: C.white, outline: "none", transition: "border 0.2s", width: "100%" }}
                      onFocus={e => e.target.style.border = `1.5px solid ${C.accent}`}
                    />
                  </div>
                </div>

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
                    opacity: (authMode === "id" ? empId.length >= 4 : qrAuthDone) ? 1 : 0.4
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
                    {!scannerActive && (
                      <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.7, fontFamily: "'DM Mono',monospace" }}>EXTERNAL SCANNER INPUT</label>
                        <input
                          value={externalScanValue}
                          onChange={e => setExternalScanValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              applyExternalScan(externalScanValue);
                            }
                          }}
                          placeholder="Scan job card QR (scanner types text here)"
                          style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'DM Mono',monospace", color: C.text, background: C.white, outline: "none" }}
                        />
                        <button
                          onClick={() => applyExternalScan(externalScanValue)}
                          style={{ alignSelf: "flex-end", padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.accent}`, background: C.accentLt, color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >
                          Apply Scan
                        </button>
                      </div>
                    )}
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
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>Scan your Job Card now</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, fontFamily: "'DM Mono',monospace" }}>JOB CARD NUMBER</label>
                    <input id="operator-job-input" ref={jobInputRef} value={jobLookupNumber} onChange={e => update({ jobLookupNumber: e.target.value })} placeholder="Ready to scan..."
                      onBlur={() => stickyFocus(jobInputRef)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && jobLookupNumber.length === 6) {
                          handleJobLookup();
                        }
                      }}
                      style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", fontSize: 16, fontFamily: "'DM Mono',monospace", color: C.text, background: C.white, outline: "none", transition: "border 0.2s", width: "100%" }}
                      onFocus={e => e.target.style.border = `1.5px solid ${C.accent}`}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button onClick={() => update({ step: 1 })} style={{ padding: "12px 20px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>← Back</button>
                  <button
                    id="job-continue-btn"
                    disabled={loading || !(authMode === "id" ? jobLookupNumber.length === 6 : qrJobDone)}
                    onClick={() => handleJobLookup()}
                    style={{
                      flex: 1, padding: "13px", borderRadius: 11, border: "none", background: C.accent, color: C.white, fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
                      opacity: (loading || !(authMode === "id" ? jobLookupNumber.length >= 3 : qrJobDone)) ? 0.4 : 1
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
                        const mName = m.displayName;
                        const pName = m.processName;
                        const isSelected = machine === mName;
                        return (
                          <button key={idx} onClick={() => update({ machine: mName, selectedMachineObj: m })}
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
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span>{mName}</span>
                                {pName && <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{pName}</span>}
                              </div>
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
                          machine_workorder_id: resolveMachineWorkOrderId(),
                          work_status: Number(status),
                          token: "20A5g2n3cHGX2P7y35L8bDV7OHhyXM"
                        });
                        return;
                      }

                      update({ loading: true, error: "" });
                      try {
                        const machineWorkOrderId = resolveMachineWorkOrderId();

                        const machineWorkOrderIdStr = String(machineWorkOrderId ?? "").trim();
                        const statusStr = String(status ?? "").trim();
                        if (!machineWorkOrderIdStr || !statusStr) {
                          update({ error: "Machine mapping missing from API response. Re-open job and select machine again.", loading: false });
                          return;
                        }

                        const token = "20A5g2n3cHGX2P7y35L8bDV7OHhyXM";

                        const formData = new URLSearchParams();
                        formData.append("machine_workorder_id", machineWorkOrderIdStr);
                        formData.append("work_status", statusStr);
                        // Backward-compatible keys used by some backend variants.
                        formData.append("workorder_status", statusStr);
                        formData.append("work_status_id", statusStr);
                        formData.append("status", statusStr);
                        formData.append("empCode", String(empId || "").trim());
                        formData.append("jobCardNo", String(jobCard || jobLookupNumber || "").trim());
                        formData.append("token", token);

                        const res = await fetch("http://117.218.59.130/vasa_wo_api/work_order/work_status_change", {
                          method: "POST",
                          headers: { "Content-Type": "application/x-www-form-urlencoded" },
                          body: formData
                        });

                        let data = null;
                        let rawText = "";
                        const contentType = res.headers.get("content-type") || "";
                        if (contentType.includes("application/json")) {
                          data = await res.json();
                        } else {
                          rawText = await res.text();
                          try {
                            data = JSON.parse(rawText);
                          } catch {
                            data = null;
                            const text = await res.text();
                            console.log("Status update response:", text);
                            // Even if we fail to parse JSON, if it's 200 OK, we count it as success
                            update({ step: 5, loading: false });
                            onSync(true);
                          } catch (e) {
                            update({ step: 5, loading: false });
                            onSync(true);
                          }
                        }

                        if (res.ok && data?.status === 1) {
                          update({ step: 5, loading: false });
                        } else {
                          const backendMessage =
                            data?.msg ||
                            data?.message ||
                            (typeof rawText === "string" && rawText.trim().slice(0, 220)) ||
                            `Request failed (${res.status})`;
                          console.error("work_status_change failed", {
                            status: res.status,
                            response: data || rawText,
                            request: Object.fromEntries(formData.entries())
                          });
                          update({ error: backendMessage || "Failed to update status", loading: false });
                        }
                      } catch (err) {
                        update({ error: err?.message || "Failed to update status", loading: false });
                        const errorText = await res.text();
                        console.error("Status update error response:", errorText);
                        update({ error: `Server error (${res.status}). Check console.`, loading: false });
                        onSync(true);

                      } catch (err) {
                        console.error("Status update execution error:", err);
                        update({ error: "Connection error: " + err.message, loading: false });
                        onSync(false);
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
                    ["Machine", machine || "N/A", "'DM Sans',sans-serif"],
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
                  localStorage.removeItem("printech_emp_id");
                  setState(prev => ({
                    ...prev,
                    step: 1, authMode: "id", empId: "", jobLookupNumber: "", jobCard: "", machine: "", status: "", apiToken: "", scannerActive: false, scanError: "", error: "", currentJobData: null, selectedMachineObj: null
                  }));
                  setQrAuthDone(false);
                  setQrJobDone(false);
                }}
                  style={{ padding: "16px 32px", borderRadius: 12, border: "none", background: C.accent, color: C.white, fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 12px rgba(45, 125, 79, 0.3)" }}>
                  COMPLETE & LOGOUT →
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
function JobLookupPage({ empId, apiToken, onSync, triggerLookup }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanError, setScanError] = useState("");
  const inputRef = useRef(null);

  // Sticky Focus Helper
  const stickyFocus = (ref) => {
    setTimeout(() => {
      if (ref.current && document.activeElement !== ref.current) {
        ref.current.focus();
      }
    }, 150);
  };

  // Keep focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle Global Scans routed to this page
  useEffect(() => {
    if (triggerLookup) {
      setQuery(triggerLookup);
      // Wait for React to mount state before triggering search
      setTimeout(() => search(triggerLookup), 50);
    }
  }, [triggerLookup]);

  // Auto-fetch when query hits 6 digits
  useEffect(() => {
    if (query.trim().length === 6 && !loading && !searched) {
      search(query);
    }
  }, [query]);

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
      formData.append("token", apiToken);
      formData.append("jobCardNo", q);

      const res = await fetch("http://117.218.59.130/vasa_wo_api/work_order/viewAssignedJob", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      });
      const data = await res.json();

      if (data.status === 1 || data.job_card_id) {
        setResult(data.data || data);
        onSync(true);
      } else {
        setResult(null);
        setError(data.msg || "Job not found");
        onSync(true);
      }
    } catch (err) {
      setError("Connection error");
      onSync(false);
    } finally {
      setLoading(false);
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
    const pMap = { 1: 10, 2: 55, 3: 100 };
    return pMap[st] || 0;
  };

  const Timeline = ({ currentSt }) => {
    const steps = [
      { id: 1, label: "Pending" },
      { id: 2, label: "Ongoing" },
      { id: 3, label: "Completed" },
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


            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: 0.8, fontFamily: "'DM Mono',monospace" }}>JOB CARD NUMBER</label>
                  <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSearched(false); setResult(null); }} placeholder="Scan / Enter" 
                    onBlur={() => stickyFocus(inputRef)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", fontSize: 15.5, fontFamily: "'DM Mono',monospace", color: C.text, background: C.white, outline: "none", transition: "border 0.2s", width: "100%" }}
                    onFocus={e => e.target.style.border = `1.5px solid ${C.accent}`}
                  />
                </div>
                <button disabled={loading} onClick={() => search()}
                  style={{ alignSelf: "flex-end", padding: "13px 22px", borderRadius: 10, border: "none", background: C.accent, color: C.white, fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", opacity: loading ? 0.6 : 1, height: 49 }}>
                  {loading ? "..." : "◎ Search"}
                </button>
              </div>
            </div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 8, fontFamily: "'DM Mono',monospace" }}>Enter job card number to view live status</div>
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

              {/* Machine Activity section (Matches Admin "Machine Live Report") */}
              {result.machineWoList && result.machineWoList.length > 0 && (
                <div style={{ marginTop: 24, borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff4d4d", boxShadow: "0 0 8px #ff4d4d88" }} />
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.text, fontFamily: "'Lora',serif", letterSpacing: 0.5 }}>MACHINE LIVE REPORT</div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                      <thead>
                        <tr style={{ background: "#6b728022", textAlign: "left" }}>
                          <th style={{ padding: "10px 12px", fontSize: 10, color: C.muted, borderBottom: `1px solid ${C.border}`, fontFamily: "'DM Mono',monospace" }}>S.NO</th>
                          <th style={{ padding: "10px 12px", fontSize: 10, color: C.muted, borderBottom: `1px solid ${C.border}`, fontFamily: "'DM Mono',monospace" }}>MACHINE</th>
                          <th style={{ padding: "10px 12px", fontSize: 10, color: C.muted, borderBottom: `1px solid ${C.border}`, fontFamily: "'DM Mono',monospace" }}>OPERATOR</th>
                          <th style={{ padding: "10px 12px", fontSize: 10, color: C.muted, borderBottom: `1px solid ${C.border}`, fontFamily: "'DM Mono',monospace" }}>PROCESS</th>
                          <th style={{ padding: "10px 12px", fontSize: 10, color: C.muted, borderBottom: `1px solid ${C.border}`, fontFamily: "'DM Mono',monospace" }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.machineWoList.map((m, idx) => {
                          const jobFinished = (result.workorder_status || result.workOrderSts || result.status) >= 3;
                          const currentStatus = m.status || (jobFinished ? "Completed" : "Pending");
                          const isLive = !jobFinished && (currentStatus.toLowerCase().includes("going") || currentStatus.toLowerCase().includes("progress"));
                          return (
                            <tr key={idx} style={{ borderBottom: `1px solid #f0f0f0` }}>
                              <td style={{ padding: "12px", fontSize: 12, color: C.muted, fontFamily: "'DM Mono',monospace" }}>{idx + 1}</td>
                              <td style={{ padding: "12px", fontSize: 13, fontWeight: 600, color: C.text }}>{m.machine_name || m.machineName || "N/A"}</td>
                              <td style={{ padding: "12px", fontSize: 13, color: C.text }}>{m.operator_name || m.operatorName || "Pending"}</td>
                              <td style={{ padding: "12px", fontSize: 13, color: C.muted }}>{m.process_name || m.processName || "General"}</td>
                              <td style={{ padding: "12px" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: isLive ? "#f59e0b" : C.completed, padding: "3px 10px", borderRadius: 6, background: isLive ? "#fffbeb" : "#f0fdf4" }}>
                                  {isLive && (
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", animation: "pulse 1.5s infinite" }} />
                                  )}
                                  {currentStatus}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



/* ── ROOT ──────────────────────────────────────────────────── */
// Set this to true to prevent sending data to the live database
window.PRINTECH_DEV_MODE = false;

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
    currentJobData: null,
    selectedMachineObj: null,
    apiToken: ""
  });

  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState("just now");
  const [scanAlert, setScanAlert] = useState("");
  const scanBuffer = useRef("");
  const lastKeyTime = useRef(0);

  const handleSync = (online) => {
    setIsOnline(online);
    if (online) {
      setLastSync(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    }
  };

  const handleGlobalClick = () => {
    // We use a small timeout to let the browser finish any click/blur processing
    setTimeout(() => {
      if (active === "operator") {
        const step = state.step;
        const empInput = document.getElementById("operator-emp-input");
        const jobInput = document.getElementById("operator-job-input");
        
        // Only snap focus if we are in Step 1 or 2 and the focus isn't already there
        if (step === 1 && document.activeElement !== empInput) empInput?.focus();
        if (step === 2 && document.activeElement !== jobInput) jobInput?.focus();
      }
    }, 50);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const now = Date.now();
      // Reset buffer if delay > 100ms (standard for fast hardware scanners)
      if (now - lastKeyTime.current > 100) scanBuffer.current = "";
      lastKeyTime.current = now;

      if (e.key === "Enter") {
        const val = scanBuffer.current.trim().toUpperCase();
        scanBuffer.current = "";
        if (!val) return;

        // 1. ROUTE EMPLOYEE BADGES
        if (val.startsWith("EMP") && val.length >= 4) {
          setActive("operator");
          setState(prev => ({ ...prev, step: 2, empId: val }));
          localStorage.setItem("printech_emp_id", val);
          return;
        }

        // 2. ROUTE JOB CARDS (6 Digits)
        if (/^\d{6}$/.test(val)) {
          // If we ARE an operator and already logged in, stay in Operator Entry
          if (active === "operator" && state.empId) {
            setState(prev => ({ ...prev, jobLookupNumber: val }));
          } else {
            // Otherwise, switch to Job Lookup
            setActive("jobview");
            // Set a special flag to trigger search in JobLookupPage
            setState(prev => ({ ...prev, jobLookupNumber: val, triggerLookup: true }));
          }
          return;
        }

        // 3. INVALID CODES
        setScanAlert("Invalid QR Code: " + val);
        setTimeout(() => setScanAlert(""), 3000);
      } else if (e.key.length === 1) {
        scanBuffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, state.empId]);

  useEffect(() => {
    window.addEventListener("mouseup", handleGlobalClick);
    return () => window.removeEventListener("mouseup", handleGlobalClick);
  }, [active, state.step]);


  return (
    <div className="app-container" style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700;800&family=DM+Sans:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        select, input, button { font-family:inherit; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:#f0f4f1; } ::-webkit-scrollbar-thumb { background:#b7dfc8; border-radius:4px; }
        button:hover { filter: brightness(0.96); }

        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }

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

      <Sidebar active={active} setActive={setActive} isOnline={isOnline} lastSync={lastSync} />

      <div style={{ flex: 1, overflowY: "auto", minHeight: "100vh", position: "relative" }}>
        {/* Invalid QR Toast */}
        {scanAlert && (
          <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#dc2626", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 800, zIndex: 99999, boxShadow: "0 10px 30px rgba(0,0,0,0.3)", display: "flex", gap: 10, alignItems: "center", animation: "slideDown 0.3s ease" }}>
            <span style={{ fontSize: 20 }}>⚠</span> {scanAlert}
          </div>
        )}
        <style>{`
          @keyframes slideDown { from { top: -60px; opacity: 0; } to { top: 20px; opacity: 1; } }
        `}</style>

        <div style={{ display: active === "operator" ? "block" : "none", height: "100%" }}>
          <OperatorPage state={state} setState={setState} onSync={handleSync} />
        </div>
        <div style={{ display: active === "jobview" ? "block" : "none", height: "100%" }}>
          <JobLookupPage empId={state.empId} apiToken={state.apiToken} onSync={handleSync} triggerLookup={state.triggerLookup && state.jobLookupNumber} />
        </div>
      </div>
    </div>
  );
}
