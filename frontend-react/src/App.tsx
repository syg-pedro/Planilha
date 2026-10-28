import { Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Carregando, Vazio } from './components/Controles'

const Estrutura = lazy(() => import('./components/Estrutura'))
const Acesso = lazy(() => import('./pages/Acesso'))
const Painel = lazy(() => import('./pages/Painel'))
const Lancamentos = lazy(() => import('./pages/Lancamentos'))
const Recursos = lazy(() => import('./pages/Recursos'))
const Planejamento = lazy(() => import('./pages/Planejamento'))
const Dividas = lazy(() => import('./pages/Dividas'))
const Relatorios = lazy(() => import('./pages/Relatorios'))

export default function App() {
  return <Suspense fallback={<Carregando />}><Routes><Route path="/login" element={<Acesso />} /><Route path="/cadastro" element={<Acesso />} />
    <Route element={<Estrutura />}><Route index element={<Painel />} />
      <Route path="lancamentos" element={<Lancamentos />} />
      <Route path="contas" element={<Recursos recurso="accounts" />} />
      <Route path="categorias" element={<Recursos recurso="categories" />} />
      <Route path="recorrencias" element={<Recursos recurso="rules" />} />
      <Route path="desejos" element={<Recursos recurso="wishlist" />} />
      <Route path="planejamento" element={<Planejamento />} />
      <Route path="dividas" element={<Dividas />} />
      <Route path="relatorios" element={<Relatorios />} />
      <Route path="*" element={<Vazio titulo="Página não encontrada">Use a navegação para abrir uma área da sua organização.</Vazio>} />
    </Route></Routes></Suspense>
}
