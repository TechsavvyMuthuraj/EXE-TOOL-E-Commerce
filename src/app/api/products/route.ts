import { NextResponse } from 'next/server';

// Public endpoint — fetches products from Sanity (no write token needed, read is public)
export async function GET() {
    try {
        const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
        const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

        if (!projectId || projectId === 'your-project-id') {
            return NextResponse.json({ products: [] });
        }

        const query = encodeURIComponent(
            `*[_type == "product"] | order(_createdAt desc) {
                _id,
                title,
                "slug": slug.current,
                category,
                shortDescription,
                longDescription,
                features,
                pricingTiers[] { name, price, originalPrice, licenseType, downloadLink, paymentLink, couponPaymentLink },
                "mainImage": mainImage.asset->url,
                "gallery": gallery[].asset->url,
                _createdAt
            }`
        );

        const res = await fetch(
            `https://${projectId}.api.sanity.io/v2021-03-25/data/query/${dataset}?query=${query}`,
            { cache: 'no-store' }
        );

        if (!res.ok) {
            return NextResponse.json({ products: [] });
        }

        const data = await res.json();
        return NextResponse.json({ products: data.result || [] });
    } catch (err: any) {
        return NextResponse.json({ products: [], error: err.message });
    }
}
