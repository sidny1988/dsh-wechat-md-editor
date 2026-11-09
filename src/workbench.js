/**
 * 公众号MD编辑器 · 工作台主组件
 *
 * 三栏：草稿/大纲 · 编辑器 · 公众号预览。所有排版样式由 MDW_THEMES 生成，
 * 「复制到公众号」时用 MDW_INLINE 把同一份 CSS 内联进 HTML，保证所见即所得。
 */
const MDW_API = '/md-workbench'

async function mdwRequest(path, options) {
  const init = Object.assign({ credentials: 'same-origin', headers: { accept: 'application/json' } }, options || {})
  if (init.body !== undefined && typeof init.body !== 'string') {
    init.body = JSON.stringify(init.body)
    init.headers = Object.assign({}, init.headers, { 'content-type': 'application/json' })
  }
  const response = await fetch(MDW_API + path, init)
  let payload = {}
  try {
    payload = await response.json()
  } catch {
    payload = {}
  }
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error === undefined ? '请求失败（' + response.status + '）' : payload.error)
  }
  return payload
}

function mdwRelative(ts) {
  if (typeof ts !== 'number' || ts <= 0) return ''
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前'
  const date = new Date(ts)
  const now = new Date()
  if (date.getFullYear() === now.getFullYear()) return date.getMonth() + 1 + ' 月 ' + date.getDate() + ' 日'
  return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate()
}

function mdwClock(ts) {
  if (typeof ts !== 'number' || ts <= 0) return ''
  const date = new Date(ts)
  const pad = (value) => String(value).padStart(2, '0')
  return pad(date.getHours()) + ':' + pad(date.getMinutes())
}

function mdwDownload(name, text, type) {
  const blob = new Blob([text], { type: type === undefined ? 'text/plain;charset=utf-8' : type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function mdwSlug(text) {
  const clean = String(text || '未命名').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim()
  return clean === '' ? '未命名' : clean.slice(0, 60)
}

/** 一键整理：统一标题空格、块间空行、列表符号，去掉行尾空格与多余空行。 */
function mdwTidy(source) {
  let text = String(source || '').replace(/\r\n?/g, '\n')
  text = text.replace(/[ \t]+$/gm, '')
  text = text.replace(/^(#{1,6})([^#\s])/gm, '$1 $2')
  text = text.replace(/^([ \t]*)[*+]\s+/gm, '$1- ')
  text = text.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')
  text = text.replace(/(^#{1,6}\s[^\n]*)\n([^\n#])/gm, '$1\n\n$2')
  text = text.replace(/([^\n])\n(```)/g, '$1\n\n$2')
  text = text.replace(/(```[^\n]*\n[\s\S]*?\n```)\n([^\n])/g, '$1\n\n$2')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.replace(/^\n+/, '').replace(/\s+$/, '\n')
}

/** 图片压缩：长边 ≤1600，PNG 保留透明，其余转 JPEG。 */
function mdwCompressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      const image = new Image()
      image.onerror = () => reject(new Error('无法解析图片'))
      image.onload = () => {
        const maxEdge = 1600
        const ratio = Math.min(1, maxEdge / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * ratio))
        const height = Math.max(1, Math.round(image.height * ratio))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (context === null) {
          resolve({ dataUrl, name: file.name || 'image.png' })
          return
        }
        const keepAlpha = /png|webp|gif/i.test(file.type)
        if (!keepAlpha) {
          context.fillStyle = '#ffffff'
          context.fillRect(0, 0, width, height)
        }
        context.drawImage(image, 0, 0, width, height)
        const mime = keepAlpha ? 'image/png' : 'image/jpeg'
        const quality = keepAlpha ? undefined : 0.88
        resolve({ dataUrl: canvas.toDataURL(mime, quality), name: file.name || 'image.png' })
      }
      image.src = dataUrl
    }
    reader.readAsDataURL(file)
  })
}

function mwReadPath(object, path) {
  const parts = String(path || '').split('.').filter((part) => part !== '')
  let current = object
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = current[part]
  }
  return current
}

function mdwBlobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.onload = () => resolve(String(reader.result || '').replace(/^data:[^,]*,/, ''))
    reader.readAsDataURL(blob)
  })
}

function mdwImageName(blob, hint) {
  const type = blob.type || 'image/png'
  const ext = type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png'
  const rand = Math.random().toString(36).slice(2, 8)
  const stem = String(hint || '').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-').slice(0, 24)
  return 'mdw-' + Date.now().toString(36) + '-' + rand + (stem === '' || stem === '-' ? '' : '-' + stem) + '.' + ext
}

/** 把图片上传到设置里选定的图床，返回公网 URL；本地/内嵌模式由调用方处理。 */
async function mdwUploadToProvider(blob, hint, settings) {
  const provider = settings.imageProvider
  const filename = mdwImageName(blob, hint)
  if (provider === 'github') {
    const repo = String(settings.githubRepo || '').trim()
    if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) throw new Error('GitHub 仓库要写成 owner/repo')
    const token = String(settings.githubToken || '').trim()
    if (token === '') throw new Error('缺少 GitHub Token')
    const branch = String(settings.githubBranch || 'main').trim() || 'main'
    const dir = String(settings.githubPath || '').replace(/^\/+|\/+$/g, '')
    const path = dir === '' ? filename : dir + '/' + filename
    const content = await mdwBlobToBase64(blob)
    const response = await fetch('https://api.github.com/repos/' + repo + '/contents/' + path, {
      method: 'PUT',
      headers: {
        authorization: 'Bearer ' + token,
        accept: 'application/vnd.github+json',
        'content-type': 'application/json',
        'x-github-api-version': '2022-11-28',
      },
      body: JSON.stringify({ message: 'md-workbench: ' + filename, content, branch }),
    })
    if (!response.ok) throw new Error('GitHub 上传失败（' + response.status + '），检查仓库、Token 与分支权限')
    return 'https://cdn.jsdelivr.net/gh/' + repo + '@' + branch + '/' + path
  }
  if (provider === 'cloudinary') {
    const cloud = String(settings.cloudName || '').trim()
    const preset = String(settings.cloudPreset || '').trim()
    if (cloud === '') throw new Error('请填写 Cloudinary 的 Cloud name')
    if (preset === '') throw new Error('请填写 unsigned upload preset')
    const form = new FormData()
    form.append('file', blob, filename)
    form.append('upload_preset', preset)
    const response = await fetch('https://api.cloudinary.com/v1_1/' + cloud + '/image/upload', { method: 'POST', body: form })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || typeof payload.secure_url !== 'string') {
      throw new Error('Cloudinary 上传失败（' + response.status + '），检查 preset 是否为 unsigned')
    }
    return payload.secure_url
  }
  // custom
  if (String(settings.uploadUrl || '').trim() === '') throw new Error('尚未配置图床上传接口')
  const form = new FormData()
  form.append(settings.uploadField || 'file', blob, filename)
  let headers = {}
  if (String(settings.uploadHeaders || '').trim() !== '') {
    try {
      headers = JSON.parse(settings.uploadHeaders)
    } catch {
      throw new Error('Headers 不是合法 JSON')
    }
  }
  const response = await fetch(settings.uploadUrl, { method: 'POST', body: form, headers })
  if (!response.ok) throw new Error('图床返回 ' + response.status)
  const payload = await response.json()
  const picked = mwReadPath(payload, settings.uploadPath)
  if (typeof picked !== 'string' || picked === '') throw new Error('图床返回里找不到 ' + settings.uploadPath)
  return picked
}

function mwFallbackCopy(html) {
  const holder = document.createElement('div')
  holder.contentEditable = 'true'
  holder.innerHTML = html
  holder.style.position = 'fixed'
  holder.style.left = '-9999px'
  holder.style.top = '0'
  document.body.appendChild(holder)
  const range = document.createRange()
  range.selectNodeContents(holder)
  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  selection.removeAllRanges()
  holder.remove()
  return ok
}

function Workbench(props) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saveState, setSaveState] = useState('ok')
  const [savedAt, setSavedAt] = useState(0)
  const [railOpen, setRailOpen] = useState(true)
  const [compactRail, setCompactRail] = useState(false)
  const [hostAccent, setHostAccent] = useState('')
  const [railTab, setRailTab] = useState('docs')
  const [query, setQuery] = useState('')
  const [themeOpen, setThemeOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fileOpen, setFileOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [pane, setPane] = useState('editor')
  const [deviceOpen, setDeviceOpen] = useState(false)
  const [insertOpen, setInsertOpen] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [cursor, setCursor] = useState({ line: 1, col: 1 })
  const [width, setWidth] = useState(1180)
  const [deferred, setDeferred] = useState('')

  const rootRef = useRef(null)
  const taRef = useRef(null)
  const stageRef = useRef(null)
  const deviceRef = useRef(null)
  const insertRef = useRef(null)
  const articleRef = useRef(null)
  const railRef = useRef(null)
  const editorRef = useRef(null)
  const previewRef = useRef(null)
  const fileInputRef = useRef(null)
  const importInputRef = useRef(null)
  const contentRef = useRef('')
  const titleRef = useRef('')
  const settingsRef = useRef(null)
  const saveTimer = useRef(0)
  const settingsTimer = useRef(0)
  const toastTimer = useRef(0)
  const activeIdRef = useRef('')
  const scrollFrame = useRef(0)
  const pendingSel = useRef(null)

  const settings = data === null ? null : data.settings
  const theme = MDW_THEMES.byId(settings === null ? 'classic' : settings.themeId)

  const notify = useCallback((text, tone, action) => {
    setToast({ text, tone: tone === undefined ? 'ok' : tone, action: action === undefined ? null : action, id: Date.now() })
  }, [])

  useEffect(() => {
    if (toast === null) return undefined
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  useOutside(deviceRef, () => setDeviceOpen(false), deviceOpen)
  useOutside(insertRef, () => setInsertOpen(false), insertOpen)

  const applyMeta = useCallback((next) => {
    setData((previous) => {
      if (previous === null) return next
      return {
        ...next,
        // 正在编辑的正文/标题以本地为准，避免保存回包覆盖光标与未提交输入
        active: previous.active === null ? next.active : previous.active,
      }
    })
  }, [])

  const load = useCallback(async () => {
    try {
      const state = await mdwRequest('/state')
      setData(state)
      settingsRef.current = state.settings
      const active = state.active
      if (active !== null) {
        activeIdRef.current = active.id
        contentRef.current = active.content
        titleRef.current = active.title
        setContent(active.content)
        setTitle(active.title)
        setDeferred(active.content)
        setSavedAt(active.updatedAt)
      }
      setRailOpen(state.settings.docRail !== false)
      setError('')
    } catch (failure) {
      setError(failure.message === undefined ? String(failure) : failure.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // 跟随宿主皮肤主色：皮肤插件换色时同步（变量可能挂在 body 上）
  useEffect(() => {
    if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') return
    const read = () => {
      try {
        const node = document.body === null ? document.documentElement : document.body
        const value = getComputedStyle(node).getPropertyValue('--dsw-alias-brand-primary').trim()
        setHostAccent(value)
      } catch {
        /* 读不到就沿用公众号MD编辑器主色 */
      }
    }
    read()
    const observer = typeof MutationObserver === 'function' ? new MutationObserver(read) : null
    if (observer !== null) {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-skin'] })
      if (document.body !== null) observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style', 'data-dsh-skin-center', 'data-theme'] })
    }
    return () => {
      if (observer !== null) observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined
    const node = rootRef.current
    if (node === null) return undefined
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]
      if (box !== undefined && box.contentRect.width > 0) setWidth(box.contentRect.width)
    })
    observer.observe(node)
    const initial = node.getBoundingClientRect().width
    if (initial > 0) setWidth(initial)
    return () => observer.disconnect()
  }, [data === null])

  // 预览渲染降噪：输入 60ms 后再解析（解析器约 1ms/10KB，这个档位已足够跟手）
  useEffect(() => {
    const timer = setTimeout(() => setDeferred(content), 60)
    return () => clearTimeout(timer)
  }, [content])

  const article = useMemo(() => {
    if (settings === null) return { html: '', headings: [], stats: { chars: 0, cjk: 0, latin: 0, total: 0 } }
    const result = MDW_ENGINE.render(deferred, {
      linkRefs: settings.linkRefs,
      softBreaks: settings.softBreaks,
      highlight: (code, lang) => MDW_HL.highlight(code, lang, settings.codeThemeId),
    })
    return { html: result.html, headings: result.headings, stats: MDW_ENGINE.countWords(deferred) }
  }, [deferred, settings === null ? '' : settings.linkRefs, settings === null ? '' : settings.softBreaks, settings === null ? '' : settings.codeThemeId])

  const articleCss = useMemo(() => {
    if (settings === null) return ''
    const css = MDW_THEMES.cssFor(theme, settings)
    return settings.customCss.trim() === '' ? css : css + '\n' + settings.customCss
  }, [theme.id, settings === null ? '' : JSON.stringify([settings.fontFamily, settings.fontSize, settings.lineHeight, settings.paragraphSpacing, settings.letterSpacing, settings.textAlign, settings.indent, settings.pagePadding, settings.customCss])])

  // 富内容水合：公式 / 图表 / 组件 / 二维码
  useEffect(() => {
    const node = articleRef.current
    if (node !== null) MDW_RICH.hydrate(node)
  }, [article.html, articleCss])

  // 待恢复的选区（工具栏插入后）
  useEffect(() => {
    if (pendingSel.current === null || taRef.current === null) return
    const [start, end] = pendingSel.current
    pendingSel.current = null
    taRef.current.focus()
    taRef.current.setSelectionRange(start, end)
  }, [content])

  const patchSettings = useCallback((patch) => {
    setData((previous) => {
      if (previous === null) return previous
      const next = { ...previous, settings: { ...previous.settings, ...patch } }
      settingsRef.current = next.settings
      return next
    })
    if (settingsTimer.current !== 0) clearTimeout(settingsTimer.current)
    settingsTimer.current = window.setTimeout(async () => {
      try {
        if (settingsRef.current === null) return
        const response = await mdwRequest('/act', { method: 'POST', body: { action: 'settings.save', settings: settingsRef.current } })
        applyMeta(response.state)
      } catch (failure) {
        notify(failure.message, 'warn')
      }
    }, 500)
  }, [applyMeta, notify])

  const updateContent = useCallback((next) => {
    contentRef.current = next
    setContent(next)
    setSaveState('dirty')
  }, [])

  const updateTitle = useCallback((next) => {
    titleRef.current = next
    setTitle(next)
    setSaveState('dirty')
  }, [])

  const flushSave = useCallback(async () => {
    if (data === null || data.active === null) return
    if (saveState === 'ok' && titleRef.current === data.active.title && contentRef.current === data.active.content) return
    setSaveState('saving')
    try {
      const derived = titleRef.current.trim() === '' ? '未命名文章' : titleRef.current
      const response = await mdwRequest('/act', {
        method: 'POST',
        body: { action: 'doc.save', id: data.active.id, title: derived, content: contentRef.current },
      })
      applyMeta(response.state)
      setData((previous) => (previous === null ? previous : { ...previous, active: { ...previous.active, title: derived, content: contentRef.current, updatedAt: response.savedAt } }))
      setTitle(derived)
      titleRef.current = derived
      setSavedAt(response.savedAt)
      setSaveState('ok')
    } catch (failure) {
      setSaveState('dirty')
      notify('保存失败：' + failure.message, 'warn')
    }
  }, [data, saveState, applyMeta, notify])

  // 自动保存
  useEffect(() => {
    if (saveState !== 'dirty') return undefined
    if (saveTimer.current !== 0) clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = 0
      flushSave()
    }, 850)
    return () => {
      if (saveTimer.current !== 0) clearTimeout(saveTimer.current)
    }
  }, [content, title, saveState, flushSave])

  // 关闭页面前兜底保存
  useEffect(() => {
    const handler = () => {
      if (saveState === 'dirty') flushSave()
    }
    window.addEventListener('blur', handler)
    return () => window.removeEventListener('blur', handler)
  }, [saveState, flushSave])

  const switchDoc = useCallback(
    async (id) => {
      if (data === null || id === activeIdRef.current) return
      await flushSave()
      try {
        const response = await mdwRequest('/act', { method: 'POST', body: { action: 'doc.setActive', id } })
        setData(response.state)
        const active = response.state.active
        if (active !== null) {
          activeIdRef.current = active.id
          contentRef.current = active.content
          titleRef.current = active.title
          setContent(active.content)
          setTitle(active.title)
          setDeferred(active.content)
          setSavedAt(active.updatedAt)
          setSaveState('ok')
        }
      } catch (failure) {
        notify(failure.message, 'warn')
      }
    },
    [data, flushSave, notify]
  )

  const createDoc = useCallback(
    async (seedContent, seedTitle) => {
      await flushSave()
      try {
        const response = await mdwRequest('/act', {
          method: 'POST',
          body: { action: 'doc.create', title: seedTitle === undefined ? '未命名文章' : seedTitle, content: seedContent === undefined ? '' : seedContent },
        })
        setData(response.state)
        const active = response.state.active
        if (active !== null) {
          activeIdRef.current = active.id
          contentRef.current = active.content
          titleRef.current = active.title
          setContent(active.content)
          setTitle(active.title)
          setDeferred(active.content)
          setSavedAt(active.updatedAt)
          setSaveState('ok')
          setRailTab('docs')
        }
        notify('已新建草稿')
        setTimeout(() => {
          const input = rootRef.current === null ? null : rootRef.current.querySelector('.mw-title')
          if (input !== null) {
            input.focus()
            input.select()
          }
        }, 30)
      } catch (failure) {
        notify(failure.message, 'warn')
      }
    },
    [flushSave, notify]
  )

  const duplicateDoc = useCallback(
    async (id) => {
      await flushSave()
      try {
        const response = await mdwRequest('/act', { method: 'POST', body: { action: 'doc.duplicate', id } })
        setData(response.state)
        const active = response.state.active
        if (active !== null) {
          activeIdRef.current = active.id
          contentRef.current = active.content
          titleRef.current = active.title
          setContent(active.content)
          setTitle(active.title)
          setDeferred(active.content)
          setSaveState('ok')
        }
        notify('已创建副本')
      } catch (failure) {
        notify(failure.message, 'warn')
      }
    },
    [flushSave, notify]
  )

  const removeDoc = useCallback(
    async (id) => {
      try {
        const response = await mdwRequest('/act', { method: 'POST', body: { action: 'doc.delete', id } })
        setData(response.state)
        const active = response.state.active
        if (active !== null) {
          activeIdRef.current = active.id
          contentRef.current = active.content
          titleRef.current = active.title
          setContent(active.content)
          setTitle(active.title)
          setDeferred(active.content)
          setSaveState('ok')
        }
        setModal(null)
        notify('已删除草稿')
      } catch (failure) {
        notify(failure.message, 'warn')
      }
    },
    [notify]
  )

  const renameDoc = useCallback(
    async (id, nextTitle) => {
      try {
        const response = await mdwRequest('/act', { method: 'POST', body: { action: 'doc.rename', id, title: nextTitle } })
        applyMeta(response.state)
        if (id === activeIdRef.current) {
          titleRef.current = nextTitle
          setTitle(nextTitle)
        }
        setModal(null)
        notify('已重命名')
      } catch (failure) {
        notify(failure.message, 'warn')
      }
    },
    [applyMeta, notify]
  )

  const editSelection = useCallback(
    (transform) => {
      const ta = taRef.current
      if (ta === null) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const value = contentRef.current
      const result = transform(value, start, end)
      if (result === null) return
      updateContent(result.text)
      pendingSel.current = [result.start, result.end]
    },
    [updateContent]
  )

  const surround = useCallback(
    (before, after, placeholder) => {
      editSelection((value, start, end) => {
        const selected = value.slice(start, end)
        const body = selected === '' ? placeholder : selected
        return {
          text: value.slice(0, start) + before + body + after + value.slice(end),
          start: start + before.length,
          end: start + before.length + body.length,
        }
      })
    },
    [editSelection]
  )

  const prefixLines = useCallback(
    (marker, placeholder) => {
      editSelection((value, start, end) => {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        const lineEndRaw = value.indexOf('\n', end)
        const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw
        const block = value.slice(lineStart, lineEnd)
        const lines = block.split('\n')
        const allHave = lines.every((line) => line.startsWith(marker))
        const next = lines
          .map((line) => (allHave ? line.slice(marker.length) : marker + line))
          .join('\n')
        const delta = next.length - block.length
        if (allHave) {
          return { text: value.slice(0, lineStart) + next + value.slice(lineEnd), start: Math.max(lineStart, start - marker.length), end: Math.max(lineStart, end + delta) }
        }
        return { text: value.slice(0, lineStart) + next + value.slice(lineEnd), start: start + marker.length, end: end + delta }
      })
    },
    [editSelection]
  )

  const setHeading = useCallback(
    (level) => {
      editSelection((value, start, end) => {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        const lineEndRaw = value.indexOf('\n', end)
        const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw
        const block = value.slice(lineStart, lineEnd)
        const stripped = block.replace(/^\s*#{1,6}\s+/, '')
        const next = '#'.repeat(level) + ' ' + stripped
        const delta = next.length - block.length
        return {
          text: value.slice(0, lineStart) + next + value.slice(lineEnd),
          start: Math.max(lineStart, start + delta),
          end: Math.max(lineStart, end + delta),
        }
      })
    },
    [editSelection]
  )

  const insertBlock = useCallback(
    (text) => {
      editSelection((value, start, end) => {
        const before = value.slice(0, start)
        const rest = value.slice(end)
        const needBefore = before === '' || before.endsWith('\n') ? '' : '\n'
        const needAfter = rest === '' || rest.startsWith('\n') ? '' : '\n'
        const insertion = needBefore + text + needAfter
        return { text: before + insertion + rest, start: before.length + insertion.length, end: before.length + insertion.length }
      })
    },
    [editSelection]
  )

  const insertSnippet = useCallback(
    (snippet) => {
      if (snippet.startsWith('$') && !snippet.startsWith('$$')) {
        editSelection((value, start, end) => ({ text: value.slice(0, start) + snippet + value.slice(end), start: start + snippet.length, end: start + snippet.length }))
        return
      }
      insertBlock(snippet)
    },
    [editSelection, insertBlock]
  )

  const insertTemplate = useCallback(
    (body) => {
      editSelection((value, start, end) => {
        const before = value.slice(0, start)
        const rest = value.slice(end)
        const lead = before === '' || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
        const tail = rest === '' || rest.startsWith('\n') ? '' : '\n\n'
        const insertion = lead + body + tail
        const next = before + insertion + rest
        const marker = insertion.indexOf('【')
        if (marker === -1) {
          const caret = before.length + insertion.length
          return { text: next, start: caret, end: caret }
        }
        const closing = insertion.indexOf('】', marker)
        const caret = before.length + marker
        return { text: next, start: caret, end: before.length + (closing === -1 ? marker + 1 : closing + 1) }
      })
    },
    [editSelection]
  )

  const uploadImage = useCallback(
    async (file) => {
      try {
        const { dataUrl, name } = await mdwCompressImage(file)
        let url = dataUrl
        if (settings.imageProvider === 'local') {
          const response = await mdwRequest('/image', { method: 'POST', body: { dataUrl, name } })
          url = response.url
        } else if (settings.imageProvider === 'embed') {
          url = dataUrl
        } else {
          const blob = await (await fetch(dataUrl)).blob()
          url = await mdwUploadToProvider(blob, name, settings)
        }
        insertBlock('![' + (name.replace(/\.[^.]+$/, '') || '配图') + '](' + url + ')')
        notify('已插入图片')
      } catch (failure) {
        notify(failure.message === undefined ? String(failure) : failure.message, 'warn')
      }
    },
    [settings, insertBlock, notify]
  )

  const onPaste = useCallback(
    (event) => {
      const clipboard = event.clipboardData === undefined || event.clipboardData === null ? null : event.clipboardData
      if (clipboard === null) return
      const items = clipboard.items
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index]
        if (item.kind === 'file' && item.type.indexOf('image/') === 0) {
          const file = item.getAsFile()
          if (file !== null) {
            event.preventDefault()
            uploadImage(file)
            return
          }
        }
      }
      // 从网页 / 公众号后台复制的内容通常只有 text/html，没有纯文本可读性；
      // 这里只在纯文本为空时自动转换，避免影响正常粘贴 Markdown。
      const html = typeof clipboard.getData === 'function' ? clipboard.getData('text/html') : ''
      const plain = typeof clipboard.getData === 'function' ? clipboard.getData('text/plain') : ''
      if (html !== '' && plain.trim() === '') {
        const markdown = mdwHtmlToMarkdown(html)
        if (markdown.trim() !== '') {
          event.preventDefault()
          insertBlock(markdown)
          notify('已把粘贴的 HTML 转成 Markdown')
        }
      }
    },
    [uploadImage, insertBlock, notify]
  )

  const onDrop = useCallback(
    (event) => {
      const files = event.dataTransfer === undefined || event.dataTransfer === null ? [] : event.dataTransfer.files
      for (let index = 0; index < files.length; index += 1) {
        if (files[index].type.indexOf('image/') === 0) {
          event.preventDefault()
          uploadImage(files[index])
          return
        }
      }
    },
    [uploadImage]
  )

  const onEditorKeyDown = useCallback(
    (event) => {
      const mod = event.ctrlKey || event.metaKey
      if (mod && (event.key === 'b' || event.key === 'B')) {
        event.preventDefault()
        surround('**', '**', '加粗文字')
        return
      }
      if (mod && (event.key === 'i' || event.key === 'I')) {
        event.preventDefault()
        surround('*', '*', '斜体文字')
        return
      }
      if (mod && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault()
        editSelection((value, start, end) => {
          const selected = value.slice(start, end)
          const label = selected === '' ? '链接文字' : selected
          const insertion = '[' + label + '](https://)'
          return { text: value.slice(0, start) + insertion + value.slice(end), start: start + label.length + 3, end: start + label.length + 11 }
        })
        return
      }
      if (mod && (event.key === 'e' || event.key === 'E')) {
        event.preventDefault()
        surround('`', '`', '代码')
        return
      }
      if (mod && (event.key === 's' || event.key === 'S')) {
        event.preventDefault()
        flushSave()
        return
      }
      if (mod && /^[1-6]$/.test(event.key)) {
        event.preventDefault()
        setHeading(Number(event.key))
        return
      }
      if (mod && (event.key === 'd' || event.key === 'D')) {
        event.preventDefault()
        surround('~~', '~~', '删除文字')
        return
      }
      if (event.altKey && event.shiftKey && (event.key === 'f' || event.key === 'F')) {
        event.preventDefault()
        const before = contentRef.current
        const after = mdwTidy(before)
        if (after !== before) {
          updateContent(after)
          notify('已整理排版', 'ok', { label: '撤销', run: () => updateContent(before) })
        } else {
          notify('排版已经很整齐')
        }
        return
      }
      if (event.key === 'Tab') {
        event.preventDefault()
        const ta = taRef.current
        if (ta === null) return
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const value = contentRef.current
        if (start === end && !event.shiftKey) {
          const insertion = '  '
          updateContent(value.slice(0, start) + insertion + value.slice(end))
          pendingSel.current = [start + 2, start + 2]
          return
        }
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        const lineEndRaw = value.indexOf('\n', end)
        const lineEnd = lineEndRaw === -1 ? value.length : lineEndRaw
        const block = value.slice(lineStart, lineEnd)
        const lines = block.split('\n')
        const next = lines.map((line) => (event.shiftKey ? line.replace(/^ {1,2}/, '') : '  ' + line)).join('\n')
        updateContent(value.slice(0, lineStart) + next + value.slice(lineEnd))
        pendingSel.current = [lineStart + next.length, lineStart + next.length]
        return
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        const ta = taRef.current
        if (ta === null) return
        const start = ta.selectionStart
        if (start !== ta.selectionEnd) return
        const value = contentRef.current
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        const line = value.slice(lineStart, start)
        const marker = /^(\s*)(?:([-*+])|(\d+)[.)])\s+(?:\[[ xX]\]\s+)?/.exec(line)
        if (marker === null) return
        event.preventDefault()
        const prefix = marker[2] !== undefined ? marker[1] + marker[2] + ' ' : marker[1] + (Number(marker[3]) + 1) + '. '
        const taskMatch = /^(\s*)([-*+])\s+\[[ xX]\]\s+/.exec(line)
        const insertion = '\n' + (taskMatch === null ? prefix : taskMatch[1] + taskMatch[2] + ' [ ] ')
        updateContent(value.slice(0, start) + insertion + value.slice(ta.selectionEnd))
        pendingSel.current = [start + insertion.length, start + insertion.length]
      }
    },
    [surround, editSelection, setHeading, flushSave, updateContent, notify]
  )

  const copyForWechat = useCallback(async () => {
    if (data === null || data.active === null) return
    const plain = contentRef.current
    let html = ''
    let graphics = 0
    let uploaded = 0
    try {
      const materialized = await MDW_RICH.materialize(article.html, articleCss, settings)
      html = materialized.html
      graphics = materialized.graphics
      uploaded = materialized.uploaded
    } catch (failure) {
      html = MDW_INLINE.toWechatHtml(article.html, articleCss)
    }
    const bits = []
    if (graphics > 0) bits.push(graphics + ' 个公式/图表已转为图片')
    if (uploaded > 0) bits.push(uploaded + ' 张图已转存图床')
    const done = (label) => notify(bits.length === 0 ? label : label + ' · ' + bits.join(' · '))
    try {
      if (navigator.clipboard !== undefined && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' }),
          }),
        ])
        done('已复制完整排版 · 到公众号编辑器 Ctrl+V')
      } else if (mwFallbackCopy(html)) {
        done('已复制（兼容模式）')
      } else {
        notify('复制失败，请检查剪贴板权限', 'warn')
      }
    } catch (failure) {
      if (mwFallbackCopy(html)) done('已复制（兼容模式）')
      else notify('复制失败：' + (failure.message === undefined ? failure : failure.message), 'warn')
    }
  }, [data, article.html, articleCss, settings, notify])

  const exportHtml = useCallback(async () => {
    let html = ''
    try {
      html = (await MDW_RICH.materialize(article.html, articleCss, settings)).html
    } catch {
      html = MDW_INLINE.toWechatHtml(article.html, articleCss)
    }
    const doc =
      '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + MDW_ENGINE.esc(title) + '</title><style>body{margin:0;background:#f2f2f2;padding:24px 12px}main{max-width:677px;margin:0 auto;background:#fff;border-radius:6px;box-shadow:0 8px 30px rgba(0,0,0,.08)}</style></head><body><main>' +
      html +
      '</main></body></html>'
    mdwDownload(mdwSlug(title) + '.html', doc, 'text/html;charset=utf-8')
    setFileOpen(false)
  }, [article.html, articleCss, settings, title])

  const exportMarkdown = useCallback(() => {
    mdwDownload(mdwSlug(title) + '.md', contentRef.current, 'text/markdown;charset=utf-8')
    setFileOpen(false)
  }, [title])

  const onImportFile = useCallback(
    async (event) => {
      const file = event.target.files === null ? null : event.target.files[0]
      event.target.value = ''
      if (file === undefined || file === null) return
      try {
        const text = await file.text()
        const base = file.name.replace(/\.[^.]+$/, '')
        await createDoc(text, base === '' ? '导入的文档' : base)
        notify('已导入 ' + file.name)
      } catch (failure) {
        notify('导入失败：' + (failure.message === undefined ? failure : failure.message), 'warn')
      }
    },
    [createDoc, notify]
  )

  const pasteHtml = useCallback(async () => {
    setFileOpen(false)
    try {
      if (navigator.clipboard === undefined || typeof navigator.clipboard.read !== 'function') {
        throw new Error('当前环境不支持读取剪贴板')
      }
      const items = await navigator.clipboard.read()
      for (const item of items) {
        if (item.types.indexOf('text/html') === -1) continue
        const blob = await item.getType('text/html')
        const html = await blob.text()
        const markdown = mdwHtmlToMarkdown(html)
        if (markdown.trim() === '') {
          notify('剪贴板里的 HTML 没有可转换的内容', 'warn')
          return
        }
        insertBlock(markdown)
        notify('已从 HTML 转换为 Markdown')
        return
      }
      notify('剪贴板里没有 HTML 内容', 'warn')
    } catch (failure) {
      notify('读取剪贴板失败：' + (failure.message === undefined ? failure : failure.message), 'warn')
    }
  }, [insertBlock, notify])

  const runCheck = useCallback(() => {
    setFileOpen(false)
    setDialog({ kind: 'check', issues: mdwPublishCheck(contentRef.current, settings, article) })
  }, [settings, article])

  const jumpToLine = useCallback((line) => {
    const ta = taRef.current
    if (ta === null) return
    const allLines = contentRef.current.split('\n')
    const target = Math.max(1, Math.min(allLines.length, Number(line) || 1))
    let position = 0
    for (let index = 0; index < target - 1; index += 1) position += allLines[index].length + 1
    ta.focus()
    ta.setSelectionRange(position, position + (allLines[target - 1] || '').length)
    try {
      const lineHeight = parseFloat(getComputedStyle(ta).lineHeight)
      ta.scrollTop = Math.max(0, (target - 1) * (Number.isFinite(lineHeight) ? lineHeight : 26) - ta.clientHeight / 3)
    } catch {
      /* 读不到行高就不滚动 */
    }
    setDialog(null)
  }, [])

  const copyPlain = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(contentRef.current)
      notify('已复制 Markdown 源码')
    } catch {
      notify('复制失败', 'warn')
    }
    setFileOpen(false)
  }, [notify])

  const syncCursor = useCallback(() => {
    const ta = taRef.current
    if (ta === null) return
    const pos = ta.selectionStart
    const before = contentRef.current.slice(0, pos)
    const line = before.split('\n').length
    const col = pos - before.lastIndexOf('\n')
    setCursor({ line, col })
  }, [])

  const onScrollEditor = useCallback(
    (event) => {
      if (settings.scrollSync !== true) return
      const ta = event.currentTarget
      // 滚动事件本身很密，合并到下一帧再读布局，避免每帧强制重排
      if (scrollFrame.current !== 0) return
      scrollFrame.current = window.requestAnimationFrame(() => {
        scrollFrame.current = 0
        const stage = stageRef.current
        if (stage === null) return
        const max = ta.scrollHeight - ta.clientHeight
        if (max <= 0) return
        stage.scrollTop = (ta.scrollTop / max) * (stage.scrollHeight - stage.clientHeight)
      })
    },
    [settings]
  )

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  // 拖动时直接改 DOM，松手才写设置：避免每帧 setState 导致整树重渲染
  const startRailDrag = useCallback(
    (event) => {
      event.preventDefault()
      const root = rootRef.current
      const body = root === null ? null : root.querySelector('.mw-body')
      const rail = railRef.current
      if (body === null || rail === null) return
      const rect = body.getBoundingClientRect()
      const maxWidth = Math.min(380, Math.max(200, rect.width - 640))
      let nextWidth = rail.getBoundingClientRect().width
      if (root !== null) root.setAttribute('data-drag', '1')
      const move = (moveEvent) => {
        nextWidth = clamp(moveEvent.clientX - rect.left, 180, maxWidth)
        rail.style.width = Math.round(nextWidth) + 'px'
      }
      const finish = () => {
        document.removeEventListener('pointermove', move)
        document.removeEventListener('pointerup', finish)
        document.removeEventListener('pointercancel', finish)
        if (root !== null) root.removeAttribute('data-drag')
        patchSettings({ railWidth: Math.round(clamp(nextWidth, 180, 380)) })
      }
      document.addEventListener('pointermove', move)
      document.addEventListener('pointerup', finish)
      document.addEventListener('pointercancel', finish)
    },
    [patchSettings]
  )

  const startDrag = useCallback(
    (event) => {
      event.preventDefault()
      const root = rootRef.current
      const body = root === null ? null : root.querySelector('.mw-body')
      const editor = editorRef.current
      const preview = previewRef.current
      if (body === null || editor === null || preview === null) return
      const bodyRect = body.getBoundingClientRect()
      const rail = railRef.current
      const railWidth = rail === null ? 0 : rail.getBoundingClientRect().width
      const usable = bodyRect.width - railWidth - 7
      if (usable < 240) return
      const minRatio = clamp(260 / usable, 0.18, 0.45)
      let ratio = clamp(editor.getBoundingClientRect().width / usable, minRatio, 1 - minRatio)
      if (root !== null) root.setAttribute('data-drag', '1')
      const move = (moveEvent) => {
        ratio = clamp((moveEvent.clientX - bodyRect.left - railWidth) / usable, minRatio, 1 - minRatio)
        editor.style.flexGrow = String(ratio)
        preview.style.flexGrow = String(1 - ratio)
      }
      const finish = () => {
        document.removeEventListener('pointermove', move)
        document.removeEventListener('pointerup', finish)
        document.removeEventListener('pointercancel', finish)
        if (root !== null) root.removeAttribute('data-drag')
        patchSettings({ splitRatio: Math.round(ratio * 1000) / 1000 })
      }
      document.addEventListener('pointermove', move)
      document.addEventListener('pointerup', finish)
      document.addEventListener('pointercancel', finish)
    },
    [patchSettings]
  )

  useEffect(() => {
    return () => {
      if (scrollFrame.current !== 0 && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(scrollFrame.current)
    }
  }, [])

  const allDocs = data === null ? null : data.docs
  const filteredDocs = useMemo(() => {
    if (allDocs === null) return []
    const keyword = query.trim().toLowerCase()
    return keyword === '' ? allDocs : allDocs.filter((doc) => doc.title.toLowerCase().indexOf(keyword) !== -1)
  }, [allDocs, query])

  // 玻璃材质下，环境光晕随指针轻微视差（关闭动效时完全不跑）
  useEffect(() => {
    const root = rootRef.current
    if (root === null || settings === null) return
    if (settings.motion === false || settings.surface === 'solid') return
    let frame = 0
    let px = 0
    let py = 0
    const apply = () => {
      frame = 0
      root.style.setProperty('--mw-px', px.toFixed(3))
      root.style.setProperty('--mw-py', py.toFixed(3))
    }
    const onMove = (event) => {
      px = event.clientX / Math.max(1, window.innerWidth) - 0.5
      py = event.clientY / Math.max(1, window.innerHeight) - 0.5
      if (frame === 0) frame = window.requestAnimationFrame(apply)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [settings])

  // 宿主皮肤/壁纸插件可能把 --dsw-alias-bg-base 置为 transparent、把 bg-layer 改成半透明玻璃配方。
  // 公众号MD编辑器若直接继承，会让实色档整块透出壁纸（文字压在壁纸上、按钮前景色消失）。
  // 这里把宿主令牌拍平成不透明 rgb 再写回 --mw-bg / --mw-card / --mw-card-2，
  // 公众号MD编辑器自己的玻璃档再基于拍平色做透明度，保证任何皮肤下都可读。
  useLayoutEffect(() => {
    const root = rootRef.current
    if (root === null || typeof document === 'undefined' || document.body === null) return
    const probe = document.createElement('span')
    probe.setAttribute('aria-hidden', 'true')
    probe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:0;height:0;visibility:hidden;pointer-events:none'
    document.body.appendChild(probe)

    const parseColor = (value) => {
      if (typeof value !== 'string' || value === '') return null
      let match = /^rgba?\(([^)]+)\)/.exec(value)
      if (match !== null) {
        const parts = match[1].split(/[\s,/]+/).filter((part) => part !== '').map(Number)
        if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return null
        return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
      }
      match = /^color\(srgb\s+([^)]+)\)/.exec(value)
      if (match !== null) {
        const parts = match[1].split(/[\s/]+/).filter((part) => part !== '').map(Number)
        if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return null
        return { r: parts[0] * 255, g: parts[1] * 255, b: parts[2] * 255, a: parts.length > 3 ? parts[3] : 1 }
      }
      if (value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
      return null
    }
    const probeColor = (token) => {
      try {
        if (getComputedStyle(document.body).getPropertyValue(token).trim() === '') return null
        probe.style.color = ''
        probe.style.color = 'var(' + token + ')'
        return parseColor(getComputedStyle(probe).color)
      } catch {
        return null
      }
    }
    const flatten = (color, base) => {
      if (color === null) return base.slice()
      const alpha = Math.max(0, Math.min(1, color.a))
      return [
        Math.round(color.r * alpha + base[0] * (1 - alpha)),
        Math.round(color.g * alpha + base[1] * (1 - alpha)),
        Math.round(color.b * alpha + base[2] * (1 - alpha)),
      ]
    }
    const apply = () => {
      const label = probeColor('--dsw-alias-label-primary')
      const dark = label !== null && 0.2126 * label.r + 0.7152 * label.g + 0.0722 * label.b > 140
      const palette = dark
        ? { bg: [23, 22, 26], card: [30, 29, 34], card2: [38, 37, 43] }
        : { bg: [247, 246, 242], card: [255, 255, 255], card2: [243, 241, 236] }
      const bg = flatten(probeColor('--dsw-alias-bg-base'), palette.bg)
      const card = flatten(probeColor('--dsw-alias-bg-layer-1'), bg)
      const card2 = flatten(probeColor('--dsw-alias-bg-layer-2'), bg)
      const rgb = (channels) => 'rgb(' + channels[0] + ' ' + channels[1] + ' ' + channels[2] + ')'
      root.style.setProperty('--mw-bg', rgb(bg))
      root.style.setProperty('--mw-card', rgb(card))
      root.style.setProperty('--mw-card-2', rgb(card2))
    }
    let frame = 0
    const schedule = () => {
      if (frame !== 0) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        apply()
      })
    }
    apply()
    const observer = typeof MutationObserver === 'function' ? new MutationObserver(schedule) : null
    if (observer !== null) {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-ds-dark-theme'] })
      observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-ds-dark-theme', 'data-we-wallpaper', 'data-we-glass-page'] })
    }
    window.addEventListener('resize', schedule)
    const timer = window.setInterval(schedule, 1500)
    return () => {
      if (observer !== null) observer.disconnect()
      window.removeEventListener('resize', schedule)
      window.clearInterval(timer)
      if (frame !== 0) window.cancelAnimationFrame(frame)
      if (probe.parentNode !== null) probe.parentNode.removeChild(probe)
    }
  }, [data === null ? 'loading' : 'ready'])

  if (error !== '') {
    return h(
      'div',
      { className: 'mw-root' },
      h('div', { className: 'mw-loading' }, h('div', null, '公众号MD编辑器加载失败：' + error, h('br'), h(Btn, { onClick: load, variant: 'ghost' }, '重试')))
    )
  }

  if (data === null || settings === null) {
    return h(
      'div',
      { className: 'mw-root' },
      h(
        'div',
        { className: 'mw-top' },
        h('div', { className: 'mw-brand' }, h('span', { className: 'mw-brandmark' }, h(Icon, { name: 'leaf', size: 16 })), h('span', { className: 'mw-brandname' }, '公众号MD编辑器'))
      ),
      h(
        'div',
        { className: 'mw-body' },
        h('div', { className: 'mw-skel', style: { width: '100%' } }, h('i', null), h('i', { style: { width: '80%' } }), h('i', { style: { width: '60%' } }))
      )
    )
  }

  const docs = data.docs
  const filtered = filteredDocs
  const stats = article.stats
  const readingMinutes = Math.max(1, Math.round((stats.cjk + stats.latin) / 400))
  const tight = width < 820
  const narrow = width < 1100
  const compact = width < 980
  const activeDoc = data.active

  const splitMode = settings.previewMode
  const showEditor = !tight || pane === 'editor'
  const showPreview = !tight || pane === 'preview'
  const device = MDW_DEVICES.filter((item) => item.id === settings.articleWidth)[0] || MDW_DEVICES[1]
  const paperMax = device.id === 'auto' ? 677 : Number(device.id)
  const wantedRail = Number(settings.railWidth)
  const railBase = Number.isFinite(wantedRail) && wantedRail > 0 ? wantedRail : 232
  const railWidth = tight
    ? Math.min(railBase, Math.max(232, width - 120))
    : Math.min(railBase, Math.max(180, width - 640))
  const activeAccent = settings.accent === '' ? theme.accent : settings.accent
  const surface = settings.surface === 'glass' || settings.surface === 'clear' ? settings.surface : 'solid'
  const chromeAccent = settings.accentSource === 'host' && hostAccent !== '' ? hostAccent : activeAccent
  const railVisible = tight ? compactRail : railOpen

  return h(
    'div',
    {
      className: 'mw-root',
      ref: rootRef,
      'data-rail': railVisible ? '1' : '0',
      'data-narrow': narrow ? '1' : '0',
      'data-tight': tight ? '1' : '0',
      'data-pane': pane,
      'data-drag': '0',
      'data-surface': surface,
      'data-motion': settings.motion === false ? '0' : '1',
      style: { '--mw-accent': chromeAccent },
    },
    h('style', null, MDW_CSS),
    h('div', { className: 'mw-ambient', 'aria-hidden': 'true' }, h('i'), h('i')),

    // ---------- 顶栏 ----------
    h(
      'header',
      { className: 'mw-top' },
      h(
        'div',
        { className: 'mw-brand' },
        h('span', { className: 'mw-brandmark' }, h(Icon, { name: 'leaf', size: 16 })),
        h('span', { className: 'mw-brandtext' }, h('span', { className: 'mw-brandname' }, '公众号MD编辑器'), h('span', { className: 'mw-brandsub' }, 'WeChat Markdown Editor'))
      ),
      h(
        'div',
        { className: 'mw-doc' },
        h('input', {
          className: 'mw-title',
          value: title,
          placeholder: '未命名文章',
          spellCheck: false,
          onChange: (event) => updateTitle(event.target.value),
          onBlur: () => flushSave(),
          'aria-label': '文章标题',
        }),
        h(
          'span',
          { className: 'mw-save', 'data-state': saveState },
          h('i', null),
          saveState === 'saving' ? '保存中…' : saveState === 'dirty' ? '未保存' : '已保存 ' + mdwClock(savedAt)
        )
      ),
      h(
        'div',
        { className: 'mw-actions' },
        h(Btn, { variant: 'icon', icon: 'doc', title: tight ? '显示/隐藏草稿栏' : '显示/隐藏草稿栏', onClick: () => {
          if (width < 820) {
            setCompactRail(!compactRail)
            return
          }
          const next = !railOpen
          setRailOpen(next)
          patchSettings({ docRail: next })
        } }),
        h('span', { className: 'mw-vsep' }),
        h(
          'div',
          { className: 'mw-popwrap' },
          h(Btn, { variant: 'ghost', icon: 'download', onClick: () => setFileOpen(!fileOpen) }, '文件'),
          fileOpen
            ? h(
                'div',
                { className: 'mw-menu', style: { minWidth: '210px' }, onMouseDown: (event) => event.stopPropagation() },
                h('button', { type: 'button', onClick: () => { setFileOpen(false); fileInputRef.current === null ? null : fileInputRef.current.click() } }, h(Icon, { name: 'upload', size: 14 }), '导入 Markdown', h('small', null, '.md')),
                h('button', { type: 'button', onClick: pasteHtml }, h(Icon, { name: 'clipboard', size: 14 }), '从 HTML 粘贴', h('small', null, 'HTML')),
                h('button', { type: 'button', onClick: exportMarkdown }, h(Icon, { name: 'download', size: 14 }), '导出 Markdown', h('small', null, '.md')),
                h('button', { type: 'button', onClick: exportHtml }, h(Icon, { name: 'external', size: 14 }), '导出 HTML', h('small', null, '内联样式')),
                h('hr', null),
                h('button', { type: 'button', onClick: runCheck }, h(Icon, { name: 'check', size: 14 }), '发布前检查', h('small', null, '本地')),
                h('button', { type: 'button', onClick: copyPlain }, h(Icon, { name: 'copy', size: 14 }), '复制源码'),
                h('button', { type: 'button', onClick: () => { setFileOpen(false); duplicateDoc(activeDoc === null ? '' : activeDoc.id) } }, h(Icon, { name: 'doc', size: 14 }), '创建副本')
              )
            : null
        ),
        h(
          'div',
          { className: 'mw-popwrap' },
          h(
            'button',
            { type: 'button', className: 'mw-toolwide', onClick: () => setThemeOpen(!themeOpen), 'aria-haspopup': 'dialog', title: '切换文章主题' },
            h('span', { className: 'mw-swatch', style: { background: activeAccent } }),
            h('strong', null, theme.name),
            h(Icon, { name: 'chevron', size: 12 })
          ),
          themeOpen
            ? h(ThemePopover, {
                trigger: null,
                current: theme.id,
                onClose: () => setThemeOpen(false),
                onPick: (id) => {
                  patchSettings({ themeId: id })
                  setThemeOpen(false)
                  notify('已切换主题：' + MDW_THEMES.byId(id).name)
                },
              })
            : null
        ),
        h(Btn, { variant: 'icon', icon: 'settings', title: '排版设置', onClick: () => setSettingsOpen(true) }),
        h(
          'button',
          { type: 'button', className: 'mw-btn mw-btn--primary', onClick: copyForWechat, title: '把排版内联后复制，直接粘贴进公众号编辑器' },
          h('span', { className: 'mw-dot' }),
          '复制到公众号'
        )
      )
    ),

    // ---------- 工具条 ----------
    h(
      'div',
      { className: 'mw-tools' },
      compact
        ? null
        : h('div', { className: 'mw-toolgroup' },
            h(Tool, { name: 'undo', hint: '撤销（Ctrl+Z）', onClick: () => { taRef.current === null ? null : document.execCommand('undo') } }),
            h(Tool, { name: 'redo', hint: '重做（Ctrl+Shift+Z）', onClick: () => { taRef.current === null ? null : document.execCommand('redo') } })
          ),
      compact ? null : h('span', { className: 'mw-vsep' }),
      h('div', { className: 'mw-toolgroup' },
        h(Tool, { name: 'bold', hint: '加粗 Ctrl+B', onClick: () => surround('**', '**', '加粗文字') }),
        h(Tool, { name: 'italic', hint: '斜体 Ctrl+I', onClick: () => surround('*', '*', '斜体文字') }),
        h(Tool, { name: 'strike', hint: '删除线', onClick: () => surround('~~', '~~', '删除文字') }),
        h(Tool, { name: 'code', hint: '行内代码 Ctrl+E', onClick: () => surround('`', '`', '代码') })
      ),
      h('span', { className: 'mw-vsep' }),
      h('div', { className: 'mw-toolgroup' },
        h(Tool, { name: 'quote', hint: '引用', onClick: () => prefixLines('> ', '引用') }),
        h(Tool, { name: 'ul', hint: '无序列表', onClick: () => prefixLines('- ', '列表项') }),
        h(Tool, { name: 'ol', hint: '有序列表', onClick: () => prefixLines('1. ', '列表项') }),
        h(Tool, { name: 'task', hint: '任务列表', onClick: () => prefixLines('- [ ] ', '待办') }),
        h(Tool, { name: 'hr', hint: '分割线', onClick: () => insertBlock('\n---\n') })
      ),
      h('span', { className: 'mw-vsep' }),
      h('div', { className: 'mw-toolgroup' },
        h(Tool, { name: 'link', hint: '链接 Ctrl+K', onClick: () => editSelection((value, start, end) => {
          const selected = value.slice(start, end)
          const label = selected === '' ? '链接文字' : selected
          const insertion = '[' + label + '](https://)'
          return { text: value.slice(0, start) + insertion + value.slice(end), start: start + 1, end: start + 1 + label.length }
        }) }),
        h(Tool, { name: 'image', hint: '插入图片（也可直接粘贴）', onClick: () => fileInputRef.current === null ? null : fileInputRef.current.click() }),
        compact ? null : h(Tool, { name: 'table', hint: '插入表格', onClick: () => insertBlock('| 列 1 | 列 2 |\n| --- | --- |\n| 内容 | 内容 |') }),
        compact ? null : h(Tool, { name: 'toc', hint: '插入目录', onClick: () => insertBlock('[TOC]') })
      ),
      h('span', { className: 'mw-vsep' }),
      h(
        'div',
        { className: 'mw-popwrap', ref: insertRef },
        h(
          'button',
          { type: 'button', className: 'mw-toolwide mw-toolwide--accent' + (compact ? ' mw-toolwide--icon' : ''), onClick: () => setInsertOpen(!insertOpen), title: '插入公式 / 图表 / 组件 / 表格' },
          h(Icon, { name: 'plus', size: 12 }),
          compact ? null : '插入',
          compact ? null : h(Icon, { name: 'chevron', size: 11 })
        ),
        insertOpen
          ? h(
              'div',
              { className: 'mw-menu', style: { left: 0, right: 'auto', minWidth: '198px' } },
              h('button', { type: 'button', onClick: () => { setInsertOpen(false); setDialog({ kind: 'formula' }) } }, h(Icon, { name: 'sigma', size: 14 }), '公式', h('small', null, 'LaTeX')),
              h('button', { type: 'button', onClick: () => { setInsertOpen(false); setDialog({ kind: 'mermaid' }) } }, h(Icon, { name: 'flow', size: 14 }), '图表', h('small', null, 'Mermaid')),
              h('button', { type: 'button', onClick: () => { setInsertOpen(false); setDialog({ kind: 'component' }) } }, h(Icon, { name: 'grid', size: 14 }), '组件', h('small', null, '7 种')),
              h('button', { type: 'button', onClick: () => { setInsertOpen(false); setDialog({ kind: 'template' }) } }, h(Icon, { name: 'doc', size: 14 }), '模板', h('small', null, MDW_TEMPLATES.length + ' 套')),
              h('span', { className: 'mw-menusplit' }),
              h('button', { type: 'button', onClick: () => { setInsertOpen(false); insertBlock('| 列 1 | 列 2 |\n| --- | --- |\n| 内容 | 内容 |') } }, h(Icon, { name: 'table', size: 14 }), '表格', h('small', null, 'GFM')),
              h('button', { type: 'button', onClick: () => { setInsertOpen(false); insertBlock('[TOC]') } }, h(Icon, { name: 'toc', size: 14 }), '目录', h('small', null, '[TOC]'))
            )
          : null
      ),
      h(
        'div',
        { className: 'mw-toolgroup' },
        h(Tool, { name: 'sparkle', hint: '整理排版', onClick: () => {
          const before = contentRef.current
          const after = mdwTidy(before)
          if (after === before) {
            notify('排版已经很整齐')
            return
          }
          updateContent(after)
          notify('已整理排版', 'ok', { label: '撤销', run: () => updateContent(before) })
        } })
      ),
      h(
        'div',
        { className: 'mw-toolgroup mw-toolgroup--right' },
        h(
          'div',
          { className: 'mw-toolgroup', style: { gap: '2px' } },
          tight
            ? [
                h(Tool, { key: 'e', name: 'pen', hint: '写作', active: pane === 'editor', size: 14, onClick: () => setPane('editor') }),
                h(Tool, { key: 'p', name: 'monitor', hint: '预览', active: pane === 'preview', size: 14, onClick: () => setPane('preview') }),
              ]
            : [
                h(Tool, { key: 's', name: 'split', hint: '分屏', active: splitMode === 'split', onClick: () => patchSettings({ previewMode: 'split' }) }),
                h(Tool, { key: 'e', name: 'monitor', hint: '仅编辑', active: splitMode === 'editor', onClick: () => patchSettings({ previewMode: 'editor' }) }),
                h(Tool, { key: 'p', name: 'phone', hint: '仅预览', active: splitMode === 'preview', onClick: () => patchSettings({ previewMode: 'preview' }) }),
              ]
        )
      )
    ),

    // ---------- 三栏 ----------
    h(
      'div',
      { className: 'mw-body' },
      tight && compactRail
        ? h('div', { className: 'mw-railscrim', onMouseDown: () => setCompactRail(false) })
        : null,
      railVisible
        ? h(
            'aside',
            { className: 'mw-rail', ref: railRef, style: { width: railWidth + 'px' } },
            h(
              'div',
              { className: 'mw-rail-head' },
              h('span', { className: 'mw-railtitle' }, railTab === 'docs' ? '草稿' : '大纲'),
              h(
                'div',
                { className: 'mw-pane-tabs' },
                h('button', { type: 'button', title: '新建草稿', onClick: () => createDoc(), style: { display: 'grid', placeItems: 'center', width: '22px', padding: 0 } }, h(Icon, { name: 'plus', size: 13 })),
                h('button', { type: 'button', 'data-active': railTab === 'docs' ? '1' : '0', onClick: () => setRailTab('docs') }, '文档'),
                h('button', { type: 'button', 'data-active': railTab === 'outline' ? '1' : '0', onClick: () => setRailTab('outline') }, '大纲')
              )
            ),
            railTab === 'docs' ? h('label', { className: 'mw-search' }, h(Icon, { name: 'search', size: 13 }), h('input', { value: query, placeholder: '搜索标题', onChange: (event) => setQuery(event.target.value) })) : null,
            railTab === 'docs'
              ? h(
                  'div',
                  { className: 'mw-doclist' },
                  filtered.length === 0
                    ? h('div', { className: 'mw-empty' }, h('strong', null, '没有匹配的草稿'), '试试别的关键词')
                    : filtered.map((doc) =>
                        h(
                          'div',
                          {
                            key: doc.id,
                            className: 'mw-docitem',
                            'data-active': doc.id === activeDoc.id ? '1' : '0',
                            onClick: () => switchDoc(doc.id),
                            role: 'button',
                            tabIndex: 0,
                            onKeyDown: (event) => {
                              if (event.key === 'Enter') switchDoc(doc.id)
                            },
                          },
                          h('span', { className: 'mw-doci-t' }, doc.title),
                          h('span', { className: 'mw-doci-m' }, h('span', null, mdwRelative(doc.updatedAt)), h('span', null, '·'), h('span', null, doc.chars + ' 字')),
                          h(
                            'span',
                            { className: 'mw-docacts' },
                            h('button', { type: 'button', className: 'mw-docact', title: '重命名', onClick: (event) => { event.stopPropagation(); setModal({ kind: 'rename', id: doc.id, value: doc.title }) } }, h(Icon, { name: 'pen', size: 12 })),
                            h('button', { type: 'button', className: 'mw-docact', title: '创建副本', onClick: (event) => { event.stopPropagation(); duplicateDoc(doc.id) } }, h(Icon, { name: 'copy', size: 12 })),
                            h('button', { type: 'button', className: 'mw-docact', title: '删除', onClick: (event) => { event.stopPropagation(); setModal({ kind: 'delete', id: doc.id, title: doc.title }) } }, h(Icon, { name: 'trash', size: 12 }))
                          )
                        )
                      ),
                  h('button', { type: 'button', className: 'mw-docitem', style: { color: 'var(--mw-faint)', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: '6px' }, onClick: () => createDoc() }, h(Icon, { name: 'plus', size: 13 }), '新建草稿')
                )
              : h('div', { className: 'mw-doclist' }, h('div', { className: 'mw-outline' }, article.headings.length === 0 ? h('div', { className: 'mw-empty' }, '还没有标题', '用 # 开始写小标题') : article.headings.map((heading, index) => h('button', {
                  key: index,
                  type: 'button',
                  'data-level': heading.level,
                  title: heading.text,
                  onClick: () => {
                    const ta = taRef.current
                    if (ta === null) return
                    const value = contentRef.current
                    const needle = '\n' + '#'.repeat(heading.level) + ' ' + heading.text
                    let at = value.indexOf(needle)
                    if (at === -1 && value.indexOf('#'.repeat(heading.level) + ' ' + heading.text) === 0) at = -1
                    if (at === -1) at = value.indexOf(heading.text)
                    if (at !== -1) {
                      ta.focus()
                      ta.setSelectionRange(at + 1, at + 1)
                      const ratio = value.length === 0 ? 0 : at / value.length
                      ta.scrollTop = ratio * (ta.scrollHeight - ta.clientHeight)
                    }
                  },
                }, heading.text)))
            ),
            h(
              'div',
              { className: 'mw-rail-foot' },
              h('span', null, data.docs.length + ' 篇 · 本机'),
              h('button', { type: 'button', className: 'mw-linkbtn', onClick: () => createDoc() }, '新建')
            )
          )
        : null,

      railOpen && !tight
        ? h('div', {
            className: 'mw-splitter',            style: { cursor: 'col-resize' },
            onPointerDown: startRailDrag,
            onDoubleClick: () => patchSettings({ railWidth: 232 }),
            role: 'separator',
            'aria-orientation': 'vertical',
            'aria-label': '调整草稿栏宽度',
            'aria-valuenow': Math.round(settings.railWidth),
            'aria-valuemin': 180,
            'aria-valuemax': 380,
            tabIndex: 0,
            title: '拖动调整左栏宽度，双击复位',
            onKeyDown: (event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
              event.preventDefault()
              const delta = event.key === 'ArrowRight' ? 16 : -16
              patchSettings({ railWidth: Math.min(380, Math.max(180, settings.railWidth + delta)) })
            },
          })
        : null,

      showEditor
        ? h(
            'section',
            { className: 'mw-editor', ref: editorRef, style: { flexGrow: showPreview && splitMode === 'split' ? settings.splitRatio : 1, flexShrink: 1, flexBasis: 0 } },
            h(
              'div',
              { className: 'mw-editorhead' },
              h(
                'span',
                { style: { display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--mw-dim)', textTransform: 'none', letterSpacing: '0', fontSize: '11.5px' } },
                h('span', { style: { width: '5px', height: '5px', borderRadius: '50%', background: 'var(--mw-accent)', display: 'inline-block' } }),
                '源稿'
              ),
              h('span', { style: { textTransform: 'none', letterSpacing: '0', fontSize: '11.5px' } }, 'Markdown'),
              h('span', { className: 'mw-crumb' }, '~/.dsh/md-workbench'),
              h(
                'span',
                { style: { marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center', textTransform: 'none', letterSpacing: '0' } },
                h('span', { className: 'mw-kbd' }, 'Ctrl'),
                h('span', { className: 'mw-kbd' }, 'S'),
                h('span', { style: { color: 'var(--mw-faint)', fontSize: '10.5px' } }, '保存')
              )
            ),
            h(
              'div',
              { className: 'mw-editorbody' },
              h('textarea', {
                ref: taRef,
                className: 'mw-textarea',
                value: content,
                placeholder: '# 从这里开始写\n\n支持 Markdown 全部常用语法；可以直接粘贴截图。',
                spellCheck: false,
                onChange: (event) => updateContent(event.target.value),
                onKeyDown: onEditorKeyDown,
                onKeyUp: syncCursor,
                onClick: syncCursor,
                onSelect: syncCursor,
                onPaste: onPaste,
                onDrop: onDrop,
                onDragOver: (event) => event.preventDefault(),
                onScroll: onScrollEditor,
                'aria-label': 'Markdown 编辑器',
              })
            )
          )
        : null,

      showEditor && showPreview && splitMode === 'split'
        ? h('div', {
            className: 'mw-splitter',
            onPointerDown: startDrag,
            onDoubleClick: () => patchSettings({ splitRatio: 0.52 }),
            role: 'separator',
            'aria-orientation': 'vertical',
            'aria-label': '调整编辑与预览比例',
            'aria-valuenow': Math.round(settings.splitRatio * 100),
            'aria-valuemin': 24,
            'aria-valuemax': 76,
            tabIndex: 0,
            title: '拖动调整编辑/预览比例，双击复位',
            onKeyDown: (event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
              event.preventDefault()
              const delta = event.key === 'ArrowRight' ? 0.02 : -0.02
              patchSettings({ splitRatio: Math.min(0.76, Math.max(0.24, Math.round((settings.splitRatio + delta) * 1000) / 1000)) })
            },
          })
        : null,

      showPreview
        ? h(
            'section',
            { className: 'mw-preview', ref: previewRef, style: { flexGrow: showEditor && splitMode === 'split' ? 1 - settings.splitRatio : 1, flexShrink: 1, flexBasis: 0 } },
            h(
              'div',
              { className: 'mw-previewhead' },
              h('span', null, '公众号预览'),
              h(
                'div',
                { className: 'mw-popwrap', ref: deviceRef, style: { marginLeft: 'auto' } },
                h(
                  'button',
                  { type: 'button', className: 'mw-toolwide', onClick: () => setDeviceOpen(!deviceOpen), title: '预览设备' },
                  h(Icon, { name: device.id === 'auto' ? 'monitor' : 'phone', size: 12 }),
                  h('strong', null, device.label),
                  h(Icon, { name: 'chevron', size: 11 })
                ),
                deviceOpen
                  ? h(
                      'div',
                      { className: 'mw-menu', style: { minWidth: '210px' } },
                      MDW_DEVICES.map((item) =>
                        h(
                          'button',
                          {
                            key: item.id,
                            type: 'button',
                            onClick: () => {
                              patchSettings({ articleWidth: item.id })
                              setDeviceOpen(false)
                            },
                          },
                          h('span', null, item.label),
                          h('small', null, item.hint),
                          item.id === settings.articleWidth ? h(Icon, { name: 'check', size: 12 }) : null
                        )
                      )
                    )
                  : null
              )
            ),
            h(
              'div',
              { className: 'mw-stage', ref: stageRef },
              h(
                'div',
                { className: 'mw-paper', 'data-width': device.id, style: { maxWidth: paperMax + 'px' } },
                h('style', null, articleCss),
                settings.showStats
                  ? h(
                      'div',
                      { className: 'mw-artstats' },
                      h('span', null, h('b', null, stats.cjk + stats.latin), ' 字'),
                      h('i', null, '·'),
                      h('span', null, '约 ', h('b', null, readingMinutes), ' 分钟'),
                      h('span', { className: 'mw-artstats-tag' }, theme.name)
                    )
                  : null,
                article.html === ''
                  ? h('div', { className: 'mw-empty' }, h('strong', null, '预览是空的'), '在左侧写点什么，这里会实时变成公众号排版')
                  : h('section', { className: 'mdw-art', key: theme.id, ref: articleRef, dangerouslySetInnerHTML: { __html: article.html } })
              )
            )
          )
        : null
    ),

    // ---------- 状态栏 ----------
    h(
      'footer',
      { className: 'mw-status' },
      h('span', null, '行 ', h('b', null, cursor.line), '，列 ', h('b', null, cursor.col)),
      h('span', { className: 'mw-dotsep' }, '·'),
      h('span', null, h('b', null, stats.cjk + stats.latin), ' 字'),
      h('span', { className: 'mw-dotsep' }, '·'),
      h('span', null, '约 ', h('b', null, readingMinutes), ' 分钟'),
      h('span', { className: 'mw-sp' }),
      h('span', null, theme.name),
      h('span', { className: 'mw-dotsep' }, '·'),
      h('span', null, MDW_HL.paletteOf(settings.codeThemeId).label),
      h('span', { className: 'mw-dotsep' }, '·'),
      h('span', null, 'Markdown')
    ),

    // ---------- 浮层 ----------
    toast === null
      ? null
      : h(
          'div',
          { className: 'mw-toast', role: 'status' },
          h(Icon, { name: toast.tone === 'warn' ? 'x' : 'check', size: 14 }),
          toast.text,
          toast.action === null || toast.action === undefined
            ? null
            : h(
                'button',
                {
                  type: 'button',
                  className: 'mw-toastact',
                  onClick: () => {
                    toast.action.run()
                    setToast(null)
                  },
                },
                toast.action.label
              )
        ),
    settingsOpen ? h(SettingsDrawer, { settings, onPatch: patchSettings, onClose: () => setSettingsOpen(false) }) : null,
    dialog === null
      ? null
      : dialog.kind === 'formula'
        ? h(FormulaDialog, { onClose: () => setDialog(null), onInsert: insertSnippet })
        : dialog.kind === 'mermaid'
          ? h(MermaidDialog, { onClose: () => setDialog(null), onInsert: insertSnippet })
          : dialog.kind === 'component'
            ? h(ComponentDialog, { onClose: () => setDialog(null), onInsert: insertSnippet })
            : dialog.kind === 'template'
              ? h(TemplateDialog, { onClose: () => setDialog(null), onPick: (template) => { setDialog(null); insertTemplate(template.body) } })
              : h(CheckDialog, { issues: dialog.issues, onClose: () => setDialog(null), onJump: jumpToLine }),
    modal === null
      ? null
      : modal.kind === 'delete'
        ? h(Modal, {
            title: '删除这篇草稿？',
            onCancel: () => setModal(null),
            onConfirm: () => removeDoc(modal.id),
            confirmLabel: '删除',
          }, h('p', null, '「' + modal.title + '」将被永久删除，无法恢复。'))
        : h(Modal, {
            title: '重命名草稿',
            onCancel: () => setModal(null),
            onConfirm: () => renameDoc(modal.id, modal.value),
            confirmLabel: '保存',
            disabled: modal.value.trim() === '',
          }, h('input', {
            className: 'mw-input',
            style: { width: '100%' },
            value: modal.value,
            autoFocus: true,
            onChange: (event) => setModal({ ...modal, value: event.target.value }),
            onKeyDown: (event) => {
              if (event.key === 'Enter') renameDoc(modal.id, modal.value)
            },
          })),
    h('input', { ref: fileInputRef, type: 'file', accept: 'image/*', style: { display: 'none' }, onChange: (event) => {
      const file = event.target.files === null ? null : event.target.files[0]
      event.target.value = ''
      if (file !== null) uploadImage(file)
    } }),
    h('input', { ref: importInputRef, type: 'file', accept: '.md,.markdown,.txt,text/markdown', style: { display: 'none' }, onChange: onImportFile })
  )
}
