const fsp = require('fs').promises
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

main()


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

async function getFolderStructure(folderNames) {
  console.log(folderNames.join('\n'))

  return new Promise(resolve => {
    rl.question('\nFolder name: ', async folderName => {
      if (!folderNames.includes(folderName)) {
        console.log('\nFolder name not found\n')
        return resolve()
      }

      const folderInfo = await scout('../' + folderName)

      console.log(JSON.stringify(folderInfo, null, 2).replaceAll('"', ''))

      rl.question('\nPress enter to continue...\n', () => resolve())
    })
  })
}

async function main() {
  const folderNames = await getNeighborFoldersNames()

  while (true) await getFolderStructure(folderNames)
}


setTimeout(() => {

}, 1e6);
