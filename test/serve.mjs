import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const root = new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    let path = decodeURIComponent(url.pathname === '/' ? '/test/harness.html' : url.pathname)
    // 测试环境没有宿主路由：把 /md-workbench/vendor/* 映射到插件的 vendor 目录
    if (path.startsWith('/md-workbench/vendor/')) path = '/vendor/' + path.slice('/md-workbench/vendor/'.length)
    const file = normalize(join(root, path))
    if (!file.startsWith(normalize(root))) {
      res.writeHead(403).end('forbidden')
      return
    }
    const info = await stat(file)
    if (!info.isFile()) throw new Error('not a file')
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(body)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found')
  }
}).listen(8123, '127.0.0.1', () => console.log('harness on http://127.0.0.1:8123/test/harness.html'))
