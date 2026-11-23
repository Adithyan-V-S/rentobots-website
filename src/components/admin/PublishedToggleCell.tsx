'use client'

/**
 * "Published" column in admin lists, shown as a one-click Show / Hide button.
 * Clicking saves straight away; the website page refreshes on its own (same as
 * saving the item normally).
 */
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { DefaultCellComponentProps } from 'payload'

export default function PublishedToggleCell({ cellData, rowData, collectionSlug }: DefaultCellComponentProps) {
  const router = useRouter()
  const [visible, setVisible] = useState<boolean>(Boolean(cellData))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    const next = !visible
    setBusy(true)
    setError(false)
    try {
      const res = await fetch(`/api/${collectionSlug}/${rowData.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setVisible(next)
      router.refresh()
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 30,
    padding: '0 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: busy ? 'wait' : 'pointer',
    border: '1px solid',
    opacity: busy ? 0.6 : 1,
    whiteSpace: 'nowrap',
  }
  const style: React.CSSProperties = visible
    ? { ...base, background: 'rgba(48, 200, 120, 0.14)', borderColor: 'rgba(48, 200, 120, 0.5)', color: '#5fe0a0' }
    : { ...base, background: 'transparent', borderColor: '#4a4b4d', color: '#9C9C9D' }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      style={style}
      title={visible ? 'Shown on the website — click to hide' : 'Hidden from the website — click to show'}
      aria-pressed={visible}
    >
      <span aria-hidden="true">{visible ? '●' : '○'}</span>
      {error ? 'Error — try again' : visible ? 'Shown' : 'Hidden'}
    </button>
  )
}
