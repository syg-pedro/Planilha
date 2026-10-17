# Ícones da Planilha

Identidade: grade de sete módulos formando um P, com o módulo superior direito em ascensão. Verde `#00DC82`, menta `#A7F3D0` e fundo Slate `#0F172A`, em harmonia com o tema Default.

O conceito original foi criado com a ferramenta integrada `image_gen` e preservado sem alteração em `planilha-concept.png`. Os ícones de produção adaptam esse conceito em geometria vetorial para manter definição em tamanhos pequenos e compartilhar os mesmos contornos entre navegador, PWA e Android.

## Regenerar

```sh
npm run icons:generate
```

O gerador `scripts/generate-icons.mjs` contém a geometria canônica, renderiza os PNGs com Sharp e gera os XMLs de vetor/adaptive-icon do Android. Não modifica dados financeiros.

## Saídas

- `public/favicon.svg`, `favicon.ico` e `favicon-16/32/48.png`: marca maior para leitura nas abas.
- `public/brand/planilha-icon.svg`: ícone quadrado sem máscara; `planilha-mark.svg`: símbolo transparente.
- `public/icon-192-v2.png` e `icon-512-v2.png`: instalação PWA, notificações e arte 512 px.
- `public/icon-maskable-512-v2.png`: versão própria com margem segura para máscaras PWA.
- `public/apple-touch-icon.png`: 180 × 180 px, sem máscara pré-aplicada.
- `android/app/src/main/res/mipmap-*`: cinco densidades de ícones legados, incluindo circular.
- `drawable/ic_launcher_foreground.xml` e `ic_launcher_monochrome.xml`: camadas vetoriais de 108 dp.
- `mipmap-anydpi-v26` e `mipmap-anydpi-v33`: Android adaptável e variante com camada monocromática.
- `drawable/ic_stat_notification.xml`: símbolo monocromático de notificação.
- `output/brand/planilha-icons-preview.png`: folha de apresentação.
- `output/brand/icon-validation.json`: medida do contorno real nas áreas seguras.

O Android usa foreground separado de background e a silhueta é validada dentro do círculo seguro de 66 dp, conforme [Android Developers](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive). O PWA maskable usa a região circular segura de raio 40%, conforme [web.dev](https://web.dev/articles/maskable-icon).

Não houve mudança de versão, assinatura ou publicação. Os novos ícones Android entram na próxima compilação e instalação do app.

## Validação local

- Favicon SVG, ICO, PNG e Apple Touch respondem HTTP 200 com tipos corretos. SVG usa `?v=2` para invalidar o ícone anterior nas abas.
- `NuxtPwaManifest` conecta o manifesto ao documento. Os três ícones foram carregados e decodificados no navegador: 192 px, 512 px e maskable 512 px.
- Contorno Android: raio máximo 32,88 dp, dentro dos 33 dp seguros. Contorno PWA maskable: 38,53% da largura, dentro dos 40% seguros.
- `:app:processDebugResources` aprovado com JDK 21 e SDK 35; inclui resolução do manifesto e dos recursos de todas as densidades/versões.
- ICO conferido com os três frames PNG válidos, de 16, 32 e 48 px.
- Tipagem e lint aprovados. A validação de recursos não gera APK nem comprova renderização em um aparelho físico.

## Prompt do conceito (ferramenta integrada)

> Use case: logo-brand. Create one production-ready, modern app icon for a Portuguese personal finance spreadsheet application called Planilha. Square 1024x1024 composition, full-bleed solid deep slate background #0F172A (no outer rounded mask; Android will supply its mask). Center a distinctive bold geometric spreadsheet symbol that also subtly suggests a P: a compact arrangement of rounded rectangular emerald tiles forming a clean, open grid, with strong negative-space gaps and a subtly rising top-right corner. Main symbol in Nuxt emerald #00DC82, with one restrained lighter mint accent #A7F3D0. Aim for an elegant modern financial productivity app identity, precise vector-like edges, flat restrained geometry, no texture, no glossy 3D, no shadows or glow. Symbol occupies approximately 60 percent of the square, with generous consistent margins, and remains clearly recognizable at 16px as a browser favicon. No app name, no words, no currency signs, no numbers, no charts with thin lines, no tiny spreadsheet cells, no extra badges, no presentation mockup, no border around the icon, no surrounding objects. Deliver only the single finished icon, straight on.
