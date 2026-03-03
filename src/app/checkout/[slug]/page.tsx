'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { slugify } from '@/lib/utils';
import styles from '../page.module.css';

export default function DirectCheckoutPage({ params, searchParams }: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ tier?: string; coupon?: string }>;
}) {
    const { slug } = use(params);
    const sp = use(searchParams);
    const tierName = sp.tier || '';
    const couponFromUrl = sp.coupon || '';

    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'redirecting' | 'no_link' | 'no_product' | 'auth_required' | 'error'>('loading');
    const [product, setProduct] = useState<any>(null);
    const [selectedTier, setSelectedTier] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const run = async () => {
            // 1. Check auth
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                setStatus('auth_required');
                return;
            }

            // 2. Fetch product from API
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                const decodedSlug = decodeURIComponent(slug).toLowerCase();
                const match = (data.products || []).find(
                    (p: any) => p.slug === slug || p._id === slug || slugify(p.title) === slug || p.slug === decodedSlug || slugify(p.title) === decodedSlug || (p.title || '').toLowerCase() === decodedSlug
                );

                if (!match) {
                    setStatus('no_product');
                    return;
                }
                setProduct(match);

                // 3. Find the matching tier  
                const tiers: any[] = match.pricingTiers || [];
                let tier = tiers.find((t: any) =>
                    t.name?.toLowerCase() === tierName?.toLowerCase()
                );

                // If tier not found by name, use first tier
                if (!tier && tiers.length > 0) tier = tiers[0];

                if (!tier) {
                    setStatus('no_product');
                    setErrorMsg(`No pricing tier found for "${tierName}".`);
                    return;
                }
                setSelectedTier(tier);

                // 3.5 Check coupon if provided
                let hasValidCoupon = false;
                let couponDiscountPerc = 0;
                if (couponFromUrl) {
                    const cRes = await fetch('/api/coupon/validate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code: couponFromUrl, cartItems: [{ productId: match._id, price: tier.price }] })
                    });
                    const cData = await cRes.json();
                    if (cData.success) {
                        hasValidCoupon = true;
                        couponDiscountPerc = cData.discountPercentage;
                    }
                }

                // 3.7 Fetch Site Settings (for dynamic handle)
                const settingsRes = await fetch('/api/admin/sanity?type=siteSettings');
                const settingsData = await settingsRes.json();
                const settings = settingsData.documents?.[0];
                const handle = settings?.razorpayHandle;

                // 4. Redirect to payment link if available
                let finalLink = hasValidCoupon ? (tier.couponPaymentLink || tier.paymentLink) : tier.paymentLink;

                // Fallback to Dynamic Razorpay.me handle if no specific link is found
                if (!finalLink && handle) {
                    const cleanHandle = handle.replace(/^(https?:\/\/)?(razorpay\.me\/)?@?/, '');
                    const price = hasValidCoupon ? Math.round(tier.price * (1 - couponDiscountPerc / 100)) : tier.price;
                    finalLink = `https://razorpay.me/@${cleanHandle}/${price}`;
                }

                if (finalLink) {
                    setStatus('redirecting');
                    setTimeout(() => {
                        window.location.href = finalLink;
                    }, 1200);
                } else {
                    setStatus('no_link');
                }
            } catch (err: any) {
                setStatus('error');
                setErrorMsg(err.message);
            }
        };

        run();
    }, [slug, tierName, couponFromUrl]);

    if (status === 'auth_required') {
        return (
            <div className={`container ${styles.emptyState}`}>
                <h2 style={{ color: 'var(--accent)' }}>Authentication Required</h2>
                <p style={{ color: 'var(--muted)' }}>You must be logged in to access the checkout gateway.</p>
                <button
                    className="btn-primary"
                    onClick={() => router.push(`/login?redirect=/checkout/${slug}${tierName ? `?tier=${encodeURIComponent(tierName)}` : ''}`)}
                    style={{ marginTop: '1rem' }}
                >
                    Log In to Continue
                </button>
            </div>
        );
    }

    if (status === 'no_product') {
        return (
            <div className={`container ${styles.emptyState}`}>
                <h2 style={{ color: 'var(--accent)' }}>Product Not Found</h2>
                <p style={{ color: 'var(--muted)' }}>
                    {errorMsg || `Could not find product "${slug}". It may have been removed.`}
                </p>
                <Link href="/products" className="btn-secondary" style={{ marginTop: '1rem' }}>
                    ← Browse All Products
                </Link>
            </div>
        );
    }

    if (status === 'no_link') {
        return (
            <div className={`container ${styles.emptyState}`}>
                <h2 style={{ color: 'var(--accent)' }}>⚠ Payment Not Configured</h2>
                <p style={{ color: 'var(--muted)', maxWidth: '480px', textAlign: 'center' }}>
                    The <strong style={{ color: 'var(--foreground)' }}>{selectedTier?.name}</strong> tier for{' '}
                    <strong style={{ color: 'var(--foreground)' }}>{product?.title}</strong> does not have a payment link configured yet.
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    Please add a <code style={{ color: 'var(--accent)' }}>Custom Payment Link</code> in the Admin → Products page for this tier.
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <Link href={`/products/${slug}`} className="btn-secondary">Back to Product</Link>
                    <Link href="/products" className="btn-secondary">Browse All</Link>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={`container ${styles.emptyState}`}>
                <h2 style={{ color: 'var(--accent)' }}>Checkout Error</h2>
                <p style={{ color: 'var(--muted)' }}>{errorMsg || 'An unexpected error occurred.'}</p>
                <button className="btn-secondary" onClick={() => router.back()} style={{ marginTop: '1rem' }}>Go Back</button>
            </div>
        );
    }

    // Loading / Redirecting state
    return (
        <div className={`container ${styles.emptyState}`}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                {/* Animated spinner */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    border: '3px solid rgba(245, 166, 35, 0.2)',
                    borderTop: '3px solid var(--accent)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />

                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--accent)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>
                        {status === 'redirecting' ? '⚡ Redirecting to Secure Payment' : 'Loading...'}
                    </p>
                    {product && (
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            {product.title} — {selectedTier?.name} {selectedTier?.price ? `• ₹${selectedTier.price}` : ''}
                        </p>
                    )}
                    {status === 'redirecting' && (
                        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            You will be redirected to the payment gateway shortly...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
