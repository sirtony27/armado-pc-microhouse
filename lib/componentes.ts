'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { Componente } from '@/types'

export function useComponentes() {
  const [items, setItems] = useState<Componente[]>([])

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        const { data, error } = await supabase
          .from('componentes')
          .select('id,tipo,marca,modelo,descripcion,image_url,especificaciones,activo,sku,precio')
          .eq('activo', true)
          .order('created_at', { ascending: false })
        if (error || !data) { if (!cancelled) setItems([]); return }
        const mapped: Componente[] = data.map((c: any) => ({
          id: String(c.id),
          sku: c.sku,
          tipo: c.tipo,
          marca: c.marca,
          modelo: c.modelo,
          descripcion: c.descripcion || '',
          precio: c.precio || 0,
          stock: 0,
          disponible: !!c.activo,
          imagenUrl: c.image_url || '',
          especificaciones: c.especificaciones || {},
          compatibilidad: undefined,
        }))
        if (!cancelled) setItems(mapped)
      })()
    return () => { cancelled = true }
  }, [])

  return items
}
