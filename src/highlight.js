/**
 * 公众号MD编辑器 · 轻量代码高亮
 *
 * 不引入 highlight.js：插件包以单文件 client.js 下发，运行时只能 require 宿主
 * 提供的模块。这里用「一条组合正则 + 语言关键字表」实现常见语言的着色，
 * 覆盖公众号文章里 95% 的代码块场景；识别失败一律回退为纯文本。
 *
 * 输出为带内联颜色的 <span>，复制到公众号时无需额外 CSS。
 */
const MDW_HL = (() => {
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ESC[c])

  const PALETTES = {
    'github-dark': {
      label: 'GitHub Dark',
      bg: '#0d1117',
      fg: '#c9d1d9',
      head: '#8b949e',
      cm: '#8b949e',
      str: '#a5d6ff',
      num: '#79c0ff',
      kw: '#ff7b72',
      fn: '#d2a8ff',
      type: '#ffa657',
      prop: '#79c0ff',
      tag: '#7ee787',
      attr: '#79c0ff',
      op: '#ff7b72',
    },
    'github-light': {
      label: 'GitHub Light',
      bg: '#f6f8fa',
      fg: '#24292f',
      head: '#6e7781',
      cm: '#6e7781',
      str: '#0a3069',
      num: '#0550ae',
      kw: '#cf222e',
      fn: '#8250df',
      type: '#953800',
      prop: '#0550ae',
      tag: '#116329',
      attr: '#0550ae',
      op: '#cf222e',
    },
    'one-dark': {
      label: 'One Dark',
      bg: '#282c34',
      fg: '#abb2bf',
      head: '#7f848e',
      cm: '#5c6370',
      str: '#98c379',
      num: '#d19a66',
      kw: '#c678dd',
      fn: '#61afef',
      type: '#e5c07b',
      prop: '#e06c75',
      tag: '#e06c75',
      attr: '#d19a66',
      op: '#56b6c2',
    },
    monokai: {
      label: 'Monokai',
      bg: '#272822',
      fg: '#f8f8f2',
      head: '#90908a',
      cm: '#75715e',
      str: '#e6db74',
      num: '#ae81ff',
      kw: '#f92672',
      fn: '#a6e22e',
      type: '#66d9ef',
      prop: '#f8f8f2',
      tag: '#f92672',
      attr: '#a6e22e',
      op: '#f92672',
    },
    nord: {
      label: 'Nord',
      bg: '#2e3440',
      fg: '#d8dee9',
      head: '#7b88a1',
      cm: '#616e88',
      str: '#a3be8c',
      num: '#b48ead',
      kw: '#81a1c1',
      fn: '#88c0d0',
      type: '#8fbcbb',
      prop: '#d8dee9',
      tag: '#81a1c1',
      attr: '#8fbcbb',
      op: '#81a1c1',
    },
    'solarized-light': {
      label: 'Solarized Light',
      bg: '#fdf6e3',
      fg: '#657b83',
      head: '#93a1a1',
      cm: '#93a1a1',
      str: '#2aa198',
      num: '#d33682',
      kw: '#859900',
      fn: '#268bd2',
      type: '#b58900',
      prop: '#268bd2',
      tag: '#268bd2',
      attr: '#b58900',
      op: '#859900',
    },
  }

  const C_LIKE = [
    'abstract', 'any', 'as', 'assert', 'async', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
    'class', 'const', 'continue', 'debugger', 'declare', 'default', 'delete', 'do', 'double', 'else', 'enum',
    'export', 'extends', 'false', 'final', 'finally', 'float', 'for', 'from', 'func', 'function', 'get',
    'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'is', 'keyof', 'lambda',
    'let', 'long', 'namespace', 'new', 'null', 'of', 'package', 'private', 'protected', 'public', 'readonly',
    'return', 'set', 'short', 'static', 'struct', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
    'trait', 'transient', 'true', 'try', 'type', 'typeof', 'undefined', 'var', 'void', 'volatile', 'while',
    'with', 'yield', 'fn', 'impl', 'mut', 'pub', 'use', 'crate', 'match', 'mod', 'where', 'unsafe', 'loop',
    'defer', 'go', 'chan', 'map', 'range', 'select', 'fallthrough', 'nil',
  ]
  const PY = [
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else',
    'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'None',
    'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'True', 'try', 'while', 'with', 'yield', 'self',
  ]
  const BASH = [
    'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'in',
    'select', 'until', 'time', 'local', 'return', 'exit', 'export', 'source', 'alias', 'echo', 'cd',
  ]
  const SQL = [
    'select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'table',
    'alter', 'drop', 'index', 'join', 'left', 'right', 'inner', 'outer', 'on', 'group', 'by', 'order',
    'having', 'limit', 'offset', 'union', 'all', 'distinct', 'as', 'and', 'or', 'not', 'null', 'is',
    'between', 'like', 'in', 'exists', 'case', 'when', 'then', 'else', 'end', 'primary', 'key', 'foreign',
    'references', 'default', 'constraint', 'unique', 'int', 'varchar', 'text', 'timestamp', 'boolean',
  ]
  const CSS_PROPS = [
    'display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'margin', 'padding', 'color',
    'background', 'background-color', 'border', 'border-radius', 'font', 'font-size', 'font-family',
    'font-weight', 'line-height', 'letter-spacing', 'text-align', 'flex', 'grid', 'gap', 'transform',
    'transition', 'animation', 'opacity', 'overflow', 'z-index', 'box-shadow', 'align-items',
    'justify-content', 'content', 'float', 'clear', 'white-space', 'word-break', 'cursor', 'filter',
    'backdrop-filter', 'object-fit', 'max-width', 'min-height',
  ]

  function classFor(kind) {
    return 'mdw-t-' + kind
  }

  function span(kind, text, palette) {
    const color = palette[kind] === undefined ? palette.fg : palette[kind]
    return '<span class="' + classFor(kind) + '" style="color:' + color + '">' + esc(text) + '</span>'
  }

  function plain(code, palette) {
    return '<span style="color:' + palette.fg + '">' + esc(code) + '</span>'
  }

  function highlightClike(code, palette, lang) {
    const keywords = lang === 'sql' ? SQL : C_LIKE
    const keywordSet = new Set(keywords.map((word) => (lang === 'sql' ? word.toLowerCase() : word)))
    const pattern = new RegExp(
      [
        '(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*|#[^\\n]*)', // 1 comment
        '("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`)', // 2 string
        '\\b(0[xX][0-9a-fA-F]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b', // 3 number
        '\\b([A-Za-z_$][\\w$]*)\\b', // 4 word
        '([{}()\\[\\];,.+\\-*/%=<>!&|^~?:]+)', // 5 operator
      ].join('|'),
      'g'
    )
    let out = ''
    let last = 0
    let match
    while ((match = pattern.exec(code)) !== null) {
      if (match.index > last) out += plain(code.slice(last, match.index), palette)
      last = match.index + match[0].length
      if (match[1] !== undefined) out += span('cm', match[1], palette)
      else if (match[2] !== undefined) out += span('str', match[2], palette)
      else if (match[3] !== undefined) out += span('num', match[3], palette)
      else if (match[5] !== undefined) out += span('op', match[5], palette)
      else {
        const word = match[4]
        const before = code[match.index - 1]
        const after = code[match.index + word.length]
        if (keywordSet.has(lang === 'sql' ? word.toLowerCase() : word)) out += span('kw', word, palette)
        else if (after === '(') out += span('fn', word, palette)
        else if (/^[A-Z]/.test(word) && before !== '.') out += span('type', word, palette)
        else out += plain(word, palette)
      }
    }
    if (last < code.length) out += plain(code.slice(last), palette)
    return out
  }

  function highlightPython(code, palette) {
    const keywordSet = new Set(PY)
    const pattern =
      /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?)\b|(@[A-Za-z_][\w.]*)|\b([A-Za-z_]\w*)\b|([{}()[\];,.+\-*/%=<>!&|^~:]+)/g
    let out = ''
    let last = 0
    let match
    while ((match = pattern.exec(code)) !== null) {
      if (match.index > last) out += plain(code.slice(last, match.index), palette)
      last = match.index + match[0].length
      if (match[1] !== undefined) out += span('cm', match[1], palette)
      else if (match[2] !== undefined) out += span('str', match[2], palette)
      else if (match[3] !== undefined) out += span('num', match[3], palette)
      else if (match[4] !== undefined) out += span('fn', match[4], palette)
      else if (match[5] !== undefined) {
        const word = match[5]
        const after = code[match.index + word.length]
        if (keywordSet.has(word)) out += span('kw', word, palette)
        else if (after === '(') out += span('fn', word, palette)
        else out += plain(word, palette)
      } else out += span('op', match[6], palette)
    }
    if (last < code.length) out += plain(code.slice(last), palette)
    return out
  }

  function highlightJson(code, palette) {
    const pattern = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])/g
    let out = ''
    let last = 0
    let match
    while ((match = pattern.exec(code)) !== null) {
      if (match.index > last) out += plain(code.slice(last, match.index), palette)
      last = match.index + match[0].length
      if (match[1] !== undefined) {
        out += span(match[2] === undefined ? 'str' : 'prop', match[1], palette)
        if (match[2] !== undefined) out += plain(match[2], palette)
      } else if (match[3] !== undefined) out += span('kw', match[3], palette)
      else if (match[4] !== undefined) out += span('num', match[4], palette)
      else out += plain(match[5], palette)
    }
    if (last < code.length) out += plain(code.slice(last), palette)
    return out
  }

  function highlightBash(code, palette) {
    const keywordSet = new Set(BASH)
    const pattern = /(#[^\n]*)|("(?:[^"\\]|\\.)*"|'[^']*')|(\$\{[^}]+\}|\$[A-Za-z_]\w*|\$\d)|\b(\d+)\b|\b([A-Za-z_][\w-]*)\b|([|&;<>(){}[\]]+)/g
    let out = ''
    let last = 0
    let match
    while ((match = pattern.exec(code)) !== null) {
      if (match.index > last) out += plain(code.slice(last, match.index), palette)
      last = match.index + match[0].length
      if (match[1] !== undefined) out += span('cm', match[1], palette)
      else if (match[2] !== undefined) out += span('str', match[2], palette)
      else if (match[3] !== undefined) out += span('prop', match[3], palette)
      else if (match[4] !== undefined) out += span('num', match[4], palette)
      else if (match[5] !== undefined) out += keywordSet.has(match[5]) ? span('kw', match[5], palette) : plain(match[5], palette)
      else out += span('op', match[6], palette)
    }
    if (last < code.length) out += plain(code.slice(last), palette)
    return out
  }

  function highlightMarkup(code, palette) {
    const pattern = /(<!--[\s\S]*?-->)|(<\/?)([A-Za-z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?>)/g
    let out = ''
    let last = 0
    let match
    while ((match = pattern.exec(code)) !== null) {
      if (match.index > last) out += plain(code.slice(last, match.index), palette)
      last = match.index + match[0].length
      if (match[1] !== undefined) {
        out += span('cm', match[1], palette)
        continue
      }
      out += plain(match[2], palette) + span('tag', match[3], palette)
      let attrs = match[4]
      const attrPattern = /([A-Za-z_:][\w:.-]*)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'>]+)?/g
      let attrLast = 0
      let attrMatch
      while ((attrMatch = attrPattern.exec(attrs)) !== null) {
        if (attrMatch.index > attrLast) out += plain(attrs.slice(attrLast, attrMatch.index), palette)
        attrLast = attrMatch.index + attrMatch[0].length
        out += span('attr', attrMatch[1], palette)
        if (attrMatch[2] !== undefined) out += plain(attrMatch[2], palette)
        if (attrMatch[3] !== undefined) out += span('str', attrMatch[3], palette)
      }
      if (attrLast < attrs.length) out += plain(attrs.slice(attrLast), palette)
      out += plain(match[5], palette)
    }
    if (last < code.length) out += plain(code.slice(last), palette)
    return out
  }

  function highlightCss(code, palette) {
    const props = new Set(CSS_PROPS)
    const pattern = /(\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(#[0-9a-fA-F]{3,8}\b)|([A-Za-z-]+)(?=\s*:)|(-?\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg)?)|([{}();:,>+~*]+)/g
    let out = ''
    let last = 0
    let match
    while ((match = pattern.exec(code)) !== null) {
      if (match.index > last) out += plain(code.slice(last, match.index), palette)
      last = match.index + match[0].length
      if (match[1] !== undefined) out += span('cm', match[1], palette)
      else if (match[2] !== undefined) out += span('str', match[2], palette)
      else if (match[3] !== undefined) out += span('num', match[3], palette)
      else if (match[4] !== undefined) out += props.has(match[4]) ? span('prop', match[4], palette) : span('tag', match[4], palette)
      else if (match[5] !== undefined) out += span('num', match[5], palette)
      else out += span('op', match[6], palette)
    }
    if (last < code.length) out += plain(code.slice(last), palette)
    return out
  }

  const ALIASES = {
    js: 'clike', javascript: 'clike', jsx: 'clike', ts: 'clike', typescript: 'clike', tsx: 'clike',
    java: 'clike', c: 'clike', cpp: 'clike', 'c++': 'clike', csharp: 'clike', cs: 'clike', go: 'clike',
    golang: 'clike', rust: 'clike', rs: 'clike', kotlin: 'clike', kt: 'clike', swift: 'clike',
    php: 'clike', scala: 'clike', dart: 'clike', sql: 'clike', json: 'json', jsonc: 'json',
    py: 'python', python: 'python', bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash',
    html: 'markup', xml: 'markup', svg: 'markup', vue: 'markup', css: 'css', scss: 'css', less: 'css',
    md: 'plain', markdown: 'plain', text: 'plain', txt: 'plain', plain: 'plain', yaml: 'plain', yml: 'plain',
    toml: 'plain', ini: 'plain', diff: 'plain', dockerfile: 'plain', makefile: 'plain',
  }

  function highlight(code, lang, themeId) {
    const palette = PALETTES[themeId] === undefined ? PALETTES['github-dark'] : PALETTES[themeId]
    const key = String(lang || '').toLowerCase().trim()
    const family = ALIASES[key] === undefined ? 'plain' : ALIASES[key]
    try {
      if (family === 'clike') return highlightClike(code, palette, key === 'sql' ? 'sql' : 'clike')
      if (family === 'python') return highlightPython(code, palette)
      if (family === 'json') return highlightJson(code, palette)
      if (family === 'bash') return highlightBash(code, palette)
      if (family === 'markup') return highlightMarkup(code, palette)
      if (family === 'css') return highlightCss(code, palette)
    } catch {
      /* 高亮失败不应影响正文 */
    }
    return plain(code, palette)
  }

  function paletteOf(themeId) {
    return PALETTES[themeId] === undefined ? PALETTES['github-dark'] : PALETTES[themeId]
  }

  return { highlight, paletteOf, PALETTES }
})()
