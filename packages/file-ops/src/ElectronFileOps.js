import FileOps from './FileOps'

export default class ElectronFileOps extends FileOps {
  constructor () {
    const fs = window.require('fs-extra')
    const path = window.require('path')
    super(fs, path)

    this.cp = window.require('child_process')
    this.electron = window.require('electron')
    this.trash = window.require('trash')

    this.homePath = this.electron.remote.app.getPath('home')
  }

  onFocus (handler) {
    this.electron.ipcRenderer.on('on-focus', handler)
  }

  offFocus (handler) {
    this.electron.ipcRenderer.on('off-focus', handler)
  }

  async openNewFile (defaultPath = this.homePath) {
    const result = await this.electron.remote.dialog.showOpenDialog({
      properties: ['openFile'],
      defaultPath: this.path.isAbsolute(defaultPath) ? defaultPath : this.path.join(this.homePath, defaultPath),
      filters: [
        // { name: 'all', extensions: ['cpp', 'hpp', 'wasm', 'abi', 'md', 'js', 'json', 'c', 'h', 'o'] }
      ]
    })
  
    if (result && result.filePaths && result.filePaths[0]) {
      const filePath = result.filePaths[0]
      return { key: filePath, path: filePath }
    } else {
      throw new Error()
    }
  }

  async chooseFolder (defaultPath = this.homePath) {
    const result = await this.electron.remote.dialog.showOpenDialog({
      buttonLabel: 'Open',
      defaultPath: this.path.isAbsolute(defaultPath) ? defaultPath : this.path.join(this.homePath, defaultPath),
      properties: ['openDirectory', 'createDirectory']
    })

    if (result && result.filePaths && result.filePaths[0]) {
      const filePath = result.filePaths[0]
      return filePath
    } else {
      throw new Error()
    }
  }

  openItem (filePath) {
    return this.electron.shell.openItem(filePath)
  }

  showItemInFolder (filePath) {
    return this.electron.shell.showItemInFolder(filePath)
  }

  getAppVersion () {
    return this.electron.remote.app.getVersion()
  }

  openLink (href) {
    return this.electron.shell.openExternal(href)
  }

  openInTerminal (filePath) {
    return this.cp.exec(`open -a Terminal "${filePath}"`)
    // exec(`start cmd @cmd /k pushd "${node.path}"`)
  }

  trash (files) {
    return this.trash(files)
  }
}