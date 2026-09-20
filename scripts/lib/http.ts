import { execFileSync } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

const CACHE = path.resolve(process.cwd(), '.cache')
const UA =
  'US-State-Finder/1.0 (local research app; +https://github.com/) Mozilla/5.0'

function curlGet(url: string): string | null {
  try {
    const buf = execFileSync('curl', ['-fsSL', '-A', UA, '--max-time', '120', url], {
      maxBuffer: 80 * 1024 * 1024,
    })
    const text = buf.toString('utf8')
    return text.length > 200 ? text : null
  } catch {
    return null
  }
}

export async function fetchText(url: string, cacheName: string): Promise<string> {
  await mkdir(CACHE, { recursive: true })
  const dest = path.join(CACHE, cacheName)
  try {
    const existing = await readFile(dest, 'utf8')
    if (existing.length > 200 && !existing.includes('Attention Required') && !existing.includes('"error"')) {
      return existing
    }
  } catch {
    // miss
  }
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml,text/csv,application/json;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  })
  if (!res.ok) {
    const viaCurl = curlGet(url)
    if (viaCurl) {
      await writeFile(dest, viaCurl)
      return viaCurl
    }
    throw new Error(`${url} -> ${res.status}`)
  }
  const text = await res.text()
  await writeFile(dest, text)
  return text
}

export async function fetchJson<T>(url: string, cacheName: string): Promise<T> {
  const text = await fetchText(url, cacheName)
  return JSON.parse(text) as T
}

export async function fetchBinary(url: string, cacheName: string): Promise<string> {
  await mkdir(CACHE, { recursive: true })
  const dest = path.join(CACHE, cacheName)
  try {
    const s = await stat(dest)
    if (s.size > 1000) return dest
  } catch {
    // miss
  }
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  if (!res.body) throw new Error(`no body: ${url}`)
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(dest))
  return dest
}

export async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}
