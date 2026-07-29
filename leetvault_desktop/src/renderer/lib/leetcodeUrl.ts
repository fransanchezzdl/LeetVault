export function leetcodeProblemUrl(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `https://leetcode.com/problems/${slug}/`;
}
