import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// One geometric mark supplies SVG, raster, Android vector and monochrome exports.
const root = fileURLToPath(new URL('../', import.meta.url))
const palette = { background: '#0F172A', primary: '#00DC82', mint: '#A7F3D0' }
const resourceRoot = 'android/app/src/main/res'
const roundRect = (x, y, width, height, radius = 6) =>
  `M${x + radius} ${y}H${x + width - radius}Q${x + width} ${y} ${x + width} ${y + radius}V${y + height - radius}Q${x + width} ${y + height} ${x + width - radius} ${y + height}H${x + radius}Q${x} ${y + height} ${x} ${y + height - radius}V${y + radius}Q${x} ${y} ${x + radius} ${y}Z`
const paths = [
  { d: roundRect(0, 10, 29, 24) },
  { d: 'M38.5 9L56.5 6Q62.5 5 62.5 11V29Q62.5 34 57.5 34H38.5Q33.5 34 33.5 29V15Q33.5 10 38.5 9Z' },
  { d: 'M72 5L89 0.5Q96 -1 96 7V29Q96 34 91 34H72Q67 34 67 29V11Q67 6 72 5Z', accent: true },
  ...[0, 33.5, 67].map(x => ({ d: roundRect(x, 38.5, 29, 26) })),
  { d: roundRect(0, 69, 29, 27) }
]
const mark = (monochrome = false) => paths.map(path => `<path fill="${monochrome ? '#FFFFFF' : path.accent ? palette.mint : palette.primary}" d="${path.d}"/>`).join('')
const placeMark = (size, fraction = 0.64, monochrome = false) => {
  const inset = size * (1 - fraction) / 2
  return `<g transform="translate(${inset} ${inset}) scale(${size * fraction / 96})">${mark(monochrome)}</g>`
}
const svg = (size = 512, { fraction = 0.64, round = false, circle = false, transparent = false } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${transparent ? '' : circle ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${palette.background}"/>` : `<rect width="${size}" height="${size}" rx="${round ? size * 0.22 : 0}" fill="${palette.background}"/>`}${placeMark(size, fraction)}</svg>`
const save = async (relative, content) => {
  const target = resolve(root, relative)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, content)
}
const png = async (source, size) => sharp(Buffer.from(source)).resize(size, size).png().toBuffer()
const vector = (monochrome = false, size = 108, scale = 0.5, inset = 30) => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="${size}dp" android:height="${size}dp" android:viewportWidth="${size}" android:viewportHeight="${size}">
    <group android:translateX="${inset}" android:translateY="${inset}" android:scaleX="${scale}" android:scaleY="${scale}">
${paths.map(path => `        <path android:fillColor="${monochrome ? '#FFFFFFFF' : path.accent ? palette.mint : palette.primary}" android:pathData="${path.d}" />`).join('\n')}
    </group>
</vector>
`
const adaptive = (themed = false) => `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
${themed ? '    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />\n' : ''}</adaptive-icon>
`

await save('public/brand/planilha-icon.svg', svg())
await save('public/brand/planilha-mark.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">${mark()}</svg>\n`)
const browserSvg = svg(64, { fraction: 0.78, round: true })
await save('public/favicon.svg', `${browserSvg}\n`)
const faviconImages = await Promise.all([16, 32, 48].map(async size => {
  const image = await png(browserSvg, size)
  await save(`public/favicon-${size}.png`, image)
  return { size, image }
}))
// ICO with PNG frames preserves alpha at every browser fallback size.
const header = Buffer.alloc(6 + faviconImages.length * 16)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(faviconImages.length, 4)
let offset = header.length
for (const [index, { size, image }] of faviconImages.entries()) {
  const entry = 6 + index * 16
  header[entry] = size
  header[entry + 1] = size
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(image.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += image.length
}
await save('public/favicon.ico', Buffer.concat([header, ...faviconImages.map(({ image }) => image)]))
for (const size of [192, 512]) {
  const image = await png(svg(), size)
  await save(`public/icon-${size}-v2.png`, image)
  // Compatibility for already scheduled notifications and older installed manifests.
  await save(`public/icon-${size}.png`, image)
}
await save('public/icon-maskable-512-v2.png', await png(svg(512, { fraction: 0.5625 }), 512))
await save('public/apple-touch-icon.png', await png(svg(), 180))
await save(`${resourceRoot}/drawable/app_icon.png`, await png(svg(), 512))
for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
  await save(`${resourceRoot}/mipmap-${density}/ic_launcher.png`, await png(svg(512, { round: true }), size))
  await save(`${resourceRoot}/mipmap-${density}/ic_launcher_round.png`, await png(svg(512, { circle: true }), size))
}
await save(`${resourceRoot}/drawable/ic_launcher_foreground.xml`, vector())
await save(`${resourceRoot}/drawable/ic_launcher_monochrome.xml`, vector(true))
await save(`${resourceRoot}/drawable/ic_stat_notification.xml`, vector(true, 24, 0.2, 2.4))
for (const [version, themed] of [[26, false], [33, true]]) {
  for (const name of ['ic_launcher', 'ic_launcher_round']) await save(`${resourceRoot}/mipmap-anydpi-v${version}/${name}.xml`, adaptive(themed))
}

// Validate the actual alpha silhouette against the guaranteed circular safe zones.
async function silhouetteRadius(source, size) {
  const { data, info } = await sharp(Buffer.from(source)).resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let radius = 0
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * info.channels + info.channels - 1] > 8) radius = Math.max(radius, Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2))
  }
  return radius / size
}
const adaptiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 108 108"><g transform="translate(30 30) scale(.5)">${mark()}</g></svg>`
const androidRadius = await silhouetteRadius(adaptiveSvg, 1080)
const pwaRadius = await silhouetteRadius(svg(512, { fraction: 0.5625, transparent: true }), 1024)
const report = { android: { maxRadiusDp: Number((androidRadius * 108).toFixed(2)), safeRadiusDp: 33 }, pwa: { maxRadiusRatio: Number(pwaRadius.toFixed(4)), safeRadiusRatio: 0.4 }, faviconSizes: faviconImages.map(({ size }) => size), androidDensities: ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'] }
if (androidRadius > 33 / 108 || pwaRadius > 0.4) throw new Error(`Brand mark exceeds the platform safe zone: ${JSON.stringify(report)}`)
await save('output/brand/icon-validation.json', `${JSON.stringify(report, null, 2)}\n`)

// A review sheet uses the same paths, including the platform's 72dp adaptive crop.
const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="540" viewBox="0 0 1000 540">
<defs><clipPath id="circle"><circle cx="500" cy="220" r="96"/></clipPath><clipPath id="squircle"><rect x="684" y="124" width="192" height="192" rx="48"/></clipPath></defs>
<rect width="1000" height="540" rx="24" fill="#020617"/>
<g font-family="Arial,sans-serif"><text x="48" y="58" fill="#F8FAFC" font-size="24" font-weight="600">Planilha</text><text x="48" y="87" fill="#94A3B8" font-size="15">Nova identidade · navegador e Android</text>
<g transform="translate(100 124)">${svg(192, { round: true })}</g>
<g clip-path="url(#circle)"><rect x="404" y="124" width="192" height="192" fill="${palette.background}"/><g transform="translate(356 76) scale(2.6666667)"><g transform="translate(30 30) scale(.5)">${mark()}</g></g></g>
<g clip-path="url(#squircle)"><rect x="684" y="124" width="192" height="192" fill="#D1FAE5"/><g transform="translate(636 76) scale(2.6666667)"><g transform="translate(30 30) scale(.5)">${paths.map(path => `<path fill="#064E3B" d="${path.d}"/>`).join('')}</g></g></g>
<g fill="#CBD5E1" font-size="15" text-anchor="middle"><text x="196" y="350">Aplicativo / PWA</text><text x="500" y="350">Android adaptável</text><text x="780" y="350">Android com tema</text></g>
<rect x="48" y="392" width="904" height="100" rx="16" fill="${palette.background}" stroke="#1E293B"/>
<g transform="translate(72 420)">${svg(32, { fraction: 0.78, round: true })}</g><text x="120" y="442" fill="#E2E8F0" font-size="16">Configurações · Planilha</text>
<g transform="translate(684 428)">${svg(16, { fraction: 0.78, round: true })}</g><text x="710" y="442" fill="#94A3B8" font-size="12">16 px</text>
<g transform="translate(788 420)">${svg(32, { fraction: 0.78, round: true })}</g><text x="832" y="442" fill="#94A3B8" font-size="12">32 px</text>
</g></svg>`
await save('output/brand/planilha-icons-preview.png', await sharp(Buffer.from(preview)).png().toBuffer())
console.log(JSON.stringify(report, null, 2))

// Keep an optional original concept outside public assets, without changing its pixels.
if (process.env.PLANILHA_ICON_CONCEPT) {
  await mkdir(resolve(root, 'assets/brand'), { recursive: true })
  await copyFile(process.env.PLANILHA_ICON_CONCEPT, resolve(root, 'assets/brand/planilha-concept.png'))
}
