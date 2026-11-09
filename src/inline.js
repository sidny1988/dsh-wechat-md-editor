/**
 * 公众号MD编辑器 · CSS 内联器
 *
 * 公众号编辑器只认元素上的 style，不认 <style> 与 class。复制时把主题 CSS
 * 解析成规则，按「特异性 + 源顺序」叠加到每个元素上，再交给剪贴板。
 *
 * 只支持本项目主题用到的写法：元素选择器、类选择器、后代/子代组合、
 * 逗号分组。伪类/伪元素/媒体查询整条跳过（它们也无法内联）。
 */
const MDW_INLINE = (() => {
  const SKIP_PSEUDO = /::|:(?:hover|active|focus|focus-within|visited|before|after|first-child|last-child|nth-child|nth-of-type|not)\(?/

  function specificity(selector) {
    const text = selector.replace(/\[[^\]]*\]/g, '.attr')
    const ids = (text.match(/#[\w-]+/g) || []).length
    const classes = (text.match(/\.[\w-]+/g) || []).length
    const types = (text.replace(/[#.][\w-]+/g, ' ').match(/\b[a-zA-Z][\w-]*\b/g) || []).length
    return ids * 100 + classes * 10 + types
  }

  function parseDeclarations(body) {
    const declarations = []
    for (const chunk of body.split(';')) {
      const text = chunk.trim()
      if (text === '') continue
      const colon = text.indexOf(':')
      if (colon <= 0) continue
      const prop = text.slice(0, colon).trim()
      let value = text.slice(colon + 1).trim()
      let important = false
      if (/!important$/i.test(value)) {
        important = true
        value = value.replace(/!important$/i, '').trim()
      }
      if (prop === '' || value === '') continue
      declarations.push({ prop, value, important })
    }
    return declarations
  }

  function parse(css) {
    const rules = []
    const source = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '')
    let i = 0
    let order = 0
    while (i < source.length) {
      const open = source.indexOf('{', i)
      if (open === -1) break
      const selectorText = source.slice(i, open).trim()
      let depth = 1
      let j = open + 1
      while (j < source.length && depth > 0) {
        if (source[j] === '{') depth += 1
        else if (source[j] === '}') depth -= 1
        j += 1
      }
      const body = source.slice(open + 1, j - 1)
      i = j
      if (selectorText === '' || selectorText.startsWith('@')) continue
      const declarations = parseDeclarations(body)
      if (declarations.length === 0) continue
      for (const rawSelector of selectorText.split(',')) {
        const selector = rawSelector.trim()
        if (selector === '' || SKIP_PSEUDO.test(selector)) continue
        rules.push({ selector, declarations, spec: specificity(selector), order })
        order += 1
      }
    }
    return rules
  }

  /** 把 cssText 内联到 root（含 root 自身）的每个元素上。 */
  function apply(root, cssText) {
    const rules = parse(cssText)
    if (rules.length === 0 || !root) return root
    const nodes = [root]
    const descendants = root.querySelectorAll('*')
    for (let index = 0; index < descendants.length; index += 1) nodes.push(descendants[index])
    for (const node of nodes) {
      const matched = []
      for (const rule of rules) {
        let hit = false
        try {
          hit = node.matches(rule.selector)
        } catch {
          hit = false
        }
        if (hit) matched.push(rule)
      }
      if (matched.length === 0) continue
      matched.sort((a, b) => a.spec - b.spec || a.order - b.order)
      const merged = new Map()
      for (const rule of matched) {
        for (const declaration of rule.declarations) {
          const existing = merged.get(declaration.prop)
          // 后者覆盖前者；!important 优先
          if (existing !== undefined && existing.important && !declaration.important) continue
          merged.set(declaration.prop, declaration)
        }
      }
      for (const declaration of merged.values()) {
        try {
          node.style.setProperty(declaration.prop, declaration.value, declaration.important ? 'important' : '')
        } catch {
          /* 个别属性浏览器不接受，跳过即可 */
        }
      }
    }
    return root
  }

  /** 生成可直接粘贴到公众号的 HTML（根节点 section，全部样式内联）。 */
  function toWechatHtml(articleHtml, cssText) {
    const section = document.createElement('section')
    section.className = 'mdw-art'
    section.innerHTML = articleHtml
    apply(section, cssText)
    // 相对地址在公众号里无法解析：本机图片转成绝对地址
    const images = section.querySelectorAll('img')
    for (let index = 0; index < images.length; index += 1) {
      const img = images[index]
      const src = img.getAttribute('src') || ''
      if (src.startsWith('/') && typeof location !== 'undefined') img.setAttribute('src', location.origin + src)
      img.removeAttribute('class')
    }
    section.removeAttribute('class')
    return section.outerHTML
  }

  return { apply, parse, toWechatHtml, specificity }
})()
