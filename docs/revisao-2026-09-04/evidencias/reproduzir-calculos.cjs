// Diagnóstico local: executa as funções existentes, sem escrever dados do app.
// Executar da raiz: node docs/revisao-2026-09-04/evidencias/reproduzir-calculos.cjs
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
function load(file) {
  const filename = path.resolve(file)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  const localRequire = name => load(path.resolve(path.dirname(filename), name + '.ts'))
  vm.runInNewContext(code, { module, exports: module.exports, require: localRequire, Date, Map, Set })
  return module.exports
}
const { applyFilters, computeKpis } = load('shared/finance.ts')
const today = new Date().toISOString().slice(0, 10)
const entry = { id: 'diagnostico', amount: 100, kind: 'expense', status: 'pending', dueDate: today, competenceDate: today, accountId: null, categoryId: null }
console.log(JSON.stringify({
  today,
  filtroContaSelecionadaRetornaSemConta: applyFilters([entry], { range: 'month', periodMode: 'due_date', accountIds: ['outra-conta'], categoryIds: [] }).length,
  vencimentoHojeContabilizadoNosProximos7Dias: computeKpis([entry], []).upcoming7Days,
  valorDigitado: '1.234,56',
  valorInterpretadoPelaExpressaoDaMatriz: parseFloat('1.234,56'.replace(',', '.').trim()),
}, null, 2))
