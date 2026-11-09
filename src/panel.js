/**
 * 公众号MD编辑器 · 面板注册
 * 左侧栏图标（sidebar.panellist）+ 整页面板（main）。
 */

const PANEL_ID = 'md-workbench'
const PANEL_ORDER = 57

let mwOpenPanel = () => {}

function PanelIcon(props) {
  const select = props !== undefined && props !== null && typeof props.onSelect === 'function' ? props.onSelect : mwOpenPanel
  return h(
    'svg',
    {
      width: 20,
      height: 20,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.55,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      role: 'img',
      'aria-label': '公众号MD编辑器',
      style: { cursor: 'pointer' },
      onClick: () => select(),
    },
    h('rect', { x: 2.8, y: 3.6, width: 18.4, height: 16.8, rx: 4, opacity: 0.55 }),
    h('path', { d: 'M7 16.4V9.6l2.6 3.4 2.6-3.4v6.8' }),
    h('path', { d: 'M15.4 9.8v4l2.2 2' }),
    h('path', { d: 'M6 19.6h12', opacity: 0.35 })
  )
}

function Page() {
  return h(Workbench, null)
}

// 仅用于本地验收：带 ?mdwdebug=1 打开时把渲染层暴露到 window
if (typeof location !== 'undefined' && String(location.search).indexOf('mdwdebug=1') !== -1) {
  window.__MDW_TEST__ = { rich: MDW_RICH, engine: MDW_ENGINE, inline: MDW_INLINE, themes: MDW_THEMES }
}

const mdwPlugin = {
  inject: ['slots'],
  apply(ctx) {
    const slots = ctx.slots
    mwOpenPanel = () => {
      try {
        const layout = typeof ctx.get === 'function' ? ctx.get('layout') : undefined
        if (layout !== undefined && layout !== null && typeof layout.selectPanel === 'function') layout.selectPanel(PANEL_ID)
      } catch {
        /* 没有 layout 面时保持当前面板 */
      }
    }
    const disposers = [
      slots.inject('sidebar.panellist', () =>
        slots.register({ name: 'sidebar.panellist', id: PANEL_ID, order: PANEL_ORDER, label: () => '公众号MD编辑器' }, PanelIcon)
      ),
      slots.inject('main', () => slots.register({ name: 'main', key: PANEL_ID }, Page)),
    ]
    return () => {
      for (const dispose of disposers) {
        if (dispose === undefined || dispose === null) continue
        try {
          dispose()
        } catch {
          /* 已释放 */
        }
      }
    }
  },
}

return mdwPlugin
