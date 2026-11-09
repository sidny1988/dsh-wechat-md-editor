/**
 * 公众号MD编辑器 · HTML → Markdown
 *
 * 用于把网页、Word 导出、公众号后台的文章粘成可编辑的 Markdown。
 * 只做常见标签的语义转换，不保留内联样式；未知标签一律展开为文本。
 */
const MDW_HTML_BLOCK_TAGS = ['P', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'FIGURE', 'FIGCAPTION', 'DL', 'DT', 'DD', 'FORM', 'FIELDSET', 'DETAILS', 'SUMMARY', 'ADDRESS', 'CENTER']
const MDW_HTML_SKIP_TAGS = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'VIDEO', 'AUDIO', 'CANVAS', 'OBJECT', 'EMBED', 'TEMPLATE', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA']

function mdwHtmlToMarkdown(html) {
  const source = String(html === null || html === undefined ? '' : html)
  if (source.trim() === '') return ''
  let doc = null
  try {
    doc = new DOMParser().parseFromString('<body>' + source + '</body>', 'text/html')
  } catch {
    return ''
  }
  const body = doc.body
  if (body === null) return ''

  const isBlock = (node) => node.nodeType === 1 && (MDW_HTML_BLOCK_TAGS.indexOf(node.tagName) !== -1 || /^(H[1-6]|UL|OL|LI|BLOCKQUOTE|PRE|TABLE|HR)$/.test(node.tagName))

  const cleanText = (value) => String(value === null || value === undefined ? '' : value).replace(/\u200b/g, '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ')

  const fenceFor = (text) => {
    const match = /`{3,}/.exec(text)
    return match === null ? '```' : '`'.repeat(match[0].length + 1)
  }

  const inline = (node, depth) => {
    if (node.nodeType === 3) return cleanText(node.nodeValue)
    if (node.nodeType !== 1) return ''
    const tag = node.tagName
    if (MDW_HTML_SKIP_TAGS.indexOf(tag) !== -1) return ''
    if (tag === 'BR') return '\n'
    if (tag === 'IMG') {
      const src = node.getAttribute('src') || node.getAttribute('data-src') || node.getAttribute('data-original') || ''
      const alt = cleanText(node.getAttribute('alt') || '')
      return src === '' ? '' : '![' + alt + '](' + src + ')'
    }
    const kids = Array.from(node.childNodes).map((child) => (isBlock(child) ? blocks(child, depth) : inline(child, depth))).join('')
    const text = cleanText(kids)
    switch (tag) {
      case 'STRONG':
      case 'B':
        return text.trim() === '' ? text : '**' + text.trim() + '**'
      case 'EM':
      case 'I':
        return text.trim() === '' ? text : '*' + text.trim() + '*'
      case 'DEL':
      case 'S':
      case 'STRIKE':
        return text.trim() === '' ? text : '~~' + text.trim() + '~~'
      case 'CODE': {
        const raw = cleanText(node.textContent)
        if (raw === '') return ''
        const ticks = '`'.repeat(Math.max(1, (/`+/.exec(raw) || [''])[0].length + 1))
        const padded = raw.startsWith('`') || raw.endsWith('`') ? ' ' + raw + ' ' : raw
        return ticks + padded + ticks
      }
      case 'A': {
        const href = node.getAttribute('href') || ''
        const label = text.trim() === '' ? href : text.trim()
        if (href === '' || href.startsWith('javascript:')) return label
        return '[' + label + '](' + href + ')'
      }
      case 'SUP':
        return text.trim() === '' ? '' : '<sup>' + text.trim() + '</sup>'
      case 'SUB':
        return text.trim() === '' ? '' : '<sub>' + text.trim() + '</sub>'
      case 'SPAN':
      case 'FONT': {
        const style = (node.getAttribute('style') || '').toLowerCase()
        const bold = /font-weight:\s*(bold|[6-9]00)/.test(style)
        const italic = /font-style:\s*italic/.test(style)
        const trimmed = text.trim()
        if (trimmed === '') return text
        if (bold && italic) return '***' + trimmed + '***'
        if (bold) return '**' + trimmed + '**'
        if (italic) return '*' + trimmed + '*'
        return text
      }
      default:
        return kids
    }
  }

  const listBlock = (node, depth) => {
    const ordered = node.tagName === 'OL'
    const lines = []
    let index = 0
    Array.from(node.children).forEach((child) => {
      if (child.tagName !== 'LI') return
      index += 1
      let text = ''
      const nested = []
      Array.from(child.childNodes).forEach((part) => {
        if (part.nodeType === 1 && (part.tagName === 'UL' || part.tagName === 'OL')) nested.push(part)
        else text += inline(part, depth)
      })
      let marker = ordered ? index + '. ' : '- '
      const checkbox = child.querySelector('input[type="checkbox"]')
      if (checkbox !== null) marker = checkbox.checked ? '- [x] ' : '- [ ] '
      const label = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
      lines.push('  '.repeat(depth) + marker + label)
      nested.forEach((sub) => lines.push(listBlock(sub, depth + 1).replace(/^\n+|\n+$/g, '')))
    })
    return '\n\n' + lines.join('\n') + '\n\n'
  }

  const tableBlock = (node) => {
    const rows = Array.from(node.querySelectorAll('tr'))
      .map((tr) => Array.from(tr.children)
        .filter((cell) => cell.tagName === 'TD' || cell.tagName === 'TH')
        .map((cell) => cleanText(cell.textContent).replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|')))
      .filter((cells) => cells.length > 0)
    if (rows.length === 0) return ''
    const width = Math.max.apply(null, rows.map((cells) => cells.length))
    const pad = (cells) => {
      const next = cells.slice()
      while (next.length < width) next.push('')
      return next
    }
    const line = (cells) => '| ' + cells.join(' | ') + ' |'
    const header = pad(rows[0])
    const output = [line(header), '| ' + header.map(() => '---').join(' | ') + ' |']
    rows.slice(1).forEach((cells) => output.push(line(pad(cells))))
    return '\n\n' + output.join('\n') + '\n\n'
  }

  const blocks = (node, depth) => {
    if (node.nodeType === 3) return cleanText(node.nodeValue)
    if (node.nodeType !== 1) return ''
    const tag = node.tagName
    if (MDW_HTML_SKIP_TAGS.indexOf(tag) !== -1) return ''
    if (tag === 'BR') return '\n'
    if (/^H[1-6]$/.test(tag)) {
      const level = Number(tag.charAt(1))
      return '\n\n' + '#'.repeat(level) + ' ' + inline(node, depth).trim() + '\n\n'
    }
    if (tag === 'HR') return '\n\n---\n\n'
    if (tag === 'PRE') {
      const codeNode = node.querySelector('code')
      const source = codeNode === null ? node.textContent : codeNode.textContent
      const raw = String(source === null || source === undefined ? '' : source).replace(/\u200b/g, '').replace(/\u00a0/g, ' ').replace(/^\n+|\n+$/g, '')
      const className = (codeNode === null ? node.getAttribute('class') : codeNode.getAttribute('class')) || ''
      const langMatch = /(?:language|lang)-([\w+#-]+)/.exec(className)
      const fence = fenceFor(raw)
      return '\n\n' + fence + (langMatch === null ? '' : langMatch[1]) + '\n' + raw + '\n' + fence + '\n\n'
    }
    if (tag === 'BLOCKQUOTE') {
      const inner = Array.from(node.childNodes).map((child) => (isBlock(child) ? blocks(child, depth) : inline(child, depth))).join('').trim()
      if (inner === '') return ''
      return '\n\n' + inner.split('\n').map((lineText) => '> ' + lineText.replace(/^\s+/, '')).join('\n') + '\n\n'
    }
    if (tag === 'UL' || tag === 'OL') return listBlock(node, depth)
    if (tag === 'TABLE') return tableBlock(node)
    if (tag === 'LI') {
      const text = inline(node, depth).replace(/\n+/g, ' ').trim()
      return '\n- ' + text + '\n'
    }
    if (tag === 'FIGCAPTION') {
      const caption = inline(node, depth).trim()
      return caption === '' ? '' : '\n\n*' + caption + '*\n\n'
    }
    if (MDW_HTML_BLOCK_TAGS.indexOf(tag) !== -1) {
      const hasBlockChild = Array.from(node.children).some((child) => isBlock(child))
      if (!hasBlockChild) {
        const rawText = Array.from(node.childNodes).map((child) => inline(child, depth)).join('').trim()
        if (rawText === '') return ''
        const style = (node.getAttribute('style') || '').toLowerCase()
        const bold = /font-weight:\s*(bold|[6-9]00)/.test(style)
        const italic = /font-style:\s*italic/.test(style)
        const styled = bold && italic ? '***' + rawText + '***' : bold ? '**' + rawText + '**' : italic ? '*' + rawText + '*' : rawText
        return '\n\n' + styled + '\n\n'
      }
      return '\n\n' + Array.from(node.childNodes).map((child) => (isBlock(child) ? blocks(child, depth) : inline(child, depth))).join('') + '\n\n'
    }
    return Array.from(node.childNodes).map((child) => (isBlock(child) ? blocks(child, depth) : inline(child, depth))).join('')
  }

  const raw = blocks(body, 0)
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}
