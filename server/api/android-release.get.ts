interface GitHubReleaseAsset {
  name: string
  browser_download_url: string
}

interface GitHubRelease {
  tag_name: string
  body: string | null
  published_at: string | null
  html_url: string
  assets: GitHubReleaseAsset[]
}

const RELEASE_URL = 'https://api.github.com/repos/syg-pedro/Planilha/releases/latest'

export default cachedEventHandler(async () => {
  const release = await $fetch<GitHubRelease>(RELEASE_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Financeiro-Familiar'
    }
  })
  const apk = release.assets.find((asset) => asset.name.endsWith('.apk'))

  if (!apk) {
    throw createError({ statusCode: 404, statusMessage: 'Nenhum APK publicado ainda.' })
  }

  return {
    version: release.tag_name.replace(/^v/, ''),
    notes: release.body?.trim() || undefined,
    publishedAt: release.published_at,
    apkUrl: apk.browser_download_url,
    releaseUrl: release.html_url
  }
}, {
  maxAge: 300,
  swr: true
})
