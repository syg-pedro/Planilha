# Roteiro de validação local

Este roteiro completa as verificações que dependem do Docker. Não executa operações no Supabase. Os comandos abaixo são para PowerShell, partindo da raiz do worktree `C:/Users/PedroVictordeOliveir/.codex/worktrees/planilha-java-react/Planilha`.

## 1. Confirmar pré-requisitos

O Docker Desktop precisa iniciar com engine Linux operacional. Não fazer factory reset, prune, apagar discos ou remover volumes para executar este roteiro. A falha foi contornada nesta máquina, com backup e desativação de Docker AI; detalhes em [evidencias.md](evidencias.md).

```powershell
docker version
```

Confirme Java 21 e JAVA_HOME válido. Nesta máquina, o java do PATH é Temurin 21, mas JAVA_HOME herdado aponta para uma instalação antiga. Ajuste somente o terminal, sem mudar configuração global:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
```

```powershell
java -version
```

Neste Windows, o Java precisa de um diretório temporário curto para os sockets de loopback. Configure apenas a sessão atual:

```powershell
New-Item -ItemType Directory -Path 'C:\dev\planilha-java-tmp' -Force
```

```powershell
$env:JAVA_TOOL_OPTIONS = '-Djdk.net.unixdomain.tmpdir=C:/dev/planilha-java-tmp -Djava.io.tmpdir=C:/dev/planilha-java-tmp'
```

## 2. Subir PostgreSQL exclusivo

```powershell
docker compose -f infra/dev/compose.yaml up -d --wait
```

```powershell
docker compose -f infra/dev/compose.yaml ps
```

Esperado: serviço postgres saudável, porta `127.0.0.1:55432`, banco `financeiro_lab`. Credenciais no Compose são locais e fictícias. O volume pertence ao projeto `financeiro-java-lab` e não reutiliza Supabase.

## 3. Executar testes e iniciar o backend

```powershell
Set-Location backend-java
```

```powershell
.\mvnw.cmd verify
```

Esperado: testes unitários e integração aprovados, nenhum teste ignorado. A integração cria seu próprio PostgreSQL Testcontainers temporário com banco `financeiro_lab_test`, sem usar os dados do Compose.

```powershell
.\mvnw.cmd spring-boot:run
```

Flyway executa automaticamente V1 no banco local do Compose. Esperado: histórico Flyway versão 1 e apenas marcador técnico fictício. Não há necessidade de executar SQL manual ou importar arquivos existentes.

## 4. Conferir HTTP e documentação

Em outro terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/api/health
```

Esperado: status UP, database UP, environment local-demo.

Abra [Swagger local](http://127.0.0.1:8080/swagger-ui/index.html). O único endpoint de negócio exposto nesta etapa é health; contas e lançamentos ainda não existem. Consulte [OpenAPI](http://127.0.0.1:8080/v3/api-docs) e confirme a rota `/api/health`.

Não abrir o Nuxt ou usar o navegador pessoal com sua fila offline para testar integração: a Fase 2 ainda não foi implementada.

## 5. Parar, reiniciar e obter ambiente limpo sem apagar dados

Pare o processo Java com Ctrl+C. Na raiz do worktree:

```powershell
docker compose -f infra/dev/compose.yaml stop
```

O volume persiste. Para iniciar novamente:

```powershell
docker compose -f infra/dev/compose.yaml up -d --wait
```

Para reiniciar apenas o banco:

```powershell
docker compose -f infra/dev/compose.yaml restart postgres
```

Para um ambiente vazio sem remover o volume original, primeiro pare o projeto padrão. Inicie um projeto local com outro nome, que cria outro volume:

```powershell
docker compose -p financeiro-java-lab-limpo -f infra/dev/compose.yaml up -d --wait
```

A mesma aplicação Java reaplica V1 nesse banco novo. Não há seeds financeiros; o único dado fictício é o marcador local-demo. Não execute simultaneamente os dois projetos, pois usam a mesma porta.

Para voltar ao volume original, pare o projeto alternativo:

```powershell
docker compose -p financeiro-java-lab-limpo -f infra/dev/compose.yaml stop
```

Depois inicie novamente o projeto padrão. Nenhum comando deste roteiro apaga volumes. Qualquer limpeza destrutiva exige autorização específica e conferência do volume alvo.

Registre os resultados em evidencias.md e só então conclua os itens correspondentes do ROADMAP.md.
