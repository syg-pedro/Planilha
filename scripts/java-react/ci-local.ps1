# Script de verificacao continua local do Laboratorio Planilha (Java + React)
# Executa a esteira de qualidade local sem invocar servicos remotos, deploys ou credenciais reais.
param(
    [switch]$PularTestesPesados
)

$ErrorActionPreference = 'Stop'
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$pastaJava = Join-Path $raiz 'backend-java'
$pastaReact = Join-Path $raiz 'frontend-react'

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         PLANILHA - CI LOCAL INDEPENDENTE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Configurar variaveis de sessao para Java
Write-Host "`n[1/4] Configurando ambiente local Java..." -ForegroundColor Yellow
if (Test-Path 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot') {
    $env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot'
} elseif (!$env:JAVA_HOME -or !(Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin/java.exe'))) {
    $javaComando = Get-Command java -ErrorAction SilentlyContinue
    if ($javaComando) {
        $env:JAVA_HOME = Split-Path (Split-Path $javaComando.Source -Parent) -Parent
    }
}
$temporarioJava = Join-Path $env:SystemDrive 'dev/planilha-java-tmp'
New-Item -ItemType Directory -Path $temporarioJava -Force | Out-Null
$env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=$temporarioJava -Djava.io.tmpdir=$temporarioJava"

# 2. Compilar e testar backend Java
Write-Host "`n[2/4] Verificando backend Spring Boot - Java 21..." -ForegroundColor Yellow
Push-Location $pastaJava
try {
    if ($PularTestesPesados) {
        & ./mvnw.cmd test-compile -B -ntp
    } else {
        & ./mvnw.cmd test -B -ntp
    }
    if ($LASTEXITCODE -ne 0) { throw "Falha na compilacao/testes do backend Java." }
    Write-Host "Backend Java validado com sucesso!" -ForegroundColor Green
} finally {
    Pop-Location
}

# 3. Typecheck e Build do Frontend React + HeroUI
Write-Host "`n[3/4] Verificando frontend React - TypeScript, HeroUI e Vite..." -ForegroundColor Yellow
Push-Location $pastaReact
try {
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "Falha no typecheck ou build do frontend React." }
    Write-Host "Frontend React compilado e validado com sucesso!" -ForegroundColor Green
} finally {
    Pop-Location
}

# 4. Testes unitarios do Frontend React
Write-Host "`n[4/4] Executando testes unitarios do Frontend React..." -ForegroundColor Yellow
Push-Location $pastaReact
try {
    & npm run test
    if ($LASTEXITCODE -ne 0) { throw "Falha nos testes unitarios do frontend React." }
    Write-Host "Testes unitarios do Frontend React aprovados com sucesso!" -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  TODAS AS VERIFICACOES DO LABORATORIO FORAM CONCLUIDAS COM SUCESSO!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
