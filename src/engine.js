/**
 * 公众号MD编辑器 · Markdown 引擎
 *
 * 自研、零依赖的 GFM 子集渲染器：输出带类名的语义 HTML，预览由主题 CSS 着色，
 * 复制到公众号时再把 CSS 逐条内联。刻意不做 HTML 透传（安全 + 公众号会清洗），
 * 不做 KaTeX / Mermaid（需要额外运行时，留待后续版本）。
 *
 * 产出：{ html, headings, links, footnotes, chars }
 */
const MDW_ENGINE = (() => {
  const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

  function esc(value) {
    return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char])
  }

  const SPECIAL = /[\\`!\[\]*_~<$]/
  const URL_START = /^https?:\/\//i

  function parseJsxProps(source) {
    const props = {}
    const pattern = /([A-Za-z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([\s\S]*?)\})/g
    let match
    while ((match = pattern.exec(source)) !== null) {
      const name = match[1]
      if (match[4] !== undefined) {
        const raw = match[4].trim()
        try {
          props[name] = JSON.parse(raw)
        } catch {
          props[name] = raw
        }
      } else {
        props[name] = match[2] !== undefined ? match[2] : match[3]
      }
    }
    return props
  }

  function countWords(text) {
    const source = String(text || '')
    const cjk = source.match(/[\u3400-\u9fff\uf900-\ufaff]/g)
    const latin = source.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, ' ').match(/[A-Za-z0-9_@#$%&+./-]+/g)
    const cjkCount = cjk === null ? 0 : cjk.length
    const latinCount = latin === null ? 0 : latin.length
    return { cjk: cjkCount, latin: latinCount, total: cjkCount + latinCount, chars: source.length }
  }

  function findCloser(text, from, mark) {
    let at = text.indexOf(mark, from)
    while (at !== -1) {
      const before = text[at - 1]
      const after = text[at + mark.length]
      if (at > from && before !== undefined && !/\s/.test(before) && before !== '\\') {
        if (mark.length === 1 && after === mark) {
          at = text.indexOf(mark, at + 2)
          continue
        }
        return at
      }
      at = text.indexOf(mark, at + 1)
    }
    return -1
  }

  function readLink(text, start) {
    let depth = 0
    let i = start
    for (; i < text.length; i += 1) {
      const char = text[i]
      if (char === '\\') {
        i += 1
        continue
      }
      if (char === '[') depth += 1
      else if (char === ']') {
        depth -= 1
        if (depth === 0) break
      }
    }
    if (i >= text.length) return null
    const label = text.slice(start + 1, i)
    if (text[i + 1] !== '(') return null
    let j = i + 2
    let paren = 1
    let quote = ''
    for (; j < text.length; j += 1) {
      const char = text[j]
      if (char === '\\') {
        j += 1
        continue
      }
      if (quote !== '') {
        if (char === quote) quote = ''
        continue
      }
      if (char === '"' || char === "'") {
        quote = char
        continue
      }
      if (char === '(') paren += 1
      else if (char === ')') {
        paren -= 1
        if (paren === 0) break
      }
    }
    if (j >= text.length) return null
    const raw = text.slice(i + 2, j).trim()
    let target = raw
    let title = ''
    if (raw.startsWith('<') && raw.endsWith('>')) {
      target = raw.slice(1, -1)
    } else {
      const spaceAt = raw.search(/\s/)
      if (spaceAt !== -1) {
        target = raw.slice(0, spaceAt)
        title = raw.slice(spaceAt + 1).trim().replace(/^["'(]/, '').replace(/["')]$/, '')
      }
    }
    return { label, target, title, end: j + 1 }
  }

  function inline(text, ctx) {
    const out = []
    let i = 0
    const length = text.length
    while (i < length) {
      const char = text[i]
      if (char === '\\' && i + 1 < length) {
        out.push(esc(text[i + 1]))
        i += 2
        continue
      }
      // 行内公式 $...$（排除 $$ 与货币写法）
      if (char === '$' && text[i + 1] !== '$' && text[i + 1] !== undefined && !/\s/.test(text[i + 1])) {
        let end = -1
        for (let k = i + 1; k < length; k += 1) {
          if (text[k] === '$' && text[k - 1] !== '\\' && !/\s/.test(text[k - 1] || '')) {
            end = k
            break
          }
        }
        if (end !== -1) {
          const tex = text.slice(i + 1, end)
          if (tex.length > 0 && /[\\^_=+\-*/<>{}a-zA-Z\u0370-\u03ff]/.test(tex)) {
            out.push('<span class="mdw-math" data-display="0" data-tex="' + esc(tex) + '"></span>')
            i = end + 1
            continue
          }
        }
      }
      if (char === '`') {
        let run = 1
        while (text[i + run] === '`') run += 1
        const fence = '`'.repeat(run)
        const end = text.indexOf(fence, i + run)
        if (end !== -1) {
          out.push('<code class="mdw-code-inline">' + esc(text.slice(i + run, end).trim()) + '</code>')
          i = end + run
          continue
        }
        out.push(esc(fence))
        i += run
        continue
      }
      if (char === '!' && text[i + 1] === '[') {
        const image = readLink(text, i + 1)
        if (image !== null) {
          out.push(
            '<img class="mdw-img" src="' +
              esc(image.target) +
              '" alt="' +
              esc(image.label) +
              '"' +
              (image.title === '' ? '' : ' title="' + esc(image.title) + '"') +
              ' />'
          )
          i = image.end
          continue
        }
      }
      if (char === '[') {
        if (text[i + 1] === '^') {
          const close = text.indexOf(']', i + 2)
          if (close !== -1) {
            const id = text.slice(i + 2, close)
            if (/^[^\s\]]+$/.test(id)) {
              out.push(footnoteRef(id, ctx))
              i = close + 1
              continue
            }
          }
        }
        const link = readLink(text, i)
        if (link !== null) {
          out.push(linkHtml(link.label, link.target, link.title, ctx))
          i = link.end
          continue
        }
      }
      if ((char === '*' || char === '_') && text[i + 1] === char) {
        const mark = char + char
        const end = findCloser(text, i + 2, mark)
        if (end !== -1 && text.slice(i + 2, end).trim() !== '') {
          out.push('<strong>' + inline(text.slice(i + 2, end), ctx) + '</strong>')
          i = end + 2
          continue
        }
      }
      if (char === '*' || char === '_') {
        const end = findCloser(text, i + 1, char)
        if (end !== -1) {
          const inner = text.slice(i + 1, end)
          if (inner.trim() !== '' && !/^\s/.test(inner)) {
            out.push('<em>' + inline(inner, ctx) + '</em>')
            i = end + 1
            continue
          }
        }
      }
      if (char === '~' && text[i + 1] === '~') {
        const end = text.indexOf('~~', i + 2)
        if (end !== -1) {
          out.push('<del>' + inline(text.slice(i + 2, end), ctx) + '</del>')
          i = end + 2
          continue
        }
      }
      if (char === '<') {
        const end = text.indexOf('>', i + 1)
        if (end !== -1) {
          const inner = text.slice(i + 1, end)
          if (/^(https?:\/\/|mailto:)/i.test(inner)) {
            out.push(linkHtml(inner, inner, '', ctx, true))
            i = end + 1
            continue
          }
        }
      }
      if ((char === 'h' || char === 'H') && URL_START.test(text.slice(i, i + 8))) {
        let end = i
        while (end < length && !/[\s<>，。；：！？、）】》”’]/.test(text[end])) end += 1
        let url = text.slice(i, end)
        let tail = ''
        const trailing = /[.,;:!?)\]，。；：！？）】]+$/.exec(url)
        if (trailing !== null) {
          tail = trailing[0]
          url = url.slice(0, url.length - tail.length)
        }
        if (url.length > 8) {
          out.push(linkHtml(url, url, '', ctx, true))
          if (tail !== '') out.push(esc(tail))
          i = end
          continue
        }
      }
      if (SPECIAL.test(char)) {
        out.push(esc(char))
        i += 1
        continue
      }
      // 普通文本按段累积，减少一次一字符的数组开销
      let end = i + 1
      while (end < length && !SPECIAL.test(text[end]) && !URL_START.test(text.slice(end, end + 8))) end += 1
      out.push(esc(text.slice(i, end)))
      i = end
    }
    return out.join('')
  }

  function linkHtml(label, target, title, ctx, literalLabel) {
    const safeHref = esc(target)
    const titleAttr = title === '' ? '' : ' title="' + esc(title) + '"'
    const body = literalLabel === true ? esc(label) : inline(label, ctx)
    if (ctx.refs === true) {
      let index = ctx.linkIndex.get(target)
      if (index === undefined) {
        ctx.links.push(target)
        index = ctx.links.length
        ctx.linkIndex.set(target, index)
      }
      return (
        '<a class="mdw-link" href="' +
        safeHref +
        '"' +
        titleAttr +
        '>' +
        body +
        '<sup class="mdw-ref">[' +
        index +
        ']</sup></a>'
      )
    }
    return '<a class="mdw-link" href="' + safeHref + '"' + titleAttr + '>' + body + '</a>'
  }

  function footnoteRef(id, ctx) {
    if (!ctx.footnotes.has(id)) {
      ctx.footnotes.set(id, { id, text: '', order: ctx.footnoteOrder.length + 1 })
      ctx.footnoteOrder.push(id)
    }
    const entry = ctx.footnotes.get(id)
    return '<sup class="mdw-fn"><a href="#fn-' + esc(id) + '" id="fnref-' + esc(id) + '">[' + entry.order + ']</a></sup>'
  }

  const BLOCK_START = null // 见 isBlockStart：正则回溯引用不可靠，改为显式判定

  function isBlockStart(lines, index) {
    const line = lines[index]
    if (line === undefined) return false
    if (/^\s{0,3}#{1,6}\s+/.test(line)) return true
    if (/^\s{0,3}>/.test(line)) return true
    if (/^\s*(```|~~~)/.test(line)) return true
    if (isHr(line)) return true
    if (/^\s{0,3}([-*+]|\d+[.)])\s+/.test(line)) return true
    if (/^\s{0,3}\[[^\]]+\]:/.test(line)) return true
    if (/^\s*\$\$/.test(line)) return true
    if (/^\s*\[\[?TOC\]?\]\s*$/i.test(line)) return true
    if (line.includes('|') && isTableSeparator(lines[index + 1])) return true
    return false
  }

  function isTableSeparator(line) {
    if (line === undefined) return false
    if (!line.includes('|')) return false
    return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(line)
  }

  function splitRow(line) {
    let text = line.trim()
    if (text.startsWith('|')) text = text.slice(1)
    if (text.endsWith('|') && !text.endsWith('\\|')) text = text.slice(0, -1)
    const cells = []
    let current = ''
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i]
      if (char === '\\' && text[i + 1] === '|') {
        current += '|'
        i += 1
        continue
      }
      if (char === '|') {
        cells.push(current.trim())
        current = ''
        continue
      }
      current += char
    }
    cells.push(current.trim())
    return cells
  }

  function alignOf(cell) {
    const text = cell.trim()
    const left = text.startsWith(':')
    const right = text.endsWith(':')
    if (left && right) return 'center'
    if (right) return 'right'
    return 'left'
  }

  function isHr(line) {
    return /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)
  }

  function parseList(lines, start, state) {
    const first = /^(\s*)([-*+]|\d+[.)])\s+/.exec(lines[start])
    if (first === null) return null
    const indent = first[1].length
    const ordered = /^\d/.test(first[2])
    const startNumber = ordered ? parseInt(first[2], 10) : 1
    const items = []
    let i = start
    while (i < lines.length) {
      const marker = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i])
      if (marker === null || marker[1].length !== indent || /^\d/.test(marker[2]) !== ordered) break
      const content = [marker[3]]
      let j = i + 1
      let sawBlank = false
      while (j < lines.length) {
        const next = lines[j]
        if (/^\s*$/.test(next)) {
          content.push('')
          sawBlank = true
          j += 1
          continue
        }
        const nextIndent = /^\s*/.exec(next)[0].length
        if (nextIndent > indent) {
          content.push(next.slice(Math.min(nextIndent, indent + 2)))
          sawBlank = false
          j += 1
          continue
        }
        if (sawBlank) break
        if (isBlockStart(lines, j) || /^\s*\|/.test(next)) break
        content.push(next)
        j += 1
      }
      let body = content.join('\n').replace(/\s+$/, '')
      let task = null
      const check = /^\[([ xX])\]\s+([\s\S]*)$/.exec(body)
      if (check !== null) {
        task = check[1].toLowerCase() === 'x'
        body = check[2]
      }
      items.push({ body, task })
      i = j
    }
    return { items, ordered, startNumber, nextIndex: i }
  }

  function renderItemBody(body, state) {
    const html = parseBlocks(body.split('\n'), state).trim()
    const onlyParagraph = /^<p(?:\s[^>]*)?>([\s\S]*)<\/p>$/.exec(html)
    if (onlyParagraph !== null && html.indexOf('</p><') === -1) return onlyParagraph[1]
    return html
  }

  function parseBlocks(lines, state) {
    const out = []
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (/^\s*$/.test(line)) {
        i += 1
        continue
      }

      if (/^\s*(```|~~~)/.test(line)) {
        const fenceMatch = /^\s*(`{3,}|~{3,})\s*([^\s`]*)/.exec(line)
        const fence = fenceMatch[1][0]
        const count = fenceMatch[1].length
        const lang = (fenceMatch[2] || '').trim()
        const body = []
        i += 1
        while (i < lines.length) {
          const closeMatch = new RegExp('^\\s*' + (fence === '`' ? '`' : '~') + '{' + count + ',}\\s*$')
          if (closeMatch.test(lines[i])) {
            i += 1
            break
          }
          body.push(lines[i])
          i += 1
        }
        const code = body.join('\n')
        if (lang.toLowerCase() === 'mermaid') {
          out.push('<div class="mdw-mermaid" data-code="' + esc(code) + '"></div>')
          continue
        }
        const label = lang === '' ? '' : lang.toUpperCase()
        out.push(
          '<div class="mdw-codeblock">' +
            '<div class="mdw-codehead">' +
            '<span class="mdw-dot" style="background:#ff5f57"></span>' +
            '<span class="mdw-dot" style="background:#febc2e"></span>' +
            '<span class="mdw-dot" style="background:#28c840"></span>' +
            (label === '' ? '' : '<span class="mdw-lang">' + esc(label) + '</span>') +
            '</div>' +
            '<pre class="mdw-pre" data-lang="' +
            esc(lang) +
            '"><code class="mdw-code" data-lang="' +
            esc(lang) +
            '">' +
            (state.highlight === undefined ? esc(code) : state.highlight(code, lang)) +
            '</code></pre></div>'
        )
        continue
      }

      const trimmed = line.trim()
      if (/^\$\$/.test(trimmed)) {
        // $$ 单行 $$ 或多行块
        if (trimmed.length > 4 && trimmed.endsWith('$$') && trimmed.indexOf('$$', 2) === trimmed.length - 2) {
          out.push('<div class="mdw-math" data-display="1" data-tex="' + esc(trimmed.slice(2, -2).trim()) + '"></div>')
          i += 1
          continue
        }
        const body = []
        let j = i + 1
        while (j < lines.length && !/^\s*\$\$\s*$/.test(lines[j])) {
          body.push(lines[j])
          j += 1
        }
        if (j < lines.length) {
          out.push('<div class="mdw-math" data-display="1" data-tex="' + esc(body.join('\n').trim()) + '"></div>')
          i = j + 1
          continue
        }
      }

      // JSX 风格组件：整行 <Name prop="..." />
      const component = /^\s*<([A-Z][A-Za-z0-9]*)\s+([\s\S]*?)\/?>\s*$/.exec(line)
      if (component !== null) {
        const props = parseJsxProps(component[2])
        out.push('<div class="mdw-component" data-name="' + esc(component[1]) + '" data-props="' + esc(JSON.stringify(props)) + '"></div>')
        i += 1
        continue
      }

      const heading = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line)
      if (heading !== null) {
        const level = heading[1].length
        const text = heading[2]
        state.headings.push({ level, text: text.replace(/[*_`~]/g, ''), line: -1 })
        out.push('<h' + level + ' class="mdw-h' + level + '">' + inline(text, state) + '</h' + level + '>')
        i += 1
        continue
      }

      if (isHr(line)) {
        out.push('<hr class="mdw-hr" />')
        i += 1
        continue
      }

      if (/^\s{0,3}>/.test(line)) {
        const body = []
        while (i < lines.length) {
          const current = lines[i]
          if (/^\s{0,3}>/.test(current)) {
            body.push(current.replace(/^\s{0,3}>\s?/, ''))
            i += 1
            continue
          }
          if (/^\s*$/.test(current) && i + 1 < lines.length && /^\s{0,3}>/.test(lines[i + 1])) {
            body.push('')
            i += 1
            continue
          }
          break
        }
        out.push('<blockquote class="mdw-quote">' + parseBlocks(body, state) + '</blockquote>')
        continue
      }

      if (/^\s{0,3}\[[^\]]+\]:/.test(line)) {
        const def = /^\s{0,3}\[([^\]]+)\]:\s*(.*)$/.exec(line)
        const id = def[1]
        const chunks = [def[2]]
        i += 1
        while (i < lines.length && /^\s{2,}\S/.test(lines[i])) {
          chunks.push(lines[i].trim())
          i += 1
        }
        const entry = state.footnotes.get(id)
        if (entry !== undefined) entry.text = chunks.join(' ')
        else {
          state.footnotes.set(id, { id, text: chunks.join(' '), order: state.footnoteOrder.length + 1 })
          state.footnoteOrder.push(id)
        }
        continue
      }

      if (/^\s*\[\[?TOC\]?\]\s*$/i.test(line)) {
        state.tocWanted = true
        out.push('\u0000MDW_TOC\u0000')
        i += 1
        continue
      }

      if (line.includes('|') && isTableSeparator(lines[i + 1])) {
        const header = splitRow(line)
        const aligns = splitRow(lines[i + 1]).map(alignOf)
        i += 2
        const rows = []
        while (i < lines.length && lines[i].includes('|') && !/^\s*$/.test(lines[i])) {
          rows.push(splitRow(lines[i]))
          i += 1
        }
        let table = '<table class="mdw-table"><thead><tr>'
        for (let c = 0; c < header.length; c += 1) {
          table += '<th class="mdw-th" style="text-align:' + (aligns[c] || 'left') + '">' + inline(header[c], state) + '</th>'
        }
        table += '</tr></thead><tbody>'
        for (const row of rows) {
          table += '<tr>'
          for (let c = 0; c < header.length; c += 1) {
            const cell = row[c] === undefined ? '' : row[c]
            table += '<td class="mdw-td" style="text-align:' + (aligns[c] || 'left') + '">' + inline(cell, state) + '</td>'
          }
          table += '</tr>'
        }
        table += '</tbody></table>'
        out.push(table)
        continue
      }

      if (/^\s{0,3}([-*+]|\d+[.)])\s+/.test(line)) {
        const list = parseList(lines, i, state)
        if (list !== null) {
          const tag = list.ordered ? 'ol' : 'ul'
          const startAttr = list.ordered && list.startNumber !== 1 ? ' start="' + list.startNumber + '"' : ''
          let html = '<' + tag + ' class="mdw-list"' + startAttr + '>'
          for (const item of list.items) {
            const box =
              item.task === null
                ? ''
                : '<span class="mdw-task" data-checked="' + (item.task ? '1' : '0') + '">' + (item.task ? '☑' : '☐') + '</span>'
            html += '<li class="mdw-li">' + box + renderItemBody(item.body, state) + '</li>'
          }
          html += '</' + tag + '>'
          out.push(html)
          i = list.nextIndex
          continue
        }
      }

      // paragraph
      const paragraph = [line]
      i += 1
      while (i < lines.length) {
        const next = lines[i]
        if (/^\s*$/.test(next)) break
        if (isBlockStart(lines, i)) break
        if (next.includes('|') && isTableSeparator(lines[i + 1])) break
        paragraph.push(next)
        i += 1
      }
      const joined = paragraph.join(state.softBreaks ? '\n' : ' ')
      const html = state.softBreaks ? inline(joined, state).replace(/\n/g, '<br />') : inline(joined, state)
      out.push('<p class="mdw-p">' + html + '</p>')
    }
    return out.join('')
  }

  function render(src, options) {
    const settings = options !== null && typeof options === 'object' ? options : {}
    const state = {
      refs: settings.linkRefs !== false,
      softBreaks: settings.softBreaks !== false,
      highlight: typeof settings.highlight === 'function' ? settings.highlight : undefined,
      links: [],
      linkIndex: new Map(),
      footnotes: new Map(),
      footnoteOrder: [],
      headings: [],
      tocWanted: false,
      lineOffset: 0,
    }
    const lines = String(src === undefined || src === null ? '' : src).replace(/\r\n?/g, '\n').split('\n')
    let html = parseBlocks(lines, state)

    if (state.tocWanted) {
      const toc =
        state.headings.length === 0
          ? ''
          : '<section class="mdw-toc"><p class="mdw-toc-title">目录</p><ul class="mdw-toc-list">' +
            state.headings
              .map(
                (heading) =>
                  '<li class="mdw-toc-item" data-level="' +
                  heading.level +
                  '"><span class="mdw-toc-text">' +
                  esc(heading.text) +
                  '</span></li>'
              )
              .join('') +
            '</ul></section>'
      html = html.replace(/\u0000MDW_TOC\u0000/g, toc)
    }

    if (state.footnoteOrder.length > 0) {
      let notes = '<section class="mdw-footnotes"><hr class="mdw-hr" /><ol class="mdw-fn-list">'
      for (const id of state.footnoteOrder) {
        const entry = state.footnotes.get(id)
        notes +=
          '<li class="mdw-fn-item" id="fn-' + esc(id) + '">' + inline(entry.text === '' ? id : entry.text, state) + '</li>'
      }
      notes += '</ol></section>'
      html += notes
    }

    if (state.links.length > 0) {
      let refs = '<section class="mdw-refs"><p class="mdw-refs-title">参考链接</p><ol class="mdw-refs-list">'
      for (const link of state.links) {
        refs += '<li class="mdw-ref-item">' + esc(link) + '</li>'
      }
      refs += '</ol></section>'
      // 参考链接不参与正文的链接计数，故放在最后拼接
      html += refs
    }

    return {
      html,
      headings: state.headings,
      links: state.links,
      footnotes: state.footnoteOrder.map((id) => state.footnotes.get(id)),
      chars: countWords(src).chars,
    }
  }

  return { render, esc, inline, countWords }
})()

if (typeof module !== 'undefined' && module.exports !== undefined) module.exports = { MDW_ENGINE }
