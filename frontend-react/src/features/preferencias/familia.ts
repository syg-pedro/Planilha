export type Familia = { id: string; name: string; role: 'owner' | 'member' }
export type Membro = { userId: string; name: string; email: string; role: 'owner' | 'member'; joinedAt: string }
export type Convite = { id: string; email: string; role: 'owner' | 'member'; expiresAt: string; createdAt: string }
export const podeRemoverMembro = (membro: Membro, membros: Membro[], usuarioId: string) =>
  membro.userId !== usuarioId && (membro.role !== 'owner' || membros.filter(item => item.role === 'owner').length > 1)
export const textosFamilia = {
  titulo: 'Família', membros: 'Pessoas da família', convites: 'Convites',
  semEmail: 'Nenhum e-mail é enviado. Compartilhe o código com a pessoa convidada por um canal de confiança.',
  token: 'Copie o código agora. Ele não será exibido novamente após sair desta tela.',
  acesso: 'Somente responsáveis podem convidar e remover pessoas. O último responsável precisa permanecer na família.',
  entrada: 'O convite precisa corresponder ao e-mail da sua conta. Ao aceitar, a família será selecionada.'
}
