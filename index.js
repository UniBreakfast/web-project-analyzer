const fsp = require('fs').promises

async function explore(path, depth = 32) {
  const stats = await fsp.stat(path)
  const dir = stats.isDirectory()
  const name = path.match(/[^/\\]*$/)[0]
  const report = { name }

  if (!dir) {
    report.size = stats.size

  } else if (depth) {
    const list = await fsp.readdir(path)

    report.subs = await Promise.all(list.map(
      name => explore(path + '/' + name, depth - 1)
    ))

  } else {
    report.subs = '...'
  }

  return report
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

scout('..').then(console.log)

setTimeout(() => {

}, 1e6);
