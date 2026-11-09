/**
 * 新能力单元测试：HTML → Markdown、发布前检查、模板库完整性。
 * 不需要完整 React 环境，只借 jsdom 提供 DOMParser。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.com/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.DOMParser = dom.window.DOMParser

const load = (file, name) => {
  const source = readFileSync(new URL('../src/' + file, import.meta.url), 'utf8')
  return dom.window.eval(source + '\n' + name)
}

const toMarkdown = load('htmlmd.js', 'mdwHtmlToMarkdown')
const publishCheck = load('check.js', 'mdwPublishCheck')
const templates = load('templates.js', 'MDW_TEMPLATES')

// ---------- HTML → Markdown ----------
const html = [
  '<h2>小标题</h2>',
  '<p>正文里有 <strong>粗体</strong>、<em>斜体</em> 和 <a href="https://example.com/a">链接</a>。</p>',
  '<ul><li>第一项</li><li>第二项<ul><li>子项</li></ul></li></ul>',
  '<blockquote><p>一段引用</p></blockquote>',
  '<pre><code class="language-js">const a = 1\nconsole.log(a)</code></pre>',
  '<table><tr><th>列 A</th><th>列 B</th></tr><tr><td>1</td><td>2</td></tr></table>',
  '<p><img src="https://example.com/a.png" alt="配图"></p>',
  '<section style="font-weight: 700;">整段加粗</section>',
].join('')
const markdown = toMarkdown(html)
assert.match(markdown, /## 小标题/, '标题应转换')
assert.match(markdown, /\*\*粗体\*\*/, '粗体应转换')
assert.match(markdown, /\*斜体\*/, '斜体应转换')
assert.match(markdown, /\[链接\]\(https:\/\/example\.com\/a\)/, '链接应转换')
assert.match(markdown, /- 第一项/, '无序列表应转换')
assert.match(markdown, /  - 子项/, '嵌套列表应缩进')
assert.match(markdown, /> 一段引用/, '引用应转换')
assert.match(markdown, /```js\nconst a = 1/, '代码块应保留语言与缩进')
assert.match(markdown, /\| 列 A \| 列 B \|/, '表格表头应转换')
assert.match(markdown, /\| --- \| --- \|/, '表格分隔行应生成')
assert.match(markdown, /!\[配图\]\(https:\/\/example\.com\/a\.png\)/, '图片应转换')
assert.match(markdown, /\*\*整段加粗\*\*/, '内联样式加粗应识别')
assert.equal(toMarkdown('<script>alert(1)</script><style>.a{}</style>'), '', '脚本与样式应丢弃')

// ---------- 发布前检查 ----------
const issues = publishCheck(
  '# 标题\n\n[外链](https://example.com)\n\n[空链接]()\n\n```js\nconst a = 1\n',
  { linkRefs: false, imageProvider: 'local' },
  null
)
const titles = issues.map((issue) => issue.title)
assert.ok(titles.includes('代码块没有闭合'), '应发现未闭合代码块')
assert.ok(titles.includes('空链接'), '应发现空链接')
assert.ok(titles.includes('外链在公众号里不可点击'), '应发现未转脚注的外链')
assert.ok(titles.includes('多个一级标题') === false, '单个 H1 不应误报')

const clean = publishCheck('# 标题\n\n正文。\n\n## 小节\n\n- 列表\n', { linkRefs: true, imageProvider: 'local' }, null)
assert.equal(clean.length, 0, '干净文章不应有告警：' + JSON.stringify(clean))

const localImage = publishCheck('# 标题\n\n![图](/md-workbench/image/a.png)\n', { linkRefs: true, imageProvider: 'local' }, null)
assert.ok(localImage.some((issue) => issue.title === '本地图片在公众号可能不显示'), '应提示本地图片')

const imageOnly = publishCheck('# 标题\n\n![图](https://example.com/a.png)\n', { linkRefs: false, imageProvider: 'local' }, null)
assert.equal(imageOnly.some((issue) => issue.title === '外链在公众号里不可点击'), false, '图片不应被误报为外链')

const tableMismatch = publishCheck('# 标题\n\n| A | B |\n| --- | --- |\n| 1 | 2 | 3 |\n', { linkRefs: true, imageProvider: 'local' }, null)
assert.ok(tableMismatch.some((issue) => issue.title === '表格列数不一致'), '应发现表格列数不一致')

// ---------- 模板库 ----------
assert.equal(templates.length, 6, '应有 6 套模板')
const ids = new Set(templates.map((item) => item.id))
assert.equal(ids.size, templates.length, '模板 id 应唯一')
for (const template of templates) {
  assert.ok(template.name.length > 0, '模板应有名称')
  assert.ok(template.body.length > 80, '模板正文不应为空：' + template.id)
  assert.ok(template.body.startsWith('# '), '模板应以一级标题开头：' + template.id)
  assert.ok(template.body.indexOf('【') !== -1, '模板应带占位符：' + template.id)
}

console.log('features ok · html→md + publish check + templates')
