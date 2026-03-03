import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const signature = req.headers.get('x-razorpay-signature');
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Verify webhook signature if secret is provided
        if (secret && signature) {
            const shasum = crypto.createHmac('sha256', secret);
            shasum.update(JSON.stringify(payload));
            const digest = shasum.digest('hex');
            if (digest !== signature) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
            }
        }

        const event = payload.event;
        const payment = payload.payload.payment?.entity;
        const paymentLink = payload.payload.payment_link?.entity;

        // We only care about successful payments
        if (event === 'payment_link.paid' || event === 'payment.captured' || event === 'order.paid') {
            const email = payment?.email || paymentLink?.customer?.email;
            const amount = (payment?.amount || paymentLink?.amount) / 100; // Razorpay is in paise
            const razorpay_payment_id = payment?.id || payment?.payment_id;

            console.log(`[Webhook] Payment received: ${email} - ₹${amount} [${razorpay_payment_id}]`);

            if (!email) return NextResponse.json({ success: true, warning: 'No email found' });

            const supabase = createClient(supabaseUrl, supabaseKey);

            // 1. Find the user by email
            const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
            const user = authUser?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

            if (!user) {
                console.warn(`[Webhook] User with email ${email} not found in Supabase Auth.`);
                return NextResponse.json({ success: true, warning: 'User not found' });
            }

            // 2. Insert Order
            const { data: order, error: orderError } = await supabase.from('orders').insert({
                user_id: user.id,
                amount: amount,
                razorpay_payment_id: razorpay_payment_id,
                status: 'completed'
            }).select().single();

            if (orderError) {
                console.error('[Webhook] Order insert error:', orderError);
                return NextResponse.json({ success: false, error: orderError.message }, { status: 500 });
            }

            // 3. Logic to determine what was bought
            // Since this is a webhook for a direct link, we might not know the exact product unless passed in notes
            const notes = payment?.notes || paymentLink?.notes || {};
            let productId = notes.productId || notes.id; // Try to extract from notes
            const licenseTier = notes.tier || notes.license_tier || 'Personal';

            // If no notes, try matching by description
            if (!productId && (payment?.description || paymentLink?.description)) {
                const desc = (payment?.description || paymentLink?.description).toLowerCase();
                const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/products`);
                const data = await res.json();
                const match = data.products.find((p: any) => desc.includes(p.title.toLowerCase()));
                if (match) productId = match._id || match.slug;
            }

            if (productId) {
                // Check if license already exists for this payment_id
                const { data: existingLicense } = await supabase.from('licenses').select('id').eq('order_id', order.id).limit(1);

                if (!existingLicense || existingLicense.length === 0) {
                    const licenseKey = `KEY-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
                    await supabase.from('licenses').insert({
                        user_id: user.id,
                        product_id: productId,
                        order_id: order.id,
                        license_key: licenseKey,
                        license_tier: licenseTier
                    });
                    console.log(`[Webhook] License granted to ${email} for ${productId}`);
                }
            } else {
                console.warn(`[Webhook] Could not determine product for payment ${razorpay_payment_id}. Please check Razorpay notes.`);
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: true, message: 'Event ignored' });
    } catch (err: any) {
        console.error('[Webhook] Fatal error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
