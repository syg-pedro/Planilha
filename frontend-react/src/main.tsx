import { Component, StrictMode } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProvedorSessao } from './hooks/useSessao'
import { Button } from '@heroui/react'
import App from './App'
import './styles.css'

class LimiteFalhas extends Component<{ children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false }
  static getDerivedStateFromError() { return { falhou: true } }
  componentDidCatch(erro: Error, informacao: ErrorInfo) { console.error('Falha ao exibir a página.', erro, informacao) }
  render() {
    return this.state.falhou ? <main className="ff-empty"><h1>Não foi possível exibir esta página.</h1>
      <p>Seus dados salvos continuam disponíveis.</p><Button onPress={() => window.location.reload()}>Recarregar</Button></main> : this.props.children
  }
}

const raiz = document.getElementById('root')!
if (!['127.0.0.1', 'localhost', '[::1]'].includes(window.location.hostname)) {
  raiz.textContent = 'Este laboratório funciona somente no ambiente local.'
} else {
  const cache = new QueryClient({ defaultOptions: { queries: { staleTime: 30000,
    retry: (tentativa, erro) => tentativa < 1 && !('status' in erro && [401, 403, 400].includes(Number(erro.status))) } } })
  createRoot(raiz).render(<StrictMode><LimiteFalhas><QueryClientProvider client={cache}><BrowserRouter>
    <ProvedorSessao><App /></ProvedorSessao>
  </BrowserRouter></QueryClientProvider></LimiteFalhas></StrictMode>)
}
