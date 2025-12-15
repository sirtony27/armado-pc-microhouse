'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'

const nav = [
  { href: '/admin', label: 'Precios' },
  { href: '/admin/componentes', label: 'Componentes' },
  { href: '/admin/modelos', label: 'Modelos' },
  { href: '/admin/notebooks', label: 'Notebooks' },
]

export default function AdminLayout({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  const pathname = usePathname()
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState<string | null>(null)

  async function triggerUpdate() {
    if (updating) return
    setUpdating(true)
    setUpdateMsg(null)
    try {
      const res = await fetch('/api/update-prices', {
        method: 'POST',
        headers: process.env.NEXT_PUBLIC_CRON_SECRET ? { 'x-cron-key': process.env.NEXT_PUBLIC_CRON_SECRET } as any : undefined,
      })
      if (!res.ok) throw new Error('Fallo al actualizar precios')
      const data = await res.json()
      setUpdateMsg(`Actualizados ${data.updated ?? '?'} de ${data.total ?? '?'}`)
    } catch (e: any) {
      setUpdateMsg(e?.message || 'Error al actualizar')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold">Admin · {title || 'Panel'}</h1>
              <button
                onClick={triggerUpdate}
                disabled={updating}
                className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded ${updating
                    ? 'bg-emerald-200 text-emerald-800 cursor-wait'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
              >
                {updating ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                    Actualizando precios…
                  </>
                ) : (
                  <>Actualizar precios Dux</>
                )}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
              {updateMsg && <span className="text-[11px] text-slate-500">{updateMsg}</span>}
            </div>
          </div>
          <nav className="hidden md:flex gap-2">
            {nav.map(i => (
              <Link key={i.href} href={i.href} className={`px-3 py-1.5 rounded text-sm border ${pathname?.startsWith(i.href) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-slate-100 border-slate-200'}`}>
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <div className="rounded-lg border border-slate-200 bg-white p-2">
              {nav.map(i => (
                <Link key={i.href} href={i.href} className={`block px-3 py-2 rounded text-sm ${pathname?.startsWith(i.href) ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-50'}`}>
                  {i.label}
                </Link>
              ))}
            </div>
          </aside>
          <main className="lg:col-span-9">
            <div className="rounded-lg border border-slate-200 bg-white p-4">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
