'use client'
import { useState, useEffect } from 'react'
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
  especificaciones: any | null
  activo: boolean
}

type FieldDef = { key: string; label: string; type: 'text'|'number'|'select'|'boolean'; options?: string[] }
const FIELDS: Record<Categoria, FieldDef[]> = {
  CPU: [
    { key:'socket', label:'Socket', type:'text' },
    { key:'cores', label:'Núcleos', type:'number' },
    { key:'threads', label:'Hilos', type:'number' },
    { key:'base_clock_ghz', label:'Base (GHz)', type:'text' },
    { key:'boost_clock_ghz', label:'Turbo (GHz)', type:'text' },
    { key:'tdp_w', label:'TDP (W)', type:'text' },
    { key:'cache_mb', label:'Cache (MB)', type:'text' },
    { key:'igpu', label:'Gráfica integrada', type:'text' },
  ],
  PLACA_MADRE: [
    { key:'socket', label:'Socket', type:'text' },
    { key:'chipset', label:'Chipset', type:'text' },
    { key:'formato', label:'Formato', type:'select', options:['ATX','Micro-ATX','Mini-ITX'] },
    { key:'ram_tipo', label:'RAM Tipo', type:'select', options:['DDR4','DDR5'] },
    { key:'ram_slots', label:'RAM Slots', type:'number' },
    { key:'m2_slots', label:'M.2 Slots', type:'number' },
  ],
  RAM: [
    { key:'capacidad_gb', label:'Capacidad (GB)', type:'text' },
    { key:'tipo', label:'Tipo', type:'select', options:['DDR4','DDR5'] },
    { key:'velocidad_mhz', label:'Velocidad (MHz)', type:'text' },
    { key:'latencia_cl', label:'Latencia (CL)', type:'text' },
  ],
  ALMACENAMIENTO: [
    { key:'capacidad_gb', label:'Capacidad (GB)', type:'text' },
    { key:'tipo', label:'Tipo', type:'text' },
    { key:'lectura_mb_s', label:'Lectura (MB/s)', type:'text' },
    { key:'escritura_mb_s', label:'Escritura (MB/s)', type:'text' },
    { key:'interfaz', label:'Interfaz', type:'text' },
    { key:'factor_forma', label:'Factor forma', type:'text' },
  ],
  GPU: [
    { key:'vram_gb', label:'VRAM (GB)', type:'text' },
    { key:'cuda_cores', label:'CUDA Cores', type:'number' },
    { key:'boost_clock_mhz', label:'Boost Clock (MHz)', type:'text' },
    { key:'tdp_w', label:'TDP (W)', type:'text' },
    { key:'conectores', label:'Conectores', type:'text' },
  ],
  FUENTE: [
    { key:'potencia_w', label:'Potencia (W)', type:'text' },
    { key:'certificacion', label:'Certificación', type:'text' },
    { key:'modular', label:'Modular', type:'text' },
    { key:'conectores_pcie', label:'Conectores PCIe', type:'text' },
  ],
  GABINETE: [
    { key:'formato', label:'Formato', type:'text' },
    { key:'ventiladores_incluidos', label:'Ventiladores', type:'text' },
    { key:'color', label:'Color', type:'text' },
    { key:'panel_lateral', label:'Panel Lateral', type:'text' },
    { key:'usb_frontal', label:'USB Frontal', type:'text' },
  ],
}

interface Props {
  componente: ComponenteRow
  onClose: () => void
  onSaved: () => void
}

export default function EditComponenteModal({ componente, onClose, onSaved }: Props) {
  const [marca, setMarca] = useState(componente.marca)
  const [modelo, setModelo] = useState(componente.modelo)
  const [descripcion, setDescripcion] = useState(componente.descripcion || '')
  const [sku, setSku] = useState(componente.sku || '')
  const [activo, setActivo] = useState(componente.activo)
  const [specsForm, setSpecsForm] = useState<Record<string, any>>(componente.especificaciones || {})
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // Actualizar estados cuando cambia el componente
  useEffect(() => {
    setMarca(componente.marca)
    setModelo(componente.modelo)
    setDescripcion(componente.descripcion || '')
    setSku(componente.sku || '')
    setActivo(componente.activo)
    setSpecsForm(componente.especificaciones || {})
    setFile(null)
  }, [componente])

  const specsText = JSON.stringify(specsForm, null, 2)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      let imageUrl = componente.image_url

      // Upload de imagen si hay
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `componentes/${Date.now()}-${componente.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('componentes')
          .upload(path, file, { upsert: true })
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('componentes')
          .getPublicUrl(path)
        
        imageUrl = publicUrl
      }

      // Actualizar componente
      const { error } = await supabase
        .from('componentes')
        .update({
          marca,
          modelo,
          descripcion,
          sku: sku || null,
          image_url: imageUrl,
          especificaciones: specsForm,
          activo,
        })
        .eq('id', componente.id)

      if (error) throw error

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
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Editar Componente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Marca</label>
              <input value={marca} onChange={(e) => setMarca(e.target.value)} required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Modelo</label>
              <input value={modelo} onChange={(e) => setModelo(e.target.value)} required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">SKU</label>
              <input value={sku} onChange={(e) => setSku(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Opcional" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 flex items-center gap-2">
                <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                Activo
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Descripción</label>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Especificaciones</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {FIELDS[componente.tipo].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1">{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={specsForm[f.key] ?? ''} onChange={(e)=>setSpecsForm(s=>({ ...s, [f.key]: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm">
                      <option value="">—</option>
                      {f.options?.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                  ) : f.type === 'boolean' ? (
                    <input type="checkbox" checked={!!specsForm[f.key]} onChange={(e)=>setSpecsForm(s=>({ ...s, [f.key]: e.target.checked }))} />
                  ) : (
                    <input type={f.type==='number'?'number':'text'} value={specsForm[f.key] ?? ''} onChange={(e)=>setSpecsForm(s=>({ ...s, [f.key]: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Cambiar Imagen</label>
            {componente.image_url && (
              <img src={componente.image_url} alt={modelo} className="w-32 h-32 object-cover rounded mb-2" />
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
