
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
    console.log('Checking distinct types in componentes table...')

    const { data, error } = await supabase
        .from('componentes')
        .select('tipo')

    if (error) {
        console.error('Error:', error.message)
        return
    }

    if (data) {
        const types = [...new Set(data.map(item => item.tipo))]
        console.log('Distinct Types found:', types)
    }
}

main()
