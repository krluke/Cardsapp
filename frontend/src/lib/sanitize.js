const DANGEROUS_CSS_PROPERTIES = ['z-index', 'transform']

const DANGEROUS_CSS_REGEXES = DANGEROUS_CSS_PROPERTIES.map(prop =>
  new RegExp(`\\b${prop}\\s*:\\s*[^;"}]+;?`, 'gi')
)
const FIXED_POSITION_REGEX = /position\s*:\s*fixed;?/gi

export function sanitizeHtmlForDisplay(html) {
  if (!html) return html
  let result = html
  for (const regex of DANGEROUS_CSS_REGEXES) {
    result = result.replace(regex, '')
  }
  result = result.replace(FIXED_POSITION_REGEX, '')
  return result
}
