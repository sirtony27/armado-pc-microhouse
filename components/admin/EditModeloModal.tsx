'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrecio } from '@/lib/utils'

const REQ_CATS = ['CPU','PLACA_MADRE','RAM','ALMACENAMIENTO'] as const
const OPT_CATS = ['GPU','FUENTE','GABINETE'] as const

type Componente = { id: string; tipo: string; marca: string; modelo: string; sku?: string | null }

type Modelo = {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  uso_recomendado: string[] | null
  imagen_url: string | null
  precio_base: number
  activo?: boolean | null
  orden?: number | null
  numero_comprobante?: string | null // nuevo campo opcional
  componentes_ids: Record<string, string>
}

interface Props {
  modelo: Modelo
  onClose: () => void
  onSaved: () => void
}

export default function EditModeloModal({ modelo, onClose, onSaved }: Props) {
  const [componentes, setComponentes] = useState<Componente[]>([])
  const [nombre, setNombre] = useState(modelo.nombre)
  const [slug, setSlug] = useState(modelo.slug)
  const [descripcion, setDescripcion] = useState(modelo.descripcion || '')
  const [usoRecomendado, setUsoRecomendado] = useState<string[]>(modelo.uso_recomendado || [])
  const [usoInput, setUsoInput] = useState('')
  const [sel, setSel] = useState<Record<string, string>>(modelo.componentes_ids || {})
  const [numeroComprobante, setNumeroComprobante] = useState(modelo.numero_comprobante || '')
  const [precioBase, setPrecioBase] = useState(modelo.precio_base)
  const [activo, setActivo] = useState(modelo.activo ?? true)
  const [orden, setOrden] = useState(modelo.orden ?? 0)
  const [componentFilter, setComponentFilter] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [computedPrecio, setComputedPrecio] = useState<number>(modelo.precio_base)

  // Actualizar estados cuando cambia el modelo
  useEffect(() => {
    setNombre(modelo.nombre)
    setSlug(modelo.slug)
    setDescripcion(modelo.descripcion || '')
    setUsoRecomendado(modelo.uso_recomendado || [])
    setSel(modelo.componentes_ids || {})
    setNumeroComprobante(modelo.numero_comprobante || '')
    setPrecioBase(modelo.precio_base)
    setActivo(modelo.activo ?? true)
    setOrden(modelo.orden ?? 0)
    setFile(null)
  }, [modelo])

  const porTipo = useMemo(() => {
    const map: Record<string, Componente[]> = {}
    for (const t of [...REQ_CATS, ...OPT_CATS]) map[t] = []
    componentes.forEach(c => { if (!map[c.tipo]) map[c.tipo] = []; map[c.tipo].push(c) })
    if (componentFilter.trim()) {
      const f = componentFilter.toLowerCase()
      for (const k of Object.keys(map)) {
        map[k] = map[k].filter(c => `${c.marca} ${c.modelo} ${c.sku ?? ''}`.toLowerCase().includes(f))
      }
    }
    return map
  }, [componentes, componentFilter])

  useEffect(() => {
    loadComponentes()
  }, [])

  // Recalcular precio base automáticamente según selección y SKUs
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
      setComputedPrecio(sum)
    }
    run()
  }, [sel, componentes])

  async function loadComponentes() {
    const { data } = await supabase
      .from('componentes')
      .select('id,tipo,marca,modelo,activo,sku')
      .eq('activo', true)
      .order('tipo')
    setComponentes((data as any) || [])
  }

  function addUso() {
    if (usoInput.trim()) {
      setUsoRecomendado([...usoRecomendado, usoInput.trim()])
      setUsoInput('')
    }
  }

  function removeUso(index: number) {
    setUsoRecomendado(usoRecomendado.filter((_, i) => i !== index))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      let imageUrl = modelo.imagen_url

      // Upload de imagen si hay
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `modelos/${Date.now()}-${modelo.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('componentes')
          .upload(path, file, { upsert: true })
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('componentes')
          .getPublicUrl(path)
        
        imageUrl = publicUrl
      }

      // Actualizar modelo
      const { error } = await supabase
        .from('modelos_base')
        .update({
          nombre,
          slug,
          descripcion,
          uso_recomendado: usoRecomendado,
          imagen_url: imageUrl,
          numero_comprobante: numeroComprobante || null,
          precio_base: computedPrecio,
          activo,
          orden,
        })
        .eq('id', modelo.id)

      if (error) throw error

      // Guardar configuración de componentes en tabla separada
      const payload: any = {
        modelo_id: modelo.id,
        procesador_id: sel['CPU'] || null,
        placa_madre_id: sel['PLACA_MADRE'] || null,
        ram_id: sel['RAM'] || null,
        almacenamiento_id: sel['ALMACENAMIENTO'] || null,
        gpu_id: sel['GPU'] || null,
        fuente_id: sel['FUENTE'] || null,
        gabinete_id: sel['GABINETE'] || null,
      }
      const { error: confError } = await supabase
        .from('configuracion_modelo')
        .upsert(payload, { onConflict: 'modelo_id' })
      if (confError) throw confError

      onSaved()
      onClose()
    } catch (err: any) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Editar Modelo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">N° Comprobante (Opcional)</label>
              <input value={numeroComprobante} onChange={(e) => setNumeroComprobante(e.target.value)} placeholder="Ej: FACT-123" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Precio Base (automático)</label>
              <div className="w-full border rounded px-3 py-2 bg-slate-50">{formatPrecio(computedPrecio)}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Orden</label>
              <input type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              <span className="text-sm font-semibold">Activo</span>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Descripción</label>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Uso Recomendado</label>
            <div className="flex gap-2 mb-2">
              <input 
                value={usoInput} 
                onChange={(e) => setUsoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUso())}
                placeholder="Ej: Gaming, Oficina..."
                className="flex-1 border rounded px-3 py-2"
              />
              <button type="button" onClick={addUso} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                Agregar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {usoRecomendado.map((uso, i) => (
                <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                  {uso}
                  <button type="button" onClick={() => removeUso(i)} className="text-blue-900 hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Componentes</label>
            <input
              type="text"
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
              placeholder="Filtrar por marca/modelo/SKU"
              className="mb-3 w-full border rounded px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...REQ_CATS, ...OPT_CATS].map((cat) => (
                <div key={cat}>
                  <label className="block text-xs font-medium mb-1">{cat}</label>
                  <select 
                    value={sel[cat] || ''} 
                    onChange={(e) => setSel({...sel, [cat]: e.target.value})} 
                    required={REQ_CATS.includes(cat as any)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="">— Seleccionar —</option>
                    {porTipo[cat]?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.marca} {c.modelo}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Cambiar Imagen</label>
            {modelo.imagen_url && (
              <img src={modelo.imagen_url} alt={nombre} className="w-48 h-32 object-cover rounded mb-2" />
            )}
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className={`px-6 py-2 text-white rounded ${saving ? 'bg-[#c01d23] cursor-wait' : 'bg-[#E02127] hover:bg-[#c01d23]'}`}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
