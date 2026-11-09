/**
 * 公众号MD编辑器 · 通用 UI 原子与弹层
 * 依赖：React（宿主注入）、MDW_THEMES、MDW_HL
 */

const ICONS = {
  pen: ['M12 20h9', 'M16.6 3.4a2.1 2.1 0 0 1 3 3L7.2 18.8 3 20l1.2-4.2Z'],
  doc: ['M7 3h7l5 5v13H7z', 'M14 3v5h5'],
  plus: ['M12 5v14', 'M5 12h14'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'M21 21l-4.3-4.3'],
  more: ['M12 6h.01', 'M12 12h.01', 'M12 18h.01'],
  trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 15H6L5 6'],
  copy: ['M9 9h11v11H9z', 'M5 15V4h11'],
  download: ['M12 3v12', 'M7 10l5 5 5-5', 'M5 21h14'],
  upload: ['M12 21V9', 'M7 14l5-5 5 5', 'M5 3h14'],
  settings: ['M4 7h8', 'M16 7h4', 'M4 17h4', 'M12 17h8', 'M14 5v4', 'M8 15v4'],
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  bold: ['M7 4h6a4 4 0 0 1 0 8H7z', 'M7 12h7a4 4 0 0 1 0 8H7z'],
  italic: ['M19 4h-9', 'M14 20H5', 'M15 4 9 20'],
  strike: ['M16 4H9a3 3 0 0 0-3 3', 'M6 15a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3', 'M4 12h16'],
  code: ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'],
  quote: ['M9 7H5v6h4V9c0 3-2 5-4 6', 'M19 7h-4v6h4V9c0 3-2 5-4 6'],
  ul: ['M9 6h12', 'M9 12h12', 'M9 18h12', 'M4.5 6h.01', 'M4.5 12h.01', 'M4.5 18h.01'],
  ol: ['M10 6h11', 'M10 12h11', 'M10 18h11', 'M4 5.5 5.5 4v4', 'M4 11.6h2.2L4 14.4h2.6'],
  task: ['M4 5h10v10H4z', 'M7 10l2.4 2.4L14 7.8'],
  link: ['M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5', 'M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5'],
  image: ['M4 4h16v16H4z', 'M4 15l4.5-4.5 4 4L16 11l4 4', 'M9 9h.01'],
  table: ['M3 4h18v16H3z', 'M3 10h18', 'M3 15h18', 'M9 4v16', 'M15 4v16'],
  hr: ['M4 12h16', 'M7 7h.01', 'M12 7h.01', 'M17 7h.01', 'M7 17h.01', 'M12 17h.01', 'M17 17h.01'],
  toc: ['M4 6h16', 'M7 11h13', 'M7 16h13', 'M7 21h13'],
  undo: ['M9 14 4 9l5-5', 'M4 9h11a5 5 0 0 1 0 10h-3'],
  redo: ['M15 14l5-5-5-5', 'M20 9H9a5 5 0 0 0 0 10h3'],
  clipboard: ['M9 4h6v3H9z', 'M8 6H6v15h12V6h-2', 'M9 13l2 2 4-4'],
  phone: ['M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', 'M11 18h2'],
  monitor: ['M3 4h18v12H3z', 'M8 20h8', 'M12 16v4'],
  split: ['M3 4h18v16H3z', 'M12 4v16'],
  chevron: ['M6 9l6 6 6-6'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  leaf: ['M4 20c0-9 6-15 16-16 0 10-5 16-13 16', 'M4 20c3-5 7-8 11-9.5'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v6H4V6h6'],
  sparkle: ['M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z'],
  sigma: ['M18 4H6l6 8-6 8h12'],
  flow: ['M5 4h6v6H5z', 'M13 14h6v6h-6z', 'M8 10v4h8'],
  grid: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  lock: ['M6 11h12v10H6z', 'M9 11V7a3 3 0 0 1 6 0v4'],
}

function Icon(props) {
  const paths = ICONS[props.name] === undefined ? ICONS.doc : ICONS[props.name]
  return h(
    'svg',
    {
      width: props.size === undefined ? 16 : props.size,
      height: props.size === undefined ? 16 : props.size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: props.width === undefined ? 1.7 : props.width,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true',
    },
    paths.map((d, index) => h('path', { key: index, d }))
  )
}

const MDW_DEVICES = [
  { id: 'auto', label: '自适应', hint: '最大 677 px' },
  { id: '375', label: 'iPhone SE', hint: '375 px' },
  { id: '390', label: 'iPhone 14', hint: '390 px' },
  { id: '414', label: 'iPhone Plus', hint: '414 px' },
  { id: '768', label: 'iPad', hint: '768 px' },
  { id: '1024', label: '桌面', hint: '1024 px' },
]

const MDW_ACCENTS = [
  { value: '', label: '跟随主题' },
  { value: '#0F4C81', label: '经典蓝' },
  { value: '#009874', label: '翡翠绿' },
  { value: '#FA5151', label: '活力橘' },
  { value: '#FECE00', label: '柠檬黄' },
  { value: '#92617E', label: '薰衣紫' },
  { value: '#55C9EA', label: '天空蓝' },
  { value: '#B76E79', label: '玫瑰金' },
]

function useOutside(ref, onClose, active) {
  useEffect(() => {
    if (active !== true) return undefined
    const handler = (event) => {
      if (ref.current !== null && !ref.current.contains(event.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onClose, active])
}

function Btn(props) {
  const className = 'mw-btn' + (props.variant === undefined ? '' : ' mw-btn--' + props.variant) + (props.className === undefined ? '' : ' ' + props.className)
  return h(
    'button',
    {
      type: 'button',
      className,
      onClick: props.onClick,
      disabled: props.disabled === true,
      title: props.title,
      'aria-label': props.label,
    },
    props.icon === undefined ? null : h(Icon, { name: props.icon, size: props.iconSize }),
    props.children
  )
}

function Tool(props) {
  return h(
    'button',
    {
      type: 'button',
      className: 'mw-tool',
      onClick: props.onClick,
      onMouseDown: (event) => event.preventDefault(),
      'data-active': props.active === true ? '1' : '0',
      title: props.hint,
      'aria-label': props.hint,
    },
    h(Icon, { name: props.name, size: props.size === undefined ? 15 : props.size }),
    h('span', { className: 'mw-tooltip' }, props.hint)
  )
}

function Seg(props) {
  return h(
    'div',
    { className: 'mw-seg', role: 'group' },
    props.options.map((option) =>
      h(
        'button',
        {
          key: option.value,
          type: 'button',
          'data-active': props.value === option.value ? '1' : '0',
          onClick: () => props.onChange(option.value),
          title: option.title,
        },
        option.label
      )
    )
  )
}

function Switch(props) {
  return h('button', {
    type: 'button',
    className: 'mw-switch',
    'data-on': props.value === true ? '1' : '0',
    role: 'switch',
    'aria-checked': props.value === true,
    onClick: () => props.onChange(!props.value),
    title: props.label,
  })
}

function Range(props) {
  return h(
    'div',
    { className: 'mw-field' },
    h('label', null, props.label),
    h('input', {
      className: 'mw-range',
      type: 'range',
      min: props.min,
      max: props.max,
      step: props.step === undefined ? 1 : props.step,
      value: props.value,
      onChange: (event) => props.onChange(Number(event.target.value)),
      'aria-label': props.label,
    }),
    h('span', { className: 'mw-val' }, props.format === undefined ? props.value : props.format(props.value))
  )
}

function ToggleField(props) {
  return h(
    'div',
    { className: 'mw-field' },
    h('label', null, props.label),
    h('div', { className: 'mw-grow' }),
    h(Switch, { value: props.value, onChange: props.onChange, label: props.label })
  )
}

function TextField(props) {
  return h(
    'div',
    { className: 'mw-field', style: { alignItems: 'flex-start' } },
    h('label', null, props.label),
    h('div', { className: 'mw-grow' }, h('input', {
      className: 'mw-input',
      style: { width: '100%' },
      type: props.type === undefined ? 'text' : props.type,
      value: props.value,
      placeholder: props.placeholder,
      spellCheck: false,
      onChange: (event) => props.onChange(event.target.value),
      'aria-label': props.label,
    }))
  )
}

function Modal(props) {
  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') props.onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [props])
  return h(
    'div',
    { className: 'mw-backdrop', onMouseDown: props.onCancel },
    h(
      'div',
      { className: 'mw-modal', onMouseDown: (event) => event.stopPropagation(), role: 'dialog', 'aria-modal': 'true' },
      h('h4', null, props.title),
      props.children,
      h(
        'div',
        { className: 'mw-modalfoot' },
        h(Btn, { onClick: props.onCancel }, props.cancelLabel === undefined ? '取消' : props.cancelLabel),
        h(Btn, { variant: 'primary', onClick: props.onConfirm, disabled: props.disabled === true }, props.confirmLabel === undefined ? '确定' : props.confirmLabel)
      )
    )
  )
}

function DialogShell(props) {
  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') props.onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [props])
  return h(
    'div',
    { className: 'mw-backdrop', onMouseDown: props.onClose },
    h(
      'div',
      { className: 'mw-modal mw-modal--wide', onMouseDown: (event) => event.stopPropagation(), role: 'dialog', 'aria-modal': 'true' },
      h('h4', null, props.title),
      props.subtitle === undefined ? null : h('p', null, props.subtitle),
      props.children,
      props.footer === false
        ? null
        : h(
            'div',
            { className: 'mw-modalfoot' },
            h(Btn, { onClick: props.onClose }, '取消'),
            h(Btn, { variant: 'primary', onClick: props.onConfirm, disabled: props.disabled === true }, props.confirmLabel)
          )
    )
  )
}

function useRichPreview(build) {
  const ref = useRef(null)
  useEffect(() => {
    const node = ref.current
    if (node === null) return
    node.innerHTML = ''
    const target = build()
    if (target !== null) {
      node.appendChild(target)
      MDW_RICH.hydrate(node)
    }
  })
  return ref
}

function FormulaDialog(props) {
  const [tex, setTex] = useState('\\frac{a}{b} = c')
  const [display, setDisplay] = useState('0')
  useEffect(() => {
    MDW_RICH.prefetch('math')
  }, [])
  const previewRef = useRichPreview(() => {
    if (tex.trim() === '') return null
    const target = document.createElement('div')
    target.className = 'mdw-math'
    target.setAttribute('data-display', display)
    target.setAttribute('data-tex', tex)
    return target
  })
  return h(
    DialogShell,
    {
      title: '插入公式',
      subtitle: 'MathJax 渲染；复制到公众号时自动转成图片，公式不会跑版。',
      onClose: props.onClose,
      confirmLabel: '插入公式',
      disabled: tex.trim() === '',
      onConfirm: () => {
        if (display === '1') props.onInsert('$$\n' + tex.trim() + '\n$$')
        else props.onInsert('$' + tex.trim() + '$')
        props.onClose()
      },
    },
    h('div', { className: 'mw-seg', style: { marginBottom: '10px' } },
      h('button', { type: 'button', 'data-active': display === '0' ? '1' : '0', onClick: () => setDisplay('0') }, '行内公式'),
      h('button', { type: 'button', 'data-active': display === '1' ? '1' : '0', onClick: () => setDisplay('1') }, '块级公式')
    ),
    h('textarea', {
      className: 'mw-input mw-input--multi',
      style: { width: '100%', minHeight: '84px' },
      value: tex,
      spellCheck: false,
      placeholder: '输入 LaTeX，例如 \\frac{a}{b} = c',
      onChange: (event) => setTex(event.target.value),
    }),
    h('p', { className: 'mw-note', style: { margin: '8px 0 4px' } }, '预览'),
    h('div', { className: 'mw-richpreview', ref: previewRef, 'data-display': display }),
    h('p', { className: 'mw-note' }, '常用：\\frac{}{}、\\sqrt{}、\\sum_{i=1}^{n}、\\int_{a}^{b}、\\alpha / \\beta / \\pi')
  )
}

function MermaidDialog(props) {
  const [code, setCode] = useState('flowchart LR\n  A[写作] --> B[排版]\n  B --> C[复制]\n  C --> D[公众号]')
  useEffect(() => {
    MDW_RICH.prefetch('mermaid')
  }, [])
  const previewRef = useRichPreview(() => {
    if (code.trim() === '') return null
    const target = document.createElement('div')
    target.className = 'mdw-mermaid'
    target.setAttribute('data-code', code)
    return target
  })
  return h(
    DialogShell,
    {
      title: '插入图表',
      subtitle: 'Mermaid 语法；复制时转成 PNG，微信里不会显示为空白。',
      onClose: props.onClose,
      confirmLabel: '插入图表',
      disabled: code.trim() === '',
      onConfirm: () => {
        props.onInsert('```mermaid\n' + code.trim() + '\n```')
        props.onClose()
      },
    },
    h('textarea', {
      className: 'mw-input mw-input--multi',
      style: { width: '100%', minHeight: '120px' },
      value: code,
      spellCheck: false,
      onChange: (event) => setCode(event.target.value),
    }),
    h('p', { className: 'mw-note', style: { margin: '8px 0 4px' } }, '预览'),
    h('div', { className: 'mw-richpreview', ref: previewRef, 'data-kind': 'mermaid' }),
    h('p', { className: 'mw-note' }, '支持 flowchart / sequenceDiagram / classDiagram / gantt / pie / stateDiagram 等常用类型。')
  )
}

function ComponentDialog(props) {
  const schemas = MDW_RICH.COMPONENT_SCHEMAS
  const [index, setIndex] = useState(0)
  useEffect(() => {
    MDW_RICH.prefetch('qr')
  }, [])
  const schema = schemas[index]
  const [values, setValues] = useState(() => {
    const initial = {}
    for (const field of schemas[0].fields) initial[field.key] = field.value
    return initial
  })
  const previewRef = useRichPreview(() => {
    const target = document.createElement('div')
    target.className = 'mdw-component'
    target.setAttribute('data-name', schema.name)
    target.setAttribute('data-props', JSON.stringify(values))
    return target
  })
  const pick = (nextIndex) => {
    setIndex(nextIndex)
    const initial = {}
    for (const field of schemas[nextIndex].fields) initial[field.key] = field.value
    setValues(initial)
  }
  const patch = (key, value) => setValues((previous) => ({ ...previous, [key]: value }))
  return h(
    DialogShell,
    {
      title: '插入组件',
      subtitle: '组件输出纯内联样式 HTML，复制到公众号不会掉样式。',
      onClose: props.onClose,
      confirmLabel: '插入组件',
      onConfirm: () => {
        props.onInsert(MDW_RICH.buildComponentTag(schema.name, values))
        props.onClose()
      },
    },
    h(
      'div',
      { className: 'mw-complist' },
      schemas.map((item, itemIndex) =>
        h(
          'button',
          { key: item.name, type: 'button', 'data-active': itemIndex === index ? '1' : '0', onClick: () => pick(itemIndex), title: item.desc },
          h('strong', null, item.label),
          h('small', null, item.name)
        )
      )
    ),
    h(
      'div',
      { className: 'mw-compfields' },
      schema.fields.map((field) =>
        field.type === 'textarea'
          ? h('div', { key: field.key, className: 'mw-field', style: { alignItems: 'flex-start' } },
              h('label', null, field.label),
              h('textarea', {
                className: 'mw-input mw-input--multi mw-grow',
                value: values[field.key] === undefined ? '' : String(values[field.key]),
                spellCheck: false,
                onChange: (event) => patch(field.key, event.target.value),
              }))
          : field.type === 'select'
            ? h('div', { key: field.key, className: 'mw-field' },
                h('label', null, field.label),
                h('select', {
                  className: 'mw-select mw-grow',
                  value: values[field.key],
                  onChange: (event) => patch(field.key, event.target.value),
                }, field.options.map((option) => h('option', { key: option[0], value: option[0] }, option[1]))))
            : field.type === 'bool'
              ? h(ToggleField, { key: field.key, label: field.label, value: values[field.key] === true, onChange: (value) => patch(field.key, value) })
              : h(TextField, {
                  key: field.key,
                  label: field.label,
                  value: values[field.key] === undefined ? '' : String(values[field.key]),
                  onChange: (value) => patch(field.key, value),
                })
      )
    ),
    h('p', { className: 'mw-note', style: { margin: '4px 0' } }, '预览'),
    h('div', { className: 'mw-richpreview', ref: previewRef })
  )
}

function TemplateDialog(props) {
  return h(
    DialogShell,
    {
      title: '文章模板',
      subtitle: '选一个骨架插入到光标处，【】是待填的占位内容。',
      onClose: props.onClose,
      footer: false,
    },
    h(
      'div',
      { className: 'mw-tplgrid' },
      MDW_TEMPLATES.map((template) =>
        h(
          'button',
          { key: template.id, type: 'button', className: 'mw-tplcard', onClick: () => props.onPick(template) },
          h('small', null, template.tag),
          h('strong', null, template.name),
          h('span', null, template.hint)
        )
      )
    ),
    h('div', { className: 'mw-modalfoot' }, h(Btn, { onClick: props.onClose }, '取消'))
  )
}

function CheckDialog(props) {
  const issues = props.issues === undefined ? [] : props.issues
  const labels = { error: '错误', warn: '注意', info: '建议' }
  return h(
    DialogShell,
    {
      title: '发布前检查',
      subtitle: issues.length === 0 ? '没有发现明显问题，可以复制到公众号了。' : '发现 ' + issues.length + ' 项，逐条确认后再发布。',
      onClose: props.onClose,
      footer: false,
    },
    issues.length === 0
      ? h(
          'div',
          { className: 'mw-checkok' },
          h(Icon, { name: 'check', size: 20 }),
          h('div', null, h('strong', null, '检查通过'), h('p', null, '代码块与公式已闭合，链接和图片也没有发现明显风险。'))
        )
      : h(
          'div',
          { className: 'mw-checklist' },
          issues.map((issue, index) =>
            h(
              'div',
              { className: 'mw-checkrow', key: issue.title + ':' + issue.line + ':' + index, 'data-level': issue.level },
              h('span', { className: 'mw-checkdot', title: labels[issue.level] }),
              h('div', { style: { minWidth: 0 } }, h('strong', null, issue.title), h('p', null, issue.detail)),
              issue.line > 0 ? h('button', { type: 'button', className: 'mw-linkbtn', onClick: () => props.onJump(issue.line) }, '定位') : null
            )
          )
        ),
    h('div', { className: 'mw-modalfoot' }, h(Btn, { variant: 'primary', onClick: props.onClose }, '知道了'))
  )
}

function ThemeCard(props) {
  const theme = props.theme
  return h(
    'button',
    {
      type: 'button',
      className: 'mw-themecard',
      'data-active': props.active === true ? '1' : '0',
      onClick: () => props.onPick(theme.id),
      title: theme.note,
    },
    h(
      'div',
      { className: 'mw-thumb', style: { background: theme.paper } },
      h('i', { style: { width: '46%', height: '4px', background: theme.accent, marginBottom: '2px' } }),
      h('i', { style: { width: '76%', height: '2px', background: theme.ink, opacity: '.72' } }),
      h('i', { style: { width: '64%', height: '2px', background: theme.ink, opacity: '.42' } }),
      h('i', {
        style: {
          width: '70%',
          height: '9px',
          background: theme.quoteBg === 'transparent' ? 'rgba(0,0,0,.05)' : theme.quoteBg,
          borderLeft: '2px solid ' + theme.accent,
          marginTop: '2px',
          borderRadius: '1px',
        },
      }),
      h('i', { style: { width: '54%', height: '2px', background: theme.ink, opacity: '.3', marginTop: '1px' } })
    ),
    h(
      'span',
      { className: 'mw-tname' },
      theme.name,
      theme.origin === 'doocs' ? h('span', { className: 'mw-origin', title: '移植自 doocs/md 内置主题' }, 'doocs') : null
    )
  )
}

function ThemePopover(props) {
  const ref = useRef(null)
  useOutside(ref, props.onClose, true)
  return h(
    'div',
    { className: 'mw-popwrap', ref },
    props.trigger,
    h(
      'div',
      { className: 'mw-pop mw-pop--wide', role: 'dialog' },
      h(
        'div',
        { className: 'mw-pophead' },
        h('h4', null, '文章主题'),
        h('span', null, '共 ' + MDW_THEMES.THEMES.length + ' 套 · 悬停看说明')
      ),
      h('div', { className: 'mw-themes' }, MDW_THEMES.THEMES.map((theme) => h(ThemeCard, { key: theme.id, theme, active: theme.id === props.current, onPick: props.onPick }))),
      h(
        'p',
        { className: 'mw-note', style: { marginTop: '10px' } },
        '「经典 / 优雅 / 简洁」移植自 doocs/md；其余为公众号MD编辑器原创版式，配色取自其官方主色。'
      )
    )
  )
}

function SettingsDrawer(props) {
  const s = props.settings
  const patch = props.onPatch
  const codeThemes = Object.keys(MDW_HL.PALETTES)
  return h(
    'div',
    { className: 'mw-backdrop', onMouseDown: props.onClose },
    h(
      'aside',
      { className: 'mw-drawer', onMouseDown: (event) => event.stopPropagation(), role: 'dialog', 'aria-label': '设置' },
      h(
        'div',
        { className: 'mw-drawerhead' },
        h('h3', null, '排版设置'),
        h('span', { className: 'mw-sub' }, '即时生效'),
        h(Btn, { variant: 'icon', icon: 'x', onClick: props.onClose, label: '关闭设置' })
      ),
      h(
        'div',
        { className: 'mw-drawerbody' },
        h(
          'div',
          { className: 'mw-section' },
          h('h5', null, '外观'),
          h('div', { className: 'mw-field' }, h('label', null, '材质'), h(Seg, {
            value: s.surface || 'solid',
            onChange: (value) => patch({ surface: value }),
            options: [
              { value: 'solid', label: '实色' },
              { value: 'glass', label: '玻璃' },
              { value: 'clear', label: '通透' },
            ],
          })),
          h('div', { className: 'mw-field' }, h('label', null, '界面主色'), h(Seg, {
            value: s.accentSource || 'ink',
            onChange: (value) => patch({ accentSource: value }),
            options: [
              { value: 'ink', label: '朱砂' },
              { value: 'host', label: '跟随皮肤' },
            ],
          })),
          h(ToggleField, { label: '界面动效', value: s.motion !== false, onChange: (value) => patch({ motion: value }) }),
          h('p', { className: 'mw-note' }, '玻璃与通透会让宿主壁纸与皮肤透出来；正文纸面始终纯白，复制到公众号不受影响。')
        ),
        h(
          'div',
          { className: 'mw-section' },
          h('h5', null, '正文'),
          h('div', { className: 'mw-field' }, h('label', null, '字体'), h(Seg, {
            value: s.fontFamily,
            onChange: (value) => patch({ fontFamily: value }),
            options: [
              { value: 'system', label: '无衬线' },
              { value: 'serif', label: '衬线' },
              { value: 'song', label: '宋体' },
              { value: 'kai', label: '楷体' },
              { value: 'mono', label: '等宽' },
            ],
          })),
          h(Range, { label: '字号', min: 12, max: 24, value: s.fontSize, onChange: (value) => patch({ fontSize: value }), format: (value) => value + ' px' }),
          h(Range, { label: '行高', min: 1.2, max: 2.6, step: 0.05, value: s.lineHeight, onChange: (value) => patch({ lineHeight: value }), format: (value) => Number(value).toFixed(2) }),
          h(Range, { label: '段距', min: 0, max: 48, value: s.paragraphSpacing, onChange: (value) => patch({ paragraphSpacing: value }), format: (value) => value + ' px' }),
          h(Range, { label: '字距', min: 0, max: 3, step: 0.1, value: s.letterSpacing, onChange: (value) => patch({ letterSpacing: value }), format: (value) => Number(value).toFixed(1) + ' px' }),
          h(Range, { label: '页边距', min: 0, max: 48, value: s.pagePadding, onChange: (value) => patch({ pagePadding: value }), format: (value) => value + ' px' }),
          h('div', { className: 'mw-field' }, h('label', null, '对齐'), h(Seg, {
            value: s.textAlign,
            onChange: (value) => patch({ textAlign: value }),
            options: [
              { value: 'left', label: '左对齐' },
              { value: 'justify', label: '两端' },
              { value: 'center', label: '居中' },
            ],
          })),
          h('div', { className: 'mw-field' }, h('label', null, '主题色'), h(
            'div',
            { className: 'mw-swatches' },
            MDW_ACCENTS.map((item) =>
              h(
                'button',
                {
                  key: item.value === '' ? 'theme' : item.value,
                  type: 'button',
                  className: 'mw-swatchbtn',
                  title: item.label,
                  'data-active': s.accent === item.value ? '1' : '0',
                  style: { background: item.value === '' ? 'var(--mw-tint-2)' : item.value },
                  onClick: () => patch({ accent: item.value }),
                },
                item.value === '' ? h(Icon, { name: 'leaf', size: 11 }) : null
              )
            )
          )),
          h(ToggleField, { label: '首行缩进', value: s.indent, onChange: (value) => patch({ indent: value }) }),
          h(ToggleField, { label: '保留换行', value: s.softBreaks, onChange: (value) => patch({ softBreaks: value }) })
        ),
        h(
          'div',
          { className: 'mw-section' },
          h('h5', null, '代码块'),
          h('div', { className: 'mw-field' }, h('label', null, '配色'), h('select', {
            className: 'mw-select mw-grow',
            value: s.codeThemeId,
            onChange: (event) => patch({ codeThemeId: event.target.value }),
          }, codeThemes.map((id) => h('option', { key: id, value: id }, MDW_HL.PALETTES[id].label)))),
          h('p', { className: 'mw-note' }, '代码块带 mac 圆点与语言标签，高亮颜色直接写在内联样式里，复制到公众号不会丢。')
        ),
        h(
          'div',
          { className: 'mw-section' },
          h('h5', null, '链接'),
          h(ToggleField, { label: '外链转脚注', value: s.linkRefs, onChange: (value) => patch({ linkRefs: value }) }),
          h('p', { className: 'mw-note' }, '公众号正文不支持外链。开启后，链接文字保留为上标序号，文末自动汇总地址。')
        ),
        h(
          'div',
          { className: 'mw-section' },
          h('h5', null, '预览'),
          h('div', { className: 'mw-field' }, h('label', null, '预览设备'), h('select', {
            className: 'mw-select mw-grow',
            value: s.articleWidth,
            onChange: (event) => patch({ articleWidth: event.target.value }),
          }, MDW_DEVICES.map((item) => h('option', { key: item.id, value: item.id }, item.label + ' · ' + item.hint)))),
          h(ToggleField, { label: '字数统计', value: s.showStats, onChange: (value) => patch({ showStats: value }) }),
          h(ToggleField, { label: '同步滚动', value: s.scrollSync, onChange: (value) => patch({ scrollSync: value }) }),
          h('p', { className: 'mw-note' }, '字数统计显示在预览文章顶部，只影响预览，不会复制进公众号。')
        ),
        h(
          'div',
          { className: 'mw-section' },
          h('h5', null, '图片转存'),
          h('div', { className: 'mw-field' }, h('label', null, '图床'), h('select', {
            className: 'mw-select mw-grow',
            value: s.imageProvider,
            onChange: (event) => patch({ imageProvider: event.target.value }),
          }, [
            { value: 'local', label: '本地目录（默认）' },
            { value: 'embed', label: 'base64 内嵌正文' },
            { value: 'github', label: 'GitHub 仓库 + jsDelivr' },
            { value: 'cloudinary', label: 'Cloudinary（unsigned）' },
            { value: 'custom', label: '自定义上传接口' },
          ].map((item) => h('option', { key: item.value, value: item.value }, item.label)))),
          h('p', { className: 'mw-note' }, '公众号只能抓取公网图片。选 GitHub / Cloudinary 后，粘贴图片会直接上传并写入公网 URL。'),
          s.imageProvider === 'github'
            ? h(
                'div',
                null,
                h(TextField, { label: '仓库', value: s.githubRepo, placeholder: 'owner/repo', onChange: (value) => patch({ githubRepo: value }) }),
                h(TextField, { label: 'Token', type: 'password', value: s.githubToken, placeholder: 'ghp_…（需 contents 写权限）', onChange: (value) => patch({ githubToken: value }) }),
                h(TextField, { label: '目录', value: s.githubPath, placeholder: 'images', onChange: (value) => patch({ githubPath: value }) }),
                h(TextField, { label: '分支', value: s.githubBranch, placeholder: 'main', onChange: (value) => patch({ githubBranch: value }) })
              )
            : null,
          s.imageProvider === 'cloudinary'
            ? h(
                'div',
                null,
                h(TextField, { label: 'Cloud name', value: s.cloudName, placeholder: '你的 cloud name', onChange: (value) => patch({ cloudName: value }) }),
                h(TextField, { label: 'Preset', value: s.cloudPreset, placeholder: 'unsigned upload preset', onChange: (value) => patch({ cloudPreset: value }) })
              )
            : null,
          s.imageProvider === 'custom'
            ? h(
                'div',
                null,
                h(TextField, { label: '接口', value: s.uploadUrl, placeholder: 'https://example.com/upload', onChange: (value) => patch({ uploadUrl: value }) }),
                h(TextField, { label: '字段名', value: s.uploadField, placeholder: 'file', onChange: (value) => patch({ uploadField: value }) }),
                h(TextField, { label: '返回路径', value: s.uploadPath, placeholder: 'data.url', onChange: (value) => patch({ uploadPath: value }) }),
                h(
                  'div',
                  { className: 'mw-field', style: { alignItems: 'flex-start' } },
                  h('label', null, 'Headers'),
                  h('div', { className: 'mw-grow' },
                    h('textarea', {
                      className: 'mw-input mw-input--multi',
                      style: { width: '100%' },
                      value: s.uploadHeaders,
                      placeholder: '{"Authorization":"Bearer ..."}',
                      spellCheck: false,
                      onChange: (event) => patch({ uploadHeaders: event.target.value }),
                    })
                  )
                )
              )
            : null,
          h(ToggleField, { label: '复制时转存', value: s.autoUpload, onChange: (value) => patch({ autoUpload: value }) }),
          h('p', { className: 'mw-note' }, '开启后，点「复制到公众号」时会把正文里的本地图片逐张上传并替换为公网地址。')
        ),
        h(
          'div',
          { className: 'mw-section' },
          h('h5', null, '自定义 CSS'),
          h('textarea', {
            className: 'mw-input mw-input--multi',
            style: { width: '100%', minHeight: '110px' },
            value: s.customCss,
            spellCheck: false,
            placeholder: '.mdw-art h2 { letter-spacing: .2em; }',
            onChange: (event) => patch({ customCss: event.target.value }),
          }),
          h('p', { className: 'mw-note' }, '追加在主题之后，预览与复制都会带上；选择器请以 .mdw-art 开头。')
        ),
        h(
          'div',
          { className: 'mw-section' },
          h('h5', null, '快捷键'),
          h('div', { className: 'mw-kv' }, h('span', null, '加粗 / 斜体'), h('span', { className: 'mw-kbd' }, 'Ctrl'), h('span', { className: 'mw-kbd' }, 'B'), h('span', { style: { color: 'var(--mw-faint)' } }, '/'), h('span', { className: 'mw-kbd' }, 'I')),
          h('div', { className: 'mw-kv' }, h('span', null, '插入链接'), h('span', { className: 'mw-kbd' }, 'Ctrl'), h('span', { className: 'mw-kbd' }, 'K')),
          h('div', { className: 'mw-kv' }, h('span', null, '删除线'), h('span', { className: 'mw-kbd' }, 'Ctrl'), h('span', { className: 'mw-kbd' }, 'D')),
          h('div', { className: 'mw-kv' }, h('span', null, '标题 1–6'), h('span', { className: 'mw-kbd' }, 'Ctrl'), h('span', { className: 'mw-kbd' }, '1…6')),
          h('div', { className: 'mw-kv' }, h('span', null, '整理排版'), h('span', { className: 'mw-kbd' }, 'Alt'), h('span', { className: 'mw-kbd' }, 'Shift'), h('span', { className: 'mw-kbd' }, 'F')),
          h('div', { className: 'mw-kv' }, h('span', null, '立即保存'), h('span', { className: 'mw-kbd' }, 'Ctrl'), h('span', { className: 'mw-kbd' }, 'S')),
          h('div', { className: 'mw-kv' }, h('span', null, '缩进选中行'), h('span', { className: 'mw-kbd' }, 'Tab'), h('span', { style: { color: 'var(--mw-faint)' } }, '/'), h('span', { className: 'mw-kbd' }, 'Shift+Tab')),
          h('div', { className: 'mw-kv' }, h('span', null, '反引号包裹代码'), h('span', { className: 'mw-kbd' }, 'Ctrl'), h('span', { className: 'mw-kbd' }, 'E'))
        ),
        h(
          'div',
          { className: 'mw-section' },
          h('h5', null, '存储'),
          h('p', { className: 'mw-note' }, '草稿与设置保存在本机 ~/.dsh/md-workbench/store.json；图片在同目录 images/ 下。不会上传。'),
          h('div', { className: 'mw-tip' }, h(Icon, { name: 'lock', size: 14 }), h('span', null, '所有内容仅在本机流转。复制到公众号时由剪贴板直接交给编辑器。'))
        )
      )
    )
  )
}
