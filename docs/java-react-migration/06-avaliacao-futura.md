# Avaliação futura de arquitetura, hospedagem e mobilidade

Este documento atende ao requisito **FUT-01** da especificação inicial do laboratório. Nenhuma das opções abaixo está autorizada para execução automática ou deploy remoto; todas representam avaliações técnicas e financeiras para decisão futura da equipe.

---

## 1. Avaliação de hospedagem para o Backend Spring Boot (Java 21)

O backend Spring Boot com Java 21, Flyway e PostgreSQL requer um ambiente de execução contínuo com pelo menos 512 MB a 1 GB de RAM para estabilidade do garbage collector e conexões JDBC (HikariCP).

| Provedor / Plataforma | Modelo de Execução | Custo Estimado Mensal | Vantagens | Desvantagens / Riscos |
|---|---|---|---|---|
| **Railway** | Container gerenciado | ~$5 – $10 USD (por consumo de CPU/RAM) | Deploy nativo via Dockerfile, banco PostgreSQL gerenciado integrado, suporte a secrets, zero manutenção de SO. | Custo variável por tráfego/uso; limites no plano inicial. |
| **Render** | Web Service Docker | ~$7 USD (plano Starter 512MB) + $7 USD PostgreSQL | Interface simples, deploys automáticos via GitHub, SSL automático. | Cold starts no plano gratuito (inviável); 512 MB pode ser justo para JVM em picos. |
| **Fly.io** | MicroVM Firecracker | ~$5 – $12 USD | Proximidade geográfica (região `gru` em São Paulo), baixa latência no Brasil, persistência de volumes. | Configuração de rede e backups de volume mais manual. |
| **Google Cloud Run** | Serverless Container | ~$0 – $15 USD (conforme requisições e CPU sempre ativa) | Escala a zero, alta disponibilidade, integração Google Cloud. | JVM tradicional sofre com cold start se configurado para desligar; manter 1 instância ativa anula a gratuidade total. |
| **VPS (Hetzner / DigitalOcean / Linode)** | Máquina virtual dedicada | ~$4 – $6 EUR (Hetzner 2 vCPU / 4 GB RAM) | Menor custo por gigabyte de RAM do mercado, capacidade para rodar PostgreSQL, Spring Boot e Nginx juntos. | Manutenção operacional total necessária (backups, updates de SO, firewall, Docker). |

### Recomendação técnica para produção futura
Para um produto de uso familiar ou pequeno porte, um **VPS Hetzner** com Docker Compose ou um app no **Railway (região Brasil/EUA)** oferecem a melhor relação custo-benefício e menor complexidade operacional.

---

## 2. Comparativo: Spring Security + JWT vs. Supabase Auth

O laboratório implementou autenticação própria usando Spring Security, JWT efêmero (15 min) em memória e refresh token opaco (7 dias) com rotação em cookies HttpOnly/SameSiteStrict.

| Critério | Spring Security Próprio (Atual no Java) | Supabase Auth (Legado / Alternativa) |
|---|---|---|
| **Custo** | Zero adicional (incluso no backend). | Gratuito até 50.000 MAUs; pago além disso. |
| **Isolamento de dados** | Total. Regras de família e permissões enforced via Java Service e FKs compostas no banco. | Depende de RLS no PostgreSQL ou verificação do JWT Supabase no backend. |
| **Dependência externa** | Nenhuma dependência externa de infraestrutura. | Dependência do serviço e disponibilidade da Supabase. |
| **Múltiplos Provedores** | Requer implementação manual de OAuth2 (Google, Apple, GitHub). | Fornece OAuth2 pronto e gerenciamento de e-mails de recuperação. |
| **Sessão e Cookies** | Refresh tokens em cookies SameSite=Strict HttpOnly com rotação contra replay attack. | Tokens gerenciados pelo SDK no cliente (localStorage) ou adaptadores SSR. |

### Decisão recomendada
A autenticação nativa Spring Boot consolidada nesta fase é soberana, segura e elimina qualquer custo ou dependência de provedor terceiro para autenticação e isolamento multi-tenant (familiar).

---

## 3. Avaliação de mobilidade: Capacitor no React vs. Manutenção do Nuxt

Atualmente, o projeto legado utiliza Nuxt + `@capacitor/core` para gerar o app Android (`android/`).

### Cenário A: Empacotar o novo Frontend React com Capacitor
- **Viabilidade:** Total. O frontend React com Vite gera um SPA estático puro (`dist/`), exatamente o formato ideal para Capacitor (`webDir: 'frontend-react/dist'`).
- **Vantagens:** Unifica a base de código na nova arquitetura moderna (React 19, TypeScript, HeroUI); layout responsivo para viewports de 320px já foi validado; performance de inicialização superior à hidratação SSR.
- **Passos necessários:** Instalar `@capacitor/cli` e `@capacitor/core` no `frontend-react` e vincular ao projeto Android via `npx cap sync`.

### Cenário B: Manter o Nuxt como cliente mobile
- **Desvantagens:** Exige manter duas frentes de interface ativas, o adaptador do Nuxt experimental (`NUXT_JAVA_LAB=1`) e gerenciar duplicação de componentes visuais.

### Recomendação
Concluída a migração do frontend React, o empacotamento móvel direto da pasta `frontend-react/dist` pelo Capacitor é o caminho mais limpo, eficiente e sustentável a longo prazo.

---

## 4. Limites e Conformidade de Escopo

1. **Nenhum deploy remoto foi executado ou autorizado.**
2. O banco de dados do Supabase original e credenciais de produção permanecem intactos.
3. As alterações deste laboratório estão rigorosamente restritas à branch `feat/react-springboot` e ao worktree local.

