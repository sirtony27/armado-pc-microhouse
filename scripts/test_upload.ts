
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

async function testUpload() {
    console.log('Testing upload to bucket "componentes" at:', url)

    const fileName = `test-${Date.now()}.txt`
    const fileBody = 'Hello Supabase'

    const { data, error } = await supabase.storage
        .from('componentes')
        .upload(fileName, fileBody, {
            contentType: 'text/plain',
            upsert: false
        })

    if (error) {
        console.error('UPLOAD FAILED:', error)
    } else {
        console.log('UPLOAD SUCCESS:', data)
        // Clean up
        await supabase.storage.from('componentes').remove([fileName])
    }
}

testUpload()
