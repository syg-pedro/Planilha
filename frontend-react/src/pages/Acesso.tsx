import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@heroui/react'
import { Campo, Carregando, Falha } from '../components/Controles'
import { useSessao } from '../hooks/useSessao'
import { FalhaApi } from '../services/api'

export default function Acesso() {
  const cadastro = useLocation().pathname === '/cadastro'
  const { sessao, carregando, entrar, cadastrar } = useSessao()
  const [erro, definirErro] = useState<unknown>(null)
  const schema = z.object({
    name: cadastro ? z.string().trim().min(1, 'Informe seu nome.').max(100) : z.string(),
    familyName: cadastro ? z.string().trim().min(1, 'Dê um nome à família.').max(100) : z.string(),
    email: z.email('Informe um e-mail válido.').max(254),
    password: z.string().min(cadastro ? 8 : 1, cadastro ? 'Use pelo menos 8 caracteres.' : 'Informe sua senha.')
      .refine(valor => new TextEncoder().encode(valor).length <= 72, 'Use uma senha com até 72 bytes.')
  })
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema), defaultValues: { name: '', familyName: '', email: '', password: '' }
  })
  if (carregando) return <Carregando />
  if (sessao) return <Navigate to="/" replace />
  return <main className="ff-access"><aside className="ff-access__story">
    <Link className="ff-brand" to="/login"><span aria-hidden="true">p.</span>Planilha</Link>
    <div><p className="ff-eyebrow">UM PLANO PARA CADA MÊS</p><h1>Seu mês,<br /><em>em dia.</em></h1>
      <p>Contas, compromissos e planos. Um lugar para cuidar do que vem pela frente.</p></div>
    <p className="ff-access__foot">Organização compartilhada. Decisões mais claras.</p>
  </aside><section className="ff-access__form"><span className="ff-tag">Ambiente local</span>
    <h2>{cadastro ? 'Vamos organizar a casa' : 'Bom ter você por aqui'}</h2>
    <p className="ff-muted">{cadastro ? 'Crie seu acesso e a primeira família.' : 'Entre para acompanhar suas finanças.'}</p>
    <form noValidate onSubmit={handleSubmit(async dados => {
      definirErro(null)
      try { if (cadastro) await cadastrar(dados); else await entrar(dados.email, dados.password) }
      catch (falha) { definirErro(falha instanceof FalhaApi && falha.status === 401 ? new Error('E-mail ou senha inválidos.') : falha) }
    })} className="ff-form">
      {cadastro && <Campo titulo="Seu nome" autoComplete="name" {...register('name')} erro={errors.name?.message} />}
      {cadastro && <Campo titulo="Nome da família" autoComplete="organization" {...register('familyName')} erro={errors.familyName?.message} />}
      <Campo titulo="E-mail" type="email" autoComplete="email" {...register('email')} erro={errors.email?.message} />
      <Campo titulo="Senha" type="password" autoComplete={cadastro ? 'new-password' : 'current-password'}
        {...register('password')} erro={errors.password?.message} />
      {erro != null && <Falha erro={erro} />}
      <Button type="submit" fullWidth isPending={isSubmitting}>{cadastro ? 'Criar minha conta' : 'Entrar'}</Button>
    </form><p className="ff-access__switch">{cadastro ? 'Já tem uma conta?' : 'Primeiro acesso?'}{' '}
      <Link to={cadastro ? '/login' : '/cadastro'}>{cadastro ? 'Entrar' : 'Criar conta'}</Link></p>
  </section></main>
}
