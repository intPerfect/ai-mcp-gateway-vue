export function highlightText(text: string, keyword: string): string {
  if (!keyword.trim() || !text) return escapeHtml(text)
  const kw = keyword.trim()
  const regex = new RegExp(`(${escapeRegex(kw)})`, 'gi')
  return escapeHtml(text).replace(regex, '<mark class="hl">$1</mark>')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
