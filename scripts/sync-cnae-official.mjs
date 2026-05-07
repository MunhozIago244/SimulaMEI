import crypto from 'node:crypto'
import { existsSync } from 'node:fs'
import {
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import * as XLSX from 'xlsx'

const ROOT_DIR = process.cwd()
const DATA_DIR = path.join(ROOT_DIR, 'data', 'cnae')
const RAW_DIR = path.join(DATA_DIR, 'raw')
const SNAPSHOT_DIR = path.join(DATA_DIR, 'snapshots')
const REPORT_DIR = path.join(DATA_DIR, 'reports')
const LATEST_PATH = path.join(DATA_DIR, 'latest.json')
const MANIFEST_PATH = path.join(DATA_DIR, 'source-manifest.json')

const OFFICIAL_SOURCES = [
  {
    id: 'concla-ibge-cnae-2-3-subclasses',
    type: 'catalog',
    parser: 'concla-cnae-subclasses-2-3-xlsx',
    name: 'CNAE 2.3 Subclasses - estrutura detalhada',
    owner: 'IBGE/CONCLA',
    pageUrl: 'https://concla.ibge.gov.br/classificacoes/download-concla.html',
    rowLabel: 'CNAE 2.3 Subclasses',
    fallbackFileUrl:
      'https://concla.ibge.gov.br/images/concla/documentacao/CNAE_Subclasses_2_3_Estrutura_Detalhada.xlsx',
  },
  {
    id: 'simples-nacional-mei-anexo-xi',
    type: 'document',
    parser: null,
    name: 'Anexo XI - ocupacoes permitidas ao MEI',
    owner: 'Comite Gestor do Simples Nacional / Receita Federal',
    pageUrl:
      'https://www8.receita.fazenda.gov.br/SimplesNacional/Arquivos/manual/Anexo_XI.pdf',
    fallbackFileUrl:
      'https://www8.receita.fazenda.gov.br/SimplesNacional/Arquivos/manual/Anexo_XI.pdf',
  },
  {
    id: 'simples-nacional-legislacao',
    type: 'document',
    parser: null,
    name: 'Indice oficial de legislacao do Simples Nacional',
    owner: 'Comite Gestor do Simples Nacional / Receita Federal',
    pageUrl:
      'https://www8.receita.fazenda.gov.br/SimplesNacional/ConteudoApoio/Legislacao/TelaLegislacao.aspx',
    fallbackFileUrl:
      'https://www8.receita.fazenda.gov.br/SimplesNacional/ConteudoApoio/Legislacao/TelaLegislacao.aspx',
  },
]

const args = new Set(process.argv.slice(2))
const checkMode = args.has('--check')

async function main() {
  await ensureDirectories()

  const fetchedAt = new Date().toISOString()
  const dateStamp = fetchedAt.slice(0, 10)
  const previousSnapshot = await readJsonIfExists(LATEST_PATH)

  const sourceResults = []
  let officialCatalog = null

  for (const source of OFFICIAL_SOURCES) {
    const result = await fetchSource(source, dateStamp, fetchedAt)
    sourceResults.push(result.manifest)

    if (source.type === 'catalog') {
      officialCatalog = result.catalog
    }
  }

  if (!officialCatalog) {
    throw new Error('Nenhuma fonte oficial de catalogo CNAE foi processada.')
  }

  const snapshot = {
    schemaVersion: 1,
    generatedAt: fetchedAt,
    source: officialCatalog.source,
    monitoredSources: sourceResults,
    total: officialCatalog.records.length,
    records: officialCatalog.records,
  }

  const report = buildReport(previousSnapshot, snapshot, fetchedAt)
  const snapshotPath = path.join(
    SNAPSHOT_DIR,
    `${dateStamp}-${snapshot.source.hashSha256.slice(0, 12)}.json`,
  )
  const reportPath = path.join(REPORT_DIR, `${dateStamp}.json`)

  await writeJson(MANIFEST_PATH, {
    schemaVersion: 1,
    generatedAt: fetchedAt,
    sources: sourceResults,
  })
  await writeJson(LATEST_PATH, snapshot)
  await writeJson(snapshotPath, snapshot)
  await writeJson(reportPath, report)

  console.log(`Fonte principal: ${snapshot.source.fileUrl}`)
  console.log(`CNAEs oficiais importados: ${snapshot.total}`)
  console.log(
    `Diff: +${report.summary.added} / -${report.summary.removed} / ~${report.summary.changed}`,
  )
  console.log(`Snapshot: ${path.relative(ROOT_DIR, snapshotPath)}`)
  console.log(`Relatorio: ${path.relative(ROOT_DIR, reportPath)}`)

  if (checkMode && previousSnapshot && hasRelevantDiff(report)) {
    console.error(
      'Alteracao detectada em relacao ao snapshot anterior. Revise o relatorio gerado.',
    )
    process.exitCode = 2
  }
}

async function ensureDirectories() {
  await Promise.all([
    mkdir(DATA_DIR, { recursive: true }),
    mkdir(RAW_DIR, { recursive: true }),
    mkdir(SNAPSHOT_DIR, { recursive: true }),
    mkdir(REPORT_DIR, { recursive: true }),
  ])
}

async function fetchSource(source, dateStamp, fetchedAt) {
  const fileUrl = await discoverFileUrl(source)
  const response = await fetchWithRetry(fileUrl)

  if (!response.ok) {
    throw new Error(
      `Falha ao baixar ${source.id}: HTTP ${response.status} ${response.statusText}`,
    )
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const hashInput = getHashInput(buffer, response.headers.get('content-type'))
  const hashSha256 = sha256(hashInput)
  const extension = getExtension(fileUrl)
  const rawPath = path.join(
    RAW_DIR,
    `${dateStamp}-${source.id}-${hashSha256.slice(0, 12)}${extension}`,
  )

  await writeFile(rawPath, buffer)

  const manifest = {
    id: source.id,
    type: source.type,
    name: source.name,
    owner: source.owner,
    pageUrl: source.pageUrl,
    fileUrl,
    hashSha256,
    fetchedAt,
    rawPath: path.relative(ROOT_DIR, rawPath).replaceAll('\\', '/'),
    parser: source.parser,
    parseStatus: source.parser ? 'parsed' : 'hash-only',
  }

  if (source.type !== 'catalog') {
    return { manifest, catalog: null }
  }

  const records = parseConclaCnaeWorkbook(buffer)
  if (records.length === 0) {
    throw new Error(`A fonte ${source.id} foi baixada, mas nenhum CNAE foi lido.`)
  }

  return {
    manifest: {
      ...manifest,
      records: records.length,
    },
    catalog: {
      source: {
        id: source.id,
        name: source.name,
        owner: source.owner,
        pageUrl: source.pageUrl,
        fileUrl,
        hashSha256,
        fetchedAt,
      },
      records,
    },
  }
}

async function discoverFileUrl(source) {
  if (!source.rowLabel) {
    return source.fallbackFileUrl
  }

  const response = await fetchWithRetry(source.pageUrl)

  if (!response.ok) {
    return source.fallbackFileUrl
  }

  const html = await response.text()
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []
  const row = rows.find((candidate) =>
    stripHtml(candidate).includes(source.rowLabel),
  )
  const href = row?.match(/href="([^"]+\.xlsx?)"/i)?.[1]

  if (!href) {
    return source.fallbackFileUrl
  }

  return new URL(href, source.pageUrl).href
}

function parseConclaCnaeWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })

  const records = []
  const hierarchy = {
    secao: '',
    divisao: '',
    grupo: '',
    classe: '',
  }

  for (const row of rows) {
    const secao = cleanCell(row[0])
    const divisao = cleanCell(row[1])
    const grupo = cleanCell(row[2])
    const classe = cleanCell(row[3])
    const subclasse = normalizeCnaeCode(cleanCell(row[4]))
    const descricao = cleanCell(row[5])

    if (secao && /^[A-Z]$/.test(secao)) hierarchy.secao = secao
    if (divisao && /^\d{2}$/.test(divisao)) hierarchy.divisao = divisao
    if (grupo && /^\d{2}\.\d$/.test(grupo)) hierarchy.grupo = grupo
    if (classe && /^\d{2}\.\d{2}-\d$/.test(classe)) hierarchy.classe = classe

    if (!subclasse || !descricao) continue

    records.push({
      cnae: subclasse,
      descricao,
      secao: hierarchy.secao,
      divisao: hierarchy.divisao,
      grupo: hierarchy.grupo,
      classe: hierarchy.classe,
    })
  }

  return records.sort((a, b) => a.cnae.localeCompare(b.cnae))
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, {
        headers: {
          'user-agent': 'SimulaMEI data governance bot; contato: projeto local',
        },
      })
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await sleep(500 * attempt)
      }
    }
  }

  throw lastError
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function buildReport(previousSnapshot, currentSnapshot, generatedAt) {
  const previousRecords = previousSnapshot?.records ?? []
  const previousIndex = new Map(previousRecords.map((record) => [record.cnae, record]))
  const currentIndex = new Map(
    currentSnapshot.records.map((record) => [record.cnae, record]),
  )

  const added = []
  const removed = []
  const changed = []

  for (const record of currentSnapshot.records) {
    const previous = previousIndex.get(record.cnae)
    if (!previous) {
      added.push(record)
      continue
    }

    if (JSON.stringify(projectComparable(previous)) !== JSON.stringify(projectComparable(record))) {
      changed.push({
        cnae: record.cnae,
        before: previous,
        after: record,
      })
    }
  }

  for (const record of previousRecords) {
    if (!currentIndex.has(record.cnae)) {
      removed.push(record)
    }
  }

  return {
    schemaVersion: 1,
    generatedAt,
    source: currentSnapshot.source,
    previousSource: previousSnapshot?.source ?? null,
    summary: {
      previousTotal: previousRecords.length,
      currentTotal: currentSnapshot.records.length,
      added: added.length,
      removed: removed.length,
      changed: changed.length,
      sourceHashChanged:
        Boolean(previousSnapshot?.source?.hashSha256) &&
        previousSnapshot.source.hashSha256 !== currentSnapshot.source.hashSha256,
    },
    added,
    removed,
    changed,
  }
}

function projectComparable(record) {
  return {
    descricao: record.descricao,
    secao: record.secao,
    divisao: record.divisao,
    grupo: record.grupo,
    classe: record.classe,
  }
}

async function writeJson(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null
  return JSON.parse(await readFile(filePath, 'utf8'))
}

function hasRelevantDiff(report) {
  return (
    report.summary.added > 0 ||
    report.summary.removed > 0 ||
    report.summary.changed > 0
  )
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function getHashInput(buffer, contentType) {
  if (!contentType?.toLowerCase().includes('text/html')) return buffer

  const normalized = buffer
    .toString('utf8')
    .replace(/<input[^>]+__(?:VIEWSTATE|EVENTVALIDATION|VIEWSTATEGENERATOR)[^>]*>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  return Buffer.from(normalized, 'utf8')
}

function getExtension(url) {
  const pathname = new URL(url).pathname
  const extension = path.extname(pathname)
  return extension || '.bin'
}

function cleanCell(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripHtml(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCnaeCode(value) {
  const text = cleanCell(value)
  if (/^\d{4}-\d\/\d{2}$/.test(text)) return text

  const digits = text.replace(/\D/g, '')
  if (digits.length !== 7) return null

  return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5)}`
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
