// ff2-dashboard.jsx — Dashboard expandido com alertas, KPIs, gráficos, orçamentos mini, metas mini

const { useState, useMemo } = React;

const now = new Date();
const Y = now.getFullYear(), M = now.getMonth();
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ── Mock ─────────────────────────────────────────────────────
const SMART_ALERTS = [
  { tone:'danger',  title:'Nubank vence em 3 dias', body:'Fatura de R$ 589,90 — evite juros.' },
  { tone:'warning', title:'Orçamento de Cartões em 94%', body:'Você já consumiu R$ 1.654 de R$ 1.750.' },
  { tone:'info',    title:'Meta Reserva de Emergência: 62%', body:'Aporte sugerido: R$ 400 este mês.' },
  { tone:'success', title:'Salário Pedro creditado', body:'R$ 1.000 disponível na Conta Pedro.' },
];

const CASHFLOW_DATA = [
  { month:'Fev', income:3900, expense:2780, current:false },
  { month:'Mar', income:3900, expense:3150, current:false },
  { month:'Abr', income:3900, expense:2640, current:false },
  { month:'Mai', income:3900, expense:3280, current:true  },
  { month:'Jun', income:3900, expense:2950, current:false },
  { month:'Jul', income:3900, expense:2800, current:false },
];

const BUDGET_ITEMS = [
  { name:'Cartões',  spent:1654, limit:1750, color:'var(--primary)' },
  { name:'Moradia',  spent:1700, limit:1700, color:'var(--danger)'  },
  { name:'Serviços', spent: 99,  limit: 200, color:'var(--success)' },
  { name:'Educação', spent:171,  limit: 300, color:'var(--accent)'  },
];

const GOALS = [
  { name:'Reserva de Emergência', current:6200, target:10000, color:'var(--success)' },
  { name:'Viagem de Férias',      current:1800, target: 5000, color:'var(--primary)' },
  { name:'Troca do Celular',      current: 400, target: 1500, color:'var(--accent)'  },
];

const PATRIMONY = { assets: 28400, liabilities: 14200 };

const UPCOMING = [
  { title:'Nubank Pedro',     amount:589.90, dueDate:'2026-05-10', days:3,  account:'Nubank' },
  { title:'Aluguel + Cond.',  amount:1700,   dueDate:'2026-05-12', days:5,  account:'Banco'  },
  { title:'Sicredi Pedro',    amount:484.75, dueDate:'2026-05-15', days:8,  account:'Sicredi'},
  { title:'Energia',          amount:260,    dueDate:'2026-05-18', days:11, account:'—'      },
  { title:'Mercado Livre',    amount:480.87, dueDate:'2026-05-18', days:11, account:'ML'     },
];

const NET_WORTH_TREND = [18200,19800,21100,20400,22600,24200,14200];

// ── Components ────────────────────────────────────────────────

const BudgetMiniCard = ({ item }) => {
  const pct = Math.min(100,(item.spent/item.limit)*100);
  const c = pct>=100?'var(--danger)':pct>=90?'var(--danger)':pct>=70?'var(--warning)':item.color;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{item.name}</span>
        <span style={{ fontSize:11, color:c, fontWeight:700 }}>{fmt(item.spent)} / {fmt(item.limit)}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ flex:1, height:6, background:'var(--bg2)', borderRadius:99, overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, height:'100%', background:c, borderRadius:99, transition:'width 0.6s', boxShadow:pct>=90?`0 0 6px ${c}`:'' }} />
        </div>
        <span style={{ fontSize:10, fontWeight:700, color:c, minWidth:32, textAlign:'right' }}>{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
};

const GoalMiniCard = ({ goal }) => {
  const pct = Math.min(100,(goal.current/goal.target)*100);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <DonutRing percent={pct} color={goal.color} size={44} stroke={5} label={`${pct.toFixed(0)}%`} />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:12, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{goal.name}</p>
        <p style={{ fontSize:11, color:'var(--text3)' }}>{fmt(goal.current)} de {fmt(goal.target)}</p>
      </div>
    </div>
  );
};

const UpcomingRow = ({ item }) => {
  const urgency = item.days<=3?{tone:'danger',label:'Urgente'}:item.days<=7?{tone:'warning',label:'Esta semana'}:{tone:'neutral',label:`${item.days} dias`};
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</p>
        <p style={{ fontSize:11, color:'var(--text3)' }}>{item.account} · {fmtDate(item.dueDate)}</p>
      </div>
      <span style={{ fontSize:13, fontWeight:800, color:'var(--danger)', whiteSpace:'nowrap' }}>{fmt(item.amount)}</span>
      <Badge tone={urgency.tone}>{urgency.label}</Badge>
    </div>
  );
};

// ── Dashboard Screen ──────────────────────────────────────────
const DashboardScreen = ({ onNavigate }) => {
  const totalIncome = 3900;
  const totalExpense = 3280;
  const net = totalIncome - totalExpense;
  const pending = 2680;
  const upcoming7 = 589.90+1700;
  const cardUsed = 74.2;
  const netWorth = PATRIMONY.assets - PATRIMONY.liabilities;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Alert banner */}
      <AlertBanner alerts={SMART_ALERTS} />

      {/* KPI Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:12 }}>
        <KpiCard icon="income"   label="Receitas Mai"      value={fmt(totalIncome)} color="var(--success)" trend={0} sub="vs. abril" />
        <KpiCard icon="expense"  label="Despesas Mai"      value={fmt(totalExpense)} color="var(--danger)"  trend={24} sub="vs. abril" alert />
        <KpiCard icon="balance"  label="Saldo líquido"     value={fmt(net)}  color={net>=0?"var(--success)":"var(--danger)"} sub={net>=0?"Positivo":"Negativo"} />
        <KpiCard icon="pending"  label="Em aberto"         value={fmt(pending)} color="var(--warning)" sub="Pendências" />
        <KpiCard icon="calendar" label="Próximos 7 dias"   value={fmt(upcoming7)} color="var(--accent)" sub="Vencimentos" />
        <KpiCard icon="card"     label="Uso dos cartões"   value={fmtPct(cardUsed)} color={cardUsed>80?"var(--danger)":"var(--primary)"} sub="do limite total" />
        <KpiCard icon="patrimony" label="Patrimônio líq."  value={fmt(netWorth)} color="var(--primary)" sub="Ativos - Passivos" onClick={()=>onNavigate('patrimony')} />
      </div>

      {/* Charts row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16 }}>
        <Panel title="Fluxo de caixa" subtitle="6 meses"
          action={<div style={{ display:'flex', gap:8 }}>
            <Badge tone="success" dot>Receita</Badge>
            <Badge tone="danger" dot>Despesa</Badge>
          </div>}>
          <BarChart data={CASHFLOW_DATA} height={130} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:8 }}>
            {CASHFLOW_DATA.filter(d=>d.current||CASHFLOW_DATA.indexOf(d)>=3).slice(-3).map((d,i)=>(
              <div key={i} style={{ background:'var(--surface2)', borderRadius:'var(--radius-sm)', padding:'8px 10px', border: d.current?'1px solid var(--primary)':'1px solid var(--border)' }}>
                <p style={{ fontSize:10, color:'var(--text3)', fontWeight:700 }}>{d.month}</p>
                <p style={{ fontSize:13, fontWeight:800, color:d.income-d.expense>=0?'var(--success)':'var(--danger)' }}>{fmt(d.income-d.expense)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Patrimônio líquido" subtitle="Evolução 7 meses"
          action={<Btn size="sm" variant="subtle" icon="arrow_up_right" onClick={()=>onNavigate('patrimony')}>Ver detalhes</Btn>}>
          <LineChart data={NET_WORTH_TREND} height={110} color="var(--primary)" />
          <div style={{ display:'flex', gap:16, marginTop:10 }}>
            <StatRow label="Ativos" value={fmt(PATRIMONY.assets)} color="var(--success)" />
            <StatRow label="Passivos" value={fmt(PATRIMONY.liabilities)} color="var(--danger)" />
          </div>
        </Panel>
      </div>

      {/* Budget + Goals */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
        <Panel title="Orçamentos do mês" subtitle="Consumo vs. limite por categoria"
          action={<Btn size="sm" variant="subtle" icon="budget" onClick={()=>onNavigate('budget')}>Gerenciar</Btn>}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {BUDGET_ITEMS.map((item,i) => <BudgetMiniCard key={i} item={item} />)}
          </div>
        </Panel>

        <Panel title="Metas financeiras" subtitle="Progresso de cada objetivo"
          action={<Btn size="sm" variant="subtle" icon="goal" onClick={()=>onNavigate('goals')}>Ver todas</Btn>}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {GOALS.map((g,i) => <GoalMiniCard key={i} goal={g} />)}
          </div>
        </Panel>

        <Panel title="Próximos vencimentos" subtitle="Despesas pendentes"
          action={<Badge tone="danger" dot>{UPCOMING.length} pendentes</Badge>}>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {UPCOMING.map((item,i) => <UpcomingRow key={i} item={item} />)}
          </div>
        </Panel>
      </div>

      {/* Savings rate strip */}
      <div style={{ background:'var(--surface)', borderRadius:'var(--radius)', border:'1px solid var(--border)', padding:'14px 18px', display:'flex', flexWrap:'wrap', gap:20, alignItems:'center' }}>
        <div style={{ flex:1, minWidth:160 }}>
          <p style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>Taxa de poupança</p>
          <p style={{ fontSize:22, fontWeight:800, color:'var(--primary)', marginTop:2 }}>{((net/totalIncome)*100).toFixed(1)}%</p>
          <p style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Recomendado: ≥ 20%</p>
        </div>
        <div style={{ flex:2, minWidth:200 }}>
          <ProgressBar value={net} max={totalIncome} color="var(--primary)" height={10} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
            <span style={{ fontSize:11, color:'var(--text3)' }}>Economizado: {fmt(net)}</span>
            <span style={{ fontSize:11, color:'var(--text3)' }}>Receita: {fmt(totalIncome)}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="primary" icon="reports" size="sm" onClick={()=>onNavigate('reports')}>Relatório completo</Btn>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { DashboardScreen });
