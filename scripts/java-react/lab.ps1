param(
    [ValidateSet('start', 'stop', 'restart', 'status')]
    [string]$Acao = 'start',
    [switch]$SemBuild
)

$ErrorActionPreference = 'Stop'
$raizProjeto = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$pastaJava = Join-Path $raizProjeto 'backend-java'
$arquivoJar = Join-Path $pastaJava 'target/financeiro-lab-0.0.1-SNAPSHOT.jar'
$estadoArquivo = Join-Path $pastaJava 'target/lab-processes.json'
$composeArquivo = Join-Path $raizProjeto 'infra/dev/compose.yaml'

function Obter-ProcessoLaboratorio {
    if (!(Test-Path -LiteralPath $estadoArquivo)) { return $null }
    $estado = Get-Content -LiteralPath $estadoArquivo -Raw | ConvertFrom-Json
    $processo = Get-CimInstance Win32_Process -Filter "ProcessId = $($estado.javaPid)"
    if ($processo -and $processo.Name -eq 'java.exe' -and
        $processo.CommandLine.IndexOf($arquivoJar, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
        return $processo
    }
    return $null
}

function Parar-ApiLaboratorio {
    $processo = Obter-ProcessoLaboratorio
    if ($processo) { Stop-Process -Id $processo.ProcessId -ErrorAction Stop }
}

if ($Acao -eq 'status') {
    & docker compose -f $composeArquivo ps
    $processo = Obter-ProcessoLaboratorio
    if ($processo) { Write-Output "API local em execução: PID $($processo.ProcessId)." }
    else { Write-Output 'Nenhuma API iniciada por este script está ativa.' }
    exit $LASTEXITCODE
}

if ($Acao -in @('stop', 'restart')) {
    Parar-ApiLaboratorio
    & docker compose -f $composeArquivo stop
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível parar o PostgreSQL local.' }
    if ($Acao -eq 'stop') { exit 0 }
}

if (Obter-ProcessoLaboratorio) {
    Write-Output 'A API do laboratório já está em execução. Use restart para recompilar.'
    exit 0
}

$portaOcupada = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($portaOcupada) { throw 'A porta 8080 está em uso. Pare o processo responsável antes de iniciar o laboratório.' }
& docker compose -f $composeArquivo up -d --wait
if ($LASTEXITCODE -ne 0) { throw 'O PostgreSQL local não iniciou.' }

$javaHomeAnterior = $env:JAVA_HOME
$javaOpcoesAnteriores = $env:JAVA_TOOL_OPTIONS
$localAnterior = Get-Location
try {
    $javaComando = Get-Command java -ErrorAction Stop
    if (!$env:JAVA_HOME -or !(Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin/java.exe')) -or
        !(Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'lib/jvm.cfg'))) {
        $env:JAVA_HOME = Split-Path (Split-Path $javaComando.Source -Parent) -Parent
    }
    $temporarioJava = Join-Path $env:SystemDrive 'dev/planilha-java-tmp'
    New-Item -ItemType Directory -Path $temporarioJava -Force | Out-Null
    $env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=$temporarioJava -Djava.io.tmpdir=$temporarioJava"
    Set-Location -LiteralPath $pastaJava
    if (!$SemBuild) {
        & ./mvnw.cmd package -B -ntp
        if ($LASTEXITCODE -ne 0) { throw 'O build Java falhou. A API não foi iniciada.' }
    }
    if (!(Test-Path -LiteralPath $arquivoJar)) { throw 'O JAR ainda não existe. Inicie sem -SemBuild.' }
    $opcoesProcesso = @{
        FilePath = Join-Path $env:JAVA_HOME 'bin/java.exe'
        ArgumentList = @('-jar', ('"' + $arquivoJar + '"'))
        WorkingDirectory = $pastaJava
        RedirectStandardOutput = Join-Path $pastaJava 'target/lab-api.log'
        RedirectStandardError = Join-Path $pastaJava 'target/lab-api-error.log'
        WindowStyle = 'Hidden'
        PassThru = $true
    }
    $processo = Start-Process @opcoesProcesso
    @{ javaPid = $processo.Id; jar = $arquivoJar } | ConvertTo-Json |
        Set-Content -LiteralPath $estadoArquivo
    for ($tentativa = 0; $tentativa -lt 60; $tentativa++) {
        if ($processo.HasExited) { throw 'A API encerrou durante a inicialização. Consulte backend-java/target/lab-api.log.' }
        try {
            $saude = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/api/health' -TimeoutSec 1
            if ($saude.status -eq 'UP' -and $saude.environment -eq 'local-demo') {
                Write-Output 'API pronta: http://127.0.0.1:8080/swagger-ui/index.html'
                exit 0
            }
        } catch { }
        Start-Sleep -Milliseconds 500
    }
    throw 'A API não ficou saudável no prazo esperado. Consulte backend-java/target/lab-api.log.'
} finally {
    Set-Location -LiteralPath $localAnterior
    $env:JAVA_HOME = $javaHomeAnterior
    $env:JAVA_TOOL_OPTIONS = $javaOpcoesAnteriores
}
