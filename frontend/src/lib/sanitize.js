const DANGEROUS_CSS_PROPERTIES = ['z-index', 'transform']

export function sanitizeHtmlForDisplay(html) {
  if (!html) return html
  let result = html
  for (const prop of DANGEROUS_CSS_PROPERTIES) {
    const regex = new RegExp(`\\b${prop}\\s*:\\s*[^;"}]+;?`, 'gi')
    result = result.replace(regex, '')
  }
  const fixedPositionRegex = /position\s*:\s*fixed;?/gi
  result = result.replace(fixedPositionRegex, '')
  return result
}
