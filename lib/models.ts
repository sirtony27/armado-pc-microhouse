'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { ModeloBase } from '@/types'

export function useModelosBase() {
  const [items, setItems] = useState<ModeloBase[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: modelos, error } = await supabase
        .from('modelos_base')
        .select('id, nombre, slug, descripcion, uso_recomendado, imagen_url, precio_base')
        .order('orden', { ascending: true })
      if (error || !modelos || !modelos.length) return

      const ids = modelos.map((m: any) => m.id)
      const { data: conf } = await supabase
        .from('configuracion_modelo')
        .select('modelo_id, procesador_id, placa_madre_id, ram_id, almacenamiento_id, gpu_id, fuente_id, gabinete_id')
        .in('modelo_id', ids)

      const confMap = new Map(conf?.map((c: any) => [c.modelo_id, c]) || [])

      const mapped: ModeloBase[] = modelos.map((m: any) => {
        const c = confMap.get(m.id) || {}
        return {
          id: String(m.id),
          nombre: m.nombre,
          slug: m.slug,
          descripcion: m.descripcion || '',
          usoRecomendado: m.uso_recomendado || [],
          imagenUrl: m.imagen_url || '',
          precioBase: Number(m.precio_base || 0),
          componentes: {
            procesador: c.procesador_id || '',
            placaMadre: c.placa_madre_id || '',
            ram: c.ram_id || '',
            almacenamiento: c.almacenamiento_id || '',
            gpu: c.gpu_id || undefined,
          },
        }
      })

      if (!cancelled) setItems(mapped)
    })()
    return () => { cancelled = true }
  }, [])

  return items
}
