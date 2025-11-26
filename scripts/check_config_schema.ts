
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
    console.log('Checking configuracion_modelo table...')

    // Check one row to see columns
    const { data, error } = await supabase
        .from('configuracion_modelo')
        .select('*')
        .limit(1)

    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]))
    } else {
        console.log('No data found or error:', error?.message)
    }
}

main()
