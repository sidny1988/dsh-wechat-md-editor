/**
 * 公众号MD编辑器 · 富内容渲染（公式 / 图表 / JSX 组件）
 *
 * 兼容策略：
 *   预览 → MathJax 输出 SVG、Mermaid 输出 SVG、组件输出纯内联样式 HTML
 *   复制 → 把 SVG 转成 PNG（<img>），组件保持内联样式；图片可走图床转存
 *
 * 依赖走本地 vendor（/md-workbench/vendor/…），按需加载，不访问 CDN。
 */
const MDW_RICH = (() => {
  const VENDOR = '/md-workbench/vendor/'
  const esc = (value) =>
    String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

  let mathJaxPromise = null
  let mermaidPromise = null
  let qrPromise = null
  let mermaidSeq = 0

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-mdw-vendor="' + url + '"]')
      if (existing !== null) {
        if (existing.getAttribute('data-loaded') === '1') resolve()
        else existing.addEventListener('load', () => resolve())
        return
      }
      const script = document.createElement('script')
      script.src = url
      script.async = true
      script.setAttribute('data-mdw-vendor', url)
      let settled = false
      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        reject(new Error('资源加载超时：' + url))
      }, 20000)
      script.onload = () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        script.setAttribute('data-loaded', '1')
        resolve()
      }
      script.onerror = () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(new Error('资源加载失败：' + url))
      }
      document.head.appendChild(script)
    })
  }

  function ensureMathJax() {
    if (mathJaxPromise !== null) return mathJaxPromise
    mathJaxPromise = (async () => {
      if (typeof window.MathJax === 'undefined') {
        window.MathJax = {
          startup: { typeset: false },
          tex: { inlineMath: [['$', '$']], displayMath: [['$$', '$$']], processEscapes: true },
          svg: { fontCache: 'none', scale: 1 },
          options: { enableMenu: false },
        }
      }
      await loadScript(VENDOR + 'mathjax/tex-svg.js')
      if (window.MathJax.startup !== undefined && window.MathJax.startup.promise !== undefined) await window.MathJax.startup.promise
      return window.MathJax
    })().catch((error) => {
      mathJaxPromise = null
      throw error
    })
    return mathJaxPromise
  }

  function ensureMermaid() {
    if (mermaidPromise !== null) return mermaidPromise
    mermaidPromise = (async () => {
      await loadScript(VENDOR + 'mermaid/mermaid.min.js')
      const mermaid = window.mermaid || (window.__esbuild_esm_mermaid_nm !== undefined ? window.__esbuild_esm_mermaid_nm.mermaid : undefined)
      if (mermaid === undefined) throw new Error('Mermaid 未加载')
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'neutral',
        fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
        flowchart: { htmlLabels: false, useMaxWidth: true, curve: 'basis' },
        sequence: { useMaxWidth: true },
        gantt: { useMaxWidth: true },
      })
      return mermaid
    })().catch((error) => {
      mermaidPromise = null
      throw error
    })
    return mermaidPromise
  }

  function ensureQr() {
    if (qrPromise !== null) return qrPromise
    qrPromise = loadScript(VENDOR + 'qrcode/qrcode.js').then(() => {
      const factory = window.qrcode
      if (typeof factory !== 'function') throw new Error('二维码库未加载')
      return factory
    }).catch((error) => {
      qrPromise = null
      throw error
    })
    return qrPromise
  }

  // ---------------- JSX 组件 ----------------

  const TIP_TONES = {
    info: { bg: '#eff6ff', bar: '#3b82f6', title: '#1d4ed8', text: '#334155' },
    warn: { bg: '#fff7ed', bar: '#f59e0b', title: '#b45309', text: '#4b3620' },
    success: { bg: '#ecfdf5', bar: '#10b981', title: '#047857', text: '#334155' },
    danger: { bg: '#fef2f2', bar: '#ef4444', title: '#b91c1c', text: '#4c1d1d' },
  }

  function hexToRgba(hex, alpha) {
    const text = String(hex || '').replace('#', '')
    const full = text.length === 3 ? text.split('').map((c) => c + c).join('') : text
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return 'rgba(15,76,129,' + alpha + ')'
    const num = parseInt(full, 16)
    return 'rgba(' + ((num >> 16) & 255) + ',' + ((num >> 8) & 255) + ',' + (num & 255) + ',' + alpha + ')'
  }

  function splitList(value) {
    return String(value || '')
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter((item) => item !== '')
  }

  function safeJson(value, fallback) {
    if (Array.isArray(value)) return value
    try {
      const parsed = JSON.parse(String(value || ''))
      return Array.isArray(parsed) ? parsed : fallback
    } catch {
      return fallback
    }
  }

  function renderComponent(name, props) {
    const p = props !== null && typeof props === 'object' ? props : {}
    if (name === 'TipBlock') {
      const tone = TIP_TONES[p.type] === undefined ? TIP_TONES.info : TIP_TONES[p.type]
      return (
        '<section style="margin:16px 0;padding:13px 16px;border-radius:10px;background:' + tone.bg + ';border-left:3px solid ' + tone.bar + ';">' +
        (p.title === undefined || p.title === ''
          ? ''
          : '<p style="margin:0 0 4px;font-size:14px;font-weight:700;line-height:1.6;color:' + tone.title + ';">' + esc(p.title) + '</p>') +
        '<p style="margin:0;font-size:14px;line-height:1.85;color:' + tone.text + ';">' + esc(p.text) + '</p></section>'
      )
    }
    if (name === 'QRCodeBlock') {
      const size = Math.min(400, Math.max(80, Number(p.size) || 150))
      return (
        '<section style="margin:18px 0;text-align:center;">' +
        '<img data-qr="' + esc(p.url) + '" alt="' + esc(p.text || '二维码') + '" style="width:' + size + 'px;height:' + size + 'px;display:inline-block;border:0;" />' +
        (p.text === undefined || p.text === ''
          ? ''
          : '<p style="margin:8px 0 0;font-size:12px;line-height:1.6;color:#8a8a8a;">' + esc(p.text) + '</p>') +
        '</section>'
      )
    }
    if (name === 'AuthorBlock') {
      return (
        '<section style="margin:18px 0;padding:14px 16px;border:1px solid #ececec;border-radius:12px;background:#fafafa;overflow:hidden;">' +
        (p.avatar === undefined || p.avatar === ''
          ? ''
          : '<img src="' + esc(p.avatar) + '" alt="" style="float:left;width:46px;height:46px;border-radius:50%;margin-right:12px;object-fit:cover;" />') +
        '<p style="margin:0;font-size:15px;font-weight:700;line-height:1.5;color:#222;">' + esc(p.name) + '</p>' +
        '<p style="margin:4px 0 0;font-size:13px;line-height:1.7;color:#777;">' + esc(p.intro) + '</p></section>'
      )
    }
    if (name === 'MpProfile') {
      const qr = p.qr === undefined || p.qr === ''
        ? ''
        : '<img src="' + esc(p.qr) + '" alt="公众号二维码" style="float:right;width:64px;height:64px;margin-left:12px;border-radius:6px;" />'
      return (
        '<section style="margin:18px 0;padding:16px;border:1px solid #e8e8e8;border-radius:12px;background:#fff;overflow:hidden;">' +
        qr +
        (p.avatar === undefined || p.avatar === ''
          ? ''
          : '<img src="' + esc(p.avatar) + '" alt="" style="float:left;width:44px;height:44px;border-radius:50%;margin-right:12px;object-fit:cover;" />') +
        '<p style="margin:0;font-size:15px;font-weight:700;line-height:1.5;color:#1a1a1a;">' + esc(p.name || '公众号名称') + '</p>' +
        (p.id === undefined || p.id === ''
          ? ''
          : '<p style="margin:2px 0 0;font-size:12px;line-height:1.6;color:#999;">微信号：' + esc(p.id) + '</p>') +
        (p.intro === undefined || p.intro === ''
          ? ''
          : '<p style="margin:6px 0 0;font-size:13px;line-height:1.7;color:#666;">' + esc(p.intro) + '</p>') +
        '</section>'
      )
    }
    if (name === 'TableBlock') {
      const header = splitList(p.header)
      const rows = safeJson(p.rows, [])
      const zebra = p.zebra === true || p.zebra === 'true'
      let html = '<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">'
      if (header.length > 0) {
        html += '<thead><tr>'
        for (const cell of header) {
          html += '<th style="border:1px solid #e2e2e2;background:#f5f7fa;padding:8px 10px;font-weight:700;color:#333;text-align:left;">' + esc(cell) + '</th>'
        }
        html += '</tr></thead>'
      }
      html += '<tbody>'
      rows.forEach((row, index) => {
        const cells = Array.isArray(row) ? row : [row]
        html += '<tr' + (zebra && index % 2 === 1 ? ' style="background:#fafbfc;"' : '') + '>'
        for (let c = 0; c < Math.max(cells.length, header.length, 1); c += 1) {
          html += '<td style="border:1px solid #e2e2e2;padding:8px 10px;color:#444;line-height:1.7;">' + esc(cells[c] === undefined ? '' : cells[c]) + '</td>'
        }
        html += '</tr>'
      })
      html += '</tbody></table>'
      return html
    }
    if (name === 'InfoGrid') {
      const items = safeJson(p.items, [])
      const pairs = items.map((item) => (Array.isArray(item) ? { k: item[0], v: item[1] } : { k: item.k, v: item.v }))
      const perRow = Math.max(1, Math.min(4, Number(p.columns) || 2))
      let html = '<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;"><tbody>'
      for (let index = 0; index < pairs.length; index += perRow) {
        html += '<tr>'
        for (let c = 0; c < perRow; c += 1) {
          const item = pairs[index + c]
          html += '<td style="border:1px solid #ececec;padding:10px 12px;width:' + Math.round(100 / perRow) + '%;">' +
            (item === undefined
              ? ''
              : '<span style="display:block;font-size:12px;color:#999;margin-bottom:2px;">' + esc(item.k) + '</span><span style="font-size:15px;font-weight:600;color:#222;">' + esc(item.v) + '</span>') +
            '</td>'
        }
        html += '</tr>'
      }
      html += '</tbody></table>'
      return html
    }
    if (name === 'BadgeGroup') {
      const color = /^#[0-9a-fA-F]{3,6}$/.test(String(p.color || '')) ? p.color : '#0F4C81'
      const items = splitList(p.items)
      return (
        '<section style="margin:14px 0;">' +
        items.map((item) =>
          '<span style="display:inline-block;margin:0 8px 8px 0;padding:3px 10px;border-radius:999px;background:' + hexToRgba(color, 0.1) + ';color:' + color + ';font-size:12px;line-height:1.8;">' + esc(item) + '</span>'
        ).join('') +
        '</section>'
      )
    }
    return '<section style="margin:16px 0;padding:12px;border:1px dashed #ddd;border-radius:8px;color:#999;font-size:12px;">未知组件：' + esc(name) + '</section>'
  }

  const COMPONENT_SCHEMAS = [
    {
      name: 'TipBlock', label: '提示框', desc: '高亮一段小贴士或注意事项',
      fields: [
        { key: 'type', label: '类型', type: 'select', options: [['info', '信息'], ['warn', '提醒'], ['success', '成功'], ['danger', '警示']], value: 'info' },
        { key: 'title', label: '标题', type: 'text', value: '小提示' },
        { key: 'text', label: '正文', type: 'textarea', value: '这里写要强调的内容。' },
      ],
    },
    {
      name: 'QRCodeBlock', label: '二维码', desc: '把 URL 渲染为可扫描的二维码',
      fields: [
        { key: 'url', label: '链接', type: 'text', value: 'https://md.doocs.org' },
        { key: 'text', label: '说明', type: 'text', value: '扫码访问' },
        { key: 'size', label: '尺寸(px)', type: 'text', value: '150' },
      ],
    },
    {
      name: 'AuthorBlock', label: '作者卡', desc: '展示头像、名称与简介',
      fields: [
        { key: 'name', label: '名称', type: 'text', value: '你的名字' },
        { key: 'avatar', label: '头像 URL', type: 'text', value: '' },
        { key: 'intro', label: '简介', type: 'textarea', value: '一句话介绍自己。' },
      ],
    },
    {
      name: 'MpProfile', label: '公众号名片', desc: '公众号头像、名称、微信号与二维码',
      fields: [
        { key: 'name', label: '公众号', type: 'text', value: '你的公众号' },
        { key: 'id', label: '微信号', type: 'text', value: '' },
        { key: 'avatar', label: '头像 URL', type: 'text', value: '' },
        { key: 'intro', label: '简介', type: 'text', value: '' },
        { key: 'qr', label: '二维码 URL', type: 'text', value: '' },
      ],
    },
    {
      name: 'TableBlock', label: '数据表格', desc: '用 JSON 数组生成带斑马纹的表格',
      fields: [
        { key: 'header', label: '表头', type: 'text', value: '项目,数值' },
        { key: 'rows', label: '数据(JSON)', type: 'textarea', value: '[["主题","12 套"],["代码配色","6 套"]]' },
        { key: 'zebra', label: '斑马纹', type: 'bool', value: true },
      ],
    },
    {
      name: 'InfoGrid', label: '信息网格', desc: '多列展示键值对',
      fields: [
        { key: 'items', label: '条目(JSON)', type: 'textarea', value: '[{"k":"作者","v":"你的名字"},{"k":"版本","v":"1.0"}]' },
        { key: 'columns', label: '列数', type: 'text', value: '2' },
      ],
    },
    {
      name: 'BadgeGroup', label: '标签组', desc: '一组彩色标签',
      fields: [
        { key: 'items', label: '标签', type: 'text', value: '公众号,排版,Markdown' },
        { key: 'color', label: '主色', type: 'text', value: '#0F4C81' },
      ],
    },
  ]

  function buildComponentTag(name, values) {
    const schema = COMPONENT_SCHEMAS.filter((item) => item.name === name)[0]
    if (schema === undefined) return '<' + name + ' />'
    const parts = []
    for (const field of schema.fields) {
      const raw = values[field.key]
      if (raw === undefined || raw === null || raw === '') continue
      if (field.type === 'bool') {
        parts.push(field.key + '={' + (raw === true ? 'true' : 'false') + '}')
      } else if (field.key === 'rows' || field.key === 'items') {
        const parsed = safeJson(raw, null)
        if (parsed !== null) parts.push(field.key + '={' + JSON.stringify(parsed) + '}')
      } else {
        parts.push(field.key + '="' + String(raw).replace(/"/g, '&quot;') + '"')
      }
    }
    return '<' + name + (parts.length === 0 ? '' : ' ' + parts.join(' ')) + ' />'
  }

  // ---------------- 缓存与计时 ----------------
  // 预览会在每次输入后重建 DOM，若每次都重跑 Mermaid/MathJax，打字就会明显发卡。
  // 这里按「内容哈希」缓存渲染结果，并在同一份内容上共享进行中的渲染 Promise。

  const CACHE_LIMIT = 60
  const svgCache = new Map()
  const mathCache = new Map()
  const qrCache = new Map()
  const pendingRender = new Map()
  const DEBUG = typeof location !== 'undefined' && String(location.search).indexOf('mdwdebug=1') !== -1
  let cacheEnabled = true
  const STATS = { mermaidRender: 0, mermaidHit: 0, mermaidMs: 0, mathRender: 0, mathHit: 0, qrRender: 0, qrHit: 0 }
  if (DEBUG) window.__MDW_PERF__ = STATS

  function now() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now()
  }

  function cacheHash(value) {
    let hash = 2166136261
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }
    return (hash >>> 0).toString(36)
  }

  function cacheGet(map, key) {
    if (!cacheEnabled) return undefined
    const value = map.get(key)
    if (value === undefined) return undefined
    // 命中后移到队尾，简单的 LRU
    map.delete(key)
    map.set(key, value)
    return value
  }

  function cacheSet(map, key, value) {
    if (!cacheEnabled) return
    map.set(key, value)
    if (map.size > CACHE_LIMIT) map.delete(map.keys().next().value)
  }

  function decorateMermaid(svgText) {
    const holder = document.createElement('div')
    holder.innerHTML = svgText
    const svg = holder.querySelector('svg')
    if (svg !== null) {
      svg.removeAttribute('height')
      svg.setAttribute('style', 'max-width:100%;height:auto;')
    }
    return holder.innerHTML
  }

  async function renderMermaidSvg(code) {
    const key = 'm:' + cacheHash(code)
    const cached = cacheGet(svgCache, key)
    if (cached !== undefined) {
      if (cached.indexOf('__ERR__') === 0) throw new Error(cached.slice(7))
      STATS.mermaidHit += 1
      return cached
    }
    const running = pendingRender.get(key)
    if (running !== undefined) return running
    const task = (async () => {
      const mermaid = await ensureMermaid()
      mermaidSeq += 1
      const id = 'mdw-mermaid-' + Date.now().toString(36) + '-' + mermaidSeq
      const started = now()
      try {
        const result = await mermaid.render(id, code)
        const html = decorateMermaid(result.svg)
        STATS.mermaidRender += 1
        STATS.mermaidMs += now() - started
        cacheSet(svgCache, key, html)
        return html
      } catch (error) {
        const message = error !== null && error !== undefined && error.message !== undefined ? error.message : String(error)
        STATS.mermaidRender += 1
        STATS.mermaidMs += now() - started
        // 缓存失败结果，避免错误语法在每次输入时反复重排
        cacheSet(svgCache, key, '__ERR__' + message)
        throw new Error(message)
      } finally {
        const temp = document.getElementById(id)
        if (temp !== null && temp.parentNode !== null) temp.parentNode.removeChild(temp)
      }
    })().finally(() => {
      pendingRender.delete(key)
    })
    pendingRender.set(key, task)
    return task
  }

  async function renderMathHtml(tex, display) {
    const key = (display ? 'md:' : 'mi:') + cacheHash(tex)
    const cached = cacheGet(mathCache, key)
    if (cached !== undefined) {
      STATS.mathHit += 1
      return cached
    }
    const MathJax = await ensureMathJax()
    const container = MathJax.tex2svg(tex, { display })
    const holder = document.createElement('div')
    holder.appendChild(container)
    const html = holder.innerHTML
    STATS.mathRender += 1
    cacheSet(mathCache, key, html)
    return html
  }

  async function renderQrDataUrl(text) {
    const key = 'q:' + cacheHash(text)
    const cached = cacheGet(qrCache, key)
    if (cached !== undefined) {
      STATS.qrHit += 1
      return cached
    }
    const qrcode = await ensureQr()
    const qr = qrcode(0, 'M')
    qr.addData(text)
    qr.make()
    const url = qr.createDataURL(4, 8)
    STATS.qrRender += 1
    cacheSet(qrCache, key, url)
    return url
  }

  // ---------------- 水合 ----------------

  async function hydrate(root) {
    if (root === null || root === undefined) return

    const mathNodes = Array.from(root.querySelectorAll('.mdw-math:not([data-done])'))
    for (const node of mathNodes) node.setAttribute('data-done', 'pending')
    for (const node of mathNodes) {
      const tex = node.getAttribute('data-tex') || ''
      const display = node.getAttribute('data-display') === '1'
      try {
        const html = await renderMathHtml(tex, display)
        if (!node.isConnected) continue
        node.innerHTML = html
        node.setAttribute('data-done', '1')
        node.setAttribute('data-graphic', '1')
        if (display) node.setAttribute('style', 'display:block;text-align:center;margin:14px 0;overflow-x:auto;')
      } catch {
        node.textContent = tex
        node.setAttribute('data-done', '1')
        node.setAttribute('data-error', '1')
      }
    }

    const mermaidNodes = Array.from(root.querySelectorAll('.mdw-mermaid:not([data-done])'))
    for (const node of mermaidNodes) node.setAttribute('data-done', 'pending')
    for (const node of mermaidNodes) {
      const code = node.getAttribute('data-code') || ''
      try {
        const html = await renderMermaidSvg(code)
        if (!node.isConnected) continue
        node.innerHTML = html
        node.setAttribute('data-done', '1')
        node.setAttribute('data-graphic', '1')
        node.setAttribute('style', 'margin:16px 0;text-align:center;')
      } catch (error) {
        if (!node.isConnected) continue
        node.textContent = '图表渲染失败：' + (error.message === undefined ? error : error.message)
        node.setAttribute('data-done', '1')
        node.setAttribute('data-error', '1')
      }
    }

    const components = Array.from(root.querySelectorAll('.mdw-component:not([data-done])'))
    for (const node of components) {
      const name = node.getAttribute('data-name') || ''
      let props = {}
      try {
        props = JSON.parse(node.getAttribute('data-props') || '{}')
      } catch {
        props = {}
      }
      node.innerHTML = renderComponent(name, props)
      node.setAttribute('data-done', '1')
      node.setAttribute('style', 'display:block;')
    }

    const qrImages = Array.from(root.querySelectorAll('img[data-qr]:not([data-done])'))
    for (const img of qrImages) img.setAttribute('data-done', 'pending')
    for (const img of qrImages) {
      try {
        const url = await renderQrDataUrl(img.getAttribute('data-qr') || '')
        if (!img.isConnected) continue
        img.setAttribute('src', url)
        img.setAttribute('data-done', '1')
      } catch {
        if (!img.isConnected) continue
        img.setAttribute('alt', '二维码内容无效')
        img.setAttribute('data-done', '1')
      }
    }
  }

  // ---------------- SVG → PNG ----------------

  function measure(svg) {
    let width = 0
    let height = 0
    try {
      const box = svg.getBoundingClientRect()
      width = box.width
      height = box.height
    } catch {
      /* detached */
    }
    if (!(width > 0)) {
      const attr = parseFloat(svg.getAttribute('width') || '')
      if (Number.isFinite(attr)) width = attr
    }
    if (!(height > 0)) {
      const attr = parseFloat(svg.getAttribute('height') || '')
      if (Number.isFinite(attr)) height = attr
    }
    if (!(width > 0)) width = 560
    if (!(height > 0)) height = 320
    return { width, height }
  }

  function svgToPng(svg, scale) {
    return new Promise((resolve, reject) => {
      const { width, height } = measure(svg)
      const clone = svg.cloneNode(true)
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clone.setAttribute('width', String(width))
      clone.setAttribute('height', String(height))
      const xml = new XMLSerializer().serializeToString(clone)
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)
      const image = new Image()
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.round(width * scale))
          canvas.height = Math.max(1, Math.round(height * scale))
          const context = canvas.getContext('2d')
          if (context === null) throw new Error('canvas 不可用')
          context.fillStyle = '#ffffff'
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          resolve({ dataUrl: canvas.toDataURL('image/png'), width, height })
        } catch (error) {
          reject(error)
        }
      }
      image.onerror = () => reject(new Error('SVG 转 PNG 失败'))
      image.src = url
    })
  }

  // ---------------- 复制产物 ----------------

  async function uploadDataImages(root, settings) {
    if (['github', 'cloudinary', 'custom'].indexOf(settings.imageProvider) === -1) return 0
    let uploaded = 0
    const images = Array.from(root.querySelectorAll('img'))
    for (const img of images) {
      const src = img.getAttribute('src') || ''
      const isData = src.startsWith('data:image/')
      const isLocal = src.startsWith('/md-workbench/image/')
      if (!isData && !isLocal) continue
      try {
        const blob = await (await fetch(src)).blob()
        const url = await mdwUploadToProvider(blob, isLocal ? src.split('/').pop() : 'graphic.png', settings)
        img.setAttribute('src', url)
        uploaded += 1
      } catch {
        /* 单张失败保留原地址 */
      }
    }
    return uploaded
  }

  async function materialize(html, css, settings) {
    const holder = document.createElement('div')
    holder.className = 'mdw-art'
    holder.setAttribute('style', 'position:fixed;left:-10000px;top:0;width:677px;visibility:hidden;')
    holder.innerHTML = html
    document.body.appendChild(holder)
    try {
      await hydrate(holder)
      let graphics = 0
      const nodes = Array.from(holder.querySelectorAll('[data-graphic]'))
      for (const node of nodes) {
        const svg = node.querySelector('svg')
        if (svg === null) continue
        try {
          const png = await svgToPng(svg, 2)
          const isInline = node.classList.contains('mdw-math') && node.getAttribute('data-display') === '0'
          node.innerHTML =
            '<img src="' + png.dataUrl + '" alt="' + esc(node.textContent.slice(0, 40)) + '" style="' +
            (isInline
              ? 'display:inline-block;vertical-align:-0.25em;max-width:100%;'
              : 'display:block;margin:14px auto;max-width:100%;') +
            'width:' + Math.round(png.width) + 'px;height:auto;" />'
          node.removeAttribute('data-graphic')
          node.removeAttribute('class')
          node.setAttribute('style', isInline ? 'display:inline-block;' : 'display:block;text-align:center;')
          graphics += 1
        } catch {
          /* 转换失败保留 SVG，预览仍可读 */
        }
      }
      const uploaded = await uploadDataImages(holder, settings)
      // MathJax 的无障碍 MathML 副本对公众号无意义，且可能被渲染出来
      for (const mml of Array.from(holder.querySelectorAll('mjx-assistive-mml'))) mml.remove()
      MDW_INLINE.apply(holder, css)
      const all = Array.from(holder.querySelectorAll('*'))
      for (const element of all) {
        element.removeAttribute('class')
        element.removeAttribute('data-done')
        element.removeAttribute('data-qr')
        element.removeAttribute('data-props')
        element.removeAttribute('data-display')
        element.removeAttribute('data-tex')
        element.removeAttribute('data-code')
        element.removeAttribute('data-name')
      }
      holder.removeAttribute('class')
      const images = Array.from(holder.querySelectorAll('img'))
      for (const img of images) {
        const src = img.getAttribute('src') || ''
        if (src.startsWith('/') && typeof location !== 'undefined') img.setAttribute('src', location.origin + src)
      }
      return { html: holder.outerHTML, graphics, uploaded }
    } finally {
      holder.remove()
    }
  }

  return {
    hydrate,
    materialize,
    svgToPng,
    COMPONENT_SCHEMAS,
    buildComponentTag,
    renderComponent,
    setCache: (enabled) => {
      cacheEnabled = enabled !== false
      if (!cacheEnabled) {
        svgCache.clear()
        mathCache.clear()
        qrCache.clear()
      }
    },
    prefetch: (kind) => {
      if (kind === 'mermaid') ensureMermaid().catch(() => {})
      else if (kind === 'math') ensureMathJax().catch(() => {})
      else if (kind === 'qr') ensureQr().catch(() => {})
    },
    perf: () => ({ ...STATS }),
  }
})()
