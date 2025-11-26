
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

import fs from 'fs';
const logFile = 'scripts/models_list.txt';
fs.writeFileSync(logFile, '');

async function main() {
    const { data, error } = await supabase
        .from('modelos_base')
        .select('id, nombre, slug')
        .order('nombre');

    if (error) {
        const msg = `Error fetching models: ${error.message}\n`;
        console.error(msg);
        fs.appendFileSync(logFile, msg);
    } else {
        console.log('Current Models:');
        data.forEach(m => {
            const msg = `- ${m.nombre} (Slug: ${m.slug})\n`;
            console.log(msg.trim());
            fs.appendFileSync(logFile, msg);
        });
    }
}

main()
