'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'
import type { Componente } from '@/types'

export function useRemotePrices(componentes: Componente[]) {
  const [map, setMap] = useState<Record<string, number>>({})

  const ids = useMemo(() => componentes.map(c => c.id), [componentes])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!ids.length) { setMap({}); return }
      const { data: comps } = await supabase
        .from('componentes')
        .select('id, sku')
        .in('id', ids)
        .not('sku','is', null)
      const pairs = (comps || []).map((c:any) => [String(c.id), String(c.sku)])
      if (!pairs.length) { if (!cancelled) setMap({}); return }
      const skus = pairs.map(([, sku]) => sku)
      const { data: prods } = await supabase
        .from('productos')
        .select('sku, precio')
        .in('sku', skus)
      const skuToPrice = new Map((prods||[]).map((d: any) => [String(d.sku), Number(d.precio || 0)]))
      const out: Record<string, number> = {}
      for (const [id, sku] of pairs) {
        const p = skuToPrice.get(sku)
        if (typeof p === 'number' && !Number.isNaN(p)) out[id] = p
      }
      if (!cancelled) setMap(out)
    }
    run()
    return () => { cancelled = true }
  }, [ids])

  return map
}
