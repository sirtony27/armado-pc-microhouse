
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

async function listBuckets() {
    console.log('Checking buckets for URL:', url)
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
        console.error('Error listing buckets:', error)
    } else {
        console.log('Buckets found:', data.map(b => ({ name: b.name, public: b.public })))
    }
}

listBuckets()
