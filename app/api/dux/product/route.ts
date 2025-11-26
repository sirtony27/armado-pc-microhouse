
import { NextResponse } from 'next/server';
import { fetchDuxBySku } from '@/lib/updatePrices';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const sku = searchParams.get('sku');

    if (!sku) {
        return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    }

    try {
        const data = await fetchDuxBySku(sku);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching Dux product:', error);
        return NextResponse.json({ error: error.message || 'Error fetching product' }, { status: 500 });
    }
}
