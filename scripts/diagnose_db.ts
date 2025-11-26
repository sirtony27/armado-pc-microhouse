
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
    const { data, error } = await supabase
        .from('componentes')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error:', error.message)
    } else if (data && data.length > 0) {
        console.log('KEYS:', Object.keys(data[0]).join(', '))
    } else {
        console.log('No rows')
    }
}

main()
