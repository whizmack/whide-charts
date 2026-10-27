const { app, BrowserWindow, dialog, Menu } = require('electron')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const HOST = '127.0.0.1'
const PORT = 8765
const HEALTH_URL = `http://${HOST}:${PORT}/api/health`
let backendProcess = null
let ownsBackend = false
let quitting = false
let shutdownComplete = false

function getDataDirectory() {
  const configuredPath = process.env.PERP_REPLAY_DATA_DIR
  if (configuredPath) return configuredPath

  const bundledPath = path.join(process.resourcesPath, 'desktop-data-path.txt')
  if (app.isPackaged && fs.existsSync(bundledPath)) {
    const bundledDataPath = fs.readFileSync(bundledPath, 'utf8').trim()
    if (bundledDataPath && fs.existsSync(bundledDataPath)) return bundledDataPath
  }

  if (!app.isPackaged) {
    const projectDataPath = path.resolve(app.getAppPath(), '.data')
    if (fs.existsSync(projectDataPath)) return projectDataPath
  }

  return path.join(os.homedir(), 'Library', 'Application Support', 'PerpReplay')
}

async function checkExistingBackend() {
  let response
  try {
    response = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(1000) })
  } catch {
    return false
  }

  if (!response.ok) {
    throw new Error(`Port ${PORT} is serving an unexpected local service (HTTP ${response.status}).`)
  }

  const health = await response.json().catch(() => null)
  if (health?.app !== 'perp-replay' || health?.status !== 'ok') {
    throw new Error(`Port ${PORT} is in use by a service that is not Whide Charts.`)
  }
  return true
}

function startBackend() {
  const env = {
    ...process.env,
    PERP_REPLAY_API_PORT: String(PORT),
    PERP_REPLAY_DATA_DIR: getDataDirectory(),
    PERP_REPLAY_WEB_DIR: app.isPackaged
      ? path.join(process.resourcesPath, 'web')
      : path.join(app.getAppPath(), 'dist'),
  }

  if (app.isPackaged) {
    const executable = path.join(process.resourcesPath, 'backend', 'perp-replay-backend', 'perp-replay-backend')
    if (!fs.existsSync(executable)) throw new Error(`Packaged backend was not found at ${executable}.`)
    backendProcess = spawn(executable, [], { env, stdio: ['ignore', 'pipe', 'pipe'] })
  } else {
    const projectRoot = app.getAppPath()
    const python = path.join(projectRoot, '.venv', 'bin', 'python')
    if (!fs.existsSync(python)) throw new Error(`Python environment was not found at ${python}. Run uv sync --frozen.`)
    backendProcess = spawn(python, ['-m', 'backend.desktop'], {
      cwd: projectRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  }

  ownsBackend = true
  let backendOutput = ''
  const rememberOutput = (chunk) => {
    backendOutput = `${backendOutput}${chunk.toString()}`.slice(-12000)
  }
  backendProcess.stdout.on('data', rememberOutput)
  backendProcess.stderr.on('data', rememberOutput)

  return new Promise((resolve, reject) => {
    let settled = false
    let exited = false
    const fail = (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(error)
    }
    const timer = setTimeout(() => fail(new Error('The local backend did not start within 45 seconds.')), 45000)
    backendProcess.once('error', (error) => {
      backendOutput = `${backendOutput}\n${error.message}`
      fail(new Error(`Could not start the local backend.\n${backendOutput}`))
    })
    backendProcess.once('exit', (code, signal) => {
      exited = true
      fail(new Error(`The local backend stopped (${signal || `exit ${code}`}).\n${backendOutput}`))
    })

    const poll = async () => {
      if (settled || exited) return
      try {
        if (await checkExistingBackend()) {
          settled = true
          clearTimeout(timer)
          resolve()
          return
        }
      } catch (error) {
        fail(error)
        return
      }
      if (settled || exited) return
      setTimeout(poll, 250)
    }
    void poll()
  })
}

async function ensureBackend() {
  if (await checkExistingBackend()) return
  await startBackend()
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: '#0b0e11',
    title: 'Whide Charts',
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 12, y: 13 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })
  window.loadURL(`http://${HOST}:${PORT}/?desktop=1`)
}

async function stopOwnedBackend() {
  if (!ownsBackend || !backendProcess || backendProcess.exitCode !== null || backendProcess.pid == null) {
    ownsBackend = false
    return
  }
  const child = backendProcess
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) child.kill('SIGKILL')
      resolve()
    }, 2500)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
    child.kill('SIGTERM')
  })
  ownsBackend = false
}

function installAppMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit Whide Charts', accelerator: 'Command+Q', click: () => app.quit() },
      ],
    },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'togglefullscreen' }] },
  ]))
}

app.whenReady().then(async () => {
  app.setName('Whide Charts')
  installAppMenu()
  try {
    await ensureBackend()
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  } catch (error) {
    await stopOwnedBackend()
    await dialog.showMessageBox({
      type: 'error',
      title: 'Whide Charts could not start',
      message: 'The local chart service could not be started.',
      detail: `${error.message}\n\nData folder: ${getDataDirectory()}`,
    })
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', (event) => {
  if (shutdownComplete) return
  event.preventDefault()
  if (quitting) return
  quitting = true
  void stopOwnedBackend().finally(() => {
    shutdownComplete = true
    app.quit()
  })
})
