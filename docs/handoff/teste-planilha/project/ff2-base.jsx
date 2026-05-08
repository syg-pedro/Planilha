// ff2-base.jsx — Base UI components for Financeiro Familiar v2
// Exports to window: Icon, Btn, Badge, Panel, Field, Input, Select, Textarea,
// Checkbox, Modal, KpiCard, ProgressBar, MiniSparkline, DonutRing, BarChart

const { useState, useEffect, useRef } = React;

// ── Icons ────────────────────────────────────────────────────
const ICON_PATHS = {
  dashboard: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3h2m4 0h-4m0 0V14m0 4v3",
  grid: "M3 6h18M3 12h18M3 18h18",
  calendar: "M3 4h18v16H3zM16 2v4M8 2v4M3 10h18",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zm6.4-3a6.4 6.4 0 01-.1 1.1l2.4 1.9-2.3 4-2.8-1.1a7 7 0 01-1.9 1.1L13 22h-2l-.7-2.9a7 7 0 01-1.9-1.1L5.6 19 3.3 15l2.4-1.9A6.4 6.4 0 015.6 12a6.4 6.4 0 01.1-1.1L3.3 9l2.3-4 2.8 1.1A7 7 0 0110.3 5L11 2h2l.7 2.9a7 7 0 011.9 1.1l2.8-1.1 2.3 4-2.4 1.9a6.4 6.4 0 01.1 1.1z",
  budget: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 14.5v2h-2v-2H7v-2l1-5h8l1 5h-4v2zm0-6H11V7h2v3.5z",
  goal: "M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 18l-6.1 3 1.2-6.8L2 9.3l6.9-1z",
  subscription: "M21 4H3v16h18V4zM3 8h18M7 12h.01M11 12h.01M15 12h.01",
  debt: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM8 11h8M8 13h5",
  patrimony: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  planning: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  scenario: "M22 12h-4l-3 9L9 3l-3 9H2",
  reports: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zm-2 16H8v-2h4zm2-4H8v-2h6zm0-4H8V8h6zm0-4H8V6h2l4 4h-2z",
  reconcile: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  alerts: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0",
  income: "M18 15l-6-6-6 6",
  expense: "M6 9l6 6 6-6",
  balance: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  pending: "M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM12 6v6l4 2",
  card: "M1 4h22v16H1zM1 10h22",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  trash: "M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z",
  chevron_down: "M6 9l6 6 6-6",
  chevron_right: "M9 18l6-6-6-6",
  chevron_left: "M15 18l-6-6 6-6",
  menu: "M3 6h18M3 12h18M3 18h18",
  refresh: "M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0115 0M20.5 15a9 9 0 01-15 0",
  warning: "M10.3 3.9L1.8 18a2 2 0 001.7 3h16.9a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0zM12 9v4M12 17h.01",
  info: "M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM12 16v-4M12 8h.01",
  arrow_up_right: "M7 17L17 7M7 7h10v10",
  tag: "M20.6 8.3l-4.9-4.9A2 2 0 0014.3 3H7a2 2 0 00-2 2v7.3a2 2 0 00.6 1.4l4.9 4.9a2 2 0 002.8 0l7.3-7.3a2 2 0 000-2.8zM9 9h.01",
  export: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  sparkle: "M5 3l.5 2.5L8 6l-2.5.5L5 9l-.5-2.5L2 6l2.5-.5zM19 3l.5 2.5L22 6l-2.5.5L19 9l-.5-2.5L16 6l2.5-.5zM12 13l1 4 4 1-4 1-1 4-1-4-4-1 4-1z",
};

const Icon = ({ name, size=16, color='currentColor', style={} }) => {
  const d = ICON_PATHS[name] || ICON_PATHS.info;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink:0, ...style }}>
      <path d={d} />
    </svg>
  );
};

// ── Button ────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant='secondary', size='md', disabled=false, icon, style={} }) => {
  const sz = size==='sm' ? { padding:'5px 12px', fontSize:12, gap:5 }
           : size==='lg' ? { padding:'11px 22px', fontSize:15, gap:8 }
           : { padding:'8px 16px', fontSize:13, gap:6 };
  const vr = {
    primary:   { background:'var(--primary)',  color:'#fff', border:'none' },
    secondary: { background:'var(--surface2)', color:'var(--text)',  border:'1px solid var(--border)' },
    ghost:     { background:'transparent',     color:'var(--text2)', border:'1px solid var(--border)' },
    danger:    { background:'var(--danger)',    color:'#fff', border:'none' },
    success:   { background:'var(--success)',   color:'#fff', border:'none' },
    subtle:    { background:'var(--primary-dim)', color:'var(--primary)', border:'none' },
  }[variant] || {};
  return (
    <button disabled={disabled} onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', borderRadius:'var(--radius-sm)',
      cursor: disabled?'not-allowed':'pointer', fontFamily:'Plus Jakarta Sans', fontWeight:600,
      transition:'all 0.15s', opacity: disabled?0.5:1, ...sz, ...vr, ...style,
    }}
      onMouseEnter={e=>{ if(!disabled){ e.currentTarget.style.filter='brightness(1.08)'; e.currentTarget.style.transform='translateY(-1px)'; }}}
      onMouseLeave={e=>{ e.currentTarget.style.filter=''; e.currentTarget.style.transform=''; }}
    >
      {icon && <Icon name={icon} size={sz.fontSize+2} />}
      {children}
    </button>
  );
};

// ── Badge ─────────────────────────────────────────────────────
const Badge = ({ children, tone='neutral', dot=false }) => {
  const tones = {
    success: { bg:'var(--success-light)', color:'var(--success)' },
    danger:  { bg:'var(--danger-light)',  color:'var(--danger)'  },
    warning: { bg:'var(--warning-light)', color:'var(--warning)' },
    primary: { bg:'var(--primary-dim)',   color:'var(--primary)' },
    neutral: { bg:'var(--surface2)',      color:'var(--text2)'   },
    purple:  { bg:'oklch(92% 0.06 295)', color:'oklch(50% 0.2 295)' },
  };
  const s = tones[tone] || tones.neutral;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'2px 9px', borderRadius:99, fontSize:11, fontWeight:700, background:s.bg, color:s.color, whiteSpace:'nowrap' }}>
      {dot && <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor' }} />}
      {children}
    </span>
  );
};

// ── Panel ─────────────────────────────────────────────────────
const Panel = ({ title, subtitle, action, children, style={}, noPad=false }) => (
  <div style={{ background:'var(--surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)', overflow:'hidden', ...style }}>
    {(title||action) && (
      <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, borderBottom: children ? '1px solid var(--border)' : 'none' }}>
        <div>
          {title && <h3 style={{ fontSize:14, fontWeight:700, color:'var(--text)', lineHeight:1.3 }}>{title}</h3>}
          {subtitle && <p style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{subtitle}</p>}
        </div>
        {action && <div style={{ flexShrink:0 }}>{action}</div>}
      </div>
    )}
    {children && <div style={noPad ? {} : { padding:'16px 18px' }}>{children}</div>}
  </div>
);

// ── Field ─────────────────────────────────────────────────────
const Field = ({ label, hint, children, col2=false, style={} }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5, gridColumn: col2?'span 2':'auto', ...style }}>
    <label style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</label>
    {children}
    {hint && <p style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{hint}</p>}
  </div>
);

// ── Input ─────────────────────────────────────────────────────
const Input = ({ value, onChange, type='text', placeholder, prefix, suffix, readOnly=false }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface2)', border:`1.5px solid ${focused?'var(--primary)':'var(--border)'}`, borderRadius:'var(--radius-xs)', padding:'0 12px', height:38, transition:'border-color 0.15s, box-shadow 0.15s', boxShadow: focused?'0 0 0 3px var(--primary-dim)':'none' }}>
      {prefix && <span style={{ color:'var(--text3)', fontSize:13, flexShrink:0 }}>{prefix}</span>}
      <input value={value} onChange={onChange} type={type} placeholder={placeholder} readOnly={readOnly} style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:13, color:'var(--text)', fontFamily:'Plus Jakarta Sans', minWidth:0 }} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} />
      {suffix && <span style={{ color:'var(--text3)', fontSize:13, flexShrink:0 }}>{suffix}</span>}
    </div>
  );
};

// ── Select ────────────────────────────────────────────────────
const Select = ({ value, onChange, children, placeholder='Selecionar...' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = React.Children.toArray(children).filter(c=>c.type==='option').map(c=>({ value:String(c.props.value??''), label:String(c.props.children) }));
  const selected = options.find(o=>String(o.value)===String(value));
  useEffect(() => {
    const h = e => { if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position:'relative', userSelect:'none' }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, background:'var(--surface2)', border:`1.5px solid ${open?'var(--primary)':'var(--border)'}`, borderRadius: open?'var(--radius-xs) var(--radius-xs) 0 0':'var(--radius-xs)', padding:'0 12px', height:38, cursor:'pointer', transition:'border-color 0.15s', boxShadow: open?'0 0 0 3px var(--primary-dim)':'none' }}>
        <span style={{ fontSize:13, color:selected?'var(--text)':'var(--text3)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selected?selected.label:placeholder}</span>
        <span style={{ color:'var(--text3)', transition:'transform 0.2s', transform:open?'rotate(180deg)':'none', display:'flex' }}><Icon name="chevron_down" size={14} /></span>
      </div>
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:500, background:'var(--surface)', border:'1.5px solid var(--primary)', borderTop:'none', borderRadius:'0 0 var(--radius-xs) var(--radius-xs)', boxShadow:'var(--shadow-md)', maxHeight:220, overflowY:'auto' }}>
          {options.map((opt,i) => {
            const sel = String(opt.value)===String(value);
            return (
              <div key={i} onMouseDown={e=>{e.preventDefault();onChange({target:{value:opt.value}});setOpen(false);}} style={{ padding:'9px 12px', fontSize:13, cursor:'pointer', color:sel?'var(--primary)':'var(--text)', background:sel?'var(--primary-dim)':'transparent', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'background 0.1s' }}
                onMouseEnter={e=>{if(!sel)e.currentTarget.style.background='var(--surface2)';}}
                onMouseLeave={e=>{if(!sel)e.currentTarget.style.background='transparent';}}>
                <span>{opt.label}</span>
                {sel && <Icon name="check" size={13} color="var(--primary)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Textarea ──────────────────────────────────────────────────
const Textarea = ({ value, onChange, placeholder, rows=3 }) => {
  const [focused, setFocused] = useState(false);
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ background:'var(--surface2)', border:`1.5px solid ${focused?'var(--primary)':'var(--border)'}`, borderRadius:'var(--radius-xs)', padding:'9px 12px', fontSize:13, color:'var(--text)', fontFamily:'Plus Jakarta Sans', outline:'none', resize:'vertical', transition:'border-color 0.15s, box-shadow 0.15s', boxShadow: focused?'0 0 0 3px var(--primary-dim)':'none', width:'100%' }}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} />
  );
};

// ── Checkbox ──────────────────────────────────────────────────
const Checkbox = ({ checked, onChange, label }) => (
  <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
    <div onClick={()=>onChange({target:{checked:!checked}})} style={{ width:18, height:18, borderRadius:5, flexShrink:0, border:`2px solid ${checked?'var(--primary)':'var(--border-strong)'}`, background:checked?'var(--primary)':'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', cursor:'pointer' }}>
      {checked && <Icon name="check" size={11} color="#fff" />}
    </div>
    {label && <span style={{ fontSize:13, color:'var(--text)' }}>{label}</span>}
  </label>
);

// ── Modal ─────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, subtitle, children, width=580 }) => {
  useEffect(()=>{ document.body.style.overflow=open?'hidden':''; return()=>{document.body.style.overflow=''}; },[open]);
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'oklch(0% 0 0 / 0.5)', backdropFilter:'blur(4px)' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ background:'var(--surface)', borderRadius:20, width:'100%', maxWidth:width, maxHeight:'92dvh', overflowY:'auto', boxShadow:'var(--shadow-lg)', border:'1px solid var(--border)' }}>
        <div style={{ padding:'18px 22px 14px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'1px solid var(--border)', gap:12 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>{title}</h2>
            {subtitle && <p style={{ fontSize:12, color:'var(--text3)', marginTop:3 }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', display:'flex', padding:4, borderRadius:8 }} onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='none'}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ padding:'20px 22px' }}>{children}</div>
      </div>
    </div>
  );
};

// ── KPI Card ──────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, color='var(--primary)', trend, onClick, alert }) => (
  <div onClick={onClick} style={{ background:'var(--surface)', borderRadius:'var(--radius)', padding:'16px 18px', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)', display:'flex', flexDirection:'column', gap:10, position:'relative', overflow:'hidden', transition:'transform 0.15s, box-shadow 0.15s', cursor:onClick?'pointer':'default' }}
    onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
    onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow-sm)'; }}>
    <div style={{ position:'absolute', right:-16, top:-16, width:80, height:80, borderRadius:'50%', background:`${color}18`, pointerEvents:'none' }} />
    {alert && <div style={{ position:'absolute', top:10, right:10 }}><Icon name="warning" size={14} color="var(--warning)" /></div>}
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div style={{ width:34, height:34, borderRadius:9, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', color }}><Icon name={icon} size={17} color={color} /></div>
      {trend!==undefined && <Badge tone={trend>=0?'success':'danger'}>{trend>=0?'↑':'↓'} {Math.abs(trend)}%</Badge>}
    </div>
    <div>
      <p style={{ fontSize:11, color:'var(--text3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</p>
      <p style={{ fontSize:22, fontWeight:800, color, lineHeight:1.1 }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{sub}</p>}
    </div>
  </div>
);

// ── Progress Bar ──────────────────────────────────────────────
const ProgressBar = ({ value, max=100, color='var(--primary)', height=8, showLabel=false, animate=true }) => {
  const pct = Math.min(100, Math.max(0, (value/max)*100));
  const c = pct >= 100 ? 'var(--danger)' : pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : color;
  return (
    <div style={{ width:'100%' }}>
      <div style={{ height, background:'var(--bg2)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:c, borderRadius:99, transition: animate?'width 0.6s cubic-bezier(.4,0,.2,1)':'none', boxShadow: pct>=90?`0 0 8px ${c}`:pct>=70?`0 0 4px ${c}`:'none' }} />
      </div>
      {showLabel && <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
        <span style={{ fontSize:11, color:'var(--text3)' }}>{pct.toFixed(0)}%</span>
      </div>}
    </div>
  );
};

// ── Mini Sparkline ─────────────────────────────────────────────
const MiniSparkline = ({ data=[], color='var(--primary)', height=40, width=120 }) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v,i) => {
    const x = (i/(data.length-1)) * width;
    const y = height - ((v-min)/range)*(height-4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow:'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r="3" fill={color} />
    </svg>
  );
};

// ── Donut Ring ────────────────────────────────────────────────
const DonutRing = ({ percent, color='var(--primary)', size=80, stroke=10, label, sublabel }) => {
  const r = (size-stroke)/2;
  const circ = 2*Math.PI*r;
  const offset = circ*(1-Math.min(1,percent/100));
  const c = percent>=100?'var(--danger)':percent>=90?'var(--danger)':percent>=70?'var(--warning)':color;
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg2)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition:'stroke-dashoffset 0.6s ease' }} />
      </svg>
      {label && <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:size>60?13:11, fontWeight:800, color:c, lineHeight:1 }}>{label}</span>
        {sublabel && <span style={{ fontSize:9, color:'var(--text3)', marginTop:1 }}>{sublabel}</span>}
      </div>}
    </div>
  );
};

// ── Bar Chart ─────────────────────────────────────────────────
const BarChart = ({ data=[], height=120, colorIncome='var(--success)', colorExpense='var(--danger)' }) => {
  const maxVal = Math.max(...data.map(d=>Math.max(d.income||0,d.expense||0)),1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height, paddingBottom:20, position:'relative' }}>
      {data.map((d,i)=>{
        const iH = Math.round(((d.income||0)/maxVal)*(height-24));
        const eH = Math.round(((d.expense||0)/maxVal)*(height-24));
        const cur = d.current;
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:height-24 }}>
              {d.income!==undefined && <div style={{ width:9, height:iH, borderRadius:'3px 3px 0 0', background:colorIncome, opacity:cur?1:0.5, transition:'height 0.5s', boxShadow:cur?`0 0 6px ${colorIncome}`:'' }} title={`Receita: ${d.income}`} />}
              {d.expense!==undefined && <div style={{ width:9, height:eH, borderRadius:'3px 3px 0 0', background:colorExpense, opacity:cur?1:0.5, transition:'height 0.5s', boxShadow:cur?`0 0 6px ${colorExpense}`:'' }} title={`Despesa: ${d.expense}`} />}
            </div>
            <span style={{ fontSize:9, color: cur?'var(--text)':'var(--text3)', fontWeight:cur?700:400, whiteSpace:'nowrap', position:'absolute', bottom:0 }}>{d.month}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Line Chart ────────────────────────────────────────────────
const LineChart = ({ data=[], height=100, width='100%', color='var(--primary)', fill=true }) => {
  const ref = useRef(null);
  const [w, setW] = useState(300);
  useEffect(()=>{ if(ref.current) setW(ref.current.offsetWidth||300); },[]);
  if (!data.length) return <div ref={ref} style={{ height }} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max-min||1;
  const pts = data.map((v,i)=>{
    const x = (i/(data.length-1))*w;
    const y = height - ((v-min)/range)*(height-8) - 4;
    return `${x},${y}`;
  });
  const ptsStr = pts.join(' ');
  const fillPath = `M ${pts[0]} ${ptsStr.slice(pts[0].length+1)} L ${w},${height} L 0,${height} Z`;
  return (
    <div ref={ref} style={{ width:'100%', height }}>
      <svg width="100%" height={height} style={{ overflow:'visible' }}>
        {fill && <path d={fillPath} fill={color} opacity={0.12} />}
        <polyline points={ptsStr} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts[pts.length-1].split(',')[0]} cy={pts[pts.length-1].split(',')[1]} r="4" fill={color} stroke="var(--surface)" strokeWidth="2" />
      </svg>
    </div>
  );
};

// ── Alert Banner ──────────────────────────────────────────────
const AlertBanner = ({ alerts=[] }) => {
  const [dismissed, setDismissed] = useState([]);
  const visible = alerts.filter((_,i)=>!dismissed.includes(i));
  if (!visible.length) return null;
  const a = visible[0];
  const idx = alerts.indexOf(a);
  const toneMap = { danger:'danger', warning:'warning', info:'primary', success:'success' };
  const bgMap = { danger:'var(--danger-light)', warning:'var(--warning-light)', info:'var(--primary-dim)', success:'var(--success-light)' };
  const borderMap = { danger:'var(--danger)', warning:'var(--warning)', info:'var(--primary)', success:'var(--success)' };
  return (
    <div style={{ background:bgMap[a.tone||'info'], border:`1px solid ${borderMap[a.tone||'info']}`, borderRadius:'var(--radius-sm)', padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
      <Icon name={a.tone==='danger'||a.tone==='warning'?'warning':'info'} size={16} color={borderMap[a.tone||'info']} />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{a.title}</p>
        {a.body && <p style={{ fontSize:12, color:'var(--text2)', marginTop:1 }}>{a.body}</p>}
      </div>
      {visible.length>1 && <Badge tone="neutral">+{visible.length-1}</Badge>}
      <button onClick={()=>setDismissed(d=>[...d,idx])} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', display:'flex', padding:4, borderRadius:6 }}><Icon name="close" size={14} /></button>
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────
const EmptyState = ({ icon='info', title, body, action }) => (
  <div style={{ textAlign:'center', padding:'40px 20px', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
    <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border)' }}>
      <Icon name={icon} size={24} color="var(--text3)" />
    </div>
    <div>
      <p style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{title}</p>
      {body && <p style={{ fontSize:13, color:'var(--text3)', maxWidth:280, margin:'0 auto' }}>{body}</p>}
    </div>
    {action}
  </div>
);

// ── Divider ───────────────────────────────────────────────────
const Divider = ({ label }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0' }}>
    <div style={{ flex:1, height:1, background:'var(--border)' }} />
    {label && <span style={{ fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>{label}</span>}
    <div style={{ flex:1, height:1, background:'var(--border)' }} />
  </div>
);

// ── Stat Row ──────────────────────────────────────────────────
const StatRow = ({ label, value, color, sub }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
    <span style={{ fontSize:13, color:'var(--text2)' }}>{label}</span>
    <div style={{ textAlign:'right' }}>
      <span style={{ fontSize:13, fontWeight:700, color:color||'var(--text)' }}>{value}</span>
      {sub && <p style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{sub}</p>}
    </div>
  </div>
);

// fmt helpers
const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
const fmtDate = d => new Date(d+'T00:00:00').toLocaleDateString('pt-BR');
const fmtPct = v => `${v.toFixed(1)}%`;

Object.assign(window, {
  Icon, Btn, Badge, Panel, Field, Input, Select, Textarea, Checkbox,
  Modal, KpiCard, ProgressBar, MiniSparkline, DonutRing, BarChart, LineChart,
  AlertBanner, EmptyState, Divider, StatRow, fmt, fmtDate, fmtPct
});
