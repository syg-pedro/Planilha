// Script de Seed de Alta Fidelidade (2 anos de dados completos)
// Usuário: teste@teste.com / Senha: teste@123

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8080'

const CABECALHOS_BASE = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'FinanceiroLab',
  'Origin': 'http://127.0.0.1:5173'
}

async function requisicao(caminho, opcoes = {}, token = null) {
  const headers = { ...CABECALHOS_BASE, ...opcoes.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const resposta = await fetch(`${API_BASE}${caminho}`, {
    ...opcoes,
    headers,
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined
  })
  if (!resposta.ok) {
    const texto = await resposta.text()
    throw new Error(`HTTP ${resposta.status} em ${caminho}: ${texto}`)
  }
  if (resposta.status === 204) return null
  return resposta.json()
}

async function obterToken() {
  console.log('1. Autenticando usuário teste@teste.com...')
  try {
    const cadastro = await requisicao('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Pedro Victor',
        familyName: 'Família Teste',
        email: 'teste@teste.com',
        password: 'teste@123'
      }
    })
    console.log('   -> Usuário registrado com sucesso!')
    return cadastro.accessToken
  } catch (erro) {
    if (erro.message.includes('409') || erro.message.includes('400')) {
      console.log('   -> Usuário já existe, realizando login...')
      const login = await requisicao('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'teste@teste.com',
          password: 'teste@123'
        }
      })
      console.log('   -> Login realizado com sucesso!')
      return login.accessToken
    }
    throw erro
  }
}

async function sincronizarContas(token, contasExistentes) {
  console.log('2. Sincronizando contas e cartões...')
  const mapa = new Map(contasExistentes.map(c => [c.name, c.id]))
  const definicoes = [
    { name: 'Conta Corrente Nubank', type: 'bank', owner: 'Pedro', limitTotal: null, closingDay: null, dueDay: null },
    { name: 'Cartão Nubank Ultravioleta', type: 'credit_card', owner: 'Pedro', limitTotal: 15000, closingDay: 28, dueDay: 5 },
    { name: 'Cartão Itaú Personnalité Black', type: 'credit_card', owner: 'Pedro', limitTotal: 25000, closingDay: 15, dueDay: 22 },
    { name: 'Investimentos XP', type: 'external', owner: 'Família', limitTotal: null, closingDay: null, dueDay: null },
    { name: 'Vale Refeição Flash', type: 'benefit', owner: 'Pedro', limitTotal: null, closingDay: null, dueDay: null },
    { name: 'Poupança Reserva Caixa', type: 'bank', owner: 'Reserva', limitTotal: null, closingDay: null, dueDay: null }
  ]

  for (const def of definicoes) {
    if (!mapa.has(def.name)) {
      const criada = await requisicao('/api/accounts', { method: 'POST', body: def }, token)
      mapa.set(def.name, criada.id)
      console.log(`   + Conta criada: ${def.name}`)
    }
  }
  return mapa
}

async function sincronizarCategorias(token, categoriasExistentes) {
  console.log('3. Sincronizando categorias...')
  const mapa = new Map(categoriasExistentes.map(c => [c.name, c.id]))
  const definicoes = [
    { name: 'Salário Principal', kind: 'income', color: '#00f59b' },
    { name: 'Rendimentos & Dividendos', kind: 'income', color: '#00d2ff' },
    { name: 'Vendas & Freelance', kind: 'income', color: '#ffb800' },
    { name: 'Reembolsos Corporativos', kind: 'income', color: '#38bdf8' },
    { name: 'Moradia & Condomínio', kind: 'expense', color: '#a855f7' },
    { name: 'Alimentação & Supermercado', kind: 'expense', color: '#ff3366' },
    { name: 'Transporte & Combustível', kind: 'expense', color: '#f97316' },
    { name: 'Saúde & Farmácia', kind: 'expense', color: '#06b6d4' },
    { name: 'Lazer & Restaurantes', kind: 'expense', color: '#ec4899' },
    { name: 'Educação & Cursos', kind: 'expense', color: '#eab308' },
    { name: 'Assinaturas & Streaming', kind: 'expense', color: '#8b5cf6' },
    { name: 'Eletrônicos & Tecnologia', kind: 'expense', color: '#10b981' },
    { name: 'Manutenção & Casa', kind: 'expense', color: '#64748b' }
  ]

  for (const def of definicoes) {
    if (!mapa.has(def.name)) {
      const criada = await requisicao('/api/categories', { method: 'POST', body: def }, token)
      mapa.set(def.name, criada.id)
      console.log(`   + Categoria criada: ${def.name}`)
    }
  }
  return mapa
}

async function sincronizarRegras(token, regrasExistentes, contas, categorias) {
  console.log('4. Sincronizando recorrências e assinaturas...')
  const nomes = new Set(regrasExistentes.map(r => r.title))
  const definicoes = [
    { title: 'Salário Mensal', amount: 8500, kind: 'income', dueDay: 5, frequency: 'monthly', conta: 'Conta Corrente Nubank', cat: 'Salário Principal' },
    { title: 'Aluguel & Condomínio', amount: 2450, kind: 'expense', dueDay: 10, frequency: 'monthly', conta: 'Conta Corrente Nubank', cat: 'Moradia & Condomínio' },
    { title: 'Plano de Saúde Unimed', amount: 680, kind: 'expense', dueDay: 12, frequency: 'monthly', conta: 'Conta Corrente Nubank', cat: 'Saúde & Farmácia' },
    { title: 'Internet Fibra 600MB', amount: 149.90, kind: 'expense', dueDay: 15, frequency: 'monthly', conta: 'Conta Corrente Nubank', cat: 'Assinaturas & Streaming' },
    { title: 'Netflix Premium 4K', amount: 55.90, kind: 'expense', dueDay: 20, frequency: 'monthly', conta: 'Cartão Nubank Ultravioleta', cat: 'Assinaturas & Streaming' },
    { title: 'Spotify Familiar', amount: 34.90, kind: 'expense', dueDay: 22, frequency: 'monthly', conta: 'Cartão Nubank Ultravioleta', cat: 'Assinaturas & Streaming' },
    { title: 'Academia SmartFit', amount: 129.90, kind: 'expense', dueDay: 25, frequency: 'monthly', conta: 'Cartão Nubank Ultravioleta', cat: 'Saúde & Farmácia' }
  ]

  for (const def of definicoes) {
    if (!nomes.has(def.title)) {
      await requisicao('/api/rules', {
        method: 'POST',
        body: {
          title: def.title,
          amount: def.amount,
          kind: def.kind,
          dueDay: def.dueDay,
          frequency: def.frequency,
          autoGenerate: true,
          startsAt: '2024-11-01',
          accountId: contas.get(def.conta),
          categoryId: categorias.get(def.cat)
        }
      }, token)
      console.log(`   + Regra criada: ${def.title}`)
    }
  }
}

async function sincronizarDesejos(token) {
  console.log('5. Sincronizando lista de desejos...')
  const resposta = await requisicao('/api/wishlist', {}, token)
  const existentes = new Set((resposta.items || []).map(i => i.name))

  const definicoes = [
    { name: 'Monitor Ultrawide 34" LG IPS 144Hz', price: 2899, priority: 'high', status: 'want', category: 'Eletrônicos', url: 'https://www.lg.com/br/monitores/ultrawide', notes: 'Para o setup de home office' },
    { name: 'Viagem de Férias para o Chile / Neve', price: 6500, priority: 'high', status: 'saving', category: 'Viagens', notes: 'Meta para as férias de inverno em 2027' },
    { name: 'Cadeira Ergonômica Herman Miller Aeron', price: 4200, priority: 'medium', status: 'want', category: 'Home Office', url: 'https://www.hermanmiller.com/pt_br' },
    { name: 'Kindle Paperwhite 16GB', price: 649, priority: 'low', status: 'bought', category: 'Lazer', notes: 'Comprado na Black Friday' },
    { name: 'Fone Sony WH-1000XM5 ANC', price: 2199, priority: 'medium', status: 'want', category: 'Eletrônicos', url: 'https://www.sony.com.br' },
    { name: 'Especialização Fullstack Cloud Architecture', price: 1800, priority: 'high', status: 'bought', category: 'Educação', notes: 'Certificação concluída com sucesso' }
  ]

  for (const def of definicoes) {
    if (!existentes.has(def.name)) {
      await requisicao('/api/wishlist', { method: 'POST', body: def }, token)
      console.log(`   + Desejo criado: ${def.name}`)
    }
  }
}

async function sincronizarConvite(token) {
  console.log('6. Sincronizando convite de família...')
  try {
    const resposta = await requisicao('/api/families/invitations', {}, token)
    if (!resposta.invitations || resposta.invitations.length === 0) {
      await requisicao('/api/families/invitations', {
        method: 'POST',
        body: { email: 'parceiro@teste.com', role: 'member' }
      }, token)
      console.log('   + Convite criado para parceiro@teste.com')
    }
  } catch (err) {
    console.log('   (convite já existente ou não disponível)')
  }
}

async function gerarLancamentos2Anos(token, contas, categorias) {
  console.log('7. Gerando lançamentos de 2 anos (Nov/2024 até Out/2026) e dívidas ativas...')
  const bootstrap = await requisicao('/api/bootstrap', {}, token)
  const lancamentosAtuais = bootstrap.entries || []
  if (lancamentosAtuais.length > 0) {
    console.log(`   -> Limpando ${lancamentosAtuais.length} lançamentos existentes para regeneração consistente...`)
    const tamanho = 30
    for (let i = 0; i < lancamentosAtuais.length; i += tamanho) {
      const pedaco = lancamentosAtuais.slice(i, i + tamanho)
      await Promise.all(pedaco.map(l => requisicao(`/api/entries/${l.id}`, { method: 'DELETE' }, token)))
      process.stdout.write(`\r   -> Removidos ${Math.min(i + tamanho, lancamentosAtuais.length)} de ${lancamentosAtuais.length}...`)
    }
    console.log('')
  }

  const loteUpserts = []
  const dataHoje = '2026-10-29'

  // 24 Meses: 2024-11 até 2026-10
  const meses = []
  for (let ano = 2024; ano <= 2026; ano++) {
    const mesInicio = ano === 2024 ? 11 : 1
    const mesFim = ano === 2026 ? 10 : 12
    for (let mes = mesInicio; mes <= mesFim; mes++) {
      meses.push(`${ano}-${String(mes).padStart(2, '0')}`)
    }
  }

  const cConta = contas.get('Conta Corrente Nubank')
  const cCartaoUltra = contas.get('Cartão Nubank Ultravioleta')
  const cCartaoBlack = contas.get('Cartão Itaú Personnalité Black')
  const cFlash = contas.get('Vale Refeição Flash')
  const cPoupanca = contas.get('Poupança Reserva Caixa')

  const catSalario = categorias.get('Salário Principal')
  const catRendimentos = categorias.get('Rendimentos & Dividendos')
  const catFreelance = categorias.get('Vendas & Freelance')
  const catMoradia = categorias.get('Moradia & Condomínio')
  const catMercado = categorias.get('Alimentação & Supermercado')
  const catTransporte = categorias.get('Transporte & Combustível')
  const catSaude = categorias.get('Saúde & Farmácia')
  const catLazer = categorias.get('Lazer & Restaurantes')
  const catAssinaturas = categorias.get('Assinaturas & Streaming')
  const catEletronicos = categorias.get('Eletrônicos & Tecnologia')
  const catEducacao = categorias.get('Educação & Cursos')

  for (const anoMes of meses) {
    const [anoStr, mesStr] = anoMes.split('-')
    const ano = Number(anoStr)
    const mes = Number(mesStr)

    const diaIso = dia => `${anoMes}-${String(dia).padStart(2, '0')}`
    const calcularStatus = (dataVenc) => {
      if (dataVenc < '2026-10-20') return Math.random() < 0.04 ? 'review' : 'paid'
      if (dataVenc <= dataHoje) return Math.random() < 0.5 ? 'paid' : 'pending'
      return 'pending'
    }

    // 1. Receita Principal - Salário
    const dtSalario = diaIso(5)
    loteUpserts.push({
      title: 'Salário Mensal - Tech Lead',
      amount: 8500,
      kind: 'income',
      dueDate: dtSalario,
      competenceDate: dtSalario,
      accountId: cConta,
      categoryId: catSalario,
      status: calcularStatus(dtSalario),
      origin: 'auto'
    })

    // 2. Receita - Rendimentos
    const dtRend = diaIso(15)
    const vlrRend = Number((180 + Math.random() * 120).toFixed(2))
    loteUpserts.push({
      title: 'Rendimentos CDB & Tesouro Selic',
      amount: vlrRend,
      kind: 'income',
      dueDate: dtRend,
      competenceDate: dtRend,
      accountId: cConta,
      categoryId: catRendimentos,
      status: calcularStatus(dtRend),
      origin: 'manual'
    })

    // 3. Receita - Freelance (a cada 3 meses)
    if (mes % 3 === 0) {
      const dtFree = diaIso(20)
      loteUpserts.push({
        title: 'Consultoria Backend & DevOps',
        amount: 2200,
        kind: 'income',
        dueDate: dtFree,
        competenceDate: dtFree,
        accountId: cConta,
        categoryId: catFreelance,
        status: calcularStatus(dtFree),
        origin: 'manual'
      })
    }

    // 4. Moradia - Aluguel & Condomínio
    const dtAluguel = diaIso(10)
    loteUpserts.push({
      title: 'Aluguel do Apartamento & Condomínio',
      amount: 2450,
      kind: 'expense',
      dueDate: dtAluguel,
      competenceDate: dtAluguel,
      accountId: cConta,
      categoryId: catMoradia,
      status: calcularStatus(dtAluguel),
      origin: 'auto'
    })

    // 5. Saúde - Plano
    const dtSaude = diaIso(12)
    loteUpserts.push({
      title: 'Plano de Saúde Unimed Familiar',
      amount: 680,
      kind: 'expense',
      dueDate: dtSaude,
      competenceDate: dtSaude,
      accountId: cConta,
      categoryId: catSaude,
      status: calcularStatus(dtSaude),
      origin: 'auto'
    })

    // 6. Internet
    const dtNet = diaIso(15)
    loteUpserts.push({
      title: 'Internet Fibra Óptica 600 Mega',
      amount: 149.90,
      kind: 'expense',
      dueDate: dtNet,
      competenceDate: dtNet,
      accountId: cConta,
      categoryId: catAssinaturas,
      status: calcularStatus(dtNet),
      origin: 'auto'
    })

    // 7. Energia Elétrica
    const dtLuz = diaIso(18)
    const vlrLuz = Number((210 + Math.random() * 85).toFixed(2))
    loteUpserts.push({
      title: 'Conta de Energia Elétrica Enel',
      amount: vlrLuz,
      kind: 'expense',
      dueDate: dtLuz,
      competenceDate: dtLuz,
      accountId: cConta,
      categoryId: catMoradia,
      status: calcularStatus(dtLuz),
      origin: 'manual'
    })

    // 8. Streamings no Cartão
    const dtNetflix = diaIso(20)
    loteUpserts.push({
      title: 'Netflix Assinatura Premium 4K',
      amount: 55.90,
      kind: 'expense',
      dueDate: dtNetflix,
      competenceDate: dtNetflix,
      accountId: cCartaoUltra,
      categoryId: catAssinaturas,
      status: calcularStatus(dtNetflix),
      origin: 'auto'
    })

    const dtSpotify = diaIso(22)
    loteUpserts.push({
      title: 'Spotify Premium Família',
      amount: 34.90,
      kind: 'expense',
      dueDate: dtSpotify,
      competenceDate: dtSpotify,
      accountId: cCartaoUltra,
      categoryId: catAssinaturas,
      status: calcularStatus(dtSpotify),
      origin: 'auto'
    })

    // 9. Academia
    const dtGym = diaIso(25)
    loteUpserts.push({
      title: 'Mensalidade Academia SmartFit Black',
      amount: 129.90,
      kind: 'expense',
      dueDate: dtGym,
      competenceDate: dtGym,
      accountId: cCartaoUltra,
      categoryId: catSaude,
      status: calcularStatus(dtGym),
      origin: 'auto'
    })

    // 10. Mercado Quinzena 1 & 2
    const dtMerc1 = diaIso(6)
    const vlrMerc1 = Number((450 + Math.random() * 150).toFixed(2))
    loteUpserts.push({
      title: 'Supermercado Pão de Açúcar (Quinzena 1)',
      amount: vlrMerc1,
      kind: 'expense',
      dueDate: dtMerc1,
      competenceDate: dtMerc1,
      accountId: cFlash,
      categoryId: catMercado,
      status: calcularStatus(dtMerc1),
      origin: 'manual'
    })

    const dtMerc2 = diaIso(21)
    const vlrMerc2 = Number((480 + Math.random() * 160).toFixed(2))
    loteUpserts.push({
      title: 'Supermercado Carrefour (Quinzena 2)',
      amount: vlrMerc2,
      kind: 'expense',
      dueDate: dtMerc2,
      competenceDate: dtMerc2,
      accountId: cCartaoUltra,
      categoryId: catMercado,
      status: calcularStatus(dtMerc2),
      origin: 'manual'
    })

    // 11. Combustível
    const dtComb1 = diaIso(14)
    loteUpserts.push({
      title: 'Posto Shell V-Power Combustível',
      amount: Number((180 + Math.random() * 60).toFixed(2)),
      kind: 'expense',
      dueDate: dtComb1,
      competenceDate: dtComb1,
      accountId: cCartaoUltra,
      categoryId: catTransporte,
      status: calcularStatus(dtComb1),
      origin: 'manual'
    })

    const dtComb2 = diaIso(28)
    loteUpserts.push({
      title: 'Posto Ipiranga Combustível',
      amount: Number((190 + Math.random() * 50).toFixed(2)),
      kind: 'expense',
      dueDate: dtComb2,
      competenceDate: dtComb2,
      accountId: cCartaoUltra,
      categoryId: catTransporte,
      status: calcularStatus(dtComb2),
      origin: 'manual'
    })

    // 12. Lazer & Restaurantes
    const dtLazer = diaIso(17)
    loteUpserts.push({
      title: 'Jantar Restaurante Fim de Semana',
      amount: Number((140 + Math.random() * 120).toFixed(2)),
      kind: 'expense',
      dueDate: dtLazer,
      competenceDate: dtLazer,
      accountId: cCartaoUltra,
      categoryId: catLazer,
      status: calcularStatus(dtLazer),
      origin: 'manual'
    })
  }

  // --------------------------------------------------------------------------
  // PARCELAMENTOS E DÍVIDAS (PARA A TELA /dividas)
  // --------------------------------------------------------------------------

  // 1. Notebook Dell XPS 15 (10x de R$ 750 - Jan/2025 a Out/2025)
  for (let i = 1; i <= 10; i++) {
    const mes = String(i).padStart(2, '0')
    const dt = `2025-${mes}-10`
    loteUpserts.push({
      title: 'Notebook Dell XPS 15 32GB i7',
      amount: 750,
      kind: 'expense',
      dueDate: dt,
      competenceDate: dt,
      installmentIndex: i,
      installmentTotal: 10,
      accountId: cCartaoBlack,
      categoryId: catEletronicos,
      status: 'paid',
      origin: 'manual'
    })
  }

  // 2. iPhone 16 Pro 256GB (12x de R$ 680 - Set/2025 a Ago/2026)
  for (let i = 1; i <= 12; i++) {
    const ano = i <= 4 ? 2025 : 2026
    const mesNum = i <= 4 ? 8 + i : i - 4
    const dt = `${ano}-${String(mesNum).padStart(2, '0')}-05`
    const status = dt <= dataHoje ? 'paid' : 'pending'
    loteUpserts.push({
      title: 'iPhone 16 Pro Titânio Preto 256GB',
      amount: 680,
      kind: 'expense',
      dueDate: dt,
      competenceDate: dt,
      installmentIndex: i,
      installmentTotal: 12,
      accountId: cCartaoUltra,
      categoryId: catEletronicos,
      status,
      origin: 'manual'
    })
  }

  // 3. Reforma da Cozinha & Bancada Granito (6x de R$ 1.200 - Mar/2025 a Ago/2025)
  for (let i = 1; i <= 6; i++) {
    const dt = `2025-0${2 + i}-15`
    loteUpserts.push({
      title: 'Reforma da Cozinha & Armários Planejados',
      amount: 1200,
      kind: 'expense',
      dueDate: dt,
      competenceDate: dt,
      installmentIndex: i,
      installmentTotal: 6,
      accountId: cCartaoBlack,
      categoryId: catMoradia,
      status: 'paid',
      origin: 'manual'
    })
  }

  // 4. Geladeira Inverter Frost Free 450L (8x de R$ 390 - Fev/2026 a Set/2026)
  for (let i = 1; i <= 8; i++) {
    const dt = `2026-0${1 + i}-22`
    loteUpserts.push({
      title: 'Geladeira Brastemp Frost Free Inverter',
      amount: 390,
      kind: 'expense',
      dueDate: dt,
      competenceDate: dt,
      installmentIndex: i,
      installmentTotal: 8,
      accountId: cCartaoUltra,
      categoryId: catMoradia,
      status: 'paid',
      origin: 'manual'
    })
  }

  // 5. Pós-Graduação Tech Lead & Arquitetura (12x de R$ 490 - Jun/2025 a Mai/2026)
  for (let i = 1; i <= 12; i++) {
    const ano = i <= 7 ? 2025 : 2026
    const mesNum = i <= 7 ? 5 + i : i - 7
    const dt = `${ano}-${String(mesNum).padStart(2, '0')}-28`
    loteUpserts.push({
      title: 'Pós-Graduação Software Architecture & Cloud',
      amount: 490,
      kind: 'expense',
      dueDate: dt,
      competenceDate: dt,
      installmentIndex: i,
      installmentTotal: 12,
      accountId: cCartaoBlack,
      categoryId: catEducacao,
      status: 'paid',
      origin: 'manual'
    })
  }

  // 6. [DÍVIDA ATIVA] iPhone 16 Pro Max 512GB (12x de R$ 749 - Jul/2026 a Jun/2027)
  for (let i = 1; i <= 12; i++) {
    const ano = i <= 6 ? 2026 : 2027
    const mesNum = i <= 6 ? 6 + i : i - 6
    const dt = `${ano}-${String(mesNum).padStart(2, '0')}-05`
    const status = dt < '2026-10-01' ? 'paid' : 'pending'
    loteUpserts.push({
      title: 'iPhone 16 Pro Max Titânio Natural 512GB',
      amount: 749,
      kind: 'expense',
      dueDate: dt,
      competenceDate: dt,
      installmentIndex: i,
      installmentTotal: 12,
      accountId: cCartaoUltra,
      categoryId: catEletronicos,
      status,
      origin: 'manual'
    })
  }

  // 7. [DÍVIDA ATIVA] Financiamento Energia Solar Fotovoltaica (24x de R$ 620 - Jan/2026 a Dez/2027)
  for (let i = 1; i <= 24; i++) {
    const ano = i <= 12 ? 2026 : 2027
    const mesNum = i <= 12 ? i : i - 12
    const dt = `${ano}-${String(mesNum).padStart(2, '0')}-18`
    const status = dt < '2026-10-01' ? 'paid' : 'pending'
    loteUpserts.push({
      title: 'Financiamento Sistema Solar 8.5kWp',
      amount: 620,
      kind: 'expense',
      dueDate: dt,
      competenceDate: dt,
      installmentIndex: i,
      installmentTotal: 24,
      accountId: cConta,
      categoryId: catMoradia,
      status,
      origin: 'manual'
    })
  }

  // 8. [DÍVIDA ATIVA] Smart TV Samsung Neo QLED 65" 4K (10x de R$ 580 - Ago/2026 a Mai/2027)
  for (let i = 1; i <= 10; i++) {
    const ano = i <= 5 ? 2026 : 2027
    const mesNum = i <= 5 ? 7 + i : i - 5
    const dt = `${ano}-${String(mesNum).padStart(2, '0')}-20`
    const status = dt < '2026-10-01' ? 'paid' : 'pending'
    loteUpserts.push({
      title: 'Smart TV Samsung Neo QLED 65" 4K Gaming',
      amount: 580,
      kind: 'expense',
      dueDate: dt,
      competenceDate: dt,
      installmentIndex: i,
      installmentTotal: 10,
      accountId: cCartaoBlack,
      categoryId: catEletronicos,
      status,
      origin: 'manual'
    })
  }

  // 9. [DÍVIDA ATIVA] Pacote Viagem Família Férias 2027 (8x de R$ 850 - Set/2026 a Abr/2027)
  for (let i = 1; i <= 8; i++) {
    const ano = i <= 4 ? 2026 : 2027
    const mesNum = i <= 4 ? 8 + i : i - 4
    const dt = `${ano}-${String(mesNum).padStart(2, '0')}-27`
    const status = dt < '2026-10-01' ? 'paid' : 'pending'
    loteUpserts.push({
      title: 'Pacote Férias Família Resorts & Voos 2027',
      amount: 850,
      kind: 'expense',
      dueDate: dt,
      competenceDate: dt,
      installmentIndex: i,
      installmentTotal: 8,
      accountId: cCartaoBlack,
      categoryId: catLazer,
      status,
      origin: 'manual'
    })
  }

  console.log(`   -> Enviando ${loteUpserts.length} lançamentos via /api/entries em lotes paralelos...`)
  const tamanhoLote = 25
  for (let i = 0; i < loteUpserts.length; i += tamanhoLote) {
    const pedaco = loteUpserts.slice(i, i + tamanhoLote)
    await Promise.all(
      pedaco.map(corpo => requisicao('/api/entries', { method: 'POST', body: corpo }, token))
    )
    process.stdout.write(`\r   -> Inseridos ${Math.min(i + tamanhoLote, loteUpserts.length)} de ${loteUpserts.length}...`)
  }
  console.log('\n   -> Todos os lançamentos inseridos com sucesso!')
}

async function atualizarConfiguracoes(token) {
  console.log('8. Atualizando configurações da família (Dark Neon, 24 meses)...')
  const bootstrap = await requisicao('/api/bootstrap', {}, token)
  const atuais = bootstrap.settings

  await requisicao('/api/settings', {
    method: 'PUT',
    body: {
      currency: atuais.currency || 'BRL',
      timezone: atuais.timezone || 'America/Sao_Paulo',
      themeMode: 'dark',
      densityMode: 'comfortable',
      periodMode: 'due_date',
      horizonMonths: 24,
      notificationDays: [1, 3, 7],
      notificationTime: '08:00',
      colorTokens: {
        ...atuais.colorTokens,
        primary: '#00f59b',
        accent: '#00d2ff',
        positive: '#00f59b',
        negative: '#ff3366',
        neutral: '#94a3b8',
        background: '#07090e',
        card: '#0f1420'
      },
      dashboardConfig: {
        ...atuais.dashboardConfig,
        visibleWidgets: ['kpis', 'cashflow', 'categories', 'upcoming', 'cycles'],
        sortMode: 'date_asc',
        defaultRange: 'month'
      },
      onboarding: atuais.onboarding
    }
  }, token)
  console.log('   -> Configurações atualizadas!')
}

async function main() {
  console.log('====================================================================')
  console.log('  INICIANDO SEED DE TESTE LOCAL (2 ANOS DE DADOS PARA TESTE)')
  console.log('====================================================================')
  const inicio = Date.now()
  const token = await obterToken()

  const bootstrap = await requisicao('/api/bootstrap', {}, token)
  const contas = await sincronizarContas(token, bootstrap.accounts || [])
  const categorias = await sincronizarCategorias(token, bootstrap.categories || [])
  await sincronizarRegras(token, bootstrap.rules || [], contas, categorias)
  await sincronizarDesejos(token)
  await sincronizarConvite(token)
  await gerarLancamentos2Anos(token, contas, categorias)
  await atualizarConfiguracoes(token)

  const segundos = ((Date.now() - inicio) / 1000).toFixed(1)
  console.log('====================================================================')
  console.log(`  SEED CONCLUÍDO COM SUCESSO EM ${segundos}s!`)
  console.log('  Credenciais prontas para teste:')
  console.log('  E-mail: teste@teste.com')
  console.log('  Senha:  teste@123')
  console.log('====================================================================')
}

main().catch(erro => {
  console.error('ERRO NO SEED:', erro)
  process.exit(1)
})

