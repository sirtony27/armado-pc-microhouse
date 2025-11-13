'use client'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

const CATEGORIAS = ['CPU','PLACA_MADRE','RAM','ALMACENAMIENTO','GPU','FUENTE','GABINETE'] as const

type Categoria = typeof CATEGORIAS[number]

type ComponenteRow = {
  id: string
  tipo: Categoria
  marca: string
  modelo: string
  descripcion: string | null
  sku: string | null
  image_url: string | null
  storage_path: string | null
  especificaciones: any | null
  activo: boolean
  created_at: string
}

import AdminLayout from '@/components/admin/AdminLayout'
import EditComponenteModal from '@/components/admin/EditComponenteModal'

type FieldDef = { key: string; label: string; type: 'text'|'number'|'select'|'boolean'; options?: string[] }
const FIELDS: Record<Categoria, FieldDef[]> = {
  CPU: [
    { key:'socket', label:'Socket', type:'text' },
    { key:'cores', label:'Núcleos', type:'number' },
    { key:'threads', label:'Hilos', type:'number' },
    { key:'base_clock_ghz', label:'Base (GHz)', type:'number' },
    { key:'boost_clock_ghz', label:'Boost (GHz)', type:'number' },
    { key:'tdp_w', label:'TDP (W)', type:'number' },
    { key:'cache_mb', label:'Cache (MB)', type:'number' },
    { key:'igpu', label:'Gráfica integrada', type:'text' },
  ],
  PLACA_MADRE: [
    { key:'socket', label:'Socket', type:'text' },
    { key:'chipset', label:'Chipset', type:'text' },
    { key:'formato', label:'Formato', type:'select', options:['ATX','Micro-ATX','Mini-ITX'] },
    { key:'ram_tipo', label:'RAM Tipo', type:'select', options:['DDR4','DDR5'] },
    { key:'ram_slots', label:'RAM Slots', type:'number' },
    { key:'m2_slots', label:'M.2 Slots', type:'number' },
    { key:'sata_puertos', label:'Puertos SATA', type:'number' },
    { key:'pcie_version', label:'PCIe', type:'text' },
  ],
  RAM: [
    { key:'capacidad_gb', label:'Capacidad (GB)', type:'number' },
    { key:'tipo', label:'Tipo', type:'select', options:['DDR4','DDR5'] },
    { key:'velocidad_mhz', label:'Velocidad (MHz)', type:'number' },
    { key:'latencia_cl', label:'Latencia (CL)', type:'number' },
  ],
  ALMACENAMIENTO: [
    { key:'tipo', label:'Tipo', type:'select', options:['SSD SATA','NVMe','HDD'] },
    { key:'capacidad_gb', label:'Capacidad (GB)', type:'number' },
    { key:'interfaz', label:'Interfaz', type:'select', options:['SATA','NVMe'] },
    { key:'lectura_mb_s', label:'Lectura (MB/s)', type:'number' },
    { key:'escritura_mb_s', label:'Escritura (MB/s)', type:'number' },
    { key:'factor_forma', label:'Factor de forma', type:'text' },
  ],
  GPU: [
    { key:'vram_gb', label:'VRAM (GB)', type:'number' },
    { key:'tipo_memoria', label:'Tipo memoria', type:'text' },
    { key:'boost_clock_mhz', label:'Boost (MHz)', type:'number' },
    { key:'tdp_w', label:'TDP (W)', type:'number' },
    { key:'conectores', label:'Conectores', type:'text' },
    { key:'min_psu_w', label:'Fuente mínima (W)', type:'number' },
  ],
  FUENTE: [
    { key:'potencia_w', label:'Potencia (W)', type:'number' },
    { key:'certificacion', label:'Certificación', type:'text' },
    { key:'modularidad', label:'Modularidad', type:'select', options:['No','Semi','Full'] },
  ],
  GABINETE: [
    { key:'formato', label:'Formato', type:'select', options:['ATX','Micro-ATX','Mini-ITX'] },
    { key:'ventiladores_incluidos', label:'Ventiladores incluidos', type:'text' },
    { key:'color', label:'Color', type:'text' },
    { key:'vidrio_lateral', label:'Vidrio lateral', type:'boolean' },
  ],
}

function buildSpecFromForm(form: Record<string, any>, tipo: Categoria) {
  const fields = FIELDS[tipo] || []
  const out: Record<string, any> = {}
  for (const f of fields) {
    const v = form[f.key]
    if (v === undefined || v === null || v === '') continue
    out[f.key] = f.type === 'number' ? Number(v) : f.type === 'boolean' ? Boolean(v) : v
  }
  return Object.keys(out).length ? out : null
}

export default function AdminComponentesPage() {
  const [items, setItems] = useState<ComponenteRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingComponente, setEditingComponente] = useState<ComponenteRow | null>(null)
  const [q, setQ] = useState('')

  // Form state
  const [tipo, setTipo] = useState<Categoria>('CPU')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [sku, setSku] = useState('')
  const [specsText, setSpecsText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [specsForm, setSpecsForm] = useState<Record<string, any>>({})

  useEffect(() => { setSpecsForm({}); setSpecsText('') }, [tipo])
  useEffect(() => { const built = buildSpecFromForm(specsForm, tipo); setSpecsText(built ? JSON.stringify(built) : '') }, [specsForm, tipo])

  const specs: any | null = useMemo(() => {
    if (!specsText.trim()) return null
    try { return JSON.parse(specsText) } catch { return null }
  }, [specsText])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('componentes')
      .select('id,tipo,marca,modelo,descripcion,sku,image_url,storage_path,especificaciones,activo,created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error) setItems((data as any) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function uploadImageIfNeeded(): Promise<{ image_url: string | null, storage_path: string | null }> {
    if (!file) return { image_url: null, storage_path: null }
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await supabase.storage.from('componentes').upload(path, file, { cacheControl: '31536000', contentType: file.type || undefined, upsert: false })
    if (upErr) throw upErr
    const { data } = supabase.storage.from('componentes').getPublicUrl(path)
    return { image_url: data.publicUrl, storage_path: path }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const img = await uploadImageIfNeeded()
      const payload = {
        tipo,
        marca: marca.trim(),
        modelo: modelo.trim(),
        descripcion: descripcion.trim() || null,
        sku: sku.trim() || null,
        image_url: img.image_url,
        storage_path: img.storage_path,
        especificaciones: buildSpecFromForm(specsForm, tipo) || specs,
        activo: true,
      }
      const { error } = await supabase.from('componentes').insert(payload as any)
      if (error) throw error
      if (payload.sku) {
        await supabase.from('productos').upsert({ sku: payload.sku, nombre: `${payload.marca} ${payload.modelo}` }, { onConflict: 'sku' })
      }
      // reset form
      setMarca(''); setModelo(''); setDescripcion(''); setSku(''); setSpecsText(''); setFile(null)
      await load()
      alert('Componente creado')
    } catch (err: any) {
      alert('Error al crear: ' + (err?.message || 'desconocido'))
    } finally {
      setSaving(false)
    }
  }

  function isSpecsValid() { return !specsText || !!specs }

  async function onDelete(id: string) {
    if (!confirm('¿Eliminar componente?')) return
    const { error } = await supabase.from('componentes').delete().eq('id', id)
    if (error) return alert('Error: ' + error.message)
    await load()
  }

  async function toggleActivo(id: string, activo: boolean) {
    const { error } = await supabase.from('componentes').update({ activo: !activo }).eq('id', id)
    if (error) return alert('Error: ' + error.message)
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, activo: !activo } : it))
  }

  const filtered = items.filter(c => [c.marca, c.modelo, c.tipo, c.sku || ''].join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <AdminLayout title="Componentes" subtitle="Cargá y gestioná el catálogo de componentes">

      <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg mb-6">
        <div>
          <label className="block text-sm font-semibold mb-1">Categoría</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as Categoria)} className="w-full border rounded px-2 py-1">
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Marca</label>
          <input value={marca} onChange={(e) => setMarca(e.target.value)} required className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Modelo</label>
          <input value={modelo} onChange={(e) => setModelo(e.target.value)} required className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">SKU (para precio Dux)</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="Opcional" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-1">Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-1">Especificaciones recomendadas</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {FIELDS[tipo].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium mb-1">{f.label}</label>
                {f.type === 'select' ? (
                  <select value={specsForm[f.key] ?? ''} onChange={(e)=>setSpecsForm(s=>({ ...s, [f.key]: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm">
                    <option value="">—</option>
                    {f.options?.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                ) : f.type === 'boolean' ? (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={!!specsForm[f.key]} onChange={(e)=>setSpecsForm(s=>({ ...s, [f.key]: e.target.checked }))} />
                  </div>
                ) : (
                  <input type={f.type==='number'?'number':'text'} value={specsForm[f.key] ?? ''} onChange={(e)=>setSpecsForm(s=>({ ...s, [f.key]: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm" />
                )}
              </div>
            ))}
          </div>
          <label className="block text-sm font-semibold mt-3 mb-1">Vista previa JSON</label>
          <textarea value={specsText} readOnly rows={4} className={`w-full border rounded px-2 py-1 font-mono text-xs ${isSpecsValid()?'':'border-red-500'}`} placeholder='{}' />
          {specsText && !specs && <p className="text-red-600 text-xs mt-1">JSON inválido</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Imagen</label>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="flex items-end">
          <button disabled={saving || !isSpecsValid()} className={`text-white px-4 py-2 rounded ${saving||!isSpecsValid()? 'bg-blue-400 cursor-not-allowed':'bg-blue-600'}`}>{saving ? 'Guardando…' : 'Crear componente'}</button>
        </div>
      </form>

      <div className="mb-3 flex items-center gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar por marca, modelo, SKU…" className="border px-3 py-2 rounded w-full md:w-80" />
      </div>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Imagen</th>
                <th className="p-2 text-left">Categoría</th>
                <th className="p-2 text-left">Marca/Modelo</th>
                <th className="p-2 text-left">SKU</th>
                <th className="p-2 text-left">Activo</th>
                
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setEditingComponente(c)} className="border-t hover:bg-blue-50 cursor-pointer transition-colors">
                  <td className="p-2">
                    {c.image_url ? (
                      <Image src={c.image_url} alt={c.modelo} width={64} height={64} className="rounded object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-200 rounded" />
                    )}
                  </td>
                  <td className="p-2">{c.tipo}</td>
                  <td className="p-2">
                    <div className="font-medium">{c.marca} {c.modelo}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{c.descripcion}</div>
                  </td>
                  <td className="p-2 font-mono">{c.sku || '-'}
                  </td>
                  <td className="p-2">
                    <button onClick={() => toggleActivo(c.id, c.activo)} className={c.activo ? 'text-emerald-700' : 'text-slate-500'}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="p-2">
                    <button onClick={() => onDelete(c.id)} className="text-red-600">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    {editingComponente && (<EditComponenteModal componente={editingComponente} onClose={() => setEditingComponente(null)} onSaved={() => { setEditingComponente(null); load() }} />)}`n      </AdminLayout>
  )
}


