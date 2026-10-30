import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'

const projectRoot = resolve(import.meta.dirname, '..')
const buildRoot = join(projectRoot, '.desktop-build')
const sidecarDir = join(buildRoot, 'backend')
const appName = 'Whide Charts.app'
const outputApp = join(buildRoot, 'out', 'mac-arm64', appName)
const applicationsDir = join(homedir(), 'Applications')
const installedApp = join(applicationsDir, appName)

function run(command, args, options = {}) {
  execFileSync(command, args, { cwd: projectRoot, stdio: 'inherit', ...options })
}

if (process.platform !== 'darwin' || process.arch !== 'arm64') {
  throw new Error('The personal desktop build currently targets Apple Silicon Macs.')
}

mkdirSync(buildRoot, { recursive: true })
run('npm', ['run', 'build'])
rmSync(sidecarDir, { recursive: true, force: true })
run('uv', ['run', 'pyinstaller', '--noconfirm', '--clean', 'desktop/pyinstaller.spec', '--distpath', sidecarDir, '--workpath', join(buildRoot, 'pyinstaller')])

const dataDirectory = process.env.PERP_REPLAY_DATA_DIR || join(projectRoot, '.data')
const initialDataDirectory = existsSync(dataDirectory)
  ? resolve(dataDirectory)
  : join(homedir(), 'Library', 'Application Support', 'PerpReplay')
writeFileSync(join(buildRoot, 'desktop-data-path.txt'), `${initialDataDirectory}\n`)

run('npx', ['electron-builder', '--mac', 'dir', '--arm64', '--config', 'electron-builder.yml'])

if (!existsSync(outputApp)) throw new Error(`Electron Builder did not create ${outputApp}`)
mkdirSync(applicationsDir, { recursive: true })
if (existsSync(installedApp)) {
  const existingInfo = join(installedApp, 'Contents', 'Info.plist')
  const existingBundleId = existsSync(existingInfo)
    ? execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print:CFBundleIdentifier', existingInfo], { encoding: 'utf8' }).trim()
    : ''
  if (existingBundleId !== 'com.whiz.whidecharts') {
    throw new Error(`Refusing to replace an unrelated app at ${installedApp}`)
  }
  rmSync(installedApp, { recursive: true, force: true })
}
run('ditto', [outputApp, installedApp])
rmSync(join(buildRoot, 'out'), { recursive: true, force: true })
console.log(`Installed ${installedApp}`)
console.log(`Using market data at ${initialDataDirectory}`)
