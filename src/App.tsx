import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { exportPartsCsv, parsePartsCsv, parsePartsCsvText } from './csv'
import type { ActiveFilter, LegoPart, SortDirection, SortKey } from './types'

const filterLabels: Record<ActiveFilter, string> = {
  usable: 'Nutzbar',
  missing: 'Restmangel',
  owned: 'Vorhanden',
  required: 'Benötigt',
}

const columns: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
  { key: 'partId', label: 'TeilID' },
  { key: 'colorId', label: 'Farbe' },
  { key: 'quantityRequired', label: 'Menge im A', numeric: true },
  { key: 'quantityOwned', label: 'Menge in B', numeric: true },
  { key: 'usable', label: 'Nutzbar', numeric: true },
  { key: 'missing', label: 'Restmangel', numeric: true },
  { key: 'shortName', label: 'Kurzname' },
]

function applyFilters(parts: LegoPart[], search: string, filters: Set<ActiveFilter>) {
  const term = search.trim().toLowerCase()

  return parts.filter((part) => {
    const matchesSearch =
      term.length === 0 ||
      [part.partId, part.colorId, part.shortName, part.colorName]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term))

    if (!matchesSearch) {
      return false
    }

    if (filters.has('usable') && part.usable <= 0) {
      return false
    }

    if (filters.has('missing') && part.missing <= 0) {
      return false
    }

    if (filters.has('owned') && part.quantityOwned <= 0) {
      return false
    }

    if (filters.has('required') && part.quantityRequired <= 0) {
      return false
    }

    return true
  })
}

function sortParts(parts: LegoPart[], key: SortKey, direction: SortDirection) {
  const sorted = [...parts].sort((a, b) => {
    const left = a[key]
    const right = b[key]

    if (typeof left === 'number' && typeof right === 'number') {
      return left - right
    }

    return String(left ?? '').localeCompare(String(right ?? ''), 'de', {
      numeric: true,
      sensitivity: 'base',
    })
  })

  return direction === 'asc' ? sorted : sorted.reverse()
}

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parts, setParts] = useState<LegoPart[]>([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Set<ActiveFilter>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('partId')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedPartId, setSelectedPartId] = useState<string>()
  const [sourceLabel, setSourceLabel] = useState('Keine Datei geladen')
  const [status, setStatus] = useState('Importiere eine CSV-Datei, um zu starten.')
  const [loading, setLoading] = useState(false)

  const visibleParts = useMemo(
    () => sortParts(applyFilters(parts, search, filters), sortKey, sortDirection),
    [filters, parts, search, sortDirection, sortKey],
  )

  const selectedPart = useMemo(
    () => parts.find((part) => part.id === selectedPartId) ?? visibleParts[0],
    [parts, selectedPartId, visibleParts],
  )

  const totals = useMemo(
    () =>
      parts.reduce(
        (sum, part) => ({
          rows: sum.rows + 1,
          required: sum.required + part.quantityRequired,
          owned: sum.owned + part.quantityOwned,
          usable: sum.usable + part.usable,
          missing: sum.missing + part.missing,
        }),
        { rows: 0, required: 0, owned: 0, usable: 0, missing: 0 },
      ),
    [parts],
  )

  const setImportedParts = (nextParts: LegoPart[], label: string) => {
    setParts(nextParts)
    setSelectedPartId(nextParts[0]?.id)
    setSourceLabel(label)
    setStatus(`${nextParts.length} Zeilen geladen.`)
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setLoading(true)
    try {
      const imported = await parsePartsCsv(file)
      setImportedParts(imported, file.name)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'CSV konnte nicht geladen werden.')
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  const loadSample = async () => {
    setLoading(true)
    try {
      const response = await fetch('/lego_parts_match.csv')
      if (!response.ok) {
        throw new Error('Beispieldatei wurde nicht gefunden.')
      }

      setImportedParts(parsePartsCsvText(await response.text()), 'lego_parts_match.csv')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Beispieldaten konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }

  const toggleFilter = (filter: ActiveFilter) => {
    setFilters((current) => {
      const next = new Set(current)
      if (next.has(filter)) {
        next.delete(filter)
      } else {
        next.add(filter)
      }
      return next
    })
  }

  const changeSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const exportCsv = () => {
    const csv = exportPartsCsv(visibleParts)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lego_parts_export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">
      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
      />

      <section className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-3 text-sm font-medium text-[var(--md-sys-color-primary)]">
                <md-icon>deployed_code</md-icon>
                Lego Inventory
              </div>
              <h1 className="text-4xl font-semibold tracking-normal text-[var(--md-sys-color-on-surface)] sm:text-5xl">
                Übersicht deiner Lego-Steine
              </h1>
              <p className="mt-3 max-w-2xl text-base text-[var(--md-sys-color-on-surface-variant)]">
                CSV importieren, Bestände prüfen, Restmangel erkennen und gefilterte Ergebnisse wieder exportieren.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <md-outlined-button onClick={loadSample}>
                <md-icon slot="icon">table_view</md-icon>
                Beispiel laden
              </md-outlined-button>
              <md-filled-button onClick={() => fileInputRef.current?.click()}>
                <md-icon slot="icon">upload_file</md-icon>
                CSV importieren
              </md-filled-button>
              <md-filled-tonal-button disabled={visibleParts.length === 0} onClick={exportCsv}>
                <md-icon slot="icon">download</md-icon>
                Export
              </md-filled-tonal-button>
            </div>
          </div>

          {loading ? <md-linear-progress indeterminate /> : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Zeilen" value={totals.rows} />
            <Metric label="Benötigt" value={totals.required} />
            <Metric label="Vorhanden" value={totals.owned} />
            <Metric label="Nutzbar" value={totals.usable} />
            <Metric label="Restmangel" value={totals.missing} tone="alert" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="min-w-0 overflow-hidden rounded-[28px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
          <div className="flex flex-col gap-4 border-b border-[var(--md-sys-color-outline-variant)] p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{sourceLabel}</p>
                <h2 className="text-2xl font-semibold tracking-normal">Inventar-Tabelle</h2>
              </div>
              <md-outlined-text-field
                className="w-full xl:w-[360px]"
                label="Suchen"
                value={search}
                onInput={(event) => setSearch((event.target as HTMLInputElement).value)}
              >
                <md-icon slot="leading-icon">search</md-icon>
              </md-outlined-text-field>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(filterLabels) as ActiveFilter[]).map((filter) => (
                <md-filter-chip
                  key={filter}
                  selected={filters.has(filter)}
                  onClick={() => toggleFilter(filter)}
                >
                  {filterLabels[filter]}
                </md-filter-chip>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-[var(--md-sys-color-surface-container-high)] text-xs uppercase text-[var(--md-sys-color-on-surface-variant)]">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className={column.numeric ? 'text-right' : undefined}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-1 px-4 py-3 font-semibold"
                        onClick={() => changeSort(column.key)}
                      >
                        <span className={column.numeric ? 'ml-auto' : undefined}>{column.label}</span>
                        {sortKey === column.key ? (
                          <md-icon className="sort-icon">
                            {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </md-icon>
                        ) : null}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleParts.map((part) => (
                  <tr
                    key={part.id}
                    className={
                      selectedPart?.id === part.id
                        ? 'bg-[var(--md-sys-color-secondary-container)]'
                        : 'hover:bg-[var(--md-sys-color-surface-container-high)]'
                    }
                    onClick={() => setSelectedPartId(part.id)}
                  >
                    <td className="px-4 py-3 font-medium">{part.partId}</td>
                    <td className="px-4 py-3">{part.colorName ?? part.colorId}</td>
                    <NumericCell value={part.quantityRequired} />
                    <NumericCell value={part.quantityOwned} />
                    <NumericCell value={part.usable} />
                    <NumericCell value={part.missing} highlight={part.missing > 0} />
                    <td className="max-w-[220px] truncate px-4 py-3 text-[var(--md-sys-color-on-surface-variant)]">
                      {part.shortName || 'Noch nicht angereichert'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--md-sys-color-outline-variant)] px-4 py-3 text-sm text-[var(--md-sys-color-on-surface-variant)]">
            <span>{status}</span>
            <span>{visibleParts.length} sichtbar</span>
          </div>
        </div>

        <aside className="rounded-[28px] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-5">
          {selectedPart ? (
            <PartDetails part={selectedPart} />
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center text-[var(--md-sys-color-on-surface-variant)]">
              <md-icon className="empty-icon">inventory_2</md-icon>
              <p className="mt-3">Noch keine Teile geladen.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: 'alert' }) {
  return (
    <div className="rounded-[24px] bg-[var(--md-sys-color-surface-container-high)] p-4">
      <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{label}</p>
      <p
        className={
          tone === 'alert'
            ? 'mt-1 text-3xl font-semibold text-[var(--md-sys-color-error)]'
            : 'mt-1 text-3xl font-semibold'
        }
      >
        {value.toLocaleString('de-DE')}
      </p>
    </div>
  )
}

function NumericCell({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <td
      className={
        highlight
          ? 'px-4 py-3 text-right font-semibold text-[var(--md-sys-color-error)]'
          : 'px-4 py-3 text-right'
      }
    >
      {value.toLocaleString('de-DE')}
    </td>
  )
}

function PartDetails({ part }: { part: LegoPart }) {
  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Ausgewähltes Teil</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-normal">{part.partId}</h2>
        <p className="mt-1 text-[var(--md-sys-color-on-surface-variant)]">
          Farbe {part.colorName ?? part.colorId}
        </p>
      </div>

      <div className="flex aspect-[4/3] items-center justify-center rounded-[24px] bg-[var(--md-sys-color-surface-container-high)]">
        {part.imageUrl ? (
          <img className="max-h-full max-w-full object-contain p-4" src={part.imageUrl} alt={part.shortName} />
        ) : (
          <div className="text-center text-[var(--md-sys-color-on-surface-variant)]">
            <md-icon className="part-icon">extension</md-icon>
            <p className="mt-2 text-sm">Bildfeld fur Rebrickable vorbereitet</p>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <DetailStat label="Benötigt" value={part.quantityRequired} />
        <DetailStat label="Vorhanden" value={part.quantityOwned} />
        <DetailStat label="Nutzbar" value={part.usable} />
        <DetailStat label="Restmangel" value={part.missing} alert={part.missing > 0} />
      </dl>

      <div className="rounded-[20px] bg-[var(--md-sys-color-surface-container-high)] p-4">
        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">Kurzname</p>
        <p className="mt-1 font-medium">{part.shortName || 'Noch nicht angereichert'}</p>
      </div>

      {part.externalUrl ? (
        <md-assist-chip href={part.externalUrl} target="_blank">
          <md-icon slot="icon">open_in_new</md-icon>
          Rebrickable vorbereiten
        </md-assist-chip>
      ) : null}
    </div>
  )
}

function DetailStat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="rounded-[20px] bg-[var(--md-sys-color-surface-container-high)] p-4">
      <dt className="text-sm text-[var(--md-sys-color-on-surface-variant)]">{label}</dt>
      <dd className={alert ? 'mt-1 text-2xl font-semibold text-[var(--md-sys-color-error)]' : 'mt-1 text-2xl font-semibold'}>
        {value.toLocaleString('de-DE')}
      </dd>
    </div>
  )
}

export default App
