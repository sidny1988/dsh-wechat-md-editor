/**
 * 公众号MD编辑器 · 界面样式（工作台外壳）v2
 *
 * 设计语言：轻纸台。
 *   - 底：暖白纸（亮）/ 宿主深色（暗），只用一条 1px 细线分隔区域
 *   - 字：界面用无衬线、标题用衬线，字号克制，数字等宽
 *   - 色：墨色为主，朱砂只做「当前/强调」的点缀，不做大面积色块
 *   - 形：8 / 12 / 16 三档圆角，阴影只用于浮层与纸面
 *   - 动：160–320ms，悬浮 1px 抬升，弹层轻微缩放淡入
 *
 * 所有类名以 mw- 开头；文章内部样式不在这里（见 themes.js）。
 */
const MDW_CSS = `
.mw-root{
  --mw-text: var(--dsw-alias-label-primary, #1c1a17);
  --mw-dim: var(--dsw-alias-label-secondary, #6f6a61);
  --mw-faint: color-mix(in srgb, var(--mw-text) 40%, transparent);
  --mw-line: var(--dsw-alias-border-l1, rgba(28,26,23,.08));
  --mw-line-strong: var(--dsw-alias-border-l2, rgba(28,26,23,.15));
  --mw-bg: var(--dsw-alias-bg-base, #f7f6f2);
  --mw-card: var(--dsw-alias-bg-layer-1, #ffffff);
  --mw-card-2: var(--dsw-alias-bg-layer-2, #f3f1ec);
  --mw-tint: color-mix(in srgb, var(--mw-text) 5%, transparent);
  --mw-tint-2: color-mix(in srgb, var(--mw-text) 9%, transparent);
  --mw-accent: #d2553a;
  --mw-accent-soft: color-mix(in srgb, var(--mw-accent) 10%, transparent);
  --mw-accent-line: color-mix(in srgb, var(--mw-accent) 34%, transparent);
  --mw-serif: "Songti SC", "Noto Serif SC", "Source Han Serif SC", "SimSun", Georgia, serif;
  --mw-sans: -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", "PingFang SC", "Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
  --mw-mono: "Cascadia Mono", "Cascadia Code", "JetBrains Mono", Menlo, Consolas, monospace;
  --mw-ease: cubic-bezier(.22,.61,.36,1);
  --mw-r-sm: 8px;
  --mw-r-md: 12px;
  --mw-r-lg: 16px;
  --mw-shadow-pop: 0 22px 54px -22px rgba(20,18,15,.42), 0 2px 8px rgba(20,18,15,.06);
  --mw-shadow-paper: 0 2px 6px rgba(20,18,15,.05), 0 28px 64px -34px rgba(20,18,15,.38);

  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--mw-bg);
  color: var(--mw-text);
  font-family: var(--mw-sans);
  font-size: 13px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  isolation: isolate;
  animation: mw-enter .32s var(--mw-ease);
}
@keyframes mw-enter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.mw-root *{box-sizing:border-box}
.mw-root ::selection{background:var(--mw-accent-soft)}
.mw-root ::-webkit-scrollbar{width:10px;height:10px}
.mw-root ::-webkit-scrollbar-thumb{background:color-mix(in srgb, var(--mw-text) 14%, transparent);border-radius:8px;border:3px solid transparent;background-clip:content-box}
.mw-root ::-webkit-scrollbar-thumb:hover{background:color-mix(in srgb, var(--mw-text) 26%, transparent);background-clip:content-box}
.mw-root ::-webkit-scrollbar-track{background:transparent}

/* ---------- 顶栏 ---------- */
.mw-top{display:flex;align-items:center;gap:14px;padding:0 18px;height:54px;flex:none;border-bottom:1px solid var(--mw-line);background:var(--mw-card);position:relative;z-index:40}
.mw-brand{display:flex;align-items:center;gap:9px;flex:none;user-select:none}
.mw-brandmark{display:grid;place-items:center;width:28px;height:28px;border-radius:9px;background:var(--mw-accent-soft);color:var(--mw-accent);border:1px solid var(--mw-accent-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.35)}
.mw-brandtext{display:flex;flex-direction:column;line-height:1.1}
.mw-brandname{font-family:var(--mw-serif);font-size:14.5px;font-weight:700;letter-spacing:.16em}
.mw-brandsub{font-size:8.5px;letter-spacing:.22em;color:var(--mw-faint);text-transform:uppercase;margin-top:3px}

.mw-doc{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
.mw-title{flex:1;min-width:60px;max-width:540px;border:0;background:transparent;color:var(--mw-text);font-family:var(--mw-serif);font-size:15.5px;font-weight:600;letter-spacing:.01em;padding:6px 8px;border-radius:var(--mw-r-sm);outline:none;text-overflow:ellipsis;transition:background .18s var(--mw-ease),box-shadow .18s}
.mw-title:hover{background:var(--mw-tint)}
.mw-title:focus{background:var(--mw-card-2);box-shadow:0 0 0 1.5px var(--mw-accent-line)}
.mw-save{display:flex;align-items:center;gap:6px;flex:none;font-size:11px;color:var(--mw-faint);letter-spacing:.02em;white-space:nowrap;transition:color .2s}
.mw-save i{width:5px;height:5px;border-radius:50%;background:var(--mw-faint);transition:background .25s,box-shadow .25s}
.mw-save[data-state=ok] i{background:#3f9c74;box-shadow:0 0 0 3px rgba(63,156,116,.14)}
.mw-save[data-state=dirty] i{background:#d9a441;box-shadow:0 0 0 3px rgba(217,164,65,.14)}
.mw-save[data-state=saving] i{background:#4f7fb8;box-shadow:0 0 0 3px rgba(79,127,184,.16);animation:mw-pulse 1s infinite}
@keyframes mw-pulse{0%,100%{opacity:1}50%{opacity:.35}}

.mw-actions{display:flex;align-items:center;gap:6px;flex:none}
.mw-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:30px;padding:0 11px;border-radius:var(--mw-r-sm);border:1px solid transparent;background:transparent;color:var(--mw-text);font:inherit;font-size:12.5px;letter-spacing:.01em;cursor:pointer;transition:background .16s var(--mw-ease),border-color .16s,color .16s,transform .16s,box-shadow .16s;white-space:nowrap;user-select:none}
.mw-btn:hover{background:var(--mw-tint)}
.mw-btn:active{transform:translateY(.5px)}
.mw-btn:focus-visible{outline:2px solid var(--mw-accent-line);outline-offset:1px}
.mw-btn[disabled]{opacity:.38;cursor:default;background:transparent}
.mw-btn--icon{width:30px;padding:0;color:var(--mw-dim)}
.mw-btn--icon:hover{color:var(--mw-text)}
.mw-btn--ghost{border-color:var(--mw-line);color:var(--mw-dim)}
.mw-btn--ghost:hover{border-color:var(--mw-line-strong);background:var(--mw-card);color:var(--mw-text)}
.mw-btn--primary{background:var(--mw-text);color:var(--mw-bg);border-color:transparent;font-weight:600;padding:0 14px;box-shadow:0 1px 2px rgba(0,0,0,.14),inset 0 1px 0 rgba(255,255,255,.1)}
.mw-btn--primary:hover{background:color-mix(in srgb, var(--mw-text) 88%, var(--mw-accent));transform:translateY(-1px);box-shadow:0 4px 14px -4px rgba(0,0,0,.3)}
.mw-btn--primary:active{transform:none}
.mw-btn--primary .mw-dot{width:5px;height:5px;border-radius:50%;background:var(--mw-accent);box-shadow:0 0 0 2px color-mix(in srgb, var(--mw-accent) 24%, transparent)}
.mw-btn--danger{color:#b23a2b}
.mw-btn--danger:hover{background:color-mix(in srgb, #b23a2b 10%, transparent)}
.mw-vsep{width:1px;height:16px;background:var(--mw-line);margin:0 4px}

/* ---------- 工具条 ---------- */
.mw-tools{display:flex;align-items:center;gap:6px;padding:0 16px;height:44px;flex:none;border-bottom:1px solid var(--mw-line);background:var(--mw-card);overflow:visible}
.mw-toolgroup{display:flex;align-items:center;gap:2px;flex:none}
.mw-toolgroup--right{margin-left:auto;gap:8px}
.mw-tool{display:grid;place-items:center;width:28px;height:28px;border:0;border-radius:var(--mw-r-sm);background:transparent;color:var(--mw-dim);cursor:pointer;transition:background .14s,color .14s,transform .14s;position:relative}
.mw-tool:hover{background:var(--mw-tint);color:var(--mw-text);transform:translateY(-.5px)}
.mw-tool:active{transform:scale(.94)}
.mw-tool[data-active="1"]{background:var(--mw-accent-soft);color:var(--mw-accent)}
.mw-tool:focus-visible{outline:2px solid var(--mw-accent-line);outline-offset:1px}
.mw-tool svg{display:block}
.mw-tool .mw-tooltip{position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%) translateY(-3px);padding:4px 8px;border-radius:6px;background:var(--mw-text);color:var(--mw-bg);font-size:10.5px;line-height:1.3;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .16s .32s,transform .16s .32s;z-index:60;box-shadow:0 6px 16px -8px rgba(0,0,0,.5)}
.mw-tool:hover .mw-tooltip{opacity:1;transform:translateX(-50%) translateY(0)}
.mw-toolwide{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border:1px solid var(--mw-line);border-radius:var(--mw-r-sm);background:var(--mw-card);color:var(--mw-dim);font:inherit;font-size:12px;cursor:pointer;transition:background .16s,border-color .16s,color .16s,transform .16s}
.mw-toolwide:hover{border-color:var(--mw-line-strong);color:var(--mw-text);background:var(--mw-card-2);transform:translateY(-.5px)}
.mw-toolwide--accent{background:var(--mw-accent-soft);border-color:var(--mw-accent-line);color:var(--mw-accent)}
.mw-toolwide--accent:hover{background:color-mix(in srgb, var(--mw-accent) 15%, transparent);border-color:var(--mw-accent-line);color:var(--mw-accent)}
.mw-toolwide strong{font-weight:600;color:inherit}
.mw-swatch{width:11px;height:11px;border-radius:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12),0 0 0 1px color-mix(in srgb, var(--mw-text) 10%, transparent);flex:none}

/* ---------- 主体三栏 ---------- */
.mw-body{display:flex;flex:1;min-height:0;min-width:0;position:relative;overflow:hidden}
.mw-rail{width:232px;flex:none;display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--mw-line);background:var(--mw-bg)}
.mw-root[data-rail="0"] .mw-rail{display:none}
.mw-rail-head{display:flex;align-items:center;gap:8px;padding:13px 12px 9px}
.mw-railtitle{font-size:10px;letter-spacing:.18em;color:var(--mw-faint);text-transform:uppercase;flex:1}
.mw-search{display:flex;align-items:center;gap:7px;margin:0 12px 8px;padding:0 9px;height:30px;border:1px solid var(--mw-line);border-radius:var(--mw-r-sm);background:var(--mw-card);color:var(--mw-faint);transition:border-color .16s,box-shadow .16s}
.mw-search:focus-within{border-color:var(--mw-accent-line);box-shadow:0 0 0 3px var(--mw-accent-soft)}
.mw-search input{flex:1;min-width:0;border:0;background:transparent;color:var(--mw-text);font:inherit;font-size:12px;outline:none}
.mw-search input::placeholder{color:var(--mw-faint)}
.mw-doclist{flex:1;min-height:0;overflow-y:auto;padding:2px 8px 12px}
.mw-docitem{display:flex;flex-direction:column;gap:3px;padding:9px 10px 8px 12px;border-radius:var(--mw-r-sm);cursor:pointer;position:relative;border:1px solid transparent;background:transparent;font:inherit;color:inherit;text-align:left;transition:background .14s,border-color .14s}
.mw-docitem + .mw-docitem{margin-top:1px}
.mw-docitem:hover{background:var(--mw-tint)}
.mw-docitem[data-active="1"]{background:color-mix(in srgb, var(--mw-accent) 6%, transparent);border-color:color-mix(in srgb, var(--mw-accent) 16%, transparent)}
.mw-docitem[data-active="1"]::before{content:"";position:absolute;left:0;top:9px;bottom:9px;width:2px;border-radius:2px;background:var(--mw-accent)}
.mw-doci-t{font-size:12.5px;font-weight:600;line-height:1.4;color:var(--mw-text);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}
.mw-docitem[data-active="1"] .mw-doci-t{color:var(--mw-accent)}
.mw-doci-m{display:flex;align-items:center;gap:7px;font-size:10.5px;color:var(--mw-faint);letter-spacing:.01em}
.mw-docacts{position:absolute;right:5px;top:5px;display:none;gap:1px;padding:2px;border-radius:7px;background:var(--mw-card);border:1px solid var(--mw-line);box-shadow:0 4px 14px -8px rgba(0,0,0,.3)}
.mw-docitem:hover .mw-docacts{display:flex;animation:mw-fadein .15s var(--mw-ease)}
.mw-docact{display:grid;place-items:center;width:22px;height:22px;border:0;border-radius:5px;background:transparent;color:var(--mw-dim);cursor:pointer;transition:background .14s,color .14s}
.mw-docact:hover{background:var(--mw-tint);color:var(--mw-text)}
.mw-rail-foot{padding:10px 12px;border-top:1px solid var(--mw-line);font-size:10.5px;color:var(--mw-faint);display:flex;align-items:center;justify-content:space-between;gap:8px}
.mw-linkbtn{border:0;background:transparent;color:var(--mw-dim);font:inherit;font-size:11px;cursor:pointer;padding:2px 5px;border-radius:5px;transition:color .14s,background .14s}
.mw-linkbtn:hover{color:var(--mw-accent);background:var(--mw-accent-soft)}

.mw-editor{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0;position:relative;background:var(--mw-card)}
.mw-editorhead{display:flex;align-items:center;gap:8px;height:36px;flex:none;padding:0 16px;border-bottom:1px solid var(--mw-line);color:var(--mw-faint);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase}
.mw-editorhead .mw-crumb{color:var(--mw-faint);letter-spacing:.02em;text-transform:none;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46%}
.mw-editorbody{flex:1;min-height:0;overflow:auto;position:relative}
.mw-textarea{display:block;width:100%;height:100%;min-height:100%;resize:none;border:0;outline:none;background:transparent;color:var(--mw-text);font-family:var(--mw-sans);font-size:14.5px;line-height:2;letter-spacing:.015em;padding:24px 30px 90px;tab-size:2;caret-color:var(--mw-accent);white-space:pre-wrap;word-break:break-word}
.mw-textarea::selection{background:color-mix(in srgb, var(--mw-accent) 16%, transparent)}
.mw-textarea::placeholder{color:var(--mw-faint)}
.mw-placeholder{position:absolute;inset:24px 30px auto;pointer-events:none;color:var(--mw-faint);font-size:14.5px;line-height:2}

.mw-splitter{width:7px;flex:none;cursor:col-resize;background:transparent;position:relative;z-index:5;margin:0 -3.5px}
.mw-splitter:after{content:"";position:absolute;inset:0 3px;background:transparent;transition:background .15s}
.mw-splitter:hover:after{background:var(--mw-accent-line)}
.mw-root[data-drag="1"] .mw-splitter:after{background:var(--mw-accent)}

.mw-preview{display:flex;flex-direction:column;min-width:0;min-height:0;flex:1;background:var(--mw-bg);position:relative}
.mw-previewhead{display:flex;align-items:center;gap:8px;height:36px;flex:none;padding:0 16px;border-bottom:1px solid var(--mw-line);color:var(--mw-faint);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;background:var(--mw-card)}
.mw-previewhead .mw-hint{margin-left:auto;text-transform:none;letter-spacing:.02em;font-size:10.5px;color:var(--mw-faint)}
.mw-stage{flex:1;min-height:0;min-width:0;overflow:auto;padding:26px 24px 90px;background-color:var(--mw-bg);background-image:radial-gradient(color-mix(in srgb, var(--mw-text) 7%, transparent) .7px, transparent .8px);background-size:18px 18px;background-attachment:local}
.mw-paper{width:100%;min-width:0;max-width:677px;margin:0 auto;background:#fff;color:#1a1a1a;border-radius:10px;box-shadow:var(--mw-shadow-paper);transition:max-width .24s var(--mw-ease);overflow:hidden}
.mw-paper .mdw-art{min-height:240px;animation:mw-fade .3s var(--mw-ease)}
@keyframes mw-fade{from{opacity:0}to{opacity:1}}
.mw-empty{padding:72px 22px;text-align:center;color:var(--mw-faint);font-size:12.5px;line-height:1.9}
.mw-empty strong{display:block;color:var(--mw-dim);font-size:13px;margin-bottom:6px}

/* ---------- 状态栏 ---------- */
.mw-status{display:flex;align-items:center;gap:16px;height:28px;flex:none;padding:0 16px;border-top:1px solid var(--mw-line);background:var(--mw-card);font-size:10.5px;color:var(--mw-faint);letter-spacing:.02em;overflow:hidden;white-space:nowrap}
.mw-status b{font-weight:600;color:var(--mw-dim);font-variant-numeric:tabular-nums}
.mw-status .mw-sp{margin-left:auto}
.mw-status .mw-tag{padding:0;background:none;color:var(--mw-faint)}
.mw-status .mw-dotsep{opacity:.35}

/* ---------- 弹层 ---------- */
.mw-popwrap{position:relative;display:inline-flex}
.mw-pop{position:absolute;top:calc(100% + 8px);right:0;z-index:80;background:var(--mw-card);border:1px solid var(--mw-line);border-radius:var(--mw-r-lg);box-shadow:var(--mw-shadow-pop);padding:14px;animation:mw-popin .18s var(--mw-ease)}
@keyframes mw-popin{from{opacity:0;transform:translateY(-6px) scale(.985)}to{opacity:1;transform:none}}
.mw-pop--wide{width:452px}
.mw-pophead{display:flex;align-items:baseline;gap:8px;margin-bottom:11px}
.mw-pophead h4{margin:0;font-size:12px;font-weight:700;letter-spacing:.05em}
.mw-pophead span{font-size:10.5px;color:var(--mw-faint);letter-spacing:.01em}
.mw-themes{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.mw-themecard{display:flex;flex-direction:column;gap:6px;padding:6px;border-radius:10px;border:1px solid var(--mw-line);background:var(--mw-card);cursor:pointer;text-align:left;transition:border-color .16s,transform .16s,box-shadow .16s;font:inherit}
.mw-themecard:hover{transform:translateY(-2px);box-shadow:0 10px 22px -12px rgba(0,0,0,.3);border-color:var(--mw-line-strong)}
.mw-themecard[data-active="1"]{border-color:var(--mw-accent);box-shadow:0 0 0 2px var(--mw-accent-soft)}
.mw-thumb{height:54px;border-radius:7px;padding:7px 8px;display:flex;flex-direction:column;gap:4px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}
.mw-thumb i{display:block;border-radius:1px}
.mw-tname{font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;color:var(--mw-text);line-height:1.2}
.mw-tname em{font-style:normal;font-size:8.5px;color:var(--mw-faint);letter-spacing:.06em;margin-left:auto}
.mw-origin{font-size:8px;padding:1px 4px;border-radius:3px;background:var(--mw-tint-2);color:var(--mw-faint);letter-spacing:.04em;text-transform:uppercase}

/* ---------- 抽屉 ---------- */
.mw-backdrop{position:absolute;inset:0;background:rgba(20,17,14,.26);backdrop-filter:blur(2px);z-index:90;animation:mw-fadein .18s}
@keyframes mw-fadein{from{opacity:0}to{opacity:1}}
.mw-drawer{position:absolute;top:0;right:0;bottom:0;width:404px;max-width:92%;background:var(--mw-card);border-left:1px solid var(--mw-line);z-index:91;display:flex;flex-direction:column;box-shadow:-30px 0 70px -34px rgba(0,0,0,.45);animation:mw-slidein .24s var(--mw-ease)}
@keyframes mw-slidein{from{transform:translateX(24px);opacity:.45}to{transform:none;opacity:1}}
.mw-drawerhead{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid var(--mw-line);flex:none}
.mw-drawerhead h3{margin:0;font-size:14px;font-family:var(--mw-serif);letter-spacing:.08em}
.mw-drawerhead .mw-sub{font-size:10.5px;color:var(--mw-faint);margin-left:auto}
.mw-drawerbody{flex:1;min-height:0;overflow-y:auto;padding:4px 18px 32px}
.mw-section{padding:15px 0;border-bottom:1px solid var(--mw-line)}
.mw-section:last-child{border-bottom:0}
.mw-section h5{margin:0 0 12px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--mw-faint);display:flex;align-items:center;gap:7px}
.mw-field{display:flex;align-items:center;gap:12px;min-height:32px}
.mw-field + .mw-field{margin-top:3px}
.mw-field > label{flex:none;width:88px;font-size:12px;color:var(--mw-dim);letter-spacing:.01em}
.mw-field .mw-val{flex:none;min-width:44px;text-align:right;font-size:11px;color:var(--mw-faint);font-variant-numeric:tabular-nums}
.mw-field .mw-grow{flex:1;min-width:0}
.mw-input,.mw-select{height:30px;border:1px solid var(--mw-line);border-radius:var(--mw-r-sm);background:var(--mw-card-2);color:var(--mw-text);font:inherit;font-size:12px;padding:0 9px;outline:none;min-width:0;transition:border-color .16s,box-shadow .16s,background .16s}
.mw-input:hover,.mw-select:hover{border-color:var(--mw-line-strong)}
.mw-input:focus,.mw-select:focus{border-color:var(--mw-accent-line);box-shadow:0 0 0 3px var(--mw-accent-soft);background:var(--mw-card)}
.mw-input--multi{height:auto;min-height:78px;padding:8px 9px;resize:vertical;font-family:var(--mw-mono);font-size:11px;line-height:1.6}
.mw-seg{display:flex;padding:2px;border-radius:9px;background:var(--mw-tint);gap:2px;flex:1}
.mw-seg button{flex:1;height:26px;border:0;border-radius:7px;background:transparent;color:var(--mw-dim);font:inherit;font-size:11.5px;cursor:pointer;transition:background .14s,color .14s}
.mw-seg button:hover{color:var(--mw-text)}
.mw-seg button[data-active="1"]{background:var(--mw-card);color:var(--mw-text);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.1)}
.mw-range{flex:1;accent-color:var(--mw-accent);height:2px}
.mw-switch{position:relative;width:34px;height:20px;border-radius:999px;background:var(--mw-tint-2);border:0;cursor:pointer;transition:background .2s;flex:none}
.mw-switch:after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .2s var(--mw-ease)}
.mw-switch[data-on="1"]{background:var(--mw-accent)}
.mw-switch[data-on="1"]:after{transform:translateX(14px)}
.mw-note{font-size:10.5px;line-height:1.7;color:var(--mw-faint);margin:6px 0 0}
.mw-swatches{display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:1}
.mw-swatchbtn{width:20px;height:20px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;color:var(--mw-dim);box-shadow:inset 0 0 0 1px rgba(0,0,0,.12);transition:transform .16s,box-shadow .16s}
.mw-swatchbtn:hover{transform:scale(1.14)}
.mw-swatchbtn[data-active="1"]{box-shadow:0 0 0 2px var(--mw-card),0 0 0 4px var(--mw-text)}
.mw-kbd{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:18px;padding:0 5px;border-radius:5px;border:1px solid var(--mw-line-strong);border-bottom-width:2px;background:var(--mw-card-2);font-family:var(--mw-mono);font-size:9.5px;color:var(--mw-dim)}
.mw-kv{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--mw-dim);padding:5px 0}
.mw-kv span{flex:1}
.mw-tip{display:flex;gap:8px;padding:10px 12px;border-radius:10px;background:var(--mw-accent-soft);color:color-mix(in srgb, var(--mw-accent) 72%, var(--mw-text));font-size:11px;line-height:1.65}

/* ---------- 菜单 / 弹窗 / 提示 ---------- */
.mw-menu{position:absolute;top:calc(100% + 6px);right:0;min-width:184px;z-index:85;background:var(--mw-card);border:1px solid var(--mw-line);border-radius:var(--mw-r-md);padding:5px;box-shadow:var(--mw-shadow-pop);animation:mw-popin .16s var(--mw-ease)}
.mw-menu button{display:flex;align-items:center;gap:9px;width:100%;padding:7px 9px;border:0;border-radius:7px;background:transparent;color:var(--mw-text);font:inherit;font-size:12px;cursor:pointer;text-align:left;white-space:nowrap;transition:background .14s}
.mw-menu button:hover{background:var(--mw-tint)}
.mw-menu button small{margin-left:auto;color:var(--mw-faint);font-size:10px}
.mw-menu hr{border:0;border-top:1px solid var(--mw-line);margin:4px 6px}
.mw-modal{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);width:360px;max-width:92%;z-index:95;background:var(--mw-card);border:1px solid var(--mw-line);border-radius:var(--mw-r-lg);padding:20px;box-shadow:0 34px 80px -28px rgba(0,0,0,.45);animation:mw-popin .18s var(--mw-ease)}
.mw-modal--wide{width:620px;max-height:84%;overflow-y:auto;top:44%}
.mw-modal h4{margin:0 0 6px;font-size:14px;font-family:var(--mw-serif);letter-spacing:.04em}
.mw-modal p{margin:0 0 12px;font-size:12px;line-height:1.7;color:var(--mw-dim)}
.mw-modalfoot{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
.mw-richpreview{min-height:56px;max-height:230px;overflow:auto;padding:12px;border:1px solid var(--mw-line);border-radius:10px;background:var(--mw-card-2);text-align:center}
.mw-richpreview .mdw-math{display:block;font-size:16px;color:#1a1a1a}
.mw-richpreview .mdw-mermaid{margin:0}
.mw-richpreview svg{max-width:100%;height:auto}
.mw-complist{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 12px}
.mw-complist button{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:6px 9px;border-radius:8px;border:1px solid var(--mw-line);background:var(--mw-card);color:var(--mw-dim);font:inherit;cursor:pointer;line-height:1.2;transition:border-color .14s,background .14s,color .14s}
.mw-complist button:hover{border-color:var(--mw-line-strong);color:var(--mw-text)}
.mw-complist button[data-active="1"]{border-color:var(--mw-accent);background:var(--mw-accent-soft);color:var(--mw-accent)}
.mw-complist strong{font-size:11.5px;font-weight:600}
.mw-complist small{font-size:9px;opacity:.6;letter-spacing:.04em}
.mw-compfields{max-height:200px;overflow-y:auto;padding-right:4px}
.mw-artstats{display:flex;align-items:center;gap:7px;padding:12px 20px 0;font-size:10.5px;letter-spacing:.04em;color:#9a948a}
.mw-artstats b{font-weight:600;color:#6b655c;font-variant-numeric:tabular-nums}
.mw-artstats i{font-style:normal;opacity:.5}
.mw-artstats-tag{margin-left:auto;padding:1px 8px;border-radius:999px;background:rgba(0,0,0,.035);color:#9a948a;font-size:9.5px;letter-spacing:.06em}
.mw-toast{position:absolute;left:50%;bottom:46px;transform:translateX(-50%);z-index:100;display:flex;align-items:center;gap:9px;padding:8px 15px;border-radius:999px;background:var(--mw-text);color:var(--mw-bg);font-size:12px;box-shadow:0 20px 44px -18px rgba(0,0,0,.5);animation:mw-toastin .22s var(--mw-ease);max-width:80%}
@keyframes mw-toastin{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
.mw-toast svg{flex:none}
.mw-toastact{border:0;border-radius:999px;padding:3px 10px;margin-left:2px;background:color-mix(in srgb, var(--mw-bg) 20%, transparent);color:inherit;font:inherit;font-size:11.5px;cursor:pointer;transition:background .14s}
.mw-toastact:hover{background:color-mix(in srgb, var(--mw-bg) 34%, transparent)}

/* ---------- 空态 / 骨架 ---------- */
.mw-skel{display:flex;flex-direction:column;gap:10px;padding:18px}
.mw-skel i{display:block;height:12px;border-radius:5px;background:var(--mw-tint);animation:mw-shimmer 1.4s infinite}
@keyframes mw-shimmer{0%,100%{opacity:.45}50%{opacity:1}}
.mw-loading{position:absolute;inset:0;display:grid;place-items:center;color:var(--mw-faint);font-size:12px;letter-spacing:.1em;text-transform:uppercase}

/* ---------- 大纲 ---------- */
.mw-outline{display:flex;flex-direction:column;gap:1px;padding:8px 6px}
.mw-outline button{border:0;background:transparent;color:var(--mw-dim);font:inherit;font-size:11.5px;text-align:left;padding:5px 8px;border-radius:6px;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:background .14s,color .14s}
.mw-outline button:hover{background:var(--mw-tint);color:var(--mw-text)}
.mw-outline button[data-level="1"]{font-weight:700;color:var(--mw-text)}
.mw-outline button[data-level="2"]{padding-left:18px}
.mw-outline button[data-level="3"]{padding-left:30px}
.mw-outline button[data-level="4"],.mw-outline button[data-level="5"],.mw-outline button[data-level="6"]{padding-left:42px;opacity:.8}
.mw-pane-tabs{display:flex;gap:2px;margin-left:auto;padding:2px;border-radius:8px;background:var(--mw-tint)}
.mw-pane-tabs button{border:0;background:transparent;color:var(--mw-faint);font:inherit;font-size:10px;letter-spacing:.04em;padding:3px 7px;border-radius:6px;cursor:pointer;transition:background .14s,color .14s}
.mw-pane-tabs button:hover{color:var(--mw-text)}
.mw-pane-tabs button[data-active="1"]{background:var(--mw-card);color:var(--mw-text);box-shadow:0 1px 2px rgba(0,0,0,.08)}

/* ---------- 富内容占位 ---------- */
.mw-paper .mdw-math:not([data-done])::after{content:"公式渲染中…";font-size:12px;color:#b3ada3;letter-spacing:.04em}
.mw-paper .mdw-mermaid:not([data-done])::after{content:"图表渲染中…";font-size:12px;color:#b3ada3;letter-spacing:.04em;display:block;padding:18px 0}
.mw-paper .mdw-mermaid svg{max-width:100%;height:auto}
.mw-paper .mdw-math[data-display="0"]{display:inline-block;vertical-align:-0.25em}
.mw-paper .mdw-math[data-display="0"] svg{vertical-align:middle}
.mw-paper mjx-assistive-mml,.mw-richpreview mjx-assistive-mml{display:none!important}

/* ---------- 响应式（按面板宽度，JS 写 data-*） ---------- */
.mw-root[data-narrow="1"] .mw-rail{width:200px}
.mw-root[data-tight="1"][data-rail="1"] .mw-rail{position:absolute;top:0;bottom:0;left:0;z-index:35;display:flex;box-shadow:0 20px 54px rgba(0,0,0,.22);background:var(--mw-card)}
.mw-railscrim{position:absolute;inset:0;z-index:30;background:color-mix(in srgb, var(--mw-text) 16%, transparent);backdrop-filter:blur(2px)}
.mw-root[data-tight="1"] .mw-splitter{display:none}
.mw-root[data-tight="1"] .mw-editor,
.mw-root[data-tight="1"] .mw-preview{display:none}
.mw-root[data-tight="1"][data-pane="editor"] .mw-editor{display:flex}
.mw-root[data-tight="1"][data-pane="preview"] .mw-preview{display:flex}
.mw-root[data-tight="1"] .mw-brandtext{display:none}
.mw-root[data-tight="1"] .mw-save{display:none}
.mw-root[data-tight="1"] .mw-actions .mw-btn--ghost span{display:none}

/* ---------- 模板 / 发布检查 ---------- */
.mw-tplgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0 2px}
.mw-tplcard{display:flex;flex-direction:column;gap:3px;align-items:flex-start;text-align:left;padding:10px 12px;border:1px solid var(--mw-line);border-radius:10px;background:var(--mw-card-2);color:var(--mw-text);font:inherit;cursor:pointer;transition:border-color .16s,background .16s,transform .16s}
.mw-tplcard:hover{border-color:var(--mw-accent-line);background:var(--mw-accent-soft);transform:translateY(-1px)}
.mw-tplcard small{font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mw-faint)}
.mw-tplcard strong{font-size:13px;font-weight:600}
.mw-tplcard span{font-size:11.5px;line-height:1.5;color:var(--mw-dim)}
.mw-checklist{display:flex;flex-direction:column;gap:8px;max-height:48vh;overflow:auto;margin:10px 0 2px}
.mw-checkrow{display:flex;gap:10px;padding:10px 12px;border:1px solid var(--mw-line);border-radius:10px;background:var(--mw-card-2)}
.mw-checkrow strong{display:block;font-size:12.5px;font-weight:600}
.mw-checkrow p{margin:3px 0 0;font-size:11.5px;line-height:1.6;color:var(--mw-dim)}
.mw-checkrow .mw-linkbtn{margin-left:auto;align-self:center;flex:none}
.mw-checkdot{width:7px;height:7px;border-radius:50%;margin-top:6px;flex:none;background:var(--mw-dim)}
.mw-checkrow[data-level="error"] .mw-checkdot{background:#df5340;box-shadow:0 0 0 3px rgba(223,83,64,.14)}
.mw-checkrow[data-level="warn"] .mw-checkdot{background:#d99a33;box-shadow:0 0 0 3px rgba(217,154,51,.14)}
.mw-checkrow[data-level="info"] .mw-checkdot{background:var(--mw-accent);box-shadow:0 0 0 3px var(--mw-accent-soft)}
.mw-checkok{display:flex;gap:12px;align-items:flex-start;padding:14px;border:1px solid var(--mw-line);border-radius:10px;background:var(--mw-card-2);margin:10px 0 2px}
.mw-checkok>svg{color:var(--mw-accent);flex:none;margin-top:1px}
.mw-checkok strong{display:block;font-size:13px}
.mw-checkok p{margin:4px 0 0;font-size:11.5px;color:var(--mw-dim);line-height:1.6}

/* ---------- 材质：实色 / 玻璃 / 通透 ---------- */
.mw-ambient{position:absolute;inset:-8%;z-index:0;pointer-events:none;opacity:0;transition:opacity .5s var(--mw-ease),transform .9s var(--mw-ease);transform:translate3d(calc(var(--mw-px,0) * 22px),calc(var(--mw-py,0) * 16px),0);overflow:hidden}
.mw-root[data-surface="glass"] .mw-ambient,.mw-root[data-surface="clear"] .mw-ambient{opacity:1}
.mw-ambient i{position:absolute;left:-6%;top:-14%;width:58%;height:58%;border-radius:50%;filter:blur(80px);background:radial-gradient(circle at 36% 36%, color-mix(in srgb, var(--mw-accent) 24%, transparent), transparent 72%);animation:mw-drift 30s ease-in-out infinite alternate;will-change:transform}
.mw-ambient i:nth-child(2){left:auto;right:-8%;top:auto;bottom:-16%;background:radial-gradient(circle at 62% 62%, color-mix(in srgb, var(--mw-accent) 13%, transparent), transparent 72%);animation-duration:44s;animation-direction:alternate-reverse}
@keyframes mw-drift{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(9%,7%,0) scale(1.08)}100%{transform:translate3d(-7%,-5%,0) scale(.95)}}
.mw-tools,.mw-status{position:relative}
.mw-root[data-surface="glass"],.mw-root[data-surface="clear"]{background:transparent}
.mw-root[data-surface="glass"] .mw-top,.mw-root[data-surface="glass"] .mw-tools,.mw-root[data-surface="glass"] .mw-status{background:color-mix(in srgb, var(--mw-card) 82%, transparent)}
.mw-root[data-surface="glass"] .mw-rail{background:color-mix(in srgb, var(--mw-card) 68%, transparent);backdrop-filter:blur(22px) saturate(1.12)}
.mw-root[data-surface="glass"] .mw-editor{background:color-mix(in srgb, var(--mw-card) 78%, transparent);backdrop-filter:blur(22px) saturate(1.1)}
.mw-root[data-surface="glass"] .mw-preview{background:transparent}
.mw-root[data-surface="glass"] .mw-previewhead{background:color-mix(in srgb, var(--mw-card) 82%, transparent)}
.mw-root[data-surface="glass"] .mw-stage{background-color:transparent;backdrop-filter:blur(18px) saturate(1.06)}
.mw-root[data-surface="clear"] .mw-top,.mw-root[data-surface="clear"] .mw-tools,.mw-root[data-surface="clear"] .mw-status{background:color-mix(in srgb, var(--mw-card) 68%, transparent)}
.mw-root[data-surface="clear"] .mw-rail{background:color-mix(in srgb, var(--mw-card) 58%, transparent);backdrop-filter:blur(14px) saturate(1.08)}
.mw-root[data-surface="clear"] .mw-editor{background:color-mix(in srgb, var(--mw-card) 64%, transparent);backdrop-filter:blur(14px) saturate(1.06)}
.mw-root[data-surface="clear"] .mw-preview{background:transparent}
.mw-root[data-surface="clear"] .mw-previewhead{background:color-mix(in srgb, var(--mw-card) 68%, transparent)}
.mw-root[data-surface="clear"] .mw-stage{background-color:transparent;backdrop-filter:blur(10px) saturate(1.04)}
.mw-root[data-surface="glass"] .mw-splitter,.mw-root[data-surface="clear"] .mw-splitter{background:transparent}
.mw-menusplit{display:block;height:1px;margin:5px 10px;background:var(--mw-line)}
.mw-toolwide--icon{width:28px;padding:0;justify-content:center;gap:0}
.mw-root[data-motion="0"] .mw-ambient{display:none}
.mw-root[data-motion="0"] *,.mw-root[data-motion="0"] *:before,.mw-root[data-motion="0"] *:after{animation-duration:.001ms !important;transition-duration:.001ms !important}

@media (prefers-reduced-motion: reduce){
  .mw-root,.mw-root *,.mw-root *:before,.mw-root *:after{animation-duration:.001ms !important;transition-duration:.001ms !important}
}
`.trim()
