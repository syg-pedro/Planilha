// ff2-screens.jsx — Todos os módulos: Orçamentos, Metas, Assinaturas, Dívidas,
// Patrimônio, Planejamento Anual, Cenários, Relatórios, Conciliação, Alertas,
// Design System, Configurações

const { useState, useEffect, useRef } = React;

// ── ORÇAMENTOS ────────────────────────────────────────────────
const BUDGET_DATA = [
  { id:'b1', cat:'Moradia',    icon:'patrimony', spent:1700, limit:1700, color:'#dc2626' },
  { id:'b2', cat:'Cartões',    icon:'card',      spent:1654, limit:1750, color:'#0ea5e9' },
  { id:'b3', cat:'Serviços',   icon:'subscription', spent:99, limit:200, color:'#f97316' },
  { id:'b4', cat:'Educação',   icon:'goal',      spent:171,  limit:300,  color:'#8b5cf6' },
  { id:'b5', cat:'Alimentação',icon:'tag',       spent:420,  limit:700,  color:'#16a34a' },
  { id:'b6', cat:'Saúde',      icon:'alerts',    spent:80,   limit:300,  color:'#ec4899' },
];

const OrcamentosScreen = () => {
  const [modal, setModal] = useState(false);
  const total = { spent: BUDGET_DATA.reduce((s,b)=>s+b.spent,0), limit: BUDGET_DATA.reduce((s,b)=>s+b.limit,0) };
  const pct = (total.spent/total.limit)*100;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Summary bar */}
      <div style={{ background:'var(--surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)', padding:'16px 20px', display:'flex', flexWrap:'wrap', gap:16, alignItems:'center' }}>
        <div style={{ flex:1, minWidth:160 }}>
          <p style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>Total do mês</p>
          <p style={{ fontSize:22, fontWeight:800, color:pct>=90?'var(--danger)':'var(--text)', marginTop:2 }}>{fmt(total.spent)} <span style={{ fontSize:13, color:'var(--text3)', fontWeight:500 }}>/ {fmt(total.limit)}</span></p>
        </div>
        <div style={{ flex:2, minWidth:200 }}>
          <ProgressBar value={total.spent} max={total.limit} height={10} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style={{ fontSize:11, color:'var(--text3)' }}>Consumido: {pct.toFixed(1)}%</span>
            <span style={{ fontSize:11, color:'var(--text3)' }}>Disponível: {fmt(total.limit-total.spent)}</span>
          </div>
        </div>
        <Btn variant="primary" icon="plus" onClick={()=>setModal(true)}>Novo orçamento</Btn>
      </div>

      {/* Budget cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:12 }}>
        {BUDGET_DATA.map(b => {
          const p = Math.min(100,(b.spent/b.limit)*100);
          const tone = p>=100?'danger':p>=90?'danger':p>=70?'warning':'success';
          const label = p>=100?'Limite atingido':p>=90?'Crítico':p>=70?'Atenção':'Saudável';
          return (
            <div key={b.id} style={{ background:'var(--surface)', borderRadius:'var(--radius)', border:`1px solid ${p>=90?'var(--danger)':p>=70?'var(--warning)':'var(--border)'}`, padding:'16px', boxShadow:'var(--shadow-sm)', display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:`${b.color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name={b.icon} size={17} color={b.color} />
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{b.cat}</p>
                    <p style={{ fontSize:11, color:'var(--text3)' }}>Limite: {fmt(b.limit)}</p>
                  </div>
                </div>
                <Badge tone={tone}>{label}</Badge>
              </div>
              <ProgressBar value={b.spent} max={b.limit} color={b.color} height={8} />
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:10, color:'var(--text3)' }}>Gasto</p>
                  <p style={{ fontSize:14, fontWeight:800, color:p>=90?'var(--danger)':'var(--text)' }}>{fmt(b.spent)}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:10, color:'var(--text3)' }}>Disponível</p>
                  <p style={{ fontSize:14, fontWeight:800, color:b.limit-b.spent<0?'var(--danger)':'var(--success)' }}>{fmt(Math.max(0,b.limit-b.spent))}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:10, color:'var(--text3)' }}>%</p>
                  <p style={{ fontSize:14, fontWeight:800, color:p>=90?'var(--danger)':p>=70?'var(--warning)':'var(--text)' }}>{p.toFixed(0)}%</p>
                </div>
              </div>
              {p>=70 && (
                <div style={{ background:p>=90?'var(--danger-light)':'var(--warning-light)', borderRadius:'var(--radius-xs)', padding:'6px 10px', display:'flex', alignItems:'center', gap:6 }}>
                  <Icon name="warning" size={13} color={p>=90?'var(--danger)':'var(--warning)'} />
                  <span style={{ fontSize:11, color:p>=90?'var(--danger)':'var(--warning)', fontWeight:600 }}>
                    {p>=100?'Orçamento esgotado':p>=90?`Alerta: ${(100-p).toFixed(0)}% restante`:`Atenção: ${(100-p).toFixed(0)}% restante`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Novo orçamento" subtitle="Defina um limite mensal por categoria">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Categoria" col2><Select value="" onChange={()=>{}}><option value="">Selecionar</option>{BUDGET_DATA.map(b=><option key={b.id} value={b.id}>{b.cat}</option>)}</Select></Field>
          <Field label="Limite mensal (R$)"><Input value="" onChange={()=>{}} prefix="R$" placeholder="0,00" /></Field>
          <Field label="Alerta em" ><Select value="70" onChange={()=>{}}><option value="70">70%</option><option value="90">90%</option><option value="100">100%</option></Select></Field>
          <Field label="Mês de referência"><Input value="2026-05" onChange={()=>{}} type="month" /></Field>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20 }}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn variant="primary" icon="check" onClick={()=>setModal(false)}>Criar orçamento</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ── METAS ─────────────────────────────────────────────────────
const GOALS_DATA = [
  { id:'g1', name:'Reserva de Emergência', current:6200,  target:10000, monthly:400, color:'var(--success)', icon:'lock',   deadline:'Dez 2026' },
  { id:'g2', name:'Viagem de Férias',      current:1800,  target:5000,  monthly:320, color:'var(--primary)', icon:'planning',deadline:'Jan 2027' },
  { id:'g3', name:'Troca do Celular',      current:400,   target:1500,  monthly:200, color:'var(--accent)',  icon:'sparkle', deadline:'Set 2026' },
  { id:'g4', name:'Entrada do Carro',      current:3200,  target:15000, monthly:600, color:'var(--warning)', icon:'scenario',deadline:'Jun 2028' },
];

const MetasScreen = () => {
  const [modal, setModal] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h2 style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Minhas metas</h2>
          <p style={{ fontSize:12, color:'var(--text3)' }}>Acompanhe cada objetivo financeiro</p>
        </div>
        <Btn variant="primary" icon="plus" onClick={()=>setModal(true)}>Nova meta</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {GOALS_DATA.map(g => {
          const pct = (g.current/g.target)*100;
          const remaining = g.target - g.current;
          const months = Math.ceil(remaining/g.monthly);
          return (
            <div key={g.id} style={{ background:'var(--surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)', padding:'18px', boxShadow:'var(--shadow-sm)', display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <DonutRing percent={pct} color={g.color} size={64} stroke={7} label={`${pct.toFixed(0)}%`} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:15, fontWeight:800, color:'var(--text)' }}>{g.name}</p>
                  <p style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Previsão: {g.deadline}</p>
                  <div style={{ display:'flex', gap:6, marginTop:6 }}>
                    <Badge tone="primary">{months} meses restantes</Badge>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, color:'var(--text3)' }}>Progresso</span>
                  <span style={{ fontSize:12, fontWeight:700, color:g.color }}>{fmt(g.current)} / {fmt(g.target)}</span>
                </div>
                <ProgressBar value={g.current} max={g.target} color={g.color} height={8} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ background:'var(--surface2)', borderRadius:'var(--radius-xs)', padding:'8px 10px', border:'1px solid var(--border)' }}>
                  <p style={{ fontSize:10, color:'var(--text3)', fontWeight:700 }}>Falta</p>
                  <p style={{ fontSize:13, fontWeight:800, color:'var(--text)' }}>{fmt(remaining)}</p>
                </div>
                <div style={{ background:'var(--surface2)', borderRadius:'var(--radius-xs)', padding:'8px 10px', border:'1px solid var(--border)' }}>
                  <p style={{ fontSize:10, color:'var(--text3)', fontWeight:700 }}>Aporte sugerido</p>
                  <p style={{ fontSize:13, fontWeight:800, color:g.color }}>{fmt(g.monthly)}/mês</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Btn variant="primary" style={{ flex:1 }} size="sm" icon="plus">Aportar</Btn>
                <Btn variant="ghost" size="sm" icon="edit">Editar</Btn>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Nova meta" subtitle="Defina seu objetivo e acompanhe o progresso">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Nome da meta" col2><Input value="" onChange={()=>{}} placeholder="Ex.: Viagem para Europa" /></Field>
          <Field label="Valor alvo (R$)"><Input value="" onChange={()=>{}} prefix="R$" placeholder="5.000,00" /></Field>
          <Field label="Saldo atual (R$)"><Input value="" onChange={()=>{}} prefix="R$" placeholder="0,00" /></Field>
          <Field label="Aporte mensal (R$)"><Input value="" onChange={()=>{}} prefix="R$" placeholder="300,00" /></Field>
          <Field label="Prazo desejado"><Input value="" onChange={()=>{}} type="month" /></Field>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20 }}>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn variant="primary" icon="check" onClick={()=>setModal(false)}>Criar meta</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ── ASSINATURAS ───────────────────────────────────────────────
const SUBS_DATA = [
  { name:'Netflix',    amount:55.90,  cycle:'mensal',  nextDate:'2026-05-15', status:'active',   variation:null },
  { name:'Spotify',    amount:21.90,  cycle:'mensal',  nextDate:'2026-05-18', status:'active',   variation:null },
  { name:'Faculdade',  amount:170.73, cycle:'mensal',  nextDate:'2026-05-08', status:'active',   variation:2.1  },
  { name:'iCloud+',   amount:16.90,  cycle:'mensal',  nextDate:'2026-05-20', status:'active',   variation:null },
  { name:'Office 365', amount:37.90,  cycle:'anual',   nextDate:'2026-11-01', status:'active',   variation:null },
  { name:'Antivírus',  amount:89.90,  cycle:'anual',   nextDate:'2026-09-15', status:'paused',   variation:null },
];

const AssinaturasScreen = () => {
  const total = SUBS_DATA.filter(s=>s.status==='active'&&s.cycle==='mensal').reduce((s,a)=>s+a.amount,0);
  const annual = SUBS_DATA.filter(s=>s.status==='active').reduce((s,a)=>s+(a.cycle==='anual'?a.amount:a.amount*12),0);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
        <KpiCard icon="subscription" label="Mensal total"   value={fmt(total)}   color="var(--primary)" sub={`${SUBS_DATA.filter(s=>s.status==='active').length} ativas`} />
        <KpiCard icon="reports"      label="Anual estimado" value={fmt(annual)}   color="var(--warning)" sub="Todas as assinaturas" />
        <KpiCard icon="alerts"       label="Próx. 7 dias"   value={fmt(SUBS_DATA.filter(s=>{ const d=new Date(s.nextDate); const n=new Date(); const in7=new Date(); in7.setDate(n.getDate()+7); return d>=n&&d<=in7; }).reduce((s,a)=>s+a.amount,0))} color="var(--danger)" sub="A vencer" />
      </div>

      <Panel title="Todas as assinaturas" action={<Btn variant="primary" icon="plus" size="sm">Adicionar</Btn>} noPad>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
              {['Serviço','Ciclo','Próx. cobrança','Valor','Variação','Status',''].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUBS_DATA.map((s,i) => (
              <tr key={i} style={{ borderBottom:'1px solid var(--border)', opacity:s.status==='paused'?0.6:1 }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'12px 14px', fontWeight:700, color:'var(--text)' }}>{s.name}</td>
                <td style={{ padding:'12px 14px' }}><Badge tone="neutral">{s.cycle}</Badge></td>
                <td style={{ padding:'12px 14px', color:'var(--text2)' }}>{fmtDate(s.nextDate)}</td>
                <td style={{ padding:'12px 14px', fontWeight:800, color:'var(--text)' }}>{fmt(s.amount)}</td>
                <td style={{ padding:'12px 14px' }}>
                  {s.variation ? <Badge tone="warning">↑ {s.variation}%</Badge> : <span style={{ color:'var(--text3)' }}>—</span>}
                </td>
                <td style={{ padding:'12px 14px' }}><Badge tone={s.status==='active'?'success':'neutral'}>{s.status==='active'?'Ativa':'Pausada'}</Badge></td>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <Btn size="sm" variant="ghost" icon="edit">Editar</Btn>
                    <Btn size="sm" variant="ghost" icon="close">Cancelar</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
};

// ── DÍVIDAS E PARCELAS ────────────────────────────────────────
const DEBTS_DATA = [
  { name:'Sicredi Pedro',   balance:284.82, rate:0,    installments:[484.75,47.82,47.82,47.82,47.82,47.82], total:6, paid:0, color:'var(--primary)' },
  { name:'Itaú Pedro',      balance:1820.62, rate:0,   installments:[297.54,...Array(8).fill(231.18)], total:9, paid:0, color:'var(--warning)' },
  { name:'Nubank Pedro',    balance:1068.70, rate:0,   installments:[589.90,102.60,...Array(10).fill(102.60)], total:12, paid:0, color:'var(--danger)' },
  { name:'Bicicleta (tia)', balance:1854,   rate:0,    installments:Array(10).fill(206), total:10, paid:0, color:'var(--accent)' },
  { name:'Will Pedro',      balance:460.25,  rate:2.5, installments:[281.89,281.89,79.81,48.66,48.66,48.66], total:7, paid:1, color:'#94a3b8' },
];

const DividasScreen = () => {
  const [selected, setSelected] = useState(null);
  const totalDebt = DEBTS_DATA.reduce((s,d)=>s+d.balance,0);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
        <KpiCard icon="debt" label="Saldo devedor total" value={fmt(totalDebt)} color="var(--danger)" sub={`${DEBTS_DATA.length} compromissos`} />
        <KpiCard icon="calendar" label="Parcelas este mês" value={fmt(DEBTS_DATA.reduce((s,d)=>s+d.installments[d.paid]||0,0))} color="var(--warning)" sub="Vencimento maio" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {DEBTS_DATA.map((d,i) => {
          const pct = ((d.paid)/d.total)*100;
          return (
            <div key={i} style={{ background:'var(--surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)', padding:'16px', boxShadow:'var(--shadow-sm)', cursor:'pointer', transition:'all 0.15s' }}
              onClick={()=>setSelected(selected===i?null:i)}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow-md)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='var(--shadow-sm)'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{d.name}</p>
                  <p style={{ fontSize:11, color:'var(--text3)' }}>{d.paid}/{d.total} parcelas pagas</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:16, fontWeight:800, color:'var(--danger)' }}>{fmt(d.balance)}</p>
                  <p style={{ fontSize:11, color:'var(--text3)' }}>saldo devedor</p>
                </div>
              </div>
              <ProgressBar value={d.paid} max={d.total} color={d.color} height={6} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ fontSize:11, color:'var(--text3)' }}>{d.total-d.paid} restantes</span>
                {d.rate>0 && <Badge tone="warning">Juros {d.rate}% a.m.</Badge>}
              </div>
              {selected===i && (
                <div style={{ marginTop:14, borderTop:'1px solid var(--border)', paddingTop:12 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'var(--text2)', marginBottom:8 }}>Cronograma de parcelas</p>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {d.installments.map((v,j)=>(
                      <div key={j} style={{ background:j<d.paid?'var(--success-light)':'var(--surface2)', border:`1px solid ${j<d.paid?'var(--success)':j===d.paid?d.color:'var(--border)'}`, borderRadius:6, padding:'4px 8px', textAlign:'center', minWidth:52 }}>
                        <p style={{ fontSize:9, color:'var(--text3)', fontWeight:700 }}>{j+1}/{d.total}</p>
                        <p style={{ fontSize:11, fontWeight:700, color:j<d.paid?'var(--success)':j===d.paid?d.color:'var(--text)' }}>{fmt(v)}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:12, display:'flex', gap:8 }}>
                    <Btn variant="subtle" size="sm" icon="scenario">Simular antecipação</Btn>
                    <Btn variant="primary" size="sm" icon="check">Marcar como pago</Btn>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── PATRIMÔNIO ────────────────────────────────────────────────
const PatrimonioScreen = () => {
  const assets = [
    { name:'Conta Pedro (saldo)',   value:2400, type:'Conta corrente' },
    { name:'Conta Juli (saldo)',    value:1800, type:'Conta corrente' },
    { name:'Flash VR acumulado',    value:800,  type:'Benefício' },
    { name:'Reserva de Emergência', value:6200, type:'Poupança/Invest.' },
    { name:'Moto (bem móvel)',      value:8000, type:'Bem' },
    { name:'Eletrodomésticos',      value:4200, type:'Bem' },
    { name:'Investimentos',         value:5000, type:'Renda fixa' },
  ];
  const liabilities = [
    { name:'Dívida Cartões (total)',  value:3488, type:'Cartão de crédito' },
    { name:'Bicicleta (parcelas)',    value:1854, type:'Parcelamento' },
    { name:'Will Pedro',             value:460,  type:'Parcelamento' },
  ];
  const totalA = assets.reduce((s,a)=>s+a.value,0);
  const totalL = liabilities.reduce((s,a)=>s+a.value,0);
  const net = totalA - totalL;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
        <KpiCard icon="income"   label="Total de ativos"    value={fmt(totalA)} color="var(--success)" />
        <KpiCard icon="expense"  label="Total de passivos"  value={fmt(totalL)} color="var(--danger)"  />
        <KpiCard icon="balance"  label="Patrimônio líquido" value={fmt(net)}    color="var(--primary)" sub={net>=0?"Positivo":"Negativo"} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Panel title="Ativos" subtitle={`Total: ${fmt(totalA)}`} action={<Btn size="sm" variant="subtle" icon="plus">Adicionar</Btn>} noPad>
          {assets.map((a,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{a.name}</p>
                <p style={{ fontSize:11, color:'var(--text3)' }}>{a.type}</p>
              </div>
              <p style={{ fontSize:13, fontWeight:800, color:'var(--success)' }}>{fmt(a.value)}</p>
            </div>
          ))}
          <div style={{ padding:'10px 16px', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>Total</span>
            <span style={{ fontSize:14, fontWeight:800, color:'var(--success)' }}>{fmt(totalA)}</span>
          </div>
        </Panel>

        <Panel title="Passivos" subtitle={`Total: ${fmt(totalL)}`} action={<Btn size="sm" variant="subtle" icon="plus">Adicionar</Btn>} noPad>
          {liabilities.map((l,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{l.name}</p>
                <p style={{ fontSize:11, color:'var(--text3)' }}>{l.type}</p>
              </div>
              <p style={{ fontSize:13, fontWeight:800, color:'var(--danger)' }}>{fmt(l.value)}</p>
            </div>
          ))}
          <div style={{ padding:'10px 16px', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>Total</span>
            <span style={{ fontSize:14, fontWeight:800, color:'var(--danger)' }}>{fmt(totalL)}</span>
          </div>
        </Panel>
      </div>

      <Panel title="Evolução do patrimônio líquido" subtitle="Últimos 12 meses">
        <LineChart data={[12000,13200,14100,13800,15600,16200,14200,18000,19200,20100,22400,14200]} height={120} color="var(--primary)" />
      </Panel>
    </div>
  );
};

// ── PLANEJAMENTO ANUAL ────────────────────────────────────────
const PlanejamentoScreen = () => {
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const data = [
    { income:3900, expense:2780, risk:false },
    { income:3900, expense:3150, risk:false },
    { income:3900, expense:2640, risk:false },
    { income:3900, expense:2610, risk:false },
    { income:3900, expense:3280, risk:true  },
    { income:3900, expense:2950, risk:false },
    { income:3900, expense:2800, risk:false },
    { income:3900, expense:4200, risk:true  },
    { income:3900, expense:2900, risk:false },
    { income:3900, expense:3100, risk:false },
    { income:3900, expense:3600, risk:true  },
    { income:3900, expense:4800, risk:true  },
  ];
  const curM = new Date().getMonth();
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <KpiCard icon="planning" label="Receita anual projetada" value={fmt(3900*12)} color="var(--success)" style={{ flex:1, minWidth:180 }} />
        <KpiCard icon="expense"  label="Despesa anual projetada" value={fmt(data.reduce((s,d)=>s+d.expense,0))} color="var(--warning)" style={{ flex:1, minWidth:180 }} />
        <KpiCard icon="warning"  label="Meses de risco"         value={`${data.filter(d=>d.risk).length} meses`} color="var(--danger)" style={{ flex:1, minWidth:180 }} />
      </div>

      <Panel title="Visão anual — 2026" subtitle="Receita vs despesa projetada por mês" noPad>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
                <th style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>Mês</th>
                <th style={{ padding:'10px 14px', textAlign:'right', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>Receita</th>
                <th style={{ padding:'10px 14px', textAlign:'right', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>Despesa</th>
                <th style={{ padding:'10px 14px', textAlign:'right', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>Saldo</th>
                <th style={{ padding:'10px 14px', textAlign:'center', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>Status</th>
                <th style={{ padding:'10px 14px', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>Barra</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m,i)=>{
                const d=data[i]; const net=d.income-d.expense; const isCur=i===curM;
                return (
                  <tr key={i} style={{ borderBottom:'1px solid var(--border)', background:isCur?'var(--primary-dim)':d.risk?'var(--danger-light)':'transparent' }}>
                    <td style={{ padding:'10px 14px', fontWeight:700, color:isCur?'var(--primary)':'var(--text)', whiteSpace:'nowrap' }}>{m} {isCur&&<Badge tone="primary" style={{ marginLeft:6 }}>Atual</Badge>}</td>
                    <td style={{ padding:'10px 14px', textAlign:'right', color:'var(--success)', fontWeight:600 }}>{fmt(d.income)}</td>
                    <td style={{ padding:'10px 14px', textAlign:'right', color:'var(--danger)', fontWeight:600 }}>{fmt(d.expense)}</td>
                    <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:800, color:net>=0?'var(--success)':'var(--danger)' }}>{fmt(net)}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center' }}>
                      {d.risk ? <Badge tone="danger">⚠ Risco</Badge> : net>=0 ? <Badge tone="success">OK</Badge> : <Badge tone="warning">Atenção</Badge>}
                    </td>
                    <td style={{ padding:'10px 14px', minWidth:120 }}>
                      <ProgressBar value={d.expense} max={d.income} color={d.risk?'var(--danger)':'var(--primary)'} height={6} animate={false} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

// ── CENÁRIOS ──────────────────────────────────────────────────
const CenariosScreen = () => {
  const [income, setIncome] = useState(3900);
  const [expense, setExpense] = useState(3280);
  const [months, setMonths] = useState(12);
  const projected = Array.from({length:months},(_,i)=>{
    let bal=0; for(let j=0;j<=i;j++) bal+=(income-expense); return Math.round(bal);
  });
  const lastBal = projected[projected.length-1];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Panel title="Simulador de cenários" subtitle="Ajuste renda e despesa para visualizar o impacto no saldo projetado">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:20 }}>
          <Field label="Receita mensal (R$)">
            <Input value={income} onChange={e=>setIncome(Number(e.target.value)||0)} type="number" prefix="R$" />
          </Field>
          <Field label="Despesa mensal (R$)">
            <Input value={expense} onChange={e=>setExpense(Number(e.target.value)||0)} type="number" prefix="R$" />
          </Field>
          <Field label="Projeção (meses)">
            <Input value={months} onChange={e=>setMonths(Math.min(60,Math.max(1,Number(e.target.value)||12)))} type="number" suffix="meses" />
          </Field>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10, marginBottom:20 }}>
          <div style={{ background:'var(--success-light)', border:'1px solid var(--success)', borderRadius:'var(--radius-sm)', padding:'10px 14px' }}>
            <p style={{ fontSize:10, color:'var(--success)', fontWeight:700, textTransform:'uppercase' }}>Poupança/mês</p>
            <p style={{ fontSize:18, fontWeight:800, color:'var(--success)' }}>{fmt(income-expense)}</p>
          </div>
          <div style={{ background: lastBal>=0?'var(--primary-dim)':'var(--danger-light)', border:`1px solid ${lastBal>=0?'var(--primary)':'var(--danger)'}`, borderRadius:'var(--radius-sm)', padding:'10px 14px' }}>
            <p style={{ fontSize:10, color:lastBal>=0?'var(--primary)':'var(--danger)', fontWeight:700, textTransform:'uppercase' }}>Saldo em {months}m</p>
            <p style={{ fontSize:18, fontWeight:800, color:lastBal>=0?'var(--primary)':'var(--danger)' }}>{fmt(lastBal)}</p>
          </div>
          <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'10px 14px' }}>
            <p style={{ fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase' }}>Taxa de poupança</p>
            <p style={{ fontSize:18, fontWeight:800, color:'var(--text)' }}>{income>0?((income-expense)/income*100).toFixed(1):0}%</p>
          </div>
        </div>
        <div style={{ marginTop:8 }}>
          <p style={{ fontSize:12, fontWeight:700, color:'var(--text2)', marginBottom:8 }}>Projeção acumulada</p>
          <LineChart data={projected} height={140} color={lastBal>=0?'var(--primary)':'var(--danger)'} fill />
        </div>
      </Panel>

      <Panel title="Cenários salvos" action={<Btn size="sm" variant="primary" icon="plus">Salvar cenário atual</Btn>}>
        <EmptyState icon="scenario" title="Nenhum cenário salvo" body="Ajuste os valores acima e salve para comparar diferentes simulações." />
      </Panel>
    </div>
  );
};

// ── RELATÓRIOS ────────────────────────────────────────────────
const RelatoriosScreen = () => {
  const [period, setPeriod] = useState('month');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
        <Select value={period} onChange={e=>setPeriod(e.target.value)} style={{ minWidth:160 }}>
          <option value="month">Este mês</option>
          <option value="quarter">Trimestre</option>
          <option value="year">Este ano</option>
          <option value="custom">Personalizado</option>
        </Select>
        <Btn variant="ghost" icon="export">Exportar PDF</Btn>
        <Btn variant="ghost" icon="export">Exportar CSV</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
        <KpiCard icon="income"  label="Total receitas" value={fmt(3900)}  color="var(--success)" trend={0}  />
        <KpiCard icon="expense" label="Total despesas" value={fmt(3280)}  color="var(--danger)"  trend={24} />
        <KpiCard icon="balance" label="Saldo período"  value={fmt(620)}   color="var(--primary)" />
        <KpiCard icon="goal"    label="Taxa poupança"  value="15.9%"       color="var(--warning)" sub="Meta: 20%" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
        <Panel title="Despesas por categoria">
          {[{name:'Cartões',pct:50,v:1654},{name:'Moradia',pct:52,v:1700},{name:'Educação',pct:5,v:171},{name:'Serviços',pct:3,v:99},{name:'Alimentação',pct:13,v:420}].map((c,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:12, color:'var(--text2)', minWidth:90 }}>{c.name}</span>
              <div style={{ flex:1 }}>
                <ProgressBar value={c.pct} max={100} height={7} />
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--text)', minWidth:70, textAlign:'right' }}>{fmt(c.v)}</span>
            </div>
          ))}
        </Panel>

        <Panel title="Comparativo mensal">
          <BarChart data={[{month:'Mar',income:3900,expense:3150,current:false},{month:'Abr',income:3900,expense:2640,current:false},{month:'Mai',income:3900,expense:3280,current:true}]} height={140} />
        </Panel>

        <Panel title="Por pessoa" subtitle="Pedro vs. Juli">
          {[{name:'Pedro',income:2800,expense:2900},{name:'Juli',income:1100,expense:380}].map((p,i)=>(
            <div key={i} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{p.name}</span>
                <span style={{ fontSize:12, color:p.income-p.expense>=0?'var(--success)':'var(--danger)', fontWeight:700 }}>{fmt(p.income-p.expense)}</span>
              </div>
              <ProgressBar value={p.expense} max={p.income} height={7} />
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
};

// ── CONCILIAÇÃO ───────────────────────────────────────────────
const ConciliacaoScreen = () => {
  const [items, setItems] = useState([
    { id:1, title:'Supermercado Extra',    amount:156.40, date:'2026-05-01', matched:false, diverge:false },
    { id:2, title:'Posto Ipiranga',        amount:180.00, date:'2026-05-02', matched:true,  diverge:false },
    { id:3, title:'iFood',                 amount:43.50,  date:'2026-05-03', matched:false, diverge:true  },
    { id:4, title:'Farmácia Drogasil',     amount:67.90,  date:'2026-05-04', matched:true,  diverge:false },
    { id:5, title:'Transferência Pedro',   amount:500.00, date:'2026-05-05', matched:false, diverge:false },
  ]);
  const confirm = id => setItems(prev=>prev.map(i=>i.id===id?{...i,matched:true}:i));
  const pending = items.filter(i=>!i.matched);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'center' }}>
        <Badge tone="warning" dot>{pending.length} pendentes</Badge>
        <Badge tone="success" dot>{items.filter(i=>i.matched).length} conciliados</Badge>
        <Badge tone="danger" dot>{items.filter(i=>i.diverge).length} divergências</Badge>
        <Btn variant="primary" size="sm" icon="check" style={{ marginLeft:'auto' }} onClick={()=>setItems(prev=>prev.map(i=>({...i,matched:true})))}>Confirmar todos</Btn>
      </div>

      <Panel title="Lançamentos para conciliar" noPad>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
              {['Data','Descrição','Valor','Status','Ação'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item=>(
              <tr key={item.id} style={{ borderBottom:'1px solid var(--border)', background:item.matched?'var(--success-light)':item.diverge?'var(--danger-light)':'transparent' }}>
                <td style={{ padding:'11px 14px', color:'var(--text2)', whiteSpace:'nowrap' }}>{fmtDate(item.date)}</td>
                <td style={{ padding:'11px 14px', fontWeight:600, color:'var(--text)' }}>{item.title}</td>
                <td style={{ padding:'11px 14px', fontWeight:800, color:'var(--text)' }}>{fmt(item.amount)}</td>
                <td style={{ padding:'11px 14px' }}>
                  {item.matched ? <Badge tone="success">Conciliado</Badge> : item.diverge ? <Badge tone="danger">Divergência</Badge> : <Badge tone="warning">Pendente</Badge>}
                </td>
                <td style={{ padding:'11px 14px' }}>
                  {!item.matched && <Btn size="sm" variant={item.diverge?'danger':'primary'} icon="check" onClick={()=>confirm(item.id)}>{item.diverge?'Revisar':'Confirmar'}</Btn>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
};

// ── ALERTAS INTELIGENTES ──────────────────────────────────────
const AlertasScreen = () => {
  const [dismissed, setDismissed] = useState([]);
  const alerts = [
    { tone:'danger',  icon:'card',   title:'Nubank vence em 3 dias',        body:'Fatura de R$ 589,90 ainda não paga. Risco de juros.',  action:'Marcar como pago' },
    { tone:'warning', icon:'budget', title:'Orçamento de Cartões em 94%',    body:'Você usou R$ 1.654 de R$ 1.750. Evite novos gastos.', action:'Ver orçamento' },
    { tone:'warning', icon:'expense',title:'Gasto fora do padrão detectado', body:'Despesa de Alimentação 38% acima da média.',           action:'Ver lançamentos' },
    { tone:'info',    icon:'goal',   title:'Meta Reserva: aporte pendente',  body:'Contribua R$ 400 para ficar no ritmo.',               action:'Aportar' },
    { tone:'success', icon:'check',  title:'Salário Pedro creditado',        body:'R$ 1.000 disponível na Conta Pedro.',                 action:null },
    { tone:'info',    icon:'alerts', title:'Will Pedro: banco inativo',      body:'Parcela de R$ 281,89 vence dia 15. Atenção!',         action:'Ver dívida' },
  ].filter((_,i)=>!dismissed.includes(i));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h2 style={{ fontSize:16, fontWeight:800, color:'var(--text)' }}>Alertas inteligentes</h2>
          <p style={{ fontSize:12, color:'var(--text3)' }}>{alerts.length} alertas ativos</p>
        </div>
        <Btn variant="ghost" size="sm" onClick={()=>setDismissed([0,1,2,3,4,5])}>Limpar todos</Btn>
      </div>

      {alerts.length===0 ? (
        <EmptyState icon="check" title="Tudo em ordem!" body="Nenhum alerta ativo no momento." />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {alerts.map((a,i)=>{
            const borderMap = { danger:'var(--danger)', warning:'var(--warning)', info:'var(--primary)', success:'var(--success)' };
            const bgMap = { danger:'var(--danger-light)', warning:'var(--warning-light)', info:'var(--primary-dim)', success:'var(--success-light)' };
            return (
              <div key={i} style={{ background:bgMap[a.tone], border:`1px solid ${borderMap[a.tone]}`, borderRadius:'var(--radius)', padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:36, height:36, borderRadius:9, background:borderMap[a.tone]+'22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                  <Icon name={a.icon} size={18} color={borderMap[a.tone]} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{a.title}</p>
                  <p style={{ fontSize:12, color:'var(--text2)', marginTop:3 }}>{a.body}</p>
                  {a.action && (
                    <button style={{ marginTop:8, fontSize:12, fontWeight:700, color:borderMap[a.tone], background:'none', border:'none', cursor:'pointer', padding:0 }}>{a.action} →</button>
                  )}
                </div>
                <button onClick={()=>setDismissed(d=>[...d,i])} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4, borderRadius:6 }}><Icon name="close" size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── DESIGN SYSTEM ─────────────────────────────────────────────
const DesignSystemScreen = () => (
  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text)', marginBottom:4 }}>Design System — Financeiro Familiar v2</h2>
      <p style={{ fontSize:13, color:'var(--text3)' }}>Referência de componentes, tokens de cor, tipografia e espaçamento.</p>
    </div>

    {/* Colors */}
    <Panel title="Paleta de cores">
      <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
        {[
          {name:'Primary',  var:'--primary'},
          {name:'Success',  var:'--success'},
          {name:'Danger',   var:'--danger'},
          {name:'Warning',  var:'--warning'},
          {name:'Accent',   var:'--accent'},
          {name:'Surface',  var:'--surface'},
          {name:'Surface 2',var:'--surface2'},
          {name:'BG',       var:'--bg'},
        ].map(c=>(
          <div key={c.name} style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
            <div style={{ width:52, height:52, borderRadius:'var(--radius-sm)', background:`var(${c.var})`, border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }} />
            <span style={{ fontSize:10, fontWeight:700, color:'var(--text2)' }}>{c.name}</span>
          </div>
        ))}
      </div>
    </Panel>

    {/* Typography */}
    <Panel title="Tipografia — Plus Jakarta Sans">
      {[
        {label:'Display / 800 / 28px', fontSize:28, fontWeight:800, text:'Financeiro Familiar'},
        {label:'H1 / 700 / 22px',      fontSize:22, fontWeight:700, text:'Dashboard mensal'},
        {label:'H2 / 700 / 18px',      fontSize:18, fontWeight:700, text:'Orçamentos do mês'},
        {label:'H3 / 700 / 15px',      fontSize:15, fontWeight:700, text:'Cartão Nubank'},
        {label:'Body / 500 / 13px',    fontSize:13, fontWeight:500, text:'Lançamento recorrente mensal'},
        {label:'Caption / 600 / 11px', fontSize:11, fontWeight:600, text:'CATEGORIA · DESPESA'},
      ].map((t,i)=>(
        <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          <span style={{ fontSize:10, color:'var(--text3)', fontWeight:700, minWidth:180 }}>{t.label}</span>
          <span style={{ fontSize:t.fontSize, fontWeight:t.fontWeight, color:'var(--text)', flex:1 }}>{t.text}</span>
        </div>
      ))}
    </Panel>

    {/* Buttons */}
    <Panel title="Botões">
      <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
        <Btn variant="primary">Primary</Btn>
        <Btn variant="secondary">Secondary</Btn>
        <Btn variant="ghost">Ghost</Btn>
        <Btn variant="danger">Danger</Btn>
        <Btn variant="success">Success</Btn>
        <Btn variant="subtle">Subtle</Btn>
        <Btn variant="primary" size="sm">Small</Btn>
        <Btn variant="primary" size="lg">Large</Btn>
        <Btn variant="primary" icon="plus">Com ícone</Btn>
        <Btn variant="primary" disabled>Disabled</Btn>
      </div>
    </Panel>

    {/* Badges */}
    <Panel title="Badges">
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        <Badge tone="success">Pago</Badge>
        <Badge tone="danger">Urgente</Badge>
        <Badge tone="warning">Atenção</Badge>
        <Badge tone="primary">Ativo</Badge>
        <Badge tone="neutral">Neutro</Badge>
        <Badge tone="purple">EVA-01</Badge>
        <Badge tone="success" dot>Com dot</Badge>
        <Badge tone="danger" dot>Crítico</Badge>
      </div>
    </Panel>

    {/* KPI Cards */}
    <Panel title="KPI Cards">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
        <KpiCard icon="income"  label="Receitas"  value="R$ 3.900"  color="var(--success)" trend={3} />
        <KpiCard icon="expense" label="Despesas"  value="R$ 3.280"  color="var(--danger)"  trend={-8} />
        <KpiCard icon="balance" label="Saldo"     value="R$ 620"    color="var(--primary)" />
        <KpiCard icon="alerts"  label="Alertas"   value="3 ativos"  color="var(--warning)" alert />
      </div>
    </Panel>

    {/* Progress */}
    <Panel title="Barras de progresso">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div><p style={{ fontSize:12, color:'var(--text3)', marginBottom:6 }}>Saudável (40%)</p><ProgressBar value={40} /></div>
        <div><p style={{ fontSize:12, color:'var(--text3)', marginBottom:6 }}>Atenção (72%)</p><ProgressBar value={72} /></div>
        <div><p style={{ fontSize:12, color:'var(--text3)', marginBottom:6 }}>Crítico (92%)</p><ProgressBar value={92} /></div>
        <div><p style={{ fontSize:12, color:'var(--text3)', marginBottom:6 }}>Esgotado (100%)</p><ProgressBar value={100} /></div>
      </div>
    </Panel>

    {/* Spacing/radius tokens */}
    <Panel title="Tokens de espaçamento e bordas">
      <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
        {[{name:'xs',r:'var(--radius-xs)'},{name:'sm',r:'var(--radius-sm)'},{name:'md',r:'var(--radius)'},{name:'full',r:'99px'}].map(t=>(
          <div key={t.name} style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
            <div style={{ width:48, height:48, background:'var(--primary-dim)', border:'1px solid var(--primary)', borderRadius:t.r }} />
            <span style={{ fontSize:10, fontWeight:700, color:'var(--text3)' }}>radius-{t.name}</span>
          </div>
        ))}
      </div>
    </Panel>
  </div>
);

// ── CONFIGURAÇÕES ─────────────────────────────────────────────
const ConfiguracoesScreen = ({ theme, setTheme }) => {
  const THEMES = [
    { id:'light', name:'Light Clean',    desc:'Claro e minimalista', icon:'☀️' },
    { id:'dark',  name:'Dark Premium',   desc:'Escuro profissional', icon:'🌙' },
    { id:'eva',   name:'EVA-01',         desc:'Temática especial',   icon:'⚡' },
  ];
  const [period, setPeriod] = useState('due_date');
  const [density, setDensity] = useState('compact');
  const [editKey, setEditKey] = useState('demo-finance-key');
  const WIDGETS = [
    {id:'kpis',label:'Cards de KPI'},{id:'cashflow',label:'Fluxo de caixa'},
    {id:'budget',label:'Orçamentos mini'},{id:'goals',label:'Metas mini'},
    {id:'upcoming',label:'Próximos vencimentos'},{id:'patrimony',label:'Patrimônio'},
  ];
  const [widgets, setWidgets] = useState(WIDGETS.map(w=>w.id));

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
      <Panel title="Tema visual">
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {THEMES.map(t=>(
            <button key={t.id} onClick={()=>setTheme(t.id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:'var(--radius-sm)', border:`2px solid ${theme===t.id?'var(--primary)':'var(--border)'}`, background:theme===t.id?'var(--primary-dim)':'var(--surface2)', cursor:'pointer', textAlign:'left', width:'100%', transition:'all 0.15s' }}>
              <span style={{ fontSize:22 }}>{t.icon}</span>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{t.name}</p>
                <p style={{ fontSize:11, color:'var(--text3)' }}>{t.desc}</p>
              </div>
              {theme===t.id && <span style={{ marginLeft:'auto' }}><Icon name="check" size={16} color="var(--primary)" /></span>}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Período e densidade">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Field label="Regra de período"><Select value={period} onChange={e=>setPeriod(e.target.value)}><option value="due_date">Por vencimento</option><option value="competence">Por competência</option></Select></Field>
          <Field label="Densidade"><Select value={density} onChange={e=>setDensity(e.target.value)}><option value="compact">Compacta</option><option value="comfortable">Confortável</option></Select></Field>
          <Field label="Chave de acesso (Edit Key)"><Input value={editKey} onChange={e=>setEditKey(e.target.value)} type="password" /></Field>
          <Btn variant="primary">Salvar configurações</Btn>
        </div>
      </Panel>

      <Panel title="Widgets do dashboard">
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {WIDGETS.map(w=>(
            <div key={w.id} style={{ padding:'8px 12px', background:'var(--surface2)', borderRadius:'var(--radius-xs)', border:'1px solid var(--border)' }}>
              <Checkbox checked={widgets.includes(w.id)} onChange={e=>setWidgets(prev=>e.target.checked?[...prev,w.id]:prev.filter(id=>id!==w.id))} label={w.label} />
            </div>
          ))}
          <Btn variant="primary" style={{ marginTop:4 }}>Salvar widgets</Btn>
        </div>
      </Panel>

      <Panel title="Importar CSV">
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Textarea placeholder={`date,amount,title\n2026-05-25,120.50,Supermercado`} rows={4} />
          <Field label="Conta destino"><Select value=""><option value="">Sem conta</option></Select></Field>
          <Btn variant="primary" icon="export">Importar CSV</Btn>
        </div>
      </Panel>

      <Panel title="Backup e restauração">
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <p style={{ fontSize:12, color:'var(--text3)' }}>Último backup: 06/05/2026 às 14h32</p>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="primary" icon="export" style={{ flex:1 }}>Fazer backup</Btn>
            <Btn variant="ghost" icon="refresh" style={{ flex:1 }}>Restaurar</Btn>
          </div>
        </div>
      </Panel>
    </div>
  );
};

Object.assign(window, {
  OrcamentosScreen, MetasScreen, AssinaturasScreen, DividasScreen,
  PatrimonioScreen, PlanejamentoScreen, CenariosScreen, RelatoriosScreen,
  ConciliacaoScreen, AlertasScreen, DesignSystemScreen, ConfiguracoesScreen,
});
