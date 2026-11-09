/**
 * 公众号MD编辑器 · 发布前检查
 *
 * 只做「能在本地确定」的检查：代码块/公式闭合、空链接、外链、图片可访问性、
 * 标题层级、超长段落、表格列数、文章长度。不联网，也不判断内容合规。
 */
function mdwPublishCheck(markdown, settings, article) {
  const source = String(markdown === null || markdown === undefined ? '' : markdown)
  const lines = source.split('\n')
  const issues = []
  const lineOf = (index) => source.slice(0, index).split('\n').length
  const push = (level, title, detail, line) => {
    issues.push({ level, title, detail, line: Number(line) || 0 })
  }

  if (source.trim() === '') {
    push('info', '正文还是空的', '左侧写点内容，预览和检查会同步更新。')
    return issues
  }

  // 代码块闭合
  let inFence = false
  let fenceLine = 0
  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      if (!inFence) {
        inFence = true
        fenceLine = index + 1
      } else {
        inFence = false
      }
    }
  })
  if (inFence) push('error', '代码块没有闭合', '第 ' + fenceLine + ' 行开始的 ``` 缺少结尾，复制后代码样式会错乱。', fenceLine)

  // 块级公式闭合
  const displayMath = (source.match(/\$\$/g) || []).length
  if (displayMath % 2 === 1) push('warn', '块级公式没有闭合', '$$ 数量是奇数，检查是否漏了结尾。')

  // 标题层级（跳过代码块）
  let fenceOpen = false
  let lastLevel = 0
  let h1Count = 0
  let headingCount = 0
  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      fenceOpen = !fenceOpen
      return
    }
    if (fenceOpen) return
    const match = /^(#{1,6})\s*(.*)$/.exec(line)
    if (match === null) return
    const level = match[1].length
    const text = match[2].trim()
    headingCount += 1
    if (text === '') push('warn', '空标题', '第 ' + (index + 1) + ' 行的标题没有文字。', index + 1)
    if (lastLevel > 0 && level > lastLevel + 1) {
      push('info', '标题层级跳跃', '从 H' + lastLevel + ' 直接跳到 H' + level + '，公众号目录会断层。', index + 1)
    }
    if (level === 1) h1Count += 1
    lastLevel = level
  })
  if (headingCount === 0) push('info', '没有小标题', '长文建议用二级标题分段，读者更容易扫读。')
  if (h1Count > 1) push('info', '多个一级标题', '一篇文章通常只保留一个 H1，其余可以降为 H2。')

  // 把代码块内容抹成空格，保留行号，避免代码里的链接被误判
  const masked = source.replace(/```[\s\S]*?```/g, (block) => block.replace(/[^\n]/g, ' '))
  // 图片语法本身也带 []()，扫描链接前先抹掉，避免把图片误报成外链
  const maskedLinks = masked.replace(/!\[[^\]]*\]\([^)]*\)/g, (block) => block.replace(/[^\n]/g, ' '))

  // 空链接 / 外链
  const externalLinks = []
  const linkPattern = /\[([^\]]*)\]\(([^)\s]*)(?:\s+"[^"]*")?\)/g
  let linkMatch = linkPattern.exec(maskedLinks)
  while (linkMatch !== null) {
    const label = linkMatch[1].trim()
    const href = linkMatch[2].trim()
    const line = lineOf(linkMatch.index)
    if (href === '' || label === '') push('warn', '空链接', '第 ' + line + ' 行的链接缺少文字或地址。', line)
    else if (/^https?:\/\//i.test(href)) externalLinks.push({ line, href })
    linkMatch = linkPattern.exec(maskedLinks)
  }
  if (externalLinks.length > 0 && settings.linkRefs === false) {
    push(
      'warn',
      '外链在公众号里不可点击',
      '检测到 ' + externalLinks.length + ' 个 http 链接。开启「外链转脚注」后，正文保留上标序号，文末自动汇总地址。',
      externalLinks[0].line
    )
  }

  // 图片
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)/g
  let imageMatch = imagePattern.exec(masked)
  while (imageMatch !== null) {
    const src = imageMatch[2].trim()
    const line = lineOf(imageMatch.index)
    if (src.startsWith('data:')) {
      push('info', '内嵌图片体积较大', '第 ' + line + ' 行是 base64 图片，正文会变长；建议改用图床。', line)
    } else if (src.indexOf('/md-workbench/image/') !== -1 && settings.imageProvider === 'local') {
      push('warn', '本地图片在公众号可能不显示', '第 ' + line + ' 行是本地图片；复制前请在设置里配置图床，或选择「base64 内嵌」。', line)
    } else if (/^http:\/\//i.test(src)) {
      push('warn', 'HTTP 图片可能被拦截', '第 ' + line + ' 行是 http 图片，公众号要求 HTTPS 图片。', line)
    }
    imageMatch = imagePattern.exec(masked)
  }

  // 超长段落（按空行分块，跳过标题 / 列表 / 引用 / 表格 / 代码）
  let blockLines = []
  let blockStart = 0
  const flushBlock = () => {
    if (blockLines.length === 0) return
    const first = blockLines[0].trim()
    const text = blockLines.join(' ').replace(/\s+/g, ' ').trim()
    const special = /^(#{1,6}\s|[-*+]\s|\d+\.\s|>|\||<)/.test(first)
    if (!special && text.length > 600) {
      push('info', '段落偏长', '第 ' + blockStart + ' 行起的段落约 ' + text.length + ' 字，建议拆成 2–3 段。', blockStart)
    }
    blockLines = []
  }
  lines.forEach((line, index) => {
    if (line.trim() === '') {
      flushBlock()
      return
    }
    if (blockLines.length === 0) blockStart = index + 1
    blockLines.push(line)
  })
  flushBlock()

  // 表格列数
  let inTable = false
  let tableWidth = 0
  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) {
      inTable = false
      tableWidth = 0
      return
    }
    const columns = trimmed.split('|').length - 2
    if (!inTable) {
      inTable = true
      tableWidth = columns
      return
    }
    if (/^\|?[\s:|-]+\|?$/.test(trimmed)) return
    if (columns !== tableWidth) {
      push('warn', '表格列数不一致', '第 ' + (index + 1) + ' 行有 ' + columns + ' 列，表头是 ' + tableWidth + ' 列。', index + 1)
      tableWidth = columns
    }
  })

  // 长度
  const length = source.replace(/\s/g, '').length
  if (length > 20000) {
    push('warn', '文章偏长', '去掉空白后约 ' + length + ' 字，接近公众号编辑器的长度上限，建议拆分发布。')
  }

  const rank = { error: 0, warn: 1, info: 2 }
  return issues.sort((a, b) => rank[a.level] - rank[b.level] || a.line - b.line)
}
