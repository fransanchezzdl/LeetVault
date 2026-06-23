interface GitHubRelease {
  tag_name: string;
  html_url: string;
  body: string;
}

const TIMEOUT_MS = 5_000;

export async function fetchLatestRelease(
  owner: string,
  repo: string
): Promise<GitHubRelease | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': `LeetVault/${__APP_VERSION__}`,
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<GitHubRelease>;
    if (
      typeof data.tag_name !== 'string' ||
      typeof data.html_url !== 'string'
    ) {
      return null;
    }
    return {
      tag_name: data.tag_name,
      html_url: data.html_url,
      body: typeof data.body === 'string' ? data.body : '',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
