import { NextResponse } from 'next/server';

const SANITY_URL = `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2021-03-25/data/mutate/${process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}`;
const TOKEN = process.env.SANITY_API_TOKEN!;

// GET all documents of a type
export async function GET(request: Request) {
    try {
        if (!TOKEN) {
            return NextResponse.json({
                error: 'SANITY_API_TOKEN is missing. Please ensure it is set in your environment variables.'
            }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'post';
        const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
        const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';

        // ... fields logic omitted for brevity in replacement ...
        const productFields = `_id, _type, title, slug, category, _createdAt, shortDescription, longDescription, features, pricingTiers[] { name, price, originalPrice, licenseType, downloadLink, paymentLink, couponPaymentLink }, "mainImage": { "url": mainImage.asset->url, "ref": mainImage.asset._ref }, "gallery": gallery[] { "url": asset->url, "ref": asset._ref }`;
        const postFields = `_id, _type, title, "slug": slug.current, category, status, _createdAt, excerpt, body, readTime, coverImageUrl, links, author`;
        const storedLinkFields = `_id, _type, title, amount, url, _createdAt`;
        const tutorialFields = `_id, _type, title, slug, category, _createdAt, shortDescription, icon, image, chapters[] { title, "slug": slug.current, content }`;
        const liveVideoFields = `_id, _type, title, "slug": slug.current, videoUrl, description, status, streamDate, category, _createdAt`;
        const siteSettingsFields = `_id, _type, bannerActive, bannerText`;

        let fields = postFields;
        if (type === 'product') fields = productFields;
        else if (type === 'storedLink') fields = storedLinkFields;
        else if (type === 'tutorial') fields = tutorialFields;
        else if (type === 'liveVideo') fields = liveVideoFields;
        else if (type === 'siteSettings') fields = siteSettingsFields;

        const query = encodeURIComponent(`*[_type == "${type}"] | order(_createdAt desc) { ${fields} }`);
        const res = await fetch(
            `https://${projectId}.api.sanity.io/v2021-03-25/data/query/${dataset}?query=${query}`,
            { headers: { Authorization: `Bearer ${TOKEN}` }, cache: 'no-store' }
        );
        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json({
                error: `Sanity Query Failed: ${data.message || JSON.stringify(data)}`
            }, { status: res.status });
        }

        return NextResponse.json({ documents: data.result || [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST: Create a new document
export async function POST(request: Request) {
    try {
        if (!TOKEN) {
            return NextResponse.json({
                error: 'SANITY_API_TOKEN is missing in environment variables. Check your Netlify/Vercel settings.'
            }, { status: 401 });
        }

        const body = await request.json();
        const { document } = body;

        const res = await fetch(SANITY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify({
                mutations: [{ create: document }],
            }),
        });

        const data = await res.json();
        if (!res.ok) {
            const errorMsg = data.message || JSON.stringify(data);
            return NextResponse.json({
                error: res.status === 401
                    ? `Sanity Authentication Failed: ${errorMsg}. Ensure your SANITY_API_TOKEN has Editor permissions.`
                    : data
            }, { status: res.status });
        }
        return NextResponse.json({ success: true, result: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH: Update a document
export async function PATCH(request: Request) {
    try {
        if (!TOKEN) return NextResponse.json({ error: 'SANITY_API_TOKEN missing' }, { status: 401 });

        const body = await request.json();
        const { id, patch } = body;

        const res = await fetch(SANITY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify({
                mutations: [{ patch: { id, set: patch } }],
            }),
        });

        const data = await res.json();
        if (!res.ok) {
            return NextResponse.json({
                error: `Sanity Update Failed: ${data.message || JSON.stringify(data)}`
            }, { status: res.status });
        }
        return NextResponse.json({ success: true, result: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE a document
export async function DELETE(request: Request) {
    try {
        if (!TOKEN) return NextResponse.json({ error: 'SANITY_API_TOKEN missing' }, { status: 401 });

        const { id } = await request.json();

        const res = await fetch(SANITY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify({
                mutations: [{ delete: { id } }],
            }),
        });

        const data = await res.json();
        if (!res.ok) {
            return NextResponse.json({
                error: `Sanity Delete Failed: ${data.message || JSON.stringify(data)}`
            }, { status: res.status });
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
