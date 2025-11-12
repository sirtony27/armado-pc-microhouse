'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Producto = {
  id: number
  sku: string | null
  nombre: string | null
  precio: number | null
  stock: number | null
  ultima_actualizacion: string | null
}

import AdminLayout from '@/components/admin/AdminLayout'
import Toast from '@/components/admin/Toast'

export default function AdminPage() {
  const [items, setItems] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)
  const [sku, setSku] = useState('')
  const [nombre, setNombre] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{type?:'success'|'error'|'info';message:string}|null>(null)
  const show = (t: any) => setToast(t)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('productos')
      .select('id, sku, nombre, precio, stock, ultima_actualizacion')
      .order('id', { ascending: false })
      .limit(100)
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addProducto(e: React.FormEvent) {
    e.preventDefault()
    if (!sku) { show({type:'error', message:'Ingresá un SKU'}); return }
    const { error } = await supabase.from('productos').insert({ sku, nombre })
    if (error) return show({type:'error', message:error.message})
    setSku(''); setNombre('')
    await load()
    show({type:'success', message:'SKU agregado'})
  }

  async function actualizarAhora() {
    setBusy(true)
    try {
      const res = await fetch('/api/update-prices', { method: 'POST', headers: process.env.NEXT_PUBLIC_CRON_SECRET ? { 'x-cron-key': process.env.NEXT_PUBLIC_CRON_SECRET } as any : undefined })
      if (!res.ok) throw new Error('Error al actualizar')
      const data = await res.json(); show({type:'success', message:`Actualizados ${data.updated}/${data.total}`})
      await load()
    } catch (e:any) { show({type:'error', message: e?.message || 'Fallo en actualización'}) }
    finally { setBusy(false) }
  }

  return (
    <AdminLayout title="Precios" subtitle="Gestioná SKUs y sincronizá valores desde Dux">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <form onSubmit={addProducto} className="md:col-span-2 rounded-lg border border-slate-200 p-4 bg-white">
          <h2 className="text-sm font-semibold mb-3">Agregar SKU a la lista</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="border px-3 py-2 rounded w-full sm:w-40" />
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre (opcional)" className="border px-3 py-2 rounded flex-1" />
            <button className="bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto" type="submit">Agregar</button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Los precios se actualizarán por cron o manualmente.</p>
        </form>
        <div className="rounded-lg border border-slate-200 p-4 bg-white">
          <h2 className="text-sm font-semibold mb-3">Acciones</h2>
          <button type="button" onClick={actualizarAhora} disabled={busy} className={`text-white px-4 py-2 rounded w-full ${busy?'bg-emerald-400 cursor-wait':'bg-emerald-600'}`}>{busy?'Actualizando…':'Actualizar precios ahora'}</button>
          <p className="text-xs text-slate-500 mt-2">Consulta Dux y refresca precio/stock.</p>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <p>Cargando…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-left">Nombre</th>
                  <th className="p-2 text-left">Precio</th>
                  <th className="p-2 text-left">Stock</th>
                  <th className="p-2 text-left">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2 font-mono">{p.sku}</td>
                    <td className="p-2">{p.nombre}</td>
                    <td className="p-2">{p.precio ?? '-'}</td>
                    <td className="p-2">{p.stock ?? '-'}</td>
                    <td className="p-2">{p.ultima_actualizacion ? new Date(p.ultima_actualizacion).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && <Toast toast={toast} onClose={()=>setToast(null)} />}
    </AdminLayout>
  )
}
