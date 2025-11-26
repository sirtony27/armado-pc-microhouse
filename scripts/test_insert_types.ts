
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs';

dotenv.config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(url, key)
const logFile = 'scripts/test_types_output.txt';
fs.writeFileSync(logFile, '');

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function testType(type: string) {
    log(`Testing type: ${type}...`)
    const { data, error } = await supabase
        .from('componentes')
        .insert([{
            tipo: type,
            marca: 'TEST',
            modelo: 'TEST',
            precio: 100,
            sku: `TEST-${type}-${Date.now()}`,
            activo: false
        }])
        .select()

    if (error) {
        log(`❌ Type '${type}' failed: ${error.message}`)
    } else {
        log(`✅ Type '${type}' allowed.`)
        // Cleanup
        if (data && data[0]) {
            await supabase.from('componentes').delete().eq('id', data[0].id)
        }
    }
}

async function main() {
    const typesToTest = ['ACCESORIOS', 'PERIFERICOS', 'SISTEMA', 'KIT', 'COMBO', 'SOFTWARE', 'SERVICIO'];

    for (const type of typesToTest) {
        await testType(type);
    }
}

main()
