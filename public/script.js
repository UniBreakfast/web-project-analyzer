const projectFolderName = document.getElementById('projectFolderName')
const structureList = document.getElementById('structureList')

getFolderStructure('prove-google-sheets-as-db').then(buildTree)

async function getNeighborFoldersNames() {
  const response = await fetch('/api/neighborFolders')
  return response.json()
}

async function getFolderStructure(folderName) {
  const response = await fetch('/api/scout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderName }),
  })

  return response.json()
}

function buildTree(report) {
  const [folderName, subs] = Object.entries(report)[0]
  projectFolderName.innerText = folderName

  fillFileList(subs, structureList)
}

function fillFileList(report, ul) {
  ul.replaceChildren(...Object.entries(report).map((pair) => {
    if (typeof pair[1] === 'number') {
      return buildFileItem(pair[0])
    } else {
      return buildFileItem(...pair)
    }
  }))
}

function buildFileItem(itemName, subs) {
  const li = document.createElement('li')

  if (subs) {
    li.classList.add('folder')

    li.innerHTML = `
      <details>
        <summary>
          <input type="checkbox" hidden>
          <span>${itemName}</span>
        </summary>
        <ul></ul>
      </details>
    `
    const ul = li.querySelector('ul')

    fillFileList(subs, ul)

  } else {
    li.innerHTML = `
      <label>
        <input type="checkbox" hidden>
        <span>${itemName}</span>
      </label>
    `
  }

  return li
}
