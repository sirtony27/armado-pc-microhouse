import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type DuxResponse = {
  item: string
  rubro: string
  total: number
  total_sin_impuestos: number
  sku: string
  moneda: string
  stock_disponible: number
}

export type UpdateSummary = {
  startedAt: string
  finishedAt: string
  durationMs: number
  total: number
  updated: number
  failed: number
  errors: Array<{ id: number; sku: string | null; reason: string }>
}

function getAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Faltan variables de entorno de Supabase')
  return createClient(url, key)
}

export async function fetchDuxBySku(sku: string): Promise<DuxResponse> {
  const endpoint = `https://catalogo.duxsoftware.com.ar/api/proxy/product_info?page=0&size=10&key_catalogo=armado_pc_microhouse&producto=${encodeURIComponent(
    sku
  )}`
  const res = await fetch(endpoint, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as DuxResponse
  if (!data || typeof data.total !== 'number') throw new Error('Respuesta inválida de Dux')
  return data
}

async function selectProductos() {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('componentes')
    .select('id, sku')
    .not('sku', 'is', null)

  if (error) throw error
  return (data || []).filter((p: any) => typeof p.sku === 'string' && p.sku.trim().length > 0)
}

async function updateProducto(
  supabase: SupabaseClient,
  id: number,
  dux: DuxResponse
) {
  const { error } = await supabase
    .from('componentes')
    .update({
      precio: dux.total,
      precio_neto: dux.total_sin_impuestos,
      stock: dux.stock_disponible,
      ultima_actualizacion: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

async function mapPool<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  let i = 0
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const idx = i++
      if (idx >= items.length) break
      results[idx] = await mapper(items[idx], idx)
    }
  })
  await Promise.all(workers)
  return results
}

export async function actualizarPreciosDux({ concurrency = 10, log = true }: { concurrency?: number; log?: boolean } = {}): Promise<UpdateSummary> {
  const started = Date.now()
  if (log) console.log(`[dux] Inicio actualización: ${new Date(started).toISOString()}`)

  const supabase = getAdminClient()
  const productos = await selectProductos()

  let updated = 0
  const errors: Array<{ id: number; sku: string | null; reason: string }> = []

  await mapPool(productos, concurrency, async (p: any) => {
    const sku = String(p.sku)
    try {
      const dux = await fetchDuxBySku(sku)
      await updateProducto(supabase, p.id as number, dux)
      updated++
      if (log) console.log(`[dux] OK ${p.id} sku=${sku} $${dux.total} stock=${dux.stock_disponible}`)
    } catch (e: any) {
      const reason = e?.message || 'Error desconocido'
      errors.push({ id: p.id as number, sku, reason })
      if (log) console.warn(`[dux] ERROR ${p.id} sku=${sku}: ${reason}`)
    }
  })

  const finished = Date.now()
  const summary: UpdateSummary = {
    startedAt: new Date(started).toISOString(),
    finishedAt: new Date(finished).toISOString(),
    durationMs: finished - started,
    total: productos.length,
    updated,
    failed: errors.length,
    errors,
  }

  if (log)
    console.log(
      `[dux] Fin actualización: ${summary.updated}/${summary.total} ok, ${summary.failed} errores, dur=${summary.durationMs}ms`
    )

  return summary
}
