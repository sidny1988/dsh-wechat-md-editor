/**
 * UI 冒烟测试：在 jsdom 里真实挂载插件面板，验证
 *   1. apply() 能把 sidebar.panellist / main 两个座位注册出去
 *   2. 首屏能从 /state 拉数据并渲染出预览
 *   3. 主题弹层有 12 套主题，点选后预览样式随之变化
 *   4. 编辑正文后预览更新、状态栏字数变化
 *   5. CSS 内联器把主题样式写进元素 style
 *
 * 依赖 profile 里已有的 react / react-dom / jsdom。
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { strict as assert } from 'node:assert'

const profileRequire = createRequire(new URL('../package.json', import.meta.url))
const React = profileRequire('react')
const { JSDOM } = profileRequire('jsdom')

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost:59554/',
  pretendToBeVisual: true,
  runScripts: 'dangerously',
})
const { window } = dom
window.ResizeObserver = class {
  observe() {}
  disconnect() {}
}
window.ClipboardItem = class {
  constructor(map) {
    this.map = map
  }
}

// react-dom 在渲染时读取裸 window/document，这里把 jsdom 的全局暴露给 Node。
globalThis.window = window
globalThis.document = window.document
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true })
for (const key of ['HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'DragEvent', 'ClipboardEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'CSS', 'DOMParser', 'XMLSerializer']) {
  if (window[key] !== undefined) globalThis[key] = typeof window[key] === 'function' && key !== 'CSS' ? window[key].bind(window) : window[key]
}
const { createRoot } = profileRequire('react-dom/client')

const STATE = {
  ok: true,
  revision: 3,
  settings: {
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
    showStats: true,
    accent: '',
  },
  order: ['d_1'],
  activeId: 'd_1',
  docs: [{ id: 'd_1', title: '测试文章', createdAt: 1, updatedAt: Date.now(), chars: 12 }],
  active: {
    id: 'd_1',
    title: '测试文章',
    createdAt: 1,
    updatedAt: Date.now(),
    chars: 12,
    content: '# 你好，公众号MD编辑器\n\n这是 **粗体** 与 `代码`。\n\n> 一段引用\n\n- 列表一\n- 列表二\n\n```js\nconst a = 1\n```\n',
  },
}

window.fetch = async (url, init) => {
  const body = init !== undefined && typeof init.body === 'string' ? JSON.parse(init.body) : {}
  if (String(url).endsWith('/state')) {
    return { ok: true, status: 200, json: async () => STATE }
  }
  if (String(url).endsWith('/act')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, savedAt: Date.now(), state: { ...STATE, settings: body.settings === undefined ? STATE.settings : body.settings } }),
    }
  }
  if (String(url).endsWith('/image')) {
    return { ok: true, status: 200, json: async () => ({ ok: true, url: '/plugins/dsh-md-workbench/image/img-x.png' }) }
  }
  return { ok: false, status: 404, json: async () => ({ ok: false, error: 'not found' }) }
}

const code = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
const registrations = {}
let captured = null
window.__ModuleLoader__ = {
  load(definition) {
    captured = definition
  },
}
window.eval(code)
assert.ok(captured !== null, '客户端模块应调用 __ModuleLoader__.load')
assert.equal(captured.id, 'dsh-md-workbench')

const plugin = captured.factory((id) => (id === 'react' ? React : {}))
assert.ok(Array.isArray(plugin.inject) && plugin.inject.includes('slots'))

const ctx = {
  slots: {
    inject(seat, factory) {
      factory()
      return () => {}
    },
    register(options, component) {
      registrations[options.key !== undefined ? options.key : options.id] = { options, component }
      return () => {}
    },
  },
  get(name) {
    return name === 'layout' ? { selectPanel() {} } : undefined
  },
}
plugin.apply(ctx)
assert.ok(registrations['md-workbench'] !== undefined, '应注册 main 面板')
assert.ok(registrations['md-workbench'].component !== undefined)

const Page = registrations['md-workbench'].component
const container = window.document.getElementById('app')
const root = createRoot(container)
root.render(React.createElement(Page))

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const waitFor = async (predicate, timeout = 2500) => {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (predicate()) return true
    await wait(25)
  }
  return false
}
await waitFor(() => container.querySelector('.mdw-art') !== null)

const text = () => container.textContent || ''
const $ = (selector) => container.querySelector(selector)
const $$ = (selector) => Array.from(container.querySelectorAll(selector))

assert.ok($('.mw-root') !== null, '应渲染工作台根节点')
assert.ok($('.mw-paper') !== null, '应有预览纸面')
assert.ok($('.mdw-art') !== null, '预览应渲染文章')
assert.ok($('.mw-artstats') !== null, '开启字数统计后应有统计条')
assert.match($('.mw-artstats').textContent, /字/)
assert.match($('.mw-artstats').textContent, /分钟/)
assert.ok($('.mw-previewhead .mw-toolwide').textContent.includes('iPhone SE'), '设备选择器应显示当前设备')
assert.match($('.mdw-art').innerHTML, /<h1[^>]*>你好，公众号MD编辑器<\/h1>/)
assert.match($('.mdw-art').innerHTML, /<strong>粗体<\/strong>/)
assert.match($('.mdw-art').innerHTML, /mdw-codeblock/)
assert.ok(text().includes('测试文章'))
assert.ok($$('.mw-docitem').length >= 1, '草稿列表应有条目')
const splitters = $$('.mw-splitter')
assert.ok(splitters.length >= 2, '应有左栏与编辑/预览两条分隔条')
assert.ok(splitters.some((node) => node.getAttribute('aria-label') === '调整草稿栏宽度'), '左栏分隔条应可访问')

// 主题弹层：12 套
const themeButton = $$('.mw-toolwide')[0]
assert.ok(themeButton !== undefined, '应有主题按钮')
themeButton.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }))
themeButton.click()
await wait(50)
assert.ok($('.mw-pop') !== null, '主题弹层应打开')
assert.equal($$('.mw-themecard').length, 12, '应有 12 套主题')
const styleBefore = $('.mw-paper style').textContent
const lastCard = $$('.mw-themecard')[$$('.mw-themecard').length - 1]
lastCard.click()
await wait(60)
const styleAfter = $('.mw-paper style').textContent
assert.notEqual(styleBefore, styleAfter, '切换主题后预览样式应变化')

// 编辑正文 → 预览与字数联动（React 受控组件需要走原生 setter）
const textarea = $('.mw-textarea')
assert.ok(textarea !== null)
const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
valueSetter.call(textarea, '# 新标题\n\n新段落，加一点内容。')
textarea.dispatchEvent(new window.Event('input', { bubbles: true }))
await wait(260)
assert.match($('.mdw-art').innerHTML, /新标题/, '预览应随输入更新')
assert.ok($$('.mw-docitem').length >= 1)

// 模板库：插入 → 模板 → 选第一套
const buttonByText = (root, label) => Array.from(root.querySelectorAll('button')).filter((button) => (button.textContent || '').includes(label))[0]
const insertButton = $('.mw-toolwide--accent')
assert.ok(insertButton !== null, '应有插入按钮')
insertButton.click()
await wait(60)
const templateEntry = buttonByText($('.mw-menu'), '模板')
assert.ok(templateEntry !== undefined, '插入菜单里应有模板入口')
templateEntry.click()
await waitFor(() => $('.mw-modal') !== null)
assert.equal($$('.mw-tplcard').length, 6, '应有 6 套模板')
$$('.mw-tplcard')[0].click()
await wait(150)
assert.match($('.mw-textarea').value, /【活动名称】/, '模板应插入正文')
assert.equal($('.mw-modal') === null, true, '选择模板后应关闭弹窗')

// 发布前检查：文件 → 发布前检查
const fileButton = $$('.mw-actions .mw-btn--ghost')[0]
assert.ok(fileButton !== undefined, '应有文件菜单按钮')
fileButton.click()
await wait(60)
const checkEntry = buttonByText($('.mw-menu'), '发布前检查')
assert.ok(checkEntry !== undefined, '文件菜单应有发布前检查')
checkEntry.click()
await waitFor(() => $('.mw-modal') !== null)
assert.ok($('.mw-modal').textContent.includes('发布前检查'), '应打开检查弹窗')
assert.ok($('.mw-checkok') !== null || $('.mw-checkrow') !== null, '检查结果应有内容')
const dismiss = buttonByText($('.mw-modal'), '知道了')
if (dismiss !== undefined) dismiss.click()
await wait(80)

// 外观：材质 / 主色 / 动效
assert.equal($('.mw-root').getAttribute('data-surface'), 'glass', '应应用玻璃材质')
assert.equal($('.mw-root').getAttribute('data-motion'), '1', '动效应默认开启')
assert.match($('.mw-root').style.getPropertyValue('--mw-bg'), /^rgb/, '宿主底色应被拍平成不透明色')
assert.match($('.mw-root').style.getPropertyValue('--mw-card'), /^rgb/, '宿主卡片色应被拍平')
const settingsButton = $$('.mw-actions .mw-btn--icon')[1]
assert.ok(settingsButton !== undefined, '应有设置按钮')
settingsButton.click()
await waitFor(() => $('.mw-drawer') !== null)
assert.ok($('.mw-drawer').textContent.includes('外观'), '设置里应有外观分区')
assert.ok($('.mw-drawer').textContent.includes('跟随皮肤'), '主色应可跟随皮肤')
assert.ok($('.mw-drawer').textContent.includes('通透'), '材质应有三档')

// CSS 内联器
const section = window.document.createElement('section')
section.className = 'mdw-art'
section.innerHTML = '<h1>标题</h1><p>正文</p>'
const css = '.mdw-art h1{color:#123456} .mdw-art p{font-size:15px}'
const MDW_INLINE = (() => {
  // 从 bundle 中取出内联器：直接再跑一次 factory 的模块作用域不可达，这里改为
  // 单独 eval src/inline.js。
  const source = readFileSync(new URL('../src/inline.js', import.meta.url), 'utf8')
  return window.eval(source + '\nMDW_INLINE')
})()
MDW_INLINE.apply(section, css)
const h1 = section.querySelector('h1')
assert.match(h1.getAttribute('style') || '', /color:\s*(#123456|rgb\(18, 52, 86\))/)
assert.match(section.querySelector('p').getAttribute('style') || '', /font-size:\s*15px/)

console.log('ui ok · panel + preview + themes + inline')
root.unmount()

