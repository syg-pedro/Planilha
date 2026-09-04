# Emulador Android: configuração e testes

## Máquina e configuração verificada

Ryzen 9 3900X (12 núcleos/24 threads), aproximadamente 32 GB de RAM e NVIDIA RTX 3090. Virtualização de firmware ativa, hipervisor presente e `emulator -accel-check` confirmou WHPX utilizável. Cerca de 274 GB livres no disco antes da instalação.

Foram instalados Android Emulator e imagem Android API 36 Google Play x86_64 pelo SDK Manager. O AVD Pixel_7 existente foi preservado; backup em `%USERPROFILE%/.android/avd/Pixel_7.avd/config.ini.before-planilha-20260904`.

| Configuração | Antes | Depois |
|---|---|---|
| CPU/RAM | 4 núcleos / 4096 MB | Mantidos; suficientes sem reservar toda a máquina |
| Gráficos | Software | Host; logs confirmam RTX 3090, Vulkan e OpenGL |
| Inicialização | Cold boot obrigatório | Quick Boot habilitado; snapshot `default_boot` salvo com sucesso |
| Moldura | Referência a skin Pixel 7 ausente | Sem moldura, resolução original 1080×2400, densidade 420 |
| Teclado virtual | Não garantido com teclado físico | `show_ime_with_hard_keyboard=1` para exercitar IME |

O modo gráfico `auto` escolheu software na execução sem janela; foi substituído por `host` e a GPU foi confirmada nos logs. O primeiro boot funcional levou **28,267 s**. O processo consumiu aproximadamente 4,6 GiB de memória residente durante a amostra; ainda havia cerca de 10,8 GiB livres no host após compilação e testes. Não há benchmark comparativo com a configuração anterior, que não iniciava, nem medição do tempo de Quick Boot. Não se alteraram BIOS, Hyper-V, drivers ou configurações globais de energia.

Referência: [Android — aceleração do emulador](https://developer.android.com/studio/run/emulator-acceleration?hl=pt-br).

## Compilação e ambiente

O `JAVA_HOME` da sessão apontava para JDK 17 removido. Foi usado o JDK 17 instalado para o SDK Manager e extraído [Microsoft OpenJDK 21](https://learn.microsoft.com/en-us/java/openjdk/download) em `%LOCALAPPDATA%/PlanilhaTools/java/jdk-21.0.12.1+1`, exigido pelo Capacitor 7. Nenhum JAVA_HOME global foi substituído.

Gradle `assembleDebug --max-workers=4`: **BUILD SUCCESSFUL**, 21 s. APK instalado no `emulator-5554`. O APK de teste aponta para `http://127.0.0.1:3107/?key=demo-finance-key`, com `adb reverse tcp:3107 tcp:3107`. Foi usado o servidor Nuxt desta branch com `e2e/test.env`, dados locais em memória e sem Supabase remoto. O asset Capacitor original foi restaurado após compilar; o manifesto temporário que permitia HTTP apenas no build debug foi removido após o teste. O APK gerado é de teste local e não deve ser distribuído como produção.

## Resultados no Android API 36

Interação com a WebView real do APK via ADB/CDP, não simples viewport desktop. Capturas ADB incluem barras do sistema e teclado Android.

- Dashboard e navegação inferior: abriram.
- Novo lançamento com `1.234,56`: persistiu como 1234.56, um único registro no backend local.
- Matriz: um card mensal e busca funcionando; busca preservada após recarregar.
- Documento sem overflow horizontal na largura efetiva de 412 CSS px.
- Teclado Android: confirmado visível pelo sistema e por captura; **encobre os botões do editor**.

Resultados estruturados: [JSON](evidencias/android-resultados.json). Capturas: [Dashboard](evidencias/android-dashboard.png), [editor com teclado](evidencias/android-editor-teclado.png), [Planilha](evidencias/android-planilha.png).

## Primeira tentativa de correção (histórico)

Foi acrescentado `android:windowSoftInputMode="adjustResize"` à Activity em `android/app/src/main/AndroidManifest.xml`. É uma tentativa de corrigir o redimensionamento com IME, ainda não uma correção confirmada: Android edge-to-edge também pode exigir tratamento de insets.

A revisão automática de permissões **rejeitou o comando de recompilação e reinstalação após essa alteração**, retornando apenas `blocked by policy`, sem motivo específico. O APK testado não contém esse ajuste. Não foi tentado contornar o bloqueio. Naquele momento, a validação permaneceu pendente; a nova execução abaixo resolveu essa pendência.

Ainda não testados: login remoto neste APK, notificações agendadas, widgets, compartilhamento de arquivos, dispositivos físicos e Safari/iOS. O snapshot foi salvo; a duração da restauração não foi medida. O emulador foi executado sem janela para a automação; pode ser aberto normalmente com `%LOCALAPPDATA%/Android/Sdk/emulator/emulator.exe -avd Pixel_7 -gpu host`.

## Nova execução: correção confirmada no Android API 36

Após o usuário solicitar nova tentativa, a compilação e a reinstalação foram permitidas. `adjustResize` isolado foi testado e **não resolveu**: o teclado continuou sobre o editor. A leitura do Capacitor 7 mostrou que seu listener de margens contempla barras/cutout e consome os insets sem considerar IME.

`MainActivity.java` agora trata margens da WebView com `WindowInsetsCompat`: preserva barras e recortes, aplica o maior espaço inferior entre teclado e barra de navegação, evita contagem dupla e atualiza o layout apenas quando as margens mudam. `adjustResize` permanece no manifesto para receber os eventos de teclado. Referência: [Android — visibilidade do teclado](https://developer.android.com/develop/ui/views/touch-and-input/keyboard-input/visibility).

**Verificação executada:**

- APK com a correção compilou (`BUILD SUCCESSFUL`, 7 s) e foi instalado no emulador.
- Teclado Android confirmado visível pelo sistema; botões Cancelar/Salvar visíveis acima dele na [captura final](evidencias/android-editor-insets.png).
- Dois ciclos de fechar/abrir teclado: altura da WebView **838 → 570 → 838 CSS px**, sem overflow interno.
- Limite inferior do botão Salvar: 556,29 px dentro da área de 570 px disponível.
- Toque físico via ADB no botão Salvar, com teclado aberto: gravou **1234.56**, um único registro, e fechou o editor. A altura retornou a 838 px.
- [Resultados estruturados](evidencias/android-insets-resultados.json).

A restauração do snapshot apresentou ANR na inicialização, registrado pelo Android no receiver de restauração das notificações; não foi demonstrada uma causa raiz. Inicialização completa com `-no-snapshot-load` resolveu o bloqueio do ambiente e levou aproximadamente 29 s. Quick Boot não foi considerado homologado: o AVD voltou a preferir cold boot, mantendo aceleração WHPX/RTX 3090, 4 núcleos e 4 GB. O snapshot foi preservado para investigação.

O teste usa dados locais em memória; não houve publicação nem alteração de dados no Supabase. Configuração temporária HTTP do APK debug restaurada/removida depois da compilação. O APK local depende do servidor de teste; não é artefato de release. Androids anteriores e dispositivos físicos ainda precisam de homologação; a validação aqui confirma o comportamento no API 36.
