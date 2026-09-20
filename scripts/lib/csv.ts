/** Minimal CSV parser that handles quoted fields. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let i = 0
  let quoted = false
  while (i < text.length) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        quoted = false
        i++
        continue
      }
      cell += c
      i++
      continue
    }
    if (c === '"') {
      quoted = true
      i++
      continue
    }
    if (c === ',') {
      row.push(cell)
      cell = ''
      i++
      continue
    }
    if (c === '\n' || (c === '\r' && text[i + 1] === '\n')) {
      row.push(cell)
      cell = ''
      if (row.some((x) => x.length)) rows.push(row)
      row = []
      i += c === '\r' ? 2 : 1
      continue
    }
    if (c === '\r') {
      row.push(cell)
      cell = ''
      if (row.some((x) => x.length)) rows.push(row)
      row = []
      i++
      continue
    }
    cell += c
    i++
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

export function csvObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text)
  if (!rows.length) return []
  const header = rows[0].map((h) => h.trim())
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {}
    header.forEach((h, i) => {
      o[h] = (r[i] ?? '').trim()
    })
    return o
  })
}
