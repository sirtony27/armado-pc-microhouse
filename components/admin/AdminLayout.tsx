'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const nav = [
  { href: '/admin', label: 'Precios' },
  { href: '/admin/componentes', label: 'Componentes' },
  { href: '/admin/modelos', label: 'Modelos' },
]

export default function AdminLayout({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Admin • {title || 'Panel'}</h1>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
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
