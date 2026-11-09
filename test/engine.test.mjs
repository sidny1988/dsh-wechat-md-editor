import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'

const code = readFileSync(new URL('../src/engine.js', import.meta.url), 'utf8')
const engine = new Function(code + '\nreturn MDW_ENGINE')()

function render(md, options) {
  return engine.render(md, options || {})
}

// 1. 标题 / 强调 / 行内代码
{
  const { html, headings } = render('# 标题\n\n这是 **粗** 与 *斜* 和 `code`。')
  assert.match(html, /<h1 class="mdw-h1">标题<\/h1>/)
  assert.match(html, /<strong>粗<\/strong>/)
  assert.match(html, /<em>斜<\/em>/)
  assert.match(html, /<code class="mdw-code-inline">code<\/code>/)
  assert.equal(headings.length, 1)
}

// 2. 表格
{
  const { html } = render('| A | B |\n| :- | -: |\n| 1 | 2 |')
  assert.match(html, /<table class="mdw-table">/)
  assert.match(html, /text-align:right/)
  assert.match(html, /<td class="mdw-td"[^>]*>1<\/td>/)
}

// 3. 任务列表 + 嵌套
{
  const { html } = render('- [x] 完成\n- [ ] 待办\n  - 子项')
  assert.match(html, /data-checked="1"/)
  assert.match(html, /data-checked="0"/)
  assert.match(html, /<ul class="mdw-list">/)
  assert.equal((html.match(/<ul/g) || []).length, 2)
}

// 4. 有序列表起始编号
{
  const { html } = render('3. 三\n4. 四')
  assert.match(html, /<ol class="mdw-list" start="3">/)
}

// 5. 引用
{
  const { html } = render('> 引用 **重点**\n> 第二行')
  assert.match(html, /<blockquote class="mdw-quote"><p class="mdw-p">/)
  assert.match(html, /<strong>重点<\/strong>/)
}

// 6. 代码块
{
  const { html } = render('```js\nconst a = 1\n```')
  assert.match(html, /<div class="mdw-codeblock">/)
  assert.match(html, /<span class="mdw-lang">JS<\/span>/)
  assert.match(html, /<pre class="mdw-pre" data-lang="js">/)
  assert.match(html, /const a = 1/)
}

// 7. 链接引用 + 参考链接
{
  const { html } = render('见 [文档](https://example.com/a)。')
  assert.match(html, /<sup class="mdw-ref">\[1\]<\/sup>/)
  assert.match(html, /参考链接/)
  assert.match(html, /https:\/\/example.com\/a/)
}

// 8. 关闭链接引用
{
  const { html } = render('见 [文档](https://example.com/a)。', { linkRefs: false })
  assert.doesNotMatch(html, /mdw-refs/)
  assert.match(html, /<a class="mdw-link" href="https:\/\/example.com\/a">文档<\/a>/)
}

// 9. 脚注
{
  const { html } = render('正文[^1]\n\n[^1]: 注解内容')
  assert.match(html, /mdw-footnotes/)
  assert.match(html, /注解内容/)
}

// 10. 目录
{
  const { html } = render('[TOC]\n\n## 一\n\n## 二')
  assert.match(html, /mdw-toc/)
  assert.match(html, /<span class="mdw-toc-text">一<\/span>/)
}

// 11. 裸链接 + 标点
{
  const { html } = render('访问 https://example.com/x，谢谢')
  assert.match(html, /href="https:\/\/example.com\/x"/)
  assert.match(html, /，/)
}

// 12. 软换行
{
  const { html } = render('第一行\n第二行')
  assert.match(html, /<br \/>/)
  const spaced = render('第一行\n第二行', { softBreaks: false })
  assert.doesNotMatch(spaced.html, /<br \/>/)
}

// 13. 图片
{
  const { html } = render('![封面](https://example.com/a.png)')
  assert.match(html, /<img class="mdw-img" src="https:\/\/example.com\/a.png" alt="封面" \/>/)
}

// 14. 转义
{
  const { html } = render('<script>alert(1)</script>')
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
}

// 15. 字数
{
  const stats = engine.countWords('中文三个字 hello world')
  assert.equal(stats.cjk, 5)
  assert.equal(stats.latin, 2)
}

// 16. 行内公式（含货币排除）
{
  const { html } = render('质能方程 $E=mc^2$，价格 $5 与 $10')
  assert.match(html, /class="mdw-math" data-display="0" data-tex="E=mc\^2"/)
  assert.doesNotMatch(html, /data-tex="5"/)
}

// 17. 块级公式
{
  const { html } = render('$$\n\\frac{a}{b}\n$$')
  assert.match(html, /class="mdw-math" data-display="1"/)
  assert.match(html, /data-tex="\\frac\{a\}\{b\}"/)
}

// 18. Mermaid 代码块转图表占位
{
  const { html } = render('```mermaid\ngraph TD\nA-->B\n```')
  assert.match(html, /class="mdw-mermaid"/)
  assert.match(html, /data-code="graph TD/)
  assert.doesNotMatch(html, /mdw-codeblock/)
}

// 19. JSX 组件
{
  const { html } = render('<QRCodeBlock url="https://example.com" size={200} />')
  assert.match(html, /class="mdw-component"/)
  assert.match(html, /data-name="QRCodeBlock"/)
  assert.match(html, /&quot;size&quot;:200/)
}

// 20. 普通尖括号文本不被当成组件
{
  const { html } = render('这里写 <div> 标签')
  assert.doesNotMatch(html, /mdw-component/)
}

// 21. 段落紧跟 $$ 块：公式不能被段落吞掉
{
  const { html } = render('块级公式：\n$$\na = b\n$$\n')
  assert.equal((html.match(/mdw-math/g) || []).length, 1, '应只有一个公式占位')
  assert.match(html, /<p class="mdw-p">块级公式：<\/p>/)
  assert.match(html, /data-tex="a = b"/)
}

console.log('engine ok · 21 cases')
