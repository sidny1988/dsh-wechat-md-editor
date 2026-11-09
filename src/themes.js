/**
 * 公众号MD编辑器 · 文章样式主题库
 *
 * 设计约束：同一份 CSS 既给预览 <style> 用，也在「复制到公众号」时逐条内联。
 * 因此这里只用可内联的写法——不写伪元素、媒体查询、CSS 变量、@import。
 * 主题 = 基础排版（由设置驱动）+ 主题增量（覆盖标题/引用/表格等）。
 *
 * 其中「经典 / 优雅 / 简洁」是 doocs/md 三套内置主题的忠实移植（样式取自
 * packages/shared/src/configs/theme-css/*.css）；其余为原创设计，配色参考
 * doocs 官方 11 个预设主色，但版式是独立设计的，不冒充上游主题。
 */
const MDW_THEMES = (() => {
  const FONTS = {
    system:
      '-apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif',
    serif:
      'Optima-Regular, Optima, "PingFang SC", "Songti SC", "Noto Serif SC", Cambria, Georgia, "Times New Roman", serif',
    song: '"Songti SC", "SimSun", "Noto Serif SC", "Source Han Serif SC", serif',
    kai: '"Kaiti SC", "KaiTi", "STKaiti", "Noto Serif SC", serif',
    mono: '"JetBrains Mono", Menlo, Monaco, Consolas, "Courier New", monospace',
  }

  function fontStack(id) {
    return FONTS[id] === undefined ? FONTS.system : FONTS[id]
  }

  function baseCss(theme, s) {
    const gap = s.paragraphSpacing
    const indent = s.indent ? 'text-indent:2em;' : ''
    return `
.mdw-art{background:${theme.paper};color:${theme.ink};font-family:${fontStack(s.fontFamily)};font-size:${s.fontSize}px;line-height:${s.lineHeight};letter-spacing:${s.letterSpacing}px;text-align:${s.textAlign};padding:10px ${s.pagePadding}px 14px;word-break:break-word;overflow-wrap:break-word;-webkit-font-smoothing:antialiased}
.mdw-art p{margin:${gap}px 0;${indent}}
.mdw-art h1,.mdw-art h2,.mdw-art h3,.mdw-art h4,.mdw-art h5,.mdw-art h6{font-weight:700;line-height:1.45;letter-spacing:.02em;margin:1.6em 0 .7em}
.mdw-art h1{font-size:1.45em}
.mdw-art h2{font-size:1.25em}
.mdw-art h3{font-size:1.12em}
.mdw-art h4{font-size:1em}
.mdw-art h5{font-size:1em}
.mdw-art h6{font-size:.92em;font-weight:600;opacity:.85}
.mdw-art strong{font-weight:700}
.mdw-art em{font-style:italic}
.mdw-art del{opacity:.55}
.mdw-art a{color:${theme.link};text-decoration:none;border-bottom:1px solid ${theme.linkSoft};padding-bottom:1px}
.mdw-art code.mdw-code-inline{font-family:${FONTS.mono};font-size:.88em;padding:2px 6px;border-radius:5px;background:${theme.codeInlineBg};color:${theme.codeInlineFg};border:1px solid ${theme.codeInlineBorder};letter-spacing:0}
.mdw-art .mdw-codeblock{margin:${gap + 4}px 0;border-radius:10px;overflow:hidden;background:${theme.codeBg};box-shadow:0 1px 2px rgba(0,0,0,.06)}
.mdw-art .mdw-codehead{padding:9px 14px 0;font-family:${FONTS.mono};font-size:11px;line-height:1.4;color:${theme.codeHead}}
.mdw-art .mdw-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;vertical-align:middle}
.mdw-art .mdw-lang{float:right;text-transform:uppercase;letter-spacing:.12em;font-size:10px;opacity:.85;margin-top:1px}
.mdw-art pre.mdw-pre{margin:0;padding:10px 14px 14px;background:transparent;overflow-x:auto;font-family:${FONTS.mono};font-size:13px;line-height:1.65;letter-spacing:0;tab-size:2}
.mdw-art pre.mdw-pre code.mdw-code{font-family:inherit;font-size:inherit;background:none;border:0;padding:0;color:${theme.codeFg};white-space:pre}
.mdw-art table{border-collapse:collapse;width:100%;margin:${gap + 4}px 0;font-size:.94em;line-height:1.6}
.mdw-art th,.mdw-art td{border:1px solid ${theme.line};padding:7px 11px;text-align:left;letter-spacing:0}
.mdw-art th{background:${theme.tableHeadBg};font-weight:700;color:${theme.ink}}
.mdw-art blockquote{margin:${gap + 4}px 0;padding:12px 16px;border-left:3px solid ${theme.accent};background:${theme.quoteBg};color:${theme.quoteFg};border-radius:0 8px 8px 0}
.mdw-art blockquote p{margin:0;letter-spacing:inherit;color:inherit}
.mdw-art blockquote p + p{margin-top:.7em}
.mdw-art ul,.mdw-art ol{margin:${gap}px 0;padding-left:1.5em}
.mdw-art ul{list-style:disc}
.mdw-art ol{list-style:decimal}
.mdw-art li{margin:.42em 0;line-height:inherit}
.mdw-art li > ul,.mdw-art li > ol{margin:.3em 0}
.mdw-art .mdw-task{margin-right:.45em;font-size:.95em;opacity:.9}
.mdw-art img.mdw-img{max-width:100%;height:auto;display:block;margin:${gap}px auto;border-radius:8px}
.mdw-art hr.mdw-hr{border:0;height:1px;background:${theme.line};margin:2em 0}
.mdw-art .mdw-ref,.mdw-art .mdw-fn{font-size:.72em;line-height:1;vertical-align:super;letter-spacing:0}
.mdw-art .mdw-ref{margin-left:1px;opacity:.9}
.mdw-art .mdw-fn a{color:${theme.link};border:0}
.mdw-art .mdw-refs,.mdw-art .mdw-footnotes{margin-top:2.2em;padding-top:.4em;font-size:.86em;color:${theme.muted}}
.mdw-art .mdw-refs-title,.mdw-art .mdw-footnotes-title{font-weight:700;color:${theme.muted};letter-spacing:.06em;margin:0 0 .6em}
.mdw-art .mdw-refs-list,.mdw-art .mdw-fn-list{margin:0;padding-left:1.4em}
.mdw-art .mdw-ref-item,.mdw-art .mdw-fn-item{margin:.35em 0;line-height:1.65;color:${theme.muted};letter-spacing:0;word-break:break-all}
.mdw-art .mdw-toc{margin:${gap + 6}px 0;padding:14px 18px;background:${theme.quoteBg};border-radius:10px}
.mdw-art .mdw-toc-title{font-weight:700;margin:0 0 .5em;color:${theme.ink};letter-spacing:.08em}
.mdw-art .mdw-toc-list{margin:0;padding-left:0;list-style:none}
.mdw-art .mdw-toc-item{margin:.28em 0;color:${theme.muted};font-size:.94em}
.mdw-art .mdw-toc-item[data-level="1"]{opacity:1;font-weight:600}
.mdw-art .mdw-toc-item[data-level="2"]{padding-left:0}
.mdw-art .mdw-toc-item[data-level="3"]{padding-left:1em}
.mdw-art .mdw-toc-item[data-level="4"]{padding-left:2em}
`.trim()
  }

  const THEMES = [
    {
      id: 'classic',
      name: '经典',
      en: 'Classic',
      note: 'doocs 默认主题：居中大标题，主题色块 h2',
      origin: 'doocs',
      accent: '#0F4C81',
      paper: '#ffffff',
      ink: '#0a0a0a',
      muted: 'rgba(10,10,10,.55)',
      line: 'rgba(10,10,10,.15)',
      link: '#576b95',
      linkSoft: 'rgba(87,107,149,.35)',
      quoteBg: '#f7f7f7',
      quoteFg: '#0a0a0a',
      tableHeadBg: 'rgba(10,10,10,.05)',
      codeBg: '#0d1117',
      codeFg: '#c9d1d9',
      codeHead: '#8b949e',
      codeInlineBg: 'rgba(15,76,129,.08)',
      codeInlineFg: '#0F4C81',
      codeInlineBorder: 'rgba(15,76,129,.2)',
      css: () => `
.mdw-art h1{display:table;padding:0 1em;border-bottom:2px solid var(--accent);margin:2em auto 1em;text-align:center;font-size:1.2em}
.mdw-art h2{display:table;padding:.16em .55em;margin:2.4em auto 1.4em;color:#fff;background:var(--accent);text-align:center;font-size:1.2em;border-radius:2px}
.mdw-art h3{padding-left:10px;border-left:3px solid var(--accent);margin:2em 0 .75em;line-height:1.3}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:var(--accent);margin:1.6em 0 .5em}
.mdw-art p{letter-spacing:.08em}
.mdw-art strong{color:var(--accent)}
.mdw-art ul{list-style:circle}
.mdw-art blockquote{font-style:normal;padding:1em;border-left:4px solid var(--accent);border-radius:6px;margin:1em 0}
.mdw-art th,.mdw-art td{word-break:keep-all}
.mdw-art img.mdw-img{border-radius:4px;margin:.4em auto}
.mdw-art hr.mdw-hr{background:none;border-top:2px solid rgba(0,0,0,.1);height:0.4em;transform:scale(1,.5);transform-origin:0 0}
`,
    },
    {
      id: 'grace',
      name: '优雅',
      en: 'Grace',
      note: 'doocs 优雅主题：圆角色块 + 柔和投影',
      origin: 'doocs',
      accent: '#0F4C81',
      paper: '#ffffff',
      ink: '#0a0a0a',
      muted: 'rgba(10,10,10,.55)',
      line: 'rgba(10,10,10,.15)',
      link: '#576b95',
      linkSoft: 'rgba(87,107,149,.35)',
      quoteBg: 'transparent',
      quoteFg: 'rgba(0,0,0,.62)',
      tableHeadBg: 'rgba(10,10,10,.05)',
      codeBg: '#0d1117',
      codeFg: '#c9d1d9',
      codeHead: '#8b949e',
      codeInlineBg: 'rgba(15,76,129,.08)',
      codeInlineFg: '#0F4C81',
      codeInlineBorder: 'rgba(15,76,129,.2)',
      css: () => `
.mdw-art h1{display:table;padding:.5em 1em;border-bottom:2px solid var(--accent);margin:2em auto 1em;text-align:center;font-size:1.4em;text-shadow:2px 2px 4px rgba(0,0,0,.1)}
.mdw-art h2{display:table;padding:.3em 1em;margin:2.4em auto 1.4em;color:#fff;background:var(--accent);border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,.1);text-align:center;font-size:1.3em}
.mdw-art h3{padding-left:12px;border-left:4px solid var(--accent);border-bottom:1px dashed var(--accent);margin:2em 0 .75em;line-height:1.35;padding-bottom:4px}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:var(--accent);margin:1.6em 0 .5em}
.mdw-art p{letter-spacing:.08em}
.mdw-art strong{color:var(--accent)}
.mdw-art blockquote{font-style:italic;padding:1em 1em 1em 1.4em;border-left:4px solid var(--accent);border-radius:6px;box-shadow:0 4px 6px rgba(0,0,0,.05);margin:1em 0}
.mdw-art table{border-collapse:separate;border-spacing:0;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,.08);overflow:hidden}
.mdw-art th{background:var(--accent);color:#fff}
.mdw-art th,.mdw-art td{border:1px solid rgba(10,10,10,.12);padding:8px 12px}
.mdw-art img.mdw-img{border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,.1)}
.mdw-art hr.mdw-hr{background:linear-gradient(to right,rgba(0,0,0,0),rgba(0,0,0,.15),rgba(0,0,0,0));margin:2em 0}
`,
    },
    {
      id: 'simple',
      name: '简洁',
      en: 'Simple',
      note: 'doocs 简洁主题：不对称圆角，克制留白',
      origin: 'doocs',
      accent: '#0F4C81',
      paper: '#ffffff',
      ink: '#0a0a0a',
      muted: 'rgba(10,10,10,.55)',
      line: 'rgba(10,10,10,.15)',
      link: '#576b95',
      linkSoft: 'rgba(87,107,149,.35)',
      quoteBg: 'transparent',
      quoteFg: 'rgba(0,0,0,.6)',
      tableHeadBg: 'rgba(10,10,10,.05)',
      codeBg: '#0d1117',
      codeFg: '#c9d1d9',
      codeHead: '#8b949e',
      codeInlineBg: 'rgba(15,76,129,.08)',
      codeInlineFg: '#0F4C81',
      codeInlineBorder: 'rgba(15,76,129,.15)',
      css: () => `
.mdw-art h1{display:table;padding:.5em 1em;margin:2em auto 1em;text-align:center;font-size:1.4em;text-shadow:1px 1px 3px rgba(0,0,0,.05)}
.mdw-art h2{display:table;padding:.3em 1.2em;margin:2.4em auto 1.4em;color:#fff;background:var(--accent);border-radius:8px 24px 8px 24px;box-shadow:0 2px 6px rgba(0,0,0,.06);text-align:center;font-size:1.3em}
.mdw-art h3{padding:4px 0 4px 12px;border-left:4px solid var(--accent);border-top:1px solid rgba(15,76,129,.1);border-right:1px solid rgba(15,76,129,.1);border-bottom:1px solid rgba(15,76,129,.1);background:rgba(15,76,129,.06);border-radius:6px;margin:2em 0 .75em;line-height:1.5}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:var(--accent);margin:1.6em 0 .5em}
.mdw-art p{letter-spacing:.08em}
.mdw-art strong{color:var(--accent)}
.mdw-art blockquote{font-style:italic;padding:1em 1em 1em 1.4em;border-top:1px solid rgba(0,0,0,.05);border-right:1px solid rgba(0,0,0,.05);border-bottom:1px solid rgba(0,0,0,.05);border-left:0;margin:1em 0}
.mdw-art hr.mdw-hr{background:linear-gradient(to right,rgba(0,0,0,0),rgba(0,0,0,.15),rgba(0,0,0,0))}
`,
    },
    {
      id: 'ink',
      name: '墨韵',
      en: 'Ink',
      note: '衬线正文，双线标题，宣纸底色',
      origin: 'original',
      accent: '#8a6a45',
      paper: '#fdfbf5',
      ink: '#2a2620',
      muted: 'rgba(42,38,32,.55)',
      line: 'rgba(42,38,32,.16)',
      link: '#8a6a45',
      linkSoft: 'rgba(138,106,69,.3)',
      quoteBg: 'rgba(138,106,69,.06)',
      quoteFg: '#4a4238',
      tableHeadBg: 'rgba(138,106,69,.08)',
      codeBg: '#282420',
      codeFg: '#e8e0d2',
      codeHead: '#a89a85',
      codeInlineBg: 'rgba(138,106,69,.1)',
      codeInlineFg: '#7a5c3a',
      codeInlineBorder: 'rgba(138,106,69,.22)',
      css: () => `
.mdw-art{font-family:${FONTS.song}}
.mdw-art h1{text-align:center;font-size:1.7em;letter-spacing:.14em;padding-bottom:.5em;border-bottom:3px double var(--accent);margin:1.8em auto 1.4em;font-weight:600}
.mdw-art h2{text-align:center;font-size:1.22em;letter-spacing:.16em;font-weight:600;color:var(--accent);margin:2.6em 0 1.2em}
.mdw-art h3{font-size:1.1em;letter-spacing:.08em;padding-left:.7em;border-left:3px solid var(--accent);margin:2.2em 0 .8em}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:var(--accent);letter-spacing:.08em}
.mdw-art p{line-height:1.95;text-align:justify;letter-spacing:.06em}
.mdw-art strong{color:#6d5130}
.mdw-art blockquote{border-left:2px solid var(--accent);background:rgba(138,106,69,.06);font-style:italic;letter-spacing:.04em}
.mdw-art th{background:rgba(138,106,69,.08);border-bottom:2px solid var(--accent)}
.mdw-art img.mdw-img{border-radius:2px;border:1px solid rgba(42,38,32,.12);padding:4px;background:#fff}
.mdw-art hr.mdw-hr{height:1px;background:linear-gradient(to right,transparent,var(--accent),transparent)}
`,
    },
    {
      id: 'mist',
      name: '晨雾',
      en: 'Mist',
      note: '冷灰蓝，留白舒展，适合长文',
      origin: 'original',
      accent: '#4b6b7c',
      paper: '#fbfcfd',
      ink: '#22303a',
      muted: 'rgba(34,48,58,.55)',
      line: 'rgba(34,48,58,.14)',
      link: '#3d6478',
      linkSoft: 'rgba(61,100,120,.28)',
      quoteBg: '#f2f5f7',
      quoteFg: '#3d4a54',
      tableHeadBg: '#eef3f6',
      codeBg: '#1f2933',
      codeFg: '#d7e0e8',
      codeHead: '#8fa3b3',
      codeInlineBg: 'rgba(75,107,124,.09)',
      codeInlineFg: '#3d6478',
      codeInlineBorder: 'rgba(75,107,124,.2)',
      css: () => `
.mdw-art h1{font-size:1.5em;font-weight:600;letter-spacing:.04em;margin:1.8em 0 1em;padding-bottom:.5em;border-bottom:1px solid var(--accent)}
.mdw-art h2{font-size:1.24em;font-weight:600;margin:2.3em 0 1em;padding-bottom:.35em;border-bottom:1px solid rgba(34,48,58,.12);color:#1b2a34}
.mdw-art h3{font-size:1.1em;color:var(--accent);letter-spacing:.08em;margin:2em 0 .7em}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:var(--accent)}
.mdw-art p{line-height:1.95;letter-spacing:.03em}
.mdw-art blockquote{border-left:0;background:#f2f5f7;border-radius:10px;padding:1.1em 1.3em;color:#3d4a54;font-style:normal}
.mdw-art ul{list-style:square}
.mdw-art th{background:#eef3f6;border:0;border-bottom:2px solid rgba(34,48,58,.18)}
.mdw-art td{border:0;border-bottom:1px solid rgba(34,48,58,.09);padding:9px 10px}
.mdw-art img.mdw-img{border-radius:12px;box-shadow:0 6px 18px rgba(31,41,51,.08)}
.mdw-art hr.mdw-hr{background:linear-gradient(to right,transparent,rgba(34,48,58,.2),transparent)}
`,
    },
    {
      id: 'maple',
      name: '丹枫',
      en: 'Maple',
      note: '暖橘强调，胶囊标题，亲和有力',
      origin: 'original',
      accent: '#e2583e',
      paper: '#fffdfc',
      ink: '#2b2320',
      muted: 'rgba(43,35,32,.55)',
      line: 'rgba(43,35,32,.14)',
      link: '#c4553b',
      linkSoft: 'rgba(196,85,59,.3)',
      quoteBg: '#fef1ee',
      quoteFg: '#5a3a32',
      tableHeadBg: '#fdf0ed',
      codeBg: '#2b211e',
      codeFg: '#f3e7e2',
      codeHead: '#c0a49a',
      codeInlineBg: 'rgba(226,88,62,.09)',
      codeInlineFg: '#c0462e',
      codeInlineBorder: 'rgba(226,88,62,.22)',
      css: () => `
.mdw-art h1{text-align:center;font-size:1.55em;margin:1.6em auto 1em;letter-spacing:.06em;padding-bottom:.45em;border-bottom:4px solid rgba(226,88,62,.18)}
.mdw-art h2{display:table;margin:2.2em auto 1.2em;padding:.28em 1.1em;border-radius:999px;background:rgba(226,88,62,.1);color:var(--accent);font-size:1.18em;text-align:center}
.mdw-art h3{padding-left:.65em;border-left:4px solid var(--accent);margin:1.9em 0 .7em;line-height:1.4}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:var(--accent)}
.mdw-art p{letter-spacing:.04em}
.mdw-art strong{color:var(--accent)}
.mdw-art blockquote{border-left:3px solid var(--accent);background:#fef1ee;border-radius:8px;color:#5a3a32}
.mdw-art th{background:#fdf0ed;border:0;color:#8a3a26}
.mdw-art td{border:0;border-bottom:1px solid rgba(43,35,32,.1)}
.mdw-art img.mdw-img{border-radius:10px}
.mdw-art hr.mdw-hr{background:linear-gradient(to right,transparent,rgba(226,88,62,.35),transparent)}
`,
    },
    {
      id: 'bamboo',
      name: '竹青',
      en: 'Bamboo',
      note: '翡翠绿，竖线标题，清爽自然',
      origin: 'original',
      accent: '#009874',
      paper: '#fbfdfc',
      ink: '#1f2b26',
      muted: 'rgba(31,43,38,.55)',
      line: 'rgba(31,43,38,.14)',
      link: '#007a5e',
      linkSoft: 'rgba(0,122,94,.3)',
      quoteBg: '#eef7f3',
      quoteFg: '#2f4a40',
      tableHeadBg: '#edf6f2',
      codeBg: '#172420',
      codeFg: '#d9e6e0',
      codeHead: '#86a79a',
      codeInlineBg: 'rgba(0,152,116,.09)',
      codeInlineFg: '#007a5e',
      codeInlineBorder: 'rgba(0,152,116,.2)',
      css: () => `
.mdw-art h1{font-size:1.45em;margin:1.7em 0 1em;padding-left:.7em;border-left:7px solid var(--accent);line-height:1.3}
.mdw-art h2{font-size:1.22em;margin:2.2em 0 1em;padding:.32em .7em;background:#eef7f3;border-radius:6px;color:#0a5f49;border-left:3px solid var(--accent)}
.mdw-art h3{font-size:1.1em;color:var(--accent);margin:1.9em 0 .7em;padding-bottom:.25em;border-bottom:1px dashed rgba(0,152,116,.35)}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:var(--accent)}
.mdw-art strong{color:#007a5e}
.mdw-art blockquote{border-left:3px solid var(--accent);background:#eef7f3;color:#2f4a40;border-radius:0 8px 8px 0}
.mdw-art ul{list-style:square}
.mdw-art th{background:#edf6f2;border:1px solid rgba(0,152,116,.2)}
.mdw-art td{border:1px solid rgba(31,43,38,.1)}
.mdw-art img.mdw-img{border-radius:8px}
`,
    },
    {
      id: 'violet',
      name: '紫烟',
      en: 'Violet',
      note: '薰衣紫，居中标线，安静克制',
      origin: 'original',
      accent: '#92617E',
      paper: '#fdfbfc',
      ink: '#2b2428',
      muted: 'rgba(43,36,40,.55)',
      line: 'rgba(43,36,40,.14)',
      link: '#7d5169',
      linkSoft: 'rgba(125,81,105,.3)',
      quoteBg: 'rgba(146,97,126,.06)',
      quoteFg: '#544049',
      tableHeadBg: 'rgba(146,97,126,.08)',
      codeBg: '#241d22',
      codeFg: '#e9dfe5',
      codeHead: '#a98d9c',
      codeInlineBg: 'rgba(146,97,126,.1)',
      codeInlineFg: '#7d5169',
      codeInlineBorder: 'rgba(146,97,126,.22)',
      css: () => `
.mdw-art h1{text-align:center;font-size:1.5em;letter-spacing:.12em;margin:2em auto 1.2em;font-weight:600}
.mdw-art h2{text-align:center;font-size:1.18em;letter-spacing:.1em;margin:2.4em 0 1.1em;color:var(--accent);padding-bottom:.4em;border-bottom:1px solid rgba(146,97,126,.35)}
.mdw-art h3{font-size:1.08em;font-style:italic;color:var(--accent);margin:1.9em 0 .7em;letter-spacing:.04em}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:var(--accent);letter-spacing:.06em}
.mdw-art p{line-height:1.9;letter-spacing:.05em}
.mdw-art blockquote{border-left:2px solid var(--accent);background:rgba(146,97,126,.06);font-style:italic;color:#544049}
.mdw-art th{background:rgba(146,97,126,.08);border-bottom:2px solid rgba(146,97,126,.3)}
.mdw-art img.mdw-img{border-radius:6px}
.mdw-art hr.mdw-hr{background:linear-gradient(to right,transparent,rgba(146,97,126,.4),transparent)}
`,
    },
    {
      id: 'amber',
      name: '山吹',
      en: 'Amber',
      note: '柠檬黄块，标题醒目，适合清单体',
      origin: 'original',
      accent: '#e0a800',
      paper: '#fffdf6',
      ink: '#2b2618',
      muted: 'rgba(43,38,24,.55)',
      line: 'rgba(43,38,24,.14)',
      link: '#a87f00',
      linkSoft: 'rgba(168,127,0,.3)',
      quoteBg: '#fff8dc',
      quoteFg: '#4a4128',
      tableHeadBg: '#fff6d6',
      codeBg: '#26231a',
      codeFg: '#ece5d3',
      codeHead: '#b3a67f',
      codeInlineBg: 'rgba(224,168,0,.14)',
      codeInlineFg: '#8a6a00',
      codeInlineBorder: 'rgba(224,168,0,.3)',
      css: () => `
.mdw-art h1{font-size:1.62em;margin:1.5em 0 .9em;letter-spacing:.03em;line-height:1.3}
.mdw-art h2{font-size:1.2em;margin:2.1em 0 1em;padding:.3em .75em;background:var(--accent);color:#2b2618;border-radius:4px;display:table}
.mdw-art h3{font-size:1.1em;margin:1.9em 0 .7em;padding-bottom:.2em;border-bottom:2px solid rgba(224,168,0,.55)}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:#8a6a00}
.mdw-art strong{background:linear-gradient(transparent 62%,rgba(224,168,0,.35) 0);font-weight:700}
.mdw-art blockquote{border-left:3px solid var(--accent);background:#fff8dc;color:#4a4128}
.mdw-art th{background:#fff6d6;border:1px solid rgba(224,168,0,.35)}
.mdw-art img.mdw-img{border-radius:8px;border:1px solid rgba(43,38,24,.08)}
`,
    },
    {
      id: 'rose',
      name: '玫瑰',
      en: 'Rose',
      note: '玫瑰金，细线分隔，温柔精致',
      origin: 'original',
      accent: '#B76E79',
      paper: '#fffbfb',
      ink: '#2c2426',
      muted: 'rgba(44,36,38,.55)',
      line: 'rgba(44,36,38,.13)',
      link: '#a05a66',
      linkSoft: 'rgba(160,90,102,.3)',
      quoteBg: '#fdf0f2',
      quoteFg: '#5c3c42',
      tableHeadBg: '#fceff1',
      codeBg: '#241d1f',
      codeFg: '#eadfe1',
      codeHead: '#b3949a',
      codeInlineBg: 'rgba(183,110,121,.1)',
      codeInlineFg: '#a05a66',
      codeInlineBorder: 'rgba(183,110,121,.24)',
      css: () => `
.mdw-art h1{text-align:center;font-size:1.5em;letter-spacing:.1em;margin:1.9em auto 1.1em;font-weight:600;position:relative;padding-bottom:.5em;border-bottom:1px solid rgba(183,110,121,.4)}
.mdw-art h2{font-size:1.2em;margin:2.2em 0 1em;color:var(--accent);letter-spacing:.06em}
.mdw-art h3{font-size:1.08em;margin:1.8em 0 .7em;padding-left:.65em;border-left:2px solid var(--accent);line-height:1.45}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:var(--accent)}
.mdw-art p{line-height:1.9;letter-spacing:.04em}
.mdw-art strong{color:#a05a66}
.mdw-art blockquote{border-left:2px solid var(--accent);background:#fdf0f2;border-radius:0 10px 10px 0;color:#5c3c42}
.mdw-art th{background:#fceff1;border:0;border-bottom:1px solid rgba(183,110,121,.35)}
.mdw-art td{border:0;border-bottom:1px solid rgba(44,36,38,.08)}
.mdw-art img.mdw-img{border-radius:14px}
.mdw-art hr.mdw-hr{background:linear-gradient(to right,transparent,rgba(183,110,121,.45),transparent)}
`,
    },
    {
      id: 'mono',
      name: '石墨',
      en: 'Mono',
      note: '黑白极简，强对比，观点文首选',
      origin: 'original',
      accent: '#111111',
      paper: '#ffffff',
      ink: '#141414',
      muted: 'rgba(20,20,20,.55)',
      line: 'rgba(20,20,20,.16)',
      link: '#141414',
      linkSoft: 'rgba(20,20,20,.35)',
      quoteBg: '#f4f4f4',
      quoteFg: '#333333',
      tableHeadBg: '#141414',
      codeBg: '#111111',
      codeFg: '#ededed',
      codeHead: '#999999',
      codeInlineBg: 'rgba(20,20,20,.07)',
      codeInlineFg: '#141414',
      codeInlineBorder: 'rgba(20,20,20,.2)',
      css: () => `
.mdw-art h1{font-size:1.75em;line-height:1.25;margin:1.4em 0 .8em;letter-spacing:.01em;font-weight:800}
.mdw-art h2{display:table;font-size:1.14em;margin:2.1em 0 1em;padding:.22em .7em;background:#141414;color:#fff;letter-spacing:.08em}
.mdw-art h3{font-size:1.06em;margin:1.8em 0 .7em;padding-bottom:.25em;border-bottom:2px solid #141414;letter-spacing:.04em}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:#141414;letter-spacing:.06em}
.mdw-art p{line-height:1.9;letter-spacing:.03em;text-align:justify}
.mdw-art strong{font-weight:800}
.mdw-art blockquote{border-left:3px solid #141414;background:#f4f4f4;color:#333;font-style:normal}
.mdw-art th{background:#141414;color:#fff;border:1px solid #141414}
.mdw-art td{border:1px solid rgba(20,20,20,.14)}
.mdw-art img.mdw-img{border-radius:0}
.mdw-art hr.mdw-hr{height:2px;background:#141414;margin:2.2em 0}
`,
    },
    {
      id: 'night',
      name: '夜读',
      en: 'Night',
      note: '深色纸面，适合夜间阅读与科技长文',
      origin: 'original',
      accent: '#7aa2f7',
      paper: '#16181d',
      ink: '#d6dae3',
      muted: 'rgba(214,218,227,.55)',
      line: 'rgba(214,218,227,.16)',
      link: '#9ab8ff',
      linkSoft: 'rgba(154,184,255,.35)',
      quoteBg: '#1c2028',
      quoteFg: '#b9c0cd',
      tableHeadBg: '#1e232c',
      codeBg: '#0f1116',
      codeFg: '#d6dae3',
      codeHead: '#6f7a8d',
      codeInlineBg: 'rgba(122,162,247,.14)',
      codeInlineFg: '#9ab8ff',
      codeInlineBorder: 'rgba(122,162,247,.28)',
      css: () => `
.mdw-art h1{font-size:1.5em;font-weight:600;letter-spacing:.03em;margin:1.8em 0 1em;color:#eef1f7}
.mdw-art h2{font-size:1.2em;font-weight:600;margin:2.2em 0 1em;color:var(--accent);letter-spacing:.04em}
.mdw-art h3{font-size:1.08em;margin:1.9em 0 .7em;padding-left:.6em;border-left:3px solid var(--accent);color:#e6eaf2}
.mdw-art h4,.mdw-art h5,.mdw-art h6{color:var(--accent)}
.mdw-art p{line-height:1.95;letter-spacing:.03em;color:#c9cfda}
.mdw-art strong{color:#fff}
.mdw-art blockquote{border-left:3px solid var(--accent);background:#1c2028;color:#b9c0cd;border-radius:0 8px 8px 0}
.mdw-art th{background:#1e232c;border:1px solid rgba(214,218,227,.16)}
.mdw-art td{border:1px solid rgba(214,218,227,.12)}
.mdw-art img.mdw-img{border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.mdw-art hr.mdw-hr{background:rgba(214,218,227,.18)}
.mdw-art .mdw-codeblock{box-shadow:0 10px 26px rgba(0,0,0,.35)}
`,
    },
  ]

  function byId(id) {
    for (const theme of THEMES) if (theme.id === id) return theme
    return THEMES[0]
  }

  function cssFor(theme, settings) {
    const s = settings || {}
    const normalized = {
      fontFamily: s.fontFamily === undefined ? 'system' : s.fontFamily,
      fontSize: typeof s.fontSize === 'number' ? s.fontSize : 16,
      lineHeight: typeof s.lineHeight === 'number' ? s.lineHeight : 1.75,
      paragraphSpacing: typeof s.paragraphSpacing === 'number' ? s.paragraphSpacing : 16,
      letterSpacing: typeof s.letterSpacing === 'number' ? s.letterSpacing : 0.4,
      textAlign: s.textAlign === undefined ? 'left' : s.textAlign,
      indent: s.indent === true,
      pagePadding: typeof s.pagePadding === 'number' ? s.pagePadding : 20,
    }
    // 主题色可独立于主题覆盖（对齐参考站的「主题色」维度）
    const active = typeof s.accent === 'string' && s.accent.trim() !== '' ? { ...theme, accent: s.accent.trim() } : theme
    const themeCss = active.css(normalized).replace(/var\(--accent\)/g, active.accent)
    return baseCss(active, normalized) + '\n' + themeCss
  }

  return { THEMES, byId, cssFor, FONTS, fontStack }
})()
