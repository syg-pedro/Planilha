interface GitHubCommit {
  sha: string
  commit: {
    message: string
  }
}

const COMMIT_URL = 'https://api.github.com/repos/syg-pedro/Planilha/commits/main'

const formatNotes = (message: string) => message
  .split(/\r?\n|\\n/)
  .map((line) => line
    .replace(/^\s*(?:[-*]|\d+\.)\s*/, '')
    .replace(/^(?:feat|fix|docs|refactor|chore|test)(?:\([^)]*\))?:\s*/i, '')
    .trim())
  .filter(Boolean)
  .slice(0, 4)

export default cachedEventHandler(async () => {
  const commit = await $fetch<GitHubCommit>(COMMIT_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Financeiro-Familiar'
    }
  })

  return {
    version: commit.sha.slice(0, 7),
    notes: formatNotes(commit.commit.message)
  }
}, {
  maxAge: 60,
  swr: true
})
