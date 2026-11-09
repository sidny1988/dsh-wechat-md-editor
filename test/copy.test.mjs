/**
 * 复制产物测试：模拟「复制到公众号」，检查产出的 HTML 是否把主题样式
 * 真正内联到了每个元素上（公众号会丢弃 class / <style>）。
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { strict as assert } from 'node:assert'

const localRequire = createRequire(new URL('../package.json', import.meta.url))
const { JSDOM } = localRequire('jsdom')

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost:59554/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.location = dom.window.location

const evalExpr = (file, expression) => dom.window.eval(readFileSync(new URL('../src/' + file, import.meta.url), 'utf8') + '\n' + expression)
const engine = evalExpr('engine.js', 'MDW_ENGINE')
const themes = evalExpr('themes.js', 'MDW_THEMES')
const inliner = evalExpr('inline.js', 'MDW_INLINE')

const settings = {
  fontFamily: 'system',
  fontSize: 16,
  lineHeight: 1.75,
  paragraphSpacing: 16,
  letterSpacing: 0.4,
  textAlign: 'left',
  indent: false,
  pagePadding: 20,
  customCss: '',
}

const markdown = [
  '# 标题一号',
  '',
  '正文包含 **强调**、`行内代码` 与 [外链](https://example.com/x)。',
  '',
  '> 一段引用',
  '',
  '| 列 A | 列 B |',
  '| --- | --- |',
  '| 1 | 2 |',
  '',
  '```js',
  'const a = 1',
  '```',
  '',
  '- 项目一',
  '- 项目二',
  '',
  '![配图](/md-workbench/image/img-x.png)',
].join('\n')

const rendered = engine.render(markdown, { linkRefs: true, softBreaks: true })
const theme = themes.byId('classic')
const css = themes.cssFor(theme, settings)
const html = inliner.toWechatHtml(rendered.html, css)

const holder = dom.window.document.createElement('div')
holder.innerHTML = html
const section = holder.firstElementChild

const styleOf = (el) => el.getAttribute('style') || ''

assert.equal(section.tagName, 'SECTION', '根节点应是 section')
assert.equal(section.getAttribute('class'), null, '根节点的 class 应被移除')
assert.match(styleOf(section), /background/, '根节点应有背景色')
assert.match(styleOf(section), /font-size:\s*16px/, '根节点应有字号')
assert.match(styleOf(section), /padding:\s*10px 20px 14px/, '根节点应有页边距')

const h1 = holder.querySelector('h1')
assert.ok(h1 !== null)
assert.match(styleOf(h1), /border-bottom:\s*2px solid/, 'h1 应带主题色下边框')
assert.match(styleOf(h1), /text-align:\s*center/)
assert.match(styleOf(h1), /font-size:\s*1\.2em/, 'h1 字号应被内联（相对根字号）')

const p = holder.querySelector('p')
assert.match(styleOf(p), /margin:\s*16px 0/, '段落间距应内联')
assert.match(styleOf(p), /letter-spacing:\s*0\.08em/, '主题的字距覆盖应生效')

const strong = holder.querySelector('strong')
assert.match(styleOf(strong), /color:\s*(#0F4C81|rgb\(15, 76, 129\))/i, 'strong 应使用主题色')

const blockquote = holder.querySelector('blockquote')
assert.match(styleOf(blockquote), /background/, '引用应有底色')
assert.match(styleOf(blockquote), /border-left:\s*4px solid/, '引用应有左边框')

const th = holder.querySelector('th')
assert.match(styleOf(th), /background/, '表头应有底色')
assert.match(styleOf(th), /border:\s*1px solid/, '表头应有边框')

const codeblock = holder.querySelector('.mdw-codeblock')
assert.ok(codeblock !== null)
assert.match(styleOf(codeblock), /background/, '代码块外壳应有背景')

const img = holder.querySelector('img')
assert.match(img.getAttribute('src'), /^http:\/\/localhost:59554\/md-workbench\//, '本地图片应转成绝对地址')

const link = holder.querySelector('a')
assert.match(styleOf(link), /color:\s*(#576b95|rgb\(87, 107, 149\))/i, '链接应保留微信蓝')

assert.ok(holder.innerHTML.includes('参考链接'), '外链应生成文末参考链接')

// 主题切换必须真的改变产物
const nightCss = themes.cssFor(themes.byId('night'), settings)
const nightHtml = inliner.toWechatHtml(rendered.html, nightCss)
const nightHolder = dom.window.document.createElement('div')
nightHolder.innerHTML = nightHtml
assert.match(nightHolder.firstElementChild.getAttribute('style'), /background:\s*(#16181d|rgb\(22, 24, 29\))/i)

// 所有 12 套主题都应能产出带内联样式的 HTML
for (const item of themes.THEMES) {
  const out = inliner.toWechatHtml(rendered.html, themes.cssFor(item, settings))
  assert.ok(out.length > 500, item.id + ' 产物过短')
  assert.ok(out.includes('style='), item.id + ' 产物没有内联样式')
}

console.log('copy ok · inline styles verified · ' + themes.THEMES.length + ' themes')
