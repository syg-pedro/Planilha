import { useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import {
  Button,
  Card,
  Checkbox,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Skeleton,
  TextArea,
  TextField
} from '@heroui/react'
import { dinheiro } from '../services/formatacao'

// ----------------------------------------------------------------------------
// ENTRADAS DE DADOS (TEXTO, DATA, MÊS, BUSCA, NÚMERO)
// ----------------------------------------------------------------------------

export function Campo({
  titulo,
  erro,
  dica,
  className = '',
  ...propriedades
}: ComponentProps<typeof Input> & {
  titulo: string
  erro?: string
  dica?: string
}) {
  return (
    <TextField isInvalid={!!erro} fullWidth className={`ff-field ${className}`}>
      <Label>{titulo}</Label>
      <Input {...propriedades} />
      {dica && !erro && <p className="ff-field__hint">{dica}</p>}
      <FieldError>{erro}</FieldError>
    </TextField>
  )
}

// ----------------------------------------------------------------------------
// ENTRADA DE SENHA COM TOGGLE DE VISIBILIDADE (USABILIDADE)
// ----------------------------------------------------------------------------

export function CampoSenha({
  titulo,
  erro,
  dica,
  className = '',
  ...propriedades
}: ComponentProps<typeof Input> & {
  titulo: string
  erro?: string
  dica?: string
}) {
  const [visivel, definirVisivel] = useState(false)

  return (
    <TextField isInvalid={!!erro} fullWidth className={`ff-field ${className}`}>
      <Label>{titulo}</Label>
      <div className="ff-field__password-wrapper">
        <Input
          {...propriedades}
          type={visivel ? 'text' : 'password'}
        />
        <button
          type="button"
          tabIndex={-1}
          className="ff-password-toggle"
          onClick={() => definirVisivel(v => !v)}
          aria-label={visivel ? 'Ocultar senha' : 'Ver senha'}
          title={visivel ? 'Ocultar senha' : 'Ver senha'}
        >
          {visivel ? '🙈' : '👁'}
        </button>
      </div>
      {dica && !erro && <p className="ff-field__hint">{dica}</p>}
      <FieldError>{erro}</FieldError>
    </TextField>
  )
}

// ----------------------------------------------------------------------------
// ÁREA DE TEXTO MULTILINHA
// ----------------------------------------------------------------------------

export function AreaTexto({
  titulo,
  erro,
  dica,
  className = '',
  rows = 3,
  ...propriedades
}: ComponentProps<typeof TextArea> & {
  titulo: string
  erro?: string
  dica?: string
  rows?: number
}) {
  return (
    <TextField isInvalid={!!erro} fullWidth className={`ff-field ${className}`}>
      <Label>{titulo}</Label>
      <TextArea rows={rows} {...propriedades} />
      {dica && !erro && <p className="ff-field__hint">{dica}</p>}
      <FieldError>{erro}</FieldError>
    </TextField>
  )
}

// ----------------------------------------------------------------------------
// SELEÇÕES & DROPDOWNS
// ----------------------------------------------------------------------------

export function Escolha({
  titulo,
  valor,
  opcoes,
  alterar,
  erro,
  disabled,
  className = ''
}: {
  titulo: string
  valor: string
  opcoes: { value: string; label: string }[]
  alterar: (valor: string) => void
  erro?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <Select
      value={valor || null}
      onChange={chave => alterar(chave == null ? '' : String(chave))}
      isInvalid={!!erro}
      isDisabled={disabled}
      placeholder="Selecione uma opção"
      fullWidth
      className={`ff-select ${className}`}
    >
      <Label>{titulo}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="ff-select-popover">
        <ListBox>
          {opcoes.map(opcao => (
            <ListBox.Item key={opcao.value} id={opcao.value} textValue={opcao.label}>
              {opcao.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
      <FieldError>{erro}</FieldError>
    </Select>
  )
}

// ----------------------------------------------------------------------------
// MARCAÇÃO / CHECKBOX
// ----------------------------------------------------------------------------

export function Marcacao({
  titulo,
  marcado,
  alterar,
  className = ''
}: {
  titulo: string
  marcado: boolean
  alterar: (valor: boolean) => void
  className?: string
}) {
  return (
    <Checkbox isSelected={marcado} onChange={alterar} className={`ff-checkbox ${className}`}>
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        {titulo}
      </Checkbox.Content>
    </Checkbox>
  )
}

// ----------------------------------------------------------------------------
// PAINEL / CONTAINER DE SUPERFÍCIE GLASSMORFICA
// ----------------------------------------------------------------------------

export function Painel({
  titulo,
  detalhe,
  acao,
  children,
  className = ''
}: {
  titulo?: string
  detalhe?: string
  acao?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={`ff-panel ${className}`}>
      {(titulo || acao) && (
        <Card.Header className="ff-panel__header">
          <div>
            {titulo && <h2>{titulo}</h2>}
            {detalhe && <p className="ff-muted">{detalhe}</p>}
          </div>
          {acao}
        </Card.Header>
      )}
      <Card.Content>{children}</Card.Content>
    </Card>
  )
}

// ----------------------------------------------------------------------------
// MODAIS & DIÁLOGOS
// ----------------------------------------------------------------------------

export function Janela({
  titulo,
  aberta,
  fechar,
  children
}: {
  titulo: string
  aberta: boolean
  fechar: () => void
  children: ReactNode
}) {
  return (
    <Modal.Backdrop isOpen={aberta} onOpenChange={valor => { if (!valor) fechar() }}>
      <Modal.Container size="lg">
        <Modal.Dialog className="ff-modal-dialog">
          <Modal.CloseTrigger aria-label="Fechar" />
          <Modal.Header>
            <Modal.Heading>{titulo}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>{children}</Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}

export function Confirmar({
  titulo,
  descricao,
  aberta,
  fechar,
  confirmar,
  pendente
}: {
  titulo: string
  descricao: string
  aberta: boolean
  fechar: () => void
  confirmar: () => void
  pendente?: boolean
}) {
  return (
    <Janela titulo={titulo} aberta={aberta} fechar={fechar}>
      <p style={{ margin: '0 0 1rem 0', color: 'var(--ff-text)' }}>{descricao}</p>
      <div className="ff-actions ff-actions--end">
        <Button variant="tertiary" onPress={fechar} isDisabled={pendente}>
          Cancelar
        </Button>
        <Button variant="danger" onPress={confirmar} isPending={pendente}>
          Excluir
        </Button>
      </div>
    </Janela>
  )
}

// ----------------------------------------------------------------------------
// ALERTAS & FEEDBACK VISUAL
// ----------------------------------------------------------------------------

export type TipoAlerta = 'sucesso' | 'aviso' | 'erro' | 'info'

export function Alerta({
  tipo = 'info',
  children,
  acao,
  className = ''
}: {
  tipo?: TipoAlerta
  children: ReactNode
  acao?: ReactNode
  className?: string
}) {
  const icones: Record<TipoAlerta, string> = {
    sucesso: '✓',
    aviso: '⚠',
    erro: '✕',
    info: 'ℹ'
  }

  return (
    <div role="alert" className={`ff-alert ff-alert--${tipo} ${className}`}>
      <span className="ff-alert__icon" aria-hidden="true">
        {icones[tipo]}
      </span>
      <div className="ff-alert__content">{children}</div>
      {acao && <div className="ff-alert__action">{acao}</div>}
    </div>
  )
}

export function Falha({
  erro,
  repetir
}: {
  erro: unknown
  repetir?: () => void
}) {
  const mensagem = erro instanceof Error ? erro.message : 'Não foi possível carregar os dados.'
  return (
    <Alerta
      tipo="erro"
      acao={
        repetir ? (
          <Button size="sm" variant="outline" onPress={repetir}>
            Tentar novamente
          </Button>
        ) : undefined
      }
    >
      <p style={{ margin: 0 }}>{mensagem}</p>
    </Alerta>
  )
}

export function Carregando() {
  return (
    <div aria-busy="true" role="status" aria-label="Carregando dados" className="ff-skeletons">
      <Skeleton className="ff-skeleton" />
      <Skeleton className="ff-skeleton" />
      <Skeleton className="ff-skeleton" />
      <span className="ff-sr-only">Carregando dados…</span>
    </div>
  )
}

export function Vazio({
  titulo = 'Nenhum registro por aqui',
  children
}: {
  titulo?: string
  children?: ReactNode
}) {
  return (
    <div role="status" className="ff-empty">
      <span aria-hidden="true">↗</span>
      <h3>{titulo}</h3>
      <p>{children ?? 'Comece pelo botão de adicionar ou ajuste os filtros.'}</p>
    </div>
  )
}

// ----------------------------------------------------------------------------
// ETIQUETAS / BADGES DE STATUS
// ----------------------------------------------------------------------------

export function Rotulo({
  tipo = 'neutro',
  children,
  className = ''
}: {
  tipo?: 'sucesso' | 'aviso' | 'erro' | 'info' | 'neutro'
  children: ReactNode
  className?: string
}) {
  return (
    <span className={`ff-badge ff-badge--${tipo} ${className}`}>
      {children}
    </span>
  )
}

// ----------------------------------------------------------------------------
// FORMATADOR PADRÃO DE MOEDA
// ----------------------------------------------------------------------------

export function ValorMoeda({
  valor,
  tipo = 'neutro',
  prefixo = '',
  className = ''
}: {
  valor: number
  tipo?: 'positivo' | 'negativo' | 'neutro'
  prefixo?: string
  className?: string
}) {
  const classeCor =
    tipo === 'positivo' ? 'ff-positive' : tipo === 'negativo' ? 'ff-negative' : ''
  return (
    <span className={`ff-number ${classeCor} ${className}`}>
      {prefixo}
      {dinheiro(valor)}
    </span>
  )
}

// ----------------------------------------------------------------------------
// ZONA DE UPLOAD COM SUPORTE COMPLETO A DRAG & DROP
// ----------------------------------------------------------------------------

export function ZonaUpload({
  id,
  accept,
  arquivo,
  aoSelecionar,
  onArquivoSolto,
  titulo,
  subtitulo,
  icone = '📄',
  className = ''
}: {
  id: string
  accept: string
  arquivo: File | null
  aoSelecionar: (evento: React.ChangeEvent<HTMLInputElement>) => void
  onArquivoSolto?: (file: File) => void
  titulo: string
  subtitulo?: string
  icone?: string
  className?: string
}) {
  const [arrastando, definirArrastando] = useState(false)

  const aoArrastarSobre = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    definirArrastando(true)
  }

  const aoSairArrasto = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    definirArrastando(false)
  }

  const aoSoltar = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    definirArrastando(false)
    const file = e.dataTransfer.files?.[0]
    if (file && onArquivoSolto) {
      onArquivoSolto(file)
    }
  }

  return (
    <label
      htmlFor={id}
      className={`ff-dropzone ${arquivo ? 'ff-dropzone--has-file' : ''} ${arrastando ? 'ff-dropzone--drag' : ''} ${className}`}
      onDragOver={aoArrastarSobre}
      onDragEnter={aoArrastarSobre}
      onDragLeave={aoSairArrasto}
      onDrop={aoSoltar}
    >
      <span className="ff-dropzone__icon" aria-hidden="true">
        {icone}
      </span>
      <strong className="ff-dropzone__title">
        {arrastando ? 'Solte o arquivo para carregar!' : arquivo ? arquivo.name : titulo}
      </strong>
      {subtitulo && (
        <span className="ff-dropzone__subtitle ff-muted">
          {arrastando ? 'Solte para iniciar a validação' : arquivo ? `${(arquivo.size / 1024).toFixed(1)} KB selecionado` : subtitulo}
        </span>
      )}
      <input
        id={id}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={aoSelecionar}
      />
    </label>
  )
}
