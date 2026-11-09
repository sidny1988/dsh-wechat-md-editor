/**
 * dsh-md-workbench · 公众号MD编辑器 —— Host half.
 *
 * Zero runtime dependencies on purpose: a bundle installed from a local
 * directory resolves modules from its own path, not from the profile's
 * node_modules, so @deepseek-ai/* imports would fail at load. Everything here
 * is node builtins plus the cordis context.
 *
 * Owns:
 *   /plugins/dsh-md-workbench/state       — 草稿列表 + 当前草稿 + 设置
 *   /plugins/dsh-md-workbench/act         — 新建 / 保存 / 重命名 / 删除 / 复制 / 设置
 *   /plugins/dsh-md-workbench/image       — 粘贴图片落盘
 *   /plugins/dsh-md-workbench/image/<id>  — 本地图片读取
 *
 * All drafts live in $DSH_HOME/md-workbench/store.json (atomic writes).
 */
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-md-workbench'
export const inject = ['webServer']

const ROUTE = '/md-workbench'
const STORE_VERSION = 2
const MAX_DOCS = 300
const MAX_CONTENT = 4 * 1024 * 1024
const MAX_TITLE = 120
const MAX_IMAGE = 12 * 1024 * 1024
const IMAGE_NAME_RE = /^img-[a-f0-9]{24}\.(?:png|jpg|webp)$/

const VENDOR_FILES = {
  'mathjax/tex-svg.js': 'text/javascript; charset=utf-8',
  'mermaid/mermaid.min.js': 'text/javascript; charset=utf-8',
  'qrcode/qrcode.js': 'text/javascript; charset=utf-8',
}

const IMAGE_TYPES = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }

const ACCENTS = ['', '#0F4C81', '#009874', '#FA5151', '#FECE00', '#92617E', '#55C9EA', '#B76E79']
const ARTICLE_WIDTHS = ['auto', '375', '390', '414', '768', '1024']
const IMAGE_PROVIDERS = ['local', 'embed', 'github', 'cloudinary', 'custom']

const DEFAULT_SETTINGS = {
  themeId: 'classic',
  codeThemeId: 'github-dark',
  fontFamily: 'system',
  fontSize: 16,
  lineHeight: 1.75,
  paragraphSpacing: 16,
  letterSpacing: 0.4,
  textAlign: 'left',
  indent: false,
  softBreaks: true,
  linkRefs: true,
  pagePadding: 20,
  previewMode: 'split',
  splitRatio: 0.52,
  railWidth: 232,
  surface: 'glass',
  accentSource: 'ink',
  motion: true,
  docRail: true,
  imageProvider: 'local',
  autoUpload: false,
  uploadUrl: '',
  uploadField: 'file',
  uploadHeaders: '',
  uploadPath: 'data.url',
  githubRepo: '',
  githubToken: '',
  githubPath: 'images',
  githubBranch: 'main',
  cloudName: '',
  cloudPreset: '',
  customCss: '',
  codeLineNumbers: false,
  scrollSync: true,
  articleWidth: '375',
  showStats: false,
  accent: '',
}

const WELCOME = [
  '# 欢迎使用公众号MD编辑器',
  '',
  '> 左边写作，右边所见即所得。排版、主题、代码高亮与「复制到公众号」都在同一屏里完成。',
  '',
  '## 三步发布一篇公众号',
  '',
  '1. 在左侧 **文档** 面板新建一篇草稿，或用「导入」读入现成的 `.md` 文件；',
  '2. 在顶部挑一个主题，按「设置」微调字号、行距与段距；',
  '3. 点右上角 **复制到公众号**，到公众号编辑器里直接 `Ctrl+V`。',
  '',
  '### 支持的内容',
  '',
  '| 能力 | 说明 |',
  '| --- | --- |',
  '| Markdown | 标题、列表、任务列表、引用、表格、脚注、分割线 |',
  '| 代码块 | 自动识别语言并高亮，随主题切换配色 |',
  '| 图片 | 直接粘贴 / 拖拽，自动压缩；可配置自定义图床上传 |',
  '| 链接 | 公众号不支持外链，复制时自动转成文末「参考链接」 |',
  '',
  '```js',
  'const hello = (name) => `你好，${name}`',
  'console.log(hello("公众号"))',
  '```',
  '',
  '### 常用快捷键',
  '',
  '- `Ctrl + B` 加粗，`Ctrl + I` 斜体，`Ctrl + K` 插入链接',
  '- `Ctrl + S` 立即保存，`Tab` 缩进选中行',
  '',
  '> 所有草稿都保存在本机 `~/.dsh/md-workbench/`，不会上传任何服务器。',
  '',
  '---',
  '',
  '把这一段删掉，开始写你的第一篇。',
].join('\n')

function dshHome() {
  const env = process.env.DSH_HOME
  return env !== undefined && env.trim() !== '' ? env : join(homedir(), '.dsh')
}

function clampNumber(value, min, max, fallback) {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.min(max, Math.max(min, num))
}

function cleanText(value, limit) {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n?/g, '\n').slice(0, limit)
}

function cleanTitle(value, fallback = '未命名文章') {
  if (typeof value !== 'string') return fallback
  const title = value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE)
  return title === '' ? fallback : title
}

function normalizeSettings(input) {
  const raw = input !== null && typeof input === 'object' ? input : {}
  const pick = (key) => (raw[key] === undefined ? DEFAULT_SETTINGS[key] : raw[key])
  const oneOf = (value, allowed, fallback) => (allowed.indexOf(value) === -1 ? fallback : value)
  // 旧版本存过 doocs 的 id（default / atom-one-dark），读回时映射到本插件目录
  const themeAlias = { default: 'classic' }
  const codeAlias = { 'atom-one-dark': 'github-dark' }
  const widthAlias = { desktop: '677', phone: '375' }
  const providerAlias = { local: 'local', embed: 'embed', custom: 'custom' }
  const themeId = typeof pick('themeId') === 'string' ? pick('themeId').slice(0, 64) : DEFAULT_SETTINGS.themeId
  const codeThemeId = typeof pick('codeThemeId') === 'string' ? pick('codeThemeId').slice(0, 64) : DEFAULT_SETTINGS.codeThemeId
  const rawWidth = pick('articleWidth')
  const width = typeof rawWidth === 'string' && widthAlias[rawWidth] !== undefined ? widthAlias[rawWidth] : rawWidth
  const rawProvider = pick('imageProvider') === undefined ? pick('imageMode') : pick('imageProvider')
  const provider = typeof rawProvider === 'string' && providerAlias[rawProvider] !== undefined ? rawProvider : DEFAULT_SETTINGS.imageProvider
  return {
    themeId: themeAlias[themeId] === undefined ? themeId : themeAlias[themeId],
    codeThemeId: codeAlias[codeThemeId] === undefined ? codeThemeId : codeAlias[codeThemeId],
    fontFamily: oneOf(pick('fontFamily'), ['system', 'serif', 'kai', 'song', 'mono'], DEFAULT_SETTINGS.fontFamily),
    fontSize: clampNumber(pick('fontSize'), 12, 24, DEFAULT_SETTINGS.fontSize),
    lineHeight: clampNumber(pick('lineHeight'), 1.2, 2.6, DEFAULT_SETTINGS.lineHeight),
    paragraphSpacing: clampNumber(pick('paragraphSpacing'), 0, 48, DEFAULT_SETTINGS.paragraphSpacing),
    letterSpacing: clampNumber(pick('letterSpacing'), 0, 3, DEFAULT_SETTINGS.letterSpacing),
    textAlign: oneOf(pick('textAlign'), ['left', 'justify', 'center'], DEFAULT_SETTINGS.textAlign),
    indent: pick('indent') === true,
    softBreaks: pick('softBreaks') !== false,
    linkRefs: pick('linkRefs') !== false,
    pagePadding: clampNumber(pick('pagePadding'), 0, 48, DEFAULT_SETTINGS.pagePadding),
    previewMode: oneOf(pick('previewMode'), ['split', 'editor', 'preview'], DEFAULT_SETTINGS.previewMode),
    splitRatio: clampNumber(pick('splitRatio'), 0.24, 0.76, DEFAULT_SETTINGS.splitRatio),
    railWidth: clampNumber(pick('railWidth'), 180, 380, DEFAULT_SETTINGS.railWidth),
    surface: oneOf(pick('surface'), ['solid', 'glass', 'clear'], DEFAULT_SETTINGS.surface),
    accentSource: oneOf(pick('accentSource'), ['ink', 'host'], DEFAULT_SETTINGS.accentSource),
    motion: pick('motion') !== false,
    docRail: pick('docRail') !== false,
    imageProvider: oneOf(provider, IMAGE_PROVIDERS, DEFAULT_SETTINGS.imageProvider),
    autoUpload: pick('autoUpload') === true,
    uploadUrl: typeof pick('uploadUrl') === 'string' ? pick('uploadUrl').slice(0, 500) : '',
    uploadField: typeof pick('uploadField') === 'string' && pick('uploadField').trim() !== '' ? pick('uploadField').slice(0, 64) : 'file',
    uploadHeaders: typeof pick('uploadHeaders') === 'string' ? pick('uploadHeaders').slice(0, 2000) : '',
    uploadPath: typeof pick('uploadPath') === 'string' && pick('uploadPath').trim() !== '' ? pick('uploadPath').slice(0, 200) : 'data.url',
    githubRepo: typeof pick('githubRepo') === 'string' ? pick('githubRepo').slice(0, 200) : '',
    githubToken: typeof pick('githubToken') === 'string' ? pick('githubToken').slice(0, 400) : '',
    githubPath: typeof pick('githubPath') === 'string' ? pick('githubPath').slice(0, 200) : 'images',
    githubBranch: typeof pick('githubBranch') === 'string' && pick('githubBranch').trim() !== '' ? pick('githubBranch').slice(0, 80) : 'main',
    cloudName: typeof pick('cloudName') === 'string' ? pick('cloudName').slice(0, 120) : '',
    cloudPreset: typeof pick('cloudPreset') === 'string' ? pick('cloudPreset').slice(0, 120) : '',
    customCss: typeof pick('customCss') === 'string' ? pick('customCss').slice(0, 60000) : '',
    codeLineNumbers: pick('codeLineNumbers') === true,
    scrollSync: pick('scrollSync') !== false,
    articleWidth: oneOf(width, ARTICLE_WIDTHS, DEFAULT_SETTINGS.articleWidth),
    showStats: pick('showStats') === true,
    accent: oneOf(pick('accent'), ACCENTS, ''),
  }
}

function newDoc(title, content = '') {
  const now = Date.now()
  return {
    id: 'd_' + now.toString(36) + '_' + randomUUID().slice(0, 8),
    title: cleanTitle(title),
    content,
    createdAt: now,
    updatedAt: now,
  }
}

function emptyStore() {
  const doc = newDoc('欢迎使用公众号MD编辑器', WELCOME)
  return {
    version: STORE_VERSION,
    activeId: doc.id,
    order: [doc.id],
    docs: { [doc.id]: doc },
    settings: { ...DEFAULT_SETTINGS },
    revision: 1,
    updatedAt: Date.now(),
  }
}

/** Image format read from the file header. A data URL's declared MIME is a
 *  claim, not evidence, so the bytes get the final say. */
function sniffImageFormat(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return undefined
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return 'png'
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  if (buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP') return 'webp'
  return undefined
}

function decodeImageDataUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return { ok: false, error: '缺少图片数据' }
  const raw = value.trim()
  const match = /^data:([^;,]+)(?:\s*;[^;,]*)*\s*;base64,([\s\S]*)$/i.exec(raw)
  if (match === null) return { ok: false, error: '仅支持 base64 图片' }
  const mime = match[1].trim().toLowerCase()
  if (mime !== 'image/png' && mime !== 'image/jpeg' && mime !== 'image/webp') {
    return { ok: false, error: '仅支持 PNG / JPEG / WebP' }
  }
  const payload = match[2].replace(/\s+/g, '')
  if (payload === '' || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) return { ok: false, error: '图片数据无效' }
  const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
  if ((padded.length / 4) * 3 > MAX_IMAGE + 3) return { ok: false, error: '图片过大（上限 12MB）' }
  const buffer = Buffer.from(padded, 'base64')
  if (buffer.length === 0) return { ok: false, error: '图片为空' }
  if (buffer.length > MAX_IMAGE) return { ok: false, error: '图片过大（上限 12MB）' }
  const format = sniffImageFormat(buffer)
  if (format === undefined) return { ok: false, error: '无法识别图片格式' }
  return { ok: true, buffer, ext: format }
}

function send(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(Buffer.byteLength(body)),
    'cache-control': 'no-store',
  })
  res.end(body)
}

function readJsonBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('请求体过大'))
        try {
          req.destroy()
        } catch {
          /* already gone */
        }
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new Error('JSON 解析失败'))
      }
    })
    req.on('error', reject)
  })
}

export function apply(ctx) {
  const baseDir = join(dshHome(), 'md-workbench')
  const storeFile = join(baseDir, 'store.json')
  const imagesDir = join(baseDir, 'images')
  const vendorDir = join(dirname(fileURLToPath(import.meta.url)), 'vendor')

  let store
  let saving = Promise.resolve()

  function loadStore() {
    if (store !== undefined) return store
    store = emptyStore()
    let parsed
    try {
      parsed = JSON.parse(readFileSync(storeFile, 'utf8'))
    } catch {
      parsed = undefined
    }
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const docs = {}
      if (parsed.docs !== null && typeof parsed.docs === 'object' && !Array.isArray(parsed.docs)) {
        for (const key of Object.keys(parsed.docs)) {
          const doc = parsed.docs[key]
          if (doc === null || typeof doc !== 'object') continue
          if (typeof doc.id !== 'string' || typeof doc.content !== 'string') continue
          docs[doc.id] = {
            id: doc.id,
            title: cleanTitle(doc.title),
            content: doc.content.slice(0, MAX_CONTENT),
            createdAt: typeof doc.createdAt === 'number' ? doc.createdAt : Date.now(),
            updatedAt: typeof doc.updatedAt === 'number' ? doc.updatedAt : Date.now(),
          }
        }
      }
      if (Object.keys(docs).length > 0) {
        store.docs = docs
        store.order = Array.isArray(parsed.order) ? parsed.order.filter((id) => typeof id === 'string' && docs[id] !== undefined) : []
        for (const id of Object.keys(docs)) if (store.order.indexOf(id) === -1) store.order.push(id)
        store.activeId = typeof parsed.activeId === 'string' && docs[parsed.activeId] !== undefined ? parsed.activeId : store.order[0]
        store.settings = normalizeSettings(parsed.settings)
        store.revision = typeof parsed.revision === 'number' ? parsed.revision : 1
        store.version = STORE_VERSION
      }
    }
    return store
  }

  function persist() {
    const snapshot = JSON.stringify(loadStore(), null, 2)
    saving = saving
      .then(async () => {
        await mkdir(dirname(storeFile), { recursive: true })
        const tmp = storeFile + '.tmp'
        await writeFile(tmp, snapshot, 'utf8')
        await rename(tmp, storeFile)
      })
      .catch(() => {
        /* a failed save must not break the next one */
      })
    return saving
  }

  function touch() {
    const data = loadStore()
    data.revision = (data.revision || 0) + 1
    data.updatedAt = Date.now()
    return persist()
  }

  function docSummary(doc) {
    return {
      id: doc.id,
      title: doc.title,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      chars: doc.content.replace(/\s+/g, '').length,
    }
  }

  function buildState() {
    const data = loadStore()
    const docs = data.order.map((id) => data.docs[id]).filter(Boolean)
    const active = data.docs[data.activeId] !== undefined ? data.docs[data.activeId] : docs[0]
    return {
      ok: true,
      revision: data.revision,
      settings: data.settings,
      order: data.order,
      activeId: active !== undefined ? active.id : '',
      docs: docs.map(docSummary),
      active: active !== undefined ? { ...docSummary(active), content: active.content } : null,
    }
  }

  function createDoc(title, content) {
    const data = loadStore()
    if (data.order.length >= MAX_DOCS) return { error: '文档数量已达上限（' + MAX_DOCS + '）' }
    const doc = newDoc(title === undefined || title === '' ? '未命名文章' : title, content === undefined ? '' : cleanText(content, MAX_CONTENT))
    data.docs[doc.id] = doc
    data.order.unshift(doc.id)
    data.activeId = doc.id
    return { doc }
  }

  async function runAction(action, body) {
    const data = loadStore()
    const id = typeof body.id === 'string' ? body.id : ''
    switch (action) {
      case 'doc.create': {
        const created = createDoc(body.title, body.content)
        if (created.error !== undefined) return created
        await touch()
        return { ok: true }
      }
      case 'doc.import': {
        const created = createDoc(body.title, body.content)
        if (created.error !== undefined) return created
        await touch()
        return { ok: true, id: created.doc.id }
      }
      case 'doc.save': {
        const doc = data.docs[id]
        if (doc === undefined) return { error: '文档不存在' }
        doc.content = cleanText(body.content, MAX_CONTENT)
        if (typeof body.title === 'string' && body.title.trim() !== '') doc.title = cleanTitle(body.title)
        doc.updatedAt = Date.now()
        await touch()
        return { ok: true, savedAt: doc.updatedAt }
      }
      case 'doc.rename': {
        const doc = data.docs[id]
        if (doc === undefined) return { error: '文档不存在' }
        doc.title = cleanTitle(body.title, doc.title)
        doc.updatedAt = Date.now()
        await touch()
        return { ok: true }
      }
      case 'doc.duplicate': {
        const source = data.docs[id]
        if (source === undefined) return { error: '文档不存在' }
        const copy = newDoc(source.title + ' 副本', source.content)
        data.docs[copy.id] = copy
        data.order.splice(Math.max(0, data.order.indexOf(id) + 1), 0, copy.id)
        data.activeId = copy.id
        await touch()
        return { ok: true }
      }
      case 'doc.delete': {
        const doc = data.docs[id]
        if (doc === undefined) return { error: '文档不存在' }
        delete data.docs[id]
        data.order = data.order.filter((docId) => docId !== id)
        if (data.order.length === 0) {
          const fresh = newDoc('未命名文章', '# 新文章\n\n')
          data.docs[fresh.id] = fresh
          data.order = [fresh.id]
        }
        if (data.activeId === id) data.activeId = data.order[0]
        await touch()
        return { ok: true }
      }
      case 'doc.setActive': {
        if (data.docs[id] === undefined) return { error: '文档不存在' }
        data.activeId = id
        await touch()
        return { ok: true }
      }
      case 'settings.save': {
        data.settings = normalizeSettings(body.settings)
        await touch()
        return { ok: true }
      }
      default:
        return { error: '未知操作: ' + String(action) }
    }
  }

  ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE,
    handler: async (req, res) => {
      const url = new URL(req.url === undefined ? '/' : req.url, 'http://localhost')
      const suffix = url.pathname.slice(ROUTE.length)
      try {
        if (suffix === '/state' && req.method === 'GET') {
          send(res, 200, buildState())
          return
        }
        if (suffix === '/act' && req.method === 'POST') {
          const body = await readJsonBody(req)
          const result = await runAction(body.action, body)
          if (result.error !== undefined) {
            send(res, 400, { ok: false, error: result.error })
            return
          }
          send(res, 200, { ...result, state: buildState() })
          return
        }
        if (suffix === '/image' && req.method === 'POST') {
          const body = await readJsonBody(req, MAX_IMAGE * 2)
          const decoded = decodeImageDataUrl(body.dataUrl)
          if (decoded.ok !== true) {
            send(res, 400, { ok: false, error: decoded.error })
            return
          }
          const hash = createHash('sha256').update(decoded.buffer).digest('hex').slice(0, 24)
          const filename = 'img-' + hash + '.' + decoded.ext
          await mkdir(imagesDir, { recursive: true })
          const target = join(imagesDir, filename)
          let exists = true
          try {
            await stat(target)
          } catch {
            exists = false
          }
          if (!exists) await writeFile(target, decoded.buffer)
          send(res, 200, { ok: true, url: ROUTE + '/image/' + filename, filename, bytes: decoded.buffer.length })
          return
        }
        if (suffix.startsWith('/image/') && (req.method === 'GET' || req.method === 'HEAD')) {
          const raw = decodeURIComponent(suffix.slice('/image/'.length))
          if (!IMAGE_NAME_RE.test(raw)) {
            send(res, 400, { ok: false, error: 'bad image name' })
            return
          }
          const file = join(imagesDir, raw)
          let info
          try {
            info = await stat(file)
          } catch {
            send(res, 404, { ok: false, error: 'image not found' })
            return
          }
          if (!info.isFile()) {
            send(res, 404, { ok: false, error: 'image not found' })
            return
          }
          const extension = raw.slice(raw.lastIndexOf('.') + 1)
          const type = IMAGE_TYPES[extension] === undefined ? 'application/octet-stream' : IMAGE_TYPES[extension]
          if (req.method === 'HEAD') {
            res.writeHead(200, { 'content-type': type, 'content-length': String(info.size), 'cache-control': 'public, max-age=31536000' })
            res.end()
            return
          }
          const bytes = await readFile(file)
          res.writeHead(200, {
            'content-type': type,
            'content-length': String(bytes.length),
            'cache-control': 'public, max-age=31536000',
          })
          res.end(bytes)
          return
        }
        if (suffix.startsWith('/vendor/') && (req.method === 'GET' || req.method === 'HEAD')) {
          const raw = decodeURIComponent(suffix.slice('/vendor/'.length))
          const type = VENDOR_FILES[raw]
          if (type === undefined) {
            send(res, 404, { ok: false, error: 'vendor not found' })
            return
          }
          const file = join(vendorDir, raw)
          let info
          try {
            info = await stat(file)
          } catch {
            send(res, 404, { ok: false, error: 'vendor not found' })
            return
          }
          const headers = {
            'content-type': type,
            'content-length': String(info.size),
            'cache-control': 'public, max-age=31536000, immutable',
          }
          if (req.method === 'HEAD') {
            res.writeHead(200, headers)
            res.end()
            return
          }
          const bytes = await readFile(file)
          res.writeHead(200, headers)
          res.end(bytes)
          return
        }
        if (suffix === '/health') {
          send(res, 200, { ok: true, plugin: name, version: STORE_VERSION })
          return
        }
        send(res, 404, { ok: false, error: 'not found' })
      } catch (error) {
        const message = error !== null && error !== undefined && error.message !== undefined ? error.message : String(error)
        send(res, 400, { ok: false, error: String(message).slice(0, 400) })
      }
    },
  })
}
