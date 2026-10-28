import type { ComponentProps, ReactNode } from 'react'
import { Button, Card, Checkbox, FieldError, Input, Label, ListBox, Modal, Select, Skeleton, TextField } from '@heroui/react'

export function Campo({ titulo, erro, ...propriedades }: ComponentProps<typeof Input> & { titulo: string; erro?: string }) {
  return <TextField isInvalid={!!erro} fullWidth>
    <Label>{titulo}</Label><Input {...propriedades} /><FieldError>{erro}</FieldError>
  </TextField>
}

export function Escolha({ titulo, valor, opcoes, alterar, erro, disabled }: {
  titulo: string; valor: string; opcoes: { value: string; label: string }[]
  alterar: (valor: string) => void; erro?: string; disabled?: boolean
}) {
  return <Select value={valor || null} onChange={chave => alterar(chave == null ? '' : String(chave))}
    isInvalid={!!erro} isDisabled={disabled} placeholder="Selecione" fullWidth>
    <Label>{titulo}</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
    <Select.Popover><ListBox>{opcoes.map(opcao => <ListBox.Item key={opcao.value} id={opcao.value} textValue={opcao.label}>
      {opcao.label}<ListBox.ItemIndicator />
    </ListBox.Item>)}</ListBox></Select.Popover><FieldError>{erro}</FieldError>
  </Select>
}

export function Marcacao({ titulo, marcado, alterar }: { titulo: string; marcado: boolean; alterar: (valor: boolean) => void }) {
  return <Checkbox isSelected={marcado} onChange={alterar}><Checkbox.Content>
    <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>{titulo}
  </Checkbox.Content></Checkbox>
}

export function Painel({ titulo, detalhe, acao, children, className = '' }: {
  titulo?: string; detalhe?: string; acao?: ReactNode; children: ReactNode; className?: string
}) {
  return <Card className={`ff-panel ${className}`}>
    {(titulo || acao) && <Card.Header className="ff-panel__header"><div>
      {titulo && <h2>{titulo}</h2>}{detalhe && <p className="ff-muted">{detalhe}</p>}
    </div>{acao}</Card.Header>}<Card.Content>{children}</Card.Content>
  </Card>
}

export function Janela({ titulo, aberta, fechar, children }: { titulo: string; aberta: boolean; fechar: () => void; children: ReactNode }) {
  return <Modal.Backdrop isOpen={aberta} onOpenChange={valor => { if (!valor) fechar() }}>
    <Modal.Container size="lg"><Modal.Dialog><Modal.CloseTrigger aria-label="Fechar" />
      <Modal.Header><Modal.Heading>{titulo}</Modal.Heading></Modal.Header>
      <Modal.Body>{children}</Modal.Body>
    </Modal.Dialog></Modal.Container>
  </Modal.Backdrop>
}

export function Confirmar({ titulo, descricao, aberta, fechar, confirmar, pendente }: {
  titulo: string; descricao: string; aberta: boolean; fechar: () => void; confirmar: () => void; pendente?: boolean
}) {
  return <Janela titulo={titulo} aberta={aberta} fechar={fechar}><p>{descricao}</p>
    <div className="ff-actions ff-actions--end"><Button variant="tertiary" onPress={fechar} isDisabled={pendente}>Cancelar</Button>
      <Button variant="danger" onPress={confirmar} isPending={pendente}>Excluir</Button></div>
  </Janela>
}

export function Falha({ erro, repetir }: { erro: unknown; repetir?: () => void }) {
  return <div role="alert" className="ff-error"><p>{erro instanceof Error ? erro.message : 'Não foi possível carregar os dados.'}</p>
    {repetir && <Button size="sm" variant="outline" onPress={repetir}>Tentar novamente</Button>}</div>
}

export function Carregando() {
  return <div aria-busy="true" role="status" aria-label="Carregando dados" className="ff-skeletons">
    <Skeleton className="ff-skeleton" /><Skeleton className="ff-skeleton" /><Skeleton className="ff-skeleton" />
    <span className="ff-sr-only">Carregando dados…</span>
  </div>
}

export function Vazio({ titulo = 'Nenhum registro por aqui', children }: { titulo?: string; children?: ReactNode }) {
  return <div role="status" className="ff-empty"><span aria-hidden="true">↗</span><h3>{titulo}</h3>
    <p>{children ?? 'Comece pelo botão de adicionar ou ajuste os filtros.'}</p></div>
}
