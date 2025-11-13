'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatPrecio, roundNice } from '@/lib/utils'

const REQ_CATS = ['CPU','PLACA_MADRE','RAM','ALMACENAMIENTO'] as const
const OPT_CATS = ['GPU','FUENTE','GABINETE'] as const

type Componente = { id: string; tipo: string; marca: string; modelo: string; sku?: string | null }

type Modelo = {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  imagen_url: string | null
  precio_base: number
}

type ModeloComplete = Modelo & {
  componentes_ids: Record<string, string>
  uso_recomendado: string[] | null
}

import AdminLayout from '@/components/admin/AdminLayout'
import EditModeloModal from '@/components/admin/EditModeloModal'

export default function AdminModelosPage() {
  const [componentes, setComponentes] = useState<Componente[]>([])
  const [items, setItems] = useState<Modelo[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingModelo, setEditingModelo] = useState<any | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sel, setSel] = useState<Record<string, string>>({})
  const [computedPrecio, setComputedPrecio] = useState<number>(0)

  const porTipo = useMemo(() => {
    const map: Record<string, Componente[]> = {}
    for (const t of [...REQ_CATS, ...OPT_CATS]) map[t] = []
    componentes.forEach(c => { if (!map[c.tipo]) map[c.tipo] = []; map[c.tipo].push(c) })
    return map
  }, [componentes])

  async function loadComponentes() {
    const { data } = await supabase
      .from('componentes')
      .select('id,tipo,marca,modelo,activo,sku')
      .eq('activo', true)
      .order('tipo')
    setComponentes((data as any) || [])
  }

  async function loadAndEditModelo(id: string) {
    setEditingId(id)
    const { data: modeloData, error } = await supabase.from('modelos_base').select('id,nombre,slug,descripcion,imagen_url,precio_base,uso_recomendado,numero_comprobante,activo,orden').eq('id', id).single()
    const { data: conf } = await supabase.from('configuracion_modelo').select('procesador_id,placa_madre_id,ram_id,almacenamiento_id,gpu_id,fuente_id,gabinete_id').eq('modelo_id', id).single()
    if (!error && modeloData) {
      const componentes_ids: Record<string,string> = {
        CPU: conf?.procesador_id || '',
        PLACA_MADRE: conf?.placa_madre_id || '',
        RAM: conf?.ram_id || '',
        ALMACENAMIENTO: conf?.almacenamiento_id || '',
        GPU: conf?.gpu_id || '',
        FUENTE: conf?.fuente_id || '',
        GABINETE: conf?.gabinete_id || '',
      }
      setEditingModelo({ ...modeloData, componentes_ids })
    }
  }

  async function loadModelos() {
    setLoading(true)
    const { data } = await supabase
      .from('modelos_base')
      .select('id,nombre,slug,descripcion,imagen_url,precio_base')
      .order('orden')
    setItems((data as any) || [])
    setLoading(false)
  }

  useEffect(() => { loadComponentes(); loadModelos() }, [])

  // Calcular precio base automáticamente desde componentes seleccionados
  useEffect(() => {
    const run = async () => {
      const ids = [sel['CPU'], sel['PLACA_MADRE'], sel['RAM'], sel['ALMACENAMIENTO'], sel['GPU']].filter(Boolean) as string[]
      if (!ids.length) { setComputedPrecio(0); return }
      const selected = componentes.filter(c => ids.includes(c.id))
      const skus = selected.map(c => c.sku).filter(Boolean) as string[]
      if (!skus.length) { setComputedPrecio(0); return }
      const { data: prods } = await supabase.from('productos').select('sku,precio').in('sku', skus)
      const priceMap = new Map((prods||[]).map((p:any)=>[String(p.sku), Number(p.precio||0)]))
      const sum = selected.reduce((acc, c) => acc + (priceMap.get(String(c.sku)) || 0), 0)
      setComputedPrecio(roundNice(sum, 1000))
    }
    run()
  }, [sel, componentes])

  async function uploadImageIfNeeded(): Promise<string | null> {
    if (!file) return null
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `modelos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('componentes').upload(path, file, { cacheControl: '31536000', contentType: file.type || undefined, upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('componentes').getPublicUrl(path)
    return data.publicUrl
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre || !slug || !sel['CPU'] || !sel['PLACA_MADRE'] || !sel['RAM'] || !sel['ALMACENAMIENTO']) {
      return alert('Completá nombre, slug y los 4 componentes básicos')
    }
    setSaving(true)
    try {
      const imageUrl = await uploadImageIfNeeded()
      const { data, error } = await supabase.from('modelos_base').insert({
        nombre, slug, descripcion: descripcion || null, imagen_url: imageUrl, precio_base: computedPrecio,
      }).select('id').single()
      if (error) throw error
      const modeloId = data!.id
      const payload: any = {
        modelo_id: modeloId,
        procesador_id: sel['CPU'],
        placa_madre_id: sel['PLACA_MADRE'],
        ram_id: sel['RAM'],
        almacenamiento_id: sel['ALMACENAMIENTO'],
        gpu_id: sel['GPU'] || null,
        fuente_id: sel['FUENTE'] || null,
        gabinete_id: sel['GABINETE'] || null,
      }
      const { error: e2 } = await supabase.from('configuracion_modelo').upsert(payload, { onConflict: 'modelo_id' })
      if (e2) throw e2
      setNombre(''); setSlug(''); setDescripcion(''); setPrecioBase(0); setFile(null); setSel({})
      await loadModelos()
      alert('Modelo creado')
    } catch (err: any) {
      alert('Error: ' + (err?.message || 'desconocido'))
    } finally {
      setSaving(false)
    }
  }

  function canCreate(){ return !!(nombre && slug && sel['CPU'] && sel['PLACA_MADRE'] && sel['RAM'] && sel['ALMACENAMIENTO']) }

  async function onDelete(id: string) {
    if (!confirm('¿Eliminar modelo?')) return
    await supabase.from('configuracion_modelo').delete().eq('modelo_id', id)
    await supabase.from('modelos_base').delete().eq('id', id)
    await loadModelos()
  }

  const [q, setQ] = useState('')
  const filtered = items.filter(m => [m.nombre, m.slug].join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <AdminLayout title="Modelos" subtitle="Creá plantillas y asigná componentes por categoría">
      <form onSubmit={onCreate} className="space-y-3 p-4 border rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Nombre</label>
            <input value={nombre} onChange={(e)=>setNombre(e.target.value)} required className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Slug</label>
            <input value={slug} onChange={(e)=>setSlug(e.target.value)} required className="w-full border rounded px-2 py-1" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Descripción</label>
          <textarea value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} rows={2} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Precio base (automático)</label>
            <div className="w-full border rounded px-2 py-1 bg-slate-50">{formatPrecio(computedPrecio)}</div>
            <p className="text-xs text-slate-500 mt-1">Se calcula con CPU + Placa madre + RAM + Almacenamiento (+ GPU si elegís).</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Imagen</label>
            <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {REQ_CATS.map((t)=> (
            <div key={t}>
              <label className="block text-sm font-semibold mb-1">{t} *</label>
              <select value={sel[t]||''} onChange={(e)=>setSel(s=>({...s,[t]:e.target.value}))} required className="w-full border rounded px-2 py-1">
                <option value="">Seleccionar</option>
                {porTipo[t]?.map((c)=> <option key={c.id} value={c.id}>{c.marca} {c.modelo}</option>)}
              </select>
            </div>
          ))}
          {OPT_CATS.map((t)=> (
            <div key={t}>
              <label className="block text-sm font-semibold mb-1">{t} (opcional)</label>
              <select value={sel[t]||''} onChange={(e)=>setSel(s=>({...s,[t]:e.target.value}))} className="w-full border rounded px-2 py-1">
                <option value="">-- Ninguno --</option>
                {porTipo[t]?.map((c)=> <option key={c.id} value={c.id}>{c.marca} {c.modelo}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button disabled={saving || !canCreate()} className={`text-white px-4 py-2 rounded ${saving||!canCreate()? 'bg-blue-400 cursor-not-allowed':'bg-blue-600'}`}>{saving? 'Guardando…':'Crear modelo'}</button>
      </form>

      <div className="mb-3 flex items-center gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar por nombre o slug…" className="border px-3 py-2 rounded w-full md:w-80" />
      </div>
      {loading ? <p>Cargando…</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m)=> (
            <div key={m.id} className="border rounded-lg p-3">
              {m.imagen_url ? (
                <Image src={m.imagen_url} alt={m.nombre} width={400} height={220} className="w-full h-40 object-cover rounded" />
              ) : <div className="w-full h-40 bg-slate-200 rounded" />}
              <div className="mt-2 font-semibold">{m.nombre}</div>
              <div className="text-xs text-slate-500">{m.slug}</div>
              <div className="text-xs text-slate-600 mt-1 line-clamp-2">{m.descripcion}</div>
              <div className="mt-2 flex gap-3">
                <button onClick={()=>loadAndEditModelo(m.id)} className="text-blue-600 hover:underline">Editar</button>
                <button onClick={()=>onDelete(m.id)} className="text-red-600 hover:underline">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    {editingModelo && (<EditModeloModal modelo={editingModelo} onClose={() => setEditingModelo(null)} onSaved={() => { setEditingModelo(null); loadModelos() }} />)}
    </AdminLayout>
  )
}


