const fs = require('fs')
const fsp = fs.promises

const { createServer } = require('http')

const mimeTypes = {
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  svg: 'image/svg+xml; charset=utf-8',
  png: 'image/png',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  ico: 'image/x-icon',
  mp3: 'audio/mpeg',
  html: 'text/html; charset=utf-8',
  json: 'application/json; charset=utf-8',
  jpeg: 'image/jpeg',
  woff: 'application/font-woff',
  woff2: 'application/font-woff2',
}

const port = process.env.PORT || 3000
const server = createServer(handleRequest)

const apiHandlers = {neighborFoldersGET, scoutPOST}

server.listen(port, tellAboutStart)

async function handleApi(request) {
  const { url } = request
  const endpoint = url.slice(5) + request.method

  const answer = await apiHandlers[endpoint](request)

  return typeof answer === 'object' ? JSON.stringify(answer) : answer
}

async function neighborFoldersGET() {
  const folderNames = await getNeighborFoldersNames()

  return folderNames
}

async function scoutPOST(request) {
  const body = await getBody(request)
  const { folderName } = JSON.parse(body)

  return await scout('../' + folderName)
}

async function getBody(stream) {
  const chunks = []

  for await (const chunk of stream) chunks.push(chunk)

  return Buffer.concat(chunks).toString()
}

async function handleRequest(request, response) {
  let { url } = request

  if (url.startsWith('/api/')) {
    return response.end(await handleApi(request))
  }

  if (url === '/') url = '/index.html'

  try {
    const file = await fsp.readFile('public' + url)
    const ext = url.match(/\.([^.]+)$/)[1]
    const mime = mimeTypes[ext]

    response.setHeader('Content-Type', mime)
    response.end(file)

  } catch (error) {
    if (error.code === 'ENOENT') {
      response.statusCode = 404
      response.end(`Not found: ${url}`)
    } else {
      response.statusCode = 500
      response.end('Internal server error')
    }
  }
}

async function recon(path, depth = 32) {
  const stats = await fsp.stat(path)
  const dir = stats.isDirectory()

  if (!dir) {
    return stats.size
  }

  if (!depth) {
    return '...'
  }

  const list = await fsp.readdir(path)

  const entries = await Promise.all(list.map(async name => {
    const report = await recon(path + '/' + name, depth - 1)

    return [name, report]
  }))

  return Object.fromEntries(entries)
}

async function scout(path, depth = 32) {
  const report = await recon(path, depth)
  const name = path.match(/[^/\\]*$/)[0]

  return { [name]: report }
}

async function getNeighborFoldersNames() {
  const parentFolderInfo = await recon('..', 1)
  const folderNames = []

  for (const [name, value] of Object.entries(parentFolderInfo))
    if (typeof value !== 'number') folderNames.push(name)

  return folderNames
}

function tellAboutStart() {
  console.log(`Server started at http://localhost:${port}`)
}
