import { useState, useEffect } from "react";

const REPORTS_KEY = "safereport-v1";
const ADMIN_PASS = "Admin2024";

const TIPOS = [
  { value: "condicion_insegura", label: "⚠️ Condición Insegura", color: "#ef4444" },
  { value: "sugerencia", label: "💡 Sugerencia", color: "#f59e0b" },
  { value: "oportunidad_mejora", label: "🔧 Oportunidad de Mejora", color: "#3b82f6" },
];

const AREAS = [
  "Matricería", "Moldes", "Preparaciones", "Laboratorio preparaciones",
  "Oficinas de producción", "Colaje", "Hornos", "Mantenimiento",
  "1era Inspección", "Esmaltado", "Clasificación Final", "Logística"
];

const PRIORIDADES = [
  { value: "alta", label: "Alta", color: "#ef4444" },
  { value: "media", label: "Media", color: "#f59e0b" },
  { value: "baja", label: "Baja", color: "#22c55e" },
];

const STATUSES = [
  { value: "nuevo", label: "Nuevo", color: "#6b7280", bg: "#f3f4f6" },
  { value: "en_proceso", label: "En Proceso", color: "#d97706", bg: "#fef3c7" },
  { value: "resuelto", label: "Resuelto", color: "#16a34a", bg: "#dcfce7" },
  { value: "descartado", label: "Descartado", color: "#dc2626", bg: "#fee2e2" },
];

// ── Storage helpers (localStorage) ──────────────────────────────────────────
function loadReports() {
  try { return JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]"); } catch { return []; }
}
function saveReports(list) {
  try { localStorage.setItem(REPORTS_KEY, JSON.stringify(list)); } catch {}
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const getStatus = v => STATUSES.find(s => s.value === v) || STATUSES[0];
const getTipo   = v => TIPOS.find(t => t.value === v)   || TIPOS[0];
const getPrior  = v => PRIORIDADES.find(p => p.value === v) || PRIORIDADES[1];

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle = err => ({
  width: "100%", padding: "11px 14px",
  border: `1.5px solid ${err ? "#ef4444" : "#e2e8f0"}`,
  borderRadius: 10, fontFamily: "'Sora',sans-serif", fontSize: 14,
  color: "#1a1a2e", background: "#fafafa", outline: "none", boxSizing: "border-box",
});
const selectStyle = err => ({
  ...inputStyle(err), cursor: "pointer", appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2364748b' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
});

// ── Small components ──────────────────────────────────────────────────────────
function Tag({ color, bg, children }) {
  return (
    <span style={{ display:"inline-block", padding:"3px 10px", background: bg||color+"15",
      color, border:`1px solid ${color}30`, borderRadius:999, fontSize:11,
      fontWeight:600, fontFamily:"'Sora',sans-serif", whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}
function FieldGroup({ label, error, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display:"block", fontFamily:"'Sora',sans-serif", fontSize:13,
        fontWeight:600, color:"#374151", marginBottom:8 }}>{label}</label>
      {children}
      {error && <div style={{ color:"#ef4444", fontSize:12, marginTop:4 }}>⚠ {error}</div>}
    </div>
  );
}
function InfoCell({ label, value }) {
  return (
    <div style={{ background:"#f8fafc", borderRadius:8, padding:"10px 12px" }}>
      <div style={{ fontFamily:"'Sora',sans-serif", fontSize:10, fontWeight:600, color:"#94a3b8", marginBottom:3 }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily:"'Sora',sans-serif", fontSize:13, color:"#1a1a2e", fontWeight:500 }}>{value}</div>
    </div>
  );
}
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"18px 20px" }}>
      <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
      <div style={{ fontFamily:"'Sora',sans-serif", fontSize:30, fontWeight:800, color }}>{value}</div>
      <div style={{ fontFamily:"'Sora',sans-serif", fontSize:12, color:"#64748b", marginTop:2 }}>{label}</div>
    </div>
  );
}
function BarItem({ label, value, color, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"'Sora',sans-serif", fontSize:12, marginBottom:5 }}>
        <span style={{ color:"#475569" }}>{label}</span>
        <span style={{ fontWeight:700, color }}>{value} <span style={{ color:"#94a3b8", fontWeight:400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height:8, background:"#f1f5f9", borderRadius:999, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:999, transition:"width .5s ease" }} />
      </div>
    </div>
  );
}
function ChartCard({ title, children }) {
  return (
    <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"20px 22px" }}>
      <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:15, color:"#1a1a2e", marginBottom:18 }}>{title}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>{children}</div>
    </div>
  );
}
function FilterSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ padding:"8px 32px 8px 12px", border:"1.5px solid #e2e8f0", borderRadius:8,
        fontFamily:"'Sora',sans-serif", fontSize:13, color:"#374151", background:"#fff",
        cursor:"pointer", appearance:"none",
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%2364748b' d='M5 6L0 0h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat:"no-repeat", backgroundPosition:"right 10px center" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Survey Form ───────────────────────────────────────────────────────────────
function SurveyForm({ reports, setReports }) {
  const [form, setForm] = useState({ type:"", area:"", lugar:"", description:"", reporter:"", priority:"media" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.type) e.type = "Selecciona un tipo";
    if (!form.area) e.area = "Selecciona un área";
    if (!form.description || form.description.length < 10) e.description = "Describe con al menos 10 caracteres";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const report = {
      id: Date.now().toString(), ...form,
      status:"nuevo", actionPlan:"", comments:[],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const updated = [report, ...reports];
    saveReports(updated);
    setReports(updated);
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      minHeight:"60vh", gap:20, textAlign:"center", padding:"0 20px" }}>
      <div style={{ width:80, height:80, borderRadius:"50%",
        background:"linear-gradient(135deg,#22c55e,#16a34a)",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>✓</div>
      <div style={{ fontFamily:"'Sora',sans-serif", fontSize:26, fontWeight:700, color:"#1a1a2e" }}>¡Reporte enviado!</div>
      <div style={{ color:"#64748b", fontSize:15, maxWidth:360 }}>
        Gracias por contribuir a un ambiente más seguro. Tu reporte fue registrado y será atendido.
      </div>
      <button onClick={() => { setSubmitted(false); setForm({ type:"", area:"", description:"", reporter:"", priority:"media" }); }}
        style={{ marginTop:8, padding:"12px 32px", background:"#1a1a2e", color:"#fff",
          border:"none", borderRadius:10, fontFamily:"'Sora',sans-serif", fontWeight:600,
          fontSize:14, cursor:"pointer" }}>
        Enviar otro reporte
      </button>
    </div>
  );

  const inp = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const clearErr = f => setErrors(e => { const n={...e}; delete n[f]; return n; });

  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"32px 20px 60px" }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"#1a1a2e",
          color:"#f59e0b", padding:"8px 20px", borderRadius:999, fontSize:13, fontWeight:700,
          fontFamily:"'Sora',sans-serif", marginBottom:18, letterSpacing:1 }}>
          🛡️ REPORTE DE SEGURIDAD
        </div>
        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:28, fontWeight:800, color:"#1a1a2e", lineHeight:1.2 }}>
          Reporta · Sugiere · Mejora
        </div>
        <div style={{ color:"#64748b", fontSize:14, marginTop:8 }}>
          Tu reporte ayuda a crear un mejor lugar de trabajo
        </div>
      </div>

      <FieldGroup label="¿Qué deseas reportar?" error={errors.type}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {TIPOS.map(t => (
            <button key={t.value} onClick={() => { inp("type", t.value); clearErr("type"); }}
              style={{ padding:"14px 8px", border:`2px solid ${form.type===t.value ? t.color:"#e2e8f0"}`,
                borderRadius:12, background: form.type===t.value ? t.color+"15":"#fff",
                cursor:"pointer", textAlign:"center", fontFamily:"'Sora',sans-serif", fontSize:12,
                fontWeight: form.type===t.value ? 700:500,
                color: form.type===t.value ? t.color:"#475569", transition:"all .15s" }}>
              {t.label}
            </button>
          ))}
        </div>
      </FieldGroup>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <FieldGroup label="Área" error={errors.area}>
          <select value={form.area} onChange={e => { inp("area", e.target.value); clearErr("area"); }}
            style={selectStyle(!!errors.area)}>
            <option value="">Selecciona...</option>
            {AREAS.map(a => <option key={a}>{a}</option>)}
          </select>
        </FieldGroup>
        <FieldGroup label="Prioridad">
          <select value={form.priority} onChange={e => inp("priority", e.target.value)} style={selectStyle(false)}>
            {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </FieldGroup>
      </div>

      <FieldGroup label="Lugar / Ubicación exacta">
        <input value={form.lugar} onChange={e => inp("lugar", e.target.value)}
          placeholder="Ej: Línea 3, máquina 7, pasillo norte, estante B..."
          style={inputStyle(false)} />
      </FieldGroup>

      <FieldGroup label="Descripción detallada" error={errors.description}>
        <textarea value={form.description} onChange={e => { inp("description", e.target.value); clearErr("description"); }}
          placeholder="Describe el problema, ubicación exacta, riesgo o situación observada..."
          rows={4} style={{ ...inputStyle(!!errors.description), resize:"vertical", lineHeight:1.6 }} />
        <div style={{ textAlign:"right", fontSize:11, color: form.description.length<10?"#ef4444":"#94a3b8", marginTop:4 }}>
          {form.description.length} caracteres
        </div>
      </FieldGroup>

      <FieldGroup label="Tu nombre (opcional)">
        <input value={form.reporter} onChange={e => inp("reporter", e.target.value)}
          placeholder="Puedes reportar de forma anónima" style={inputStyle(false)} />
      </FieldGroup>

      <button onClick={handleSubmit}
        style={{ width:"100%", padding:16, background:"linear-gradient(135deg,#1a1a2e,#2d3561)",
          color:"#fff", border:"none", borderRadius:12, fontFamily:"'Sora',sans-serif",
          fontWeight:700, fontSize:16, cursor:"pointer", letterSpacing:0.5,
          boxShadow:"0 4px 20px rgba(26,26,46,.25)" }}>
        📤 Enviar Reporte
      </button>
    </div>
  );
}

// ── Admin Login ───────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const handle = () => { if (pass === ADMIN_PASS) onLogin(); else setErr("Contraseña incorrecta"); };
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"70vh" }}>
      <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:20, padding:40,
        width:"100%", maxWidth:360, boxShadow:"0 8px 40px rgba(0,0,0,.07)", textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:"#1a1a2e", marginBottom:6 }}>
          Panel de Administración
        </div>
        <div style={{ color:"#64748b", fontSize:13, marginBottom:28 }}>Ingresa tu contraseña para continuar</div>
        <input type="password" value={pass} onChange={e => { setPass(e.target.value); setErr(""); }}
          onKeyDown={e => e.key==="Enter" && handle()}
          placeholder="Contraseña" style={{ ...inputStyle(!!err), marginBottom:12, textAlign:"center" }} />
        {err && <div style={{ color:"#ef4444", fontSize:13, marginBottom:12 }}>⚠ {err}</div>}
        <button onClick={handle} style={{ width:"100%", padding:13, background:"#1a1a2e",
          color:"#fff", border:"none", borderRadius:10, fontFamily:"'Sora',sans-serif",
          fontWeight:700, fontSize:15, cursor:"pointer" }}>
          Ingresar
        </button>
      </div>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard({ reports, setReports, onLogout }) {
  const [tab, setTab]           = useState("reports");
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType]     = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterArea, setFilterArea]     = useState("all");
  const [editPlan, setEditPlan]         = useState("");
  const [editComment, setEditComment]   = useState("");
  const [copied, setCopied]             = useState(false);

  const persist = (updated) => { saveReports(updated); setReports(updated); };

  const updateStatus = (id, status) => {
    const upd = reports.map(r => r.id===id ? {...r, status, updatedAt:new Date().toISOString()} : r);
    persist(upd);
    if (selected?.id===id) setSelected(upd.find(r => r.id===id));
  };
  const savePlan = (id) => {
    const upd = reports.map(r => r.id===id ? {...r, actionPlan:editPlan, updatedAt:new Date().toISOString()} : r);
    persist(upd);
    if (selected?.id===id) setSelected(upd.find(r => r.id===id));
  };
  const addComment = (id) => {
    if (!editComment.trim()) return;
    const comment = { text:editComment, date:new Date().toISOString() };
    const upd = reports.map(r => r.id===id ? {...r, comments:[...(r.comments||[]),comment], updatedAt:new Date().toISOString()} : r);
    persist(upd);
    if (selected?.id===id) setSelected(upd.find(r => r.id===id));
    setEditComment("");
  };
  const deleteReport = (id) => {
    if (!window.confirm("¿Eliminar este reporte?")) return;
    persist(reports.filter(r => r.id!==id));
    setSelected(null);
  };

  const filtered = reports.filter(r =>
    (filterType==="all"   || r.type===filterType) &&
    (filterStatus==="all" || r.status===filterStatus) &&
    (filterArea==="all"   || r.area===filterArea)
  );

  const stats = {
    total:      reports.length,
    nuevo:      reports.filter(r => r.status==="nuevo").length,
    en_proceso: reports.filter(r => r.status==="en_proceso").length,
    resuelto:   reports.filter(r => r.status==="resuelto").length,
    condicion:  reports.filter(r => r.type==="condicion_insegura").length,
    sugerencia: reports.filter(r => r.type==="sugerencia").length,
    mejora:     reports.filter(r => r.type==="oportunidad_mejora").length,
    alta:       reports.filter(r => r.priority==="alta").length,
  };

  const areaStats = AREAS.map(a => ({ area:a, count:reports.filter(r => r.area===a).length }))
    .filter(a => a.count>0).sort((a,b) => b.count-a.count);

  const surveyUrl = window.location.origin;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(surveyUrl)}&color=1a1a2e&bgcolor=ffffff&margin=2`;

  const TABS = [
    { id:"reports",  label:"📋 Reportes",     count:reports.length },
    { id:"stats",    label:"📊 Estadísticas" },
    { id:"qr",       label:"🔗 Acceso QR" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      {/* Topbar */}
      <div style={{ background:"#1a1a2e", color:"#fff", padding:"0 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between", height:56 }}>
        <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16,
          display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:"#f59e0b" }}>🛡️</span> Panel de Seguridad
        </div>
        <button onClick={onLogout} style={{ background:"rgba(255,255,255,.1)", border:"none",
          color:"#fff", padding:"6px 16px", borderRadius:8,
          fontFamily:"'Sora',sans-serif", fontSize:12, cursor:"pointer" }}>
          Cerrar sesión
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background:"#fff", borderBottom:"1.5px solid #e2e8f0",
        padding:"0 24px", display:"flex", gap:4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:"14px 20px", border:"none", background:"none", cursor:"pointer",
              fontFamily:"'Sora',sans-serif", fontSize:13,
              fontWeight: tab===t.id ? 700:500,
              color: tab===t.id ? "#1a1a2e":"#64748b",
              borderBottom: tab===t.id ? "2.5px solid #f59e0b":"2.5px solid transparent",
              marginBottom:-1 }}>
            {t.label}{t.count!==undefined ? ` (${t.count})`:""  }
          </button>
        ))}
      </div>

      <div style={{ padding:24, maxWidth:1200, margin:"0 auto" }}>

        {/* ── REPORTS ── */}
        {tab==="reports" && (
          <div style={{ display:"grid", gridTemplateColumns: selected?"1fr 420px":"1fr", gap:20 }}>
            <div>
              {/* Filters */}
              <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                <FilterSelect value={filterType} onChange={setFilterType}
                  options={[{value:"all",label:"Todos los tipos"},...TIPOS.map(t=>({value:t.value,label:t.label}))]} />
                <FilterSelect value={filterStatus} onChange={setFilterStatus}
                  options={[{value:"all",label:"Todos los estados"},...STATUSES.map(s=>({value:s.value,label:s.label}))]} />
                <FilterSelect value={filterArea} onChange={setFilterArea}
                  options={[{value:"all",label:"Todas las áreas"},...AREAS.map(a=>({value:a,label:a}))]} />
                <div style={{ marginLeft:"auto", fontFamily:"'Sora',sans-serif", fontSize:13, color:"#64748b" }}>
                  {filtered.length} resultado(s)
                </div>
              </div>

              {filtered.length===0 ? (
                <div style={{ textAlign:"center", padding:"60px 20px", color:"#94a3b8", fontFamily:"'Sora',sans-serif" }}>
                  <div style={{ fontSize:40 }}>📭</div>
                  <div style={{ marginTop:12, fontSize:15 }}>No hay reportes que coincidan</div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {filtered.map(r => {
                    const tipo = getTipo(r.type);
                    const st   = getStatus(r.status);
                    const pr   = getPrior(r.priority);
                    const isSel = selected?.id===r.id;
                    return (
                      <div key={r.id}
                        onClick={() => { setSelected(isSel?null:r); setEditPlan(r.actionPlan||""); setEditComment(""); }}
                        style={{ background:"#fff",
                          border:`1.5px solid ${isSel?"#f59e0b":"#e2e8f0"}`,
                          borderRadius:14, padding:"16px 18px", cursor:"pointer",
                          boxShadow: isSel?"0 2px 16px rgba(245,158,11,.15)":"0 1px 4px rgba(0,0,0,.04)" }}>
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                          <Tag color={tipo.color}>{tipo.label}</Tag>
                          <Tag color={st.color} bg={st.bg}>{st.label}</Tag>
                          <Tag color={pr.color}>{pr.label}</Tag>
                          <Tag color="#64748b" bg="#f1f5f9">📍 {r.area}</Tag>
                        </div>
                        <div style={{ fontFamily:"'Sora',sans-serif", fontSize:14, color:"#1a1a2e",
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {r.description}
                        </div>
                        <div style={{ fontSize:11, color:"#94a3b8", marginTop:6, fontFamily:"'Sora',sans-serif" }}>
                          {r.reporter ? `👤 ${r.reporter}` : "👤 Anónimo"} · {formatDate(r.createdAt)}
                          {r.actionPlan ? " · 📝 Con plan de acción" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selected && (
              <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:16,
                padding:22, height:"fit-content", position:"sticky", top:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16, color:"#1a1a2e" }}>
                    Detalle del Reporte
                  </div>
                  <button onClick={() => setSelected(null)}
                    style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#94a3b8" }}>×</button>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
                  <InfoCell label="Tipo"       value={getTipo(selected.type).label} />
                  <InfoCell label="Área"       value={`📍 ${selected.area}`} />
                  <InfoCell label="Prioridad"  value={getPrior(selected.priority).label} />
                  <InfoCell label="Reportó"    value={selected.reporter||"Anónimo"} />
                  <InfoCell label="Fecha"      value={formatDate(selected.createdAt)} />
                  <InfoCell label="Actualizado" value={formatDate(selected.updatedAt)} />
                </div>

                {selected.lugar && (
                  <div style={{ marginBottom:18 }}>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>LUGAR / UBICACIÓN EXACTA</div>
                    <div style={{ fontFamily:"'Sora',sans-serif", fontSize:14, color:"#1a1a2e", background:"#f8fafc", padding:"10px 12px", borderRadius:8 }}>📌 {selected.lugar}</div>
                  </div>
                )}

                <div style={{ marginBottom:18 }}>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:600, color:"#64748b", marginBottom:6 }}>DESCRIPCIÓN</div>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontSize:14, color:"#1a1a2e", lineHeight:1.7,
                    background:"#f8fafc", padding:12, borderRadius:8 }}>
                    {selected.description}
                  </div>
                </div>

                <div style={{ marginBottom:18 }}>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:600, color:"#64748b", marginBottom:8 }}>CAMBIAR ESTADO</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {STATUSES.map(s => (
                      <button key={s.value} onClick={() => updateStatus(selected.id, s.value)}
                        style={{ padding:"7px 14px",
                          border:`1.5px solid ${selected.status===s.value ? s.color:"#e2e8f0"}`,
                          borderRadius:8, background: selected.status===s.value ? s.bg:"#fff",
                          color: selected.status===s.value ? s.color:"#64748b",
                          fontFamily:"'Sora',sans-serif", fontSize:12,
                          fontWeight: selected.status===s.value ? 700:500, cursor:"pointer" }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom:18 }}>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:600, color:"#64748b", marginBottom:8 }}>PLAN DE ACCIÓN</div>
                  <textarea value={editPlan} onChange={e => setEditPlan(e.target.value)}
                    placeholder="Define responsable, acciones a tomar, fecha compromiso..."
                    rows={3} style={{ ...inputStyle(false), resize:"vertical", fontSize:13, marginBottom:8 }} />
                  <button onClick={() => savePlan(selected.id)}
                    style={{ width:"100%", padding:9, background:"#1a1a2e", color:"#fff",
                      border:"none", borderRadius:8, fontFamily:"'Sora',sans-serif",
                      fontSize:13, fontWeight:600, cursor:"pointer" }}>
                    💾 Guardar plan
                  </button>
                </div>

                <div style={{ marginBottom:12 }}>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:600, color:"#64748b", marginBottom:8 }}>SEGUIMIENTO</div>
                  {(selected.comments||[]).map((c,i) => (
                    <div key={i} style={{ background:"#f8fafc", borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
                      <div style={{ fontFamily:"'Sora',sans-serif", fontSize:13, color:"#1a1a2e" }}>{c.text}</div>
                      <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>{formatDate(c.date)}</div>
                    </div>
                  ))}
                  <div style={{ display:"flex", gap:8 }}>
                    <input value={editComment} onChange={e => setEditComment(e.target.value)}
                      onKeyDown={e => e.key==="Enter" && addComment(selected.id)}
                      placeholder="Agregar nota de seguimiento..."
                      style={{ ...inputStyle(false), flex:1, fontSize:13 }} />
                    <button onClick={() => addComment(selected.id)}
                      style={{ padding:"0 14px", background:"#f59e0b", color:"#fff",
                        border:"none", borderRadius:8, fontFamily:"'Sora',sans-serif",
                        fontWeight:700, cursor:"pointer" }}>→</button>
                  </div>
                </div>

                <button onClick={() => deleteReport(selected.id)}
                  style={{ width:"100%", padding:9, background:"none", color:"#ef4444",
                    border:"1.5px solid #fecaca", borderRadius:8,
                    fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer", marginTop:4 }}>
                  🗑 Eliminar reporte
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STATS ── */}
        {tab==="stats" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:28 }}>
              <StatCard icon="📋" label="Total Reportes"  value={stats.total}      color="#6366f1" />
              <StatCard icon="🆕" label="Nuevos"          value={stats.nuevo}      color="#f59e0b" />
              <StatCard icon="⚙️" label="En Proceso"      value={stats.en_proceso} color="#3b82f6" />
              <StatCard icon="✅" label="Resueltos"        value={stats.resuelto}   color="#22c55e" />
              <StatCard icon="🚨" label="Alta Prioridad"  value={stats.alta}       color="#ef4444" />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <ChartCard title="Por Tipo de Reporte">
                <BarItem label="⚠️ Condiciones Inseguras"     value={stats.condicion}  color="#ef4444" total={stats.total} />
                <BarItem label="💡 Sugerencias"               value={stats.sugerencia} color="#f59e0b" total={stats.total} />
                <BarItem label="🔧 Oportunidades de Mejora"   value={stats.mejora}     color="#3b82f6" total={stats.total} />
              </ChartCard>
              <ChartCard title="Por Estado">
                {STATUSES.map(s => (
                  <BarItem key={s.value} label={s.label}
                    value={reports.filter(r => r.status===s.value).length}
                    color={s.color} total={stats.total} />
                ))}
              </ChartCard>
              <ChartCard title="Por Área (Top 5)">
                {areaStats.slice(0,5).map(a => (
                  <BarItem key={a.area} label={`📍 ${a.area}`} value={a.count} color="#6366f1" total={stats.total} />
                ))}
                {areaStats.length===0 && <div style={{ color:"#94a3b8", fontSize:13, textAlign:"center", padding:20 }}>Sin datos aún</div>}
              </ChartCard>
              <ChartCard title="Por Prioridad">
                {PRIORIDADES.map(p => (
                  <BarItem key={p.value} label={p.label}
                    value={reports.filter(r => r.priority===p.value).length}
                    color={p.color} total={stats.total} />
                ))}
              </ChartCard>
            </div>
          </div>
        )}

        {/* ── QR ── */}
        {tab==="qr" && (
          <div style={{ maxWidth:680, margin:"0 auto" }}>
            <div style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:20, padding:36, textAlign:"center" }}>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:"#1a1a2e", marginBottom:6 }}>
                Acceso al Formulario
              </div>
              <div style={{ color:"#64748b", fontSize:14, marginBottom:32 }}>
                Comparte este código QR o enlace con tu equipo
              </div>
              <div style={{ display:"inline-block", padding:16, background:"#fff",
                border:"3px solid #1a1a2e", borderRadius:16, marginBottom:24 }}>
                <img src={qrUrl} alt="QR Code" style={{ display:"block", width:220, height:220 }} />
              </div>
              <div style={{ background:"#f8fafc", borderRadius:12, padding:"14px 20px",
                marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ flex:1, fontFamily:"monospace", fontSize:13, color:"#475569",
                  wordBreak:"break-all", textAlign:"left" }}>{surveyUrl}</div>
                <button onClick={() => { navigator.clipboard?.writeText(surveyUrl); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                  style={{ padding:"8px 16px", background: copied?"#22c55e":"#1a1a2e",
                    color:"#fff", border:"none", borderRadius:8,
                    fontFamily:"'Sora',sans-serif", fontSize:12, fontWeight:600,
                    cursor:"pointer", whiteSpace:"nowrap", transition:"background .3s" }}>
                  {copied ? "✓ Copiado" : "Copiar enlace"}
                </button>
              </div>
              <div style={{ background:"#fef3c7", borderRadius:12, padding:18, textAlign:"left" }}>
                <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:14, color:"#92400e", marginBottom:8 }}>
                  💡 Cómo compartir
                </div>
                <ul style={{ fontFamily:"'Sora',sans-serif", fontSize:13, color:"#78350f",
                  lineHeight:1.8, paddingLeft:18, margin:0 }}>
                  <li>Imprime el código QR y pégalo en las áreas de trabajo</li>
                  <li>Envía el enlace por WhatsApp, email o Slack</li>
                  <li>Funciona en celular y computadora</li>
                  <li>Los reportes se guardan en este mismo servidor</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── NavBar ────────────────────────────────────────────────────────────────────
function NavBar({ view, setView, isAdmin }) {
  return (
    <div style={{ background:"#fff", borderBottom:"1.5px solid #e2e8f0",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 20px", height:50, position:"sticky", top:0, zIndex:100 }}>
      <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15,
        color:"#1a1a2e", display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ background:"#f59e0b", color:"#fff", width:28, height:28, borderRadius:8,
          display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🛡️</span>
        SafeReport
      </div>
      {!isAdmin && (
        <button onClick={() => setView(view==="survey" ? "admin-login" : "survey")}
          style={{ background:"none", border:"1.5px solid #e2e8f0", color:"#64748b",
            padding:"6px 14px", borderRadius:8, fontFamily:"'Sora',sans-serif",
            fontSize:12, cursor:"pointer" }}>
          {view==="survey" ? "🔒 Admin" : "← Volver al formulario"}
        </button>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]       = useState("survey");
  const [reports, setReports] = useState([]);

  useEffect(() => { setReports(loadReports()); }, []);

  const isAdmin = view === "admin";

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <NavBar view={view} setView={setView} isAdmin={isAdmin} />
      {view==="survey"      && <SurveyForm reports={reports} setReports={setReports} />}
      {view==="admin-login" && <AdminLogin onLogin={() => setView("admin")} />}
      {view==="admin"       && <AdminDashboard reports={reports} setReports={setReports} onLogout={() => setView("survey")} />}
    </div>
  );
}
