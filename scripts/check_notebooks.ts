
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkNotebooks() {
    const { data: allNotebooks, error } = await supabase
        .from('componentes')
        .select('id, marca, modelo, sku')
        .eq('tipo', 'NOTEBOOK')

    if (error) {
        console.error('Error fetching notebooks:', error)
        return
    }

    console.log(`Total Notebooks found: ${allNotebooks.length}`)

    const withSku = allNotebooks.filter(n => n.sku && n.sku.trim().length > 0)
    console.log(`Notebooks with SKU: ${withSku.length}`)

    if (withSku.length > 0) {
        console.log('Sample Notebooks with SKU:')
        withSku.slice(0, 5).forEach(n => console.log(`- ${n.marca} ${n.modelo} (SKU: ${n.sku})`))
    } else {
        console.log('No notebooks have valid SKUs. Update logic will skip them.')
    }
}

checkNotebooks()
