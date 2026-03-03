'use client';

import { useState, use, useEffect } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { sanityClient } from '@/lib/sanity';
import { getProductBySlug } from '@/data/products';
import ReviewSection from '@/components/ReviewSection';
import { slugify } from '@/lib/utils';
import styles from './page.module.css';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [product, setProduct] = useState<any>(null);
    const [selectedTier, setSelectedTier] = useState<any>(null);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { addItem, openDrawer } = useCartStore();

    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponMsg, setCouponMsg] = useState('');

    const validateCoupon = async () => {
        if (!couponCode) return;
        setCouponMsg('Validating...');
        try {
            const res = await fetch('/api/coupon/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: couponCode,
                    cartItems: [{ productId: product?.id, price: selectedTier?.price }]
                })
            });
            const data = await res.json();
            if (data.success) {
                setCouponDiscount(data.discountPercentage);
                setCouponMsg(`✓ ${data.discountPercentage}% discount applied!`);
            } else {
                setCouponDiscount(0);
                setCouponMsg(`⚠ ${data.error}`);
            }
        } catch (err) {
            setCouponMsg('Error validating coupon');
        }
    };

    useEffect(() => {
        setIsLoading(true);
        setCouponCode(''); setCouponDiscount(0); setCouponMsg('');

        async function fetchProduct() {
            // ── 1. Try Sanity CDN (via sanityClient) ──────────────────────────
            try {
                const query = `*[_type == "product" && slug.current == $slug][0] {
                    _id, title, "slug": slug.current, category, shortDescription,
                    longDescription, features,
                    pricingTiers[] { name, price, originalPrice, licenseType, downloadLink, paymentLink, couponPaymentLink },
                    "imageUrl": mainImage.asset->url,
                    "gallery": gallery[].asset->url
                }`;
                const data = await sanityClient.fetch(query, { slug });

                if (data && data.title) {
                    const imageVal = data.imageUrl
                        ? `url(${data.imageUrl}) center/cover`
                        : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                    const product = {
                        ...data,
                        id: data._id,
                        image: imageVal,
                        pricingTiers: data.pricingTiers || [],
                        features: data.features || [],
                        galleryUrls: data.gallery || [],
                        mainImageUrl: data.imageUrl
                    };
                    setProduct(product);
                    setActiveImage(data.imageUrl);
                    setSelectedTier((data.pricingTiers || [])[0] || null);
                    setIsLoading(false);
                    return;
                }
            } catch (_) {
                // Sanity SDK not configured — fall through
            }

            // ── 2. Try public /api/products (fetches all Sanity docs via REST) ─
            try {
                const res = await fetch('/api/products');
                const apiData = await res.json();
                const match = (apiData.products || []).find(
                    (p: any) => p.slug === slug || p._id === slug || slugify(p.title) === slug
                );
                if (match) {
                    const firstTier = match.pricingTiers?.[0] || null;
                    const imageVal = match.mainImage
                        ? `url(${match.mainImage}) center/cover`
                        : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
                    const product = {
                        id: match._id,
                        slug: match.slug,
                        title: match.title,
                        category: match.category || '',
                        shortDescription: match.shortDescription || '',
                        longDescription: match.longDescription || '',
                        features: match.features || [],
                        pricingTiers: match.pricingTiers || [],
                        price: firstTier?.price ?? 0,
                        image: imageVal,
                        galleryUrls: match.gallery || [],
                        mainImageUrl: match.mainImage
                    };
                    setProduct(product);
                    setActiveImage(match.mainImage);
                    setSelectedTier(firstTier);
                    setIsLoading(false);
                    return;
                }
            } catch (_) {
                // API fetch failed — fall through
            }

            // ── 3. Fallback to local static catalog ────────────────────────────
            const localProduct = getProductBySlug(slug);
            if (localProduct) {
                setProduct(localProduct);
                setSelectedTier(localProduct.pricingTiers[0]);
            } else {
                setProduct(null);
            }
            setIsLoading(false);
        }

        fetchProduct();
    }, [slug]);

    const handleBuyNow = async () => {
        if (!product || !selectedTier) return;

        let finalLink = (couponDiscount > 0 && selectedTier.couponPaymentLink)
            ? selectedTier.couponPaymentLink
            : selectedTier.paymentLink;

        if (finalLink) {
            window.location.href = finalLink;
            return;
        }

        // Only go to normal checkout if absolutely no payment link and no handle could be found
        const robustSlug = slugify(product.title);
        const couponParam = (couponCode && couponDiscount > 0) ? `&coupon=${encodeURIComponent(couponCode)}` : '';
        const checkoutUrl = `/checkout/${robustSlug}?tier=${encodeURIComponent(selectedTier.name)}${couponParam}`;
        window.location.href = checkoutUrl;
    };

    const handleAddToCart = () => {
        if (!product || !selectedTier) return;

        addItem({
            id: `${product.slug}-${selectedTier.name}`,
            productId: product.id,
            slug: product.slug,
            title: product.title,
            price: selectedTier.price,
            licenseTier: selectedTier.name,
            image: product.imageUrl || '',
            downloadLink: selectedTier.downloadLink,
            paymentLink: selectedTier.paymentLink,
            couponPaymentLink: selectedTier.couponPaymentLink
        });
        openDrawer();
    };

    if (isLoading) {
        return (
            <div className={`container ${styles.page}`} style={{ color: 'var(--muted)', paddingTop: '4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.5rem', animation: 'spin 1s linear infinite' }}>⏳</span>
                    Loading product...
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className={`container ${styles.page}`} style={{ paddingTop: '4rem' }}>
                <h1 style={{ color: 'var(--accent)', fontSize: '2rem', marginBottom: '1rem' }}>Product Not Found</h1>
                <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
                    The product <code style={{ background: '#111', padding: '0.2rem 0.5rem' }}>{slug}</code> could not be found in the catalog or Sanity CMS.
                </p>
                <a href="/products" className="btn-primary">← Browse All Products</a>
            </div>
        );
    }

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.grid}>
                <div className={styles.galleryPhase}>
                    <div className={styles.mainImage} style={{ background: activeImage ? `url(${activeImage}) center/cover` : product.image }}></div>
                    {(product.galleryUrls?.length > 0 || product.mainImageUrl) && (
                        <div className={styles.thumbnails}>
                            {product.mainImageUrl && (
                                <div
                                    className={`${styles.thumbnail} ${activeImage === product.mainImageUrl ? styles.activeThumbnail : ''}`}
                                    style={{ background: `url(${product.mainImageUrl}) center/cover` }}
                                    onClick={() => setActiveImage(product.mainImageUrl)}
                                ></div>
                            )}
                            {product.galleryUrls?.map((url: string, i: number) => (
                                <div
                                    key={i}
                                    className={`${styles.thumbnail} ${activeImage === url ? styles.activeThumbnail : ''}`}
                                    style={{ background: `url(${url}) center/cover` }}
                                    onClick={() => setActiveImage(url)}
                                ></div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.contentPhase}>
                    <div className={styles.header}>
                        <span className={styles.categoryBadge}>{product.category}</span>
                        <h1 className={styles.title}>{product.title}</h1>
                        <p className={styles.shortDesc}>{product.shortDescription}</p>
                    </div>

                    {product.pricingTiers?.length > 0 && (
                        <div className={styles.pricingSection}>
                            <h3 className={styles.sectionTitle}>License Option</h3>
                            <div className={styles.tiersGrid}>
                                {product.pricingTiers.map((tier: { licenseType: string; name: string; price: number; originalPrice?: number }) => (
                                    <div
                                        key={tier.licenseType}
                                        className={`${styles.tierCard} ${selectedTier?.licenseType === tier.licenseType ? styles.activeTier : ''}`}
                                        onClick={() => setSelectedTier(tier)}
                                    >
                                        <div className={styles.tierName}>{tier.name}</div>
                                        <div className={`pricing-code ${styles.tierPrice}`}>
                                            {tier.originalPrice && (
                                                <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: '0.8em', marginRight: '0.4rem' }}>
                                                    ₹{tier.originalPrice}
                                                </span>
                                            )}
                                            ₹{tier.price}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedTier && (
                        <div className={styles.actionSection}>
                            <div className={styles.selectedPrice}>
                                <div className={styles.priceLabel}>Price for {selectedTier.name}</div>
                                <div className={styles.finalPrice}>
                                    {(selectedTier.originalPrice || (couponDiscount > 0)) && (
                                        <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: '0.6em', marginRight: '0.5rem' }}>
                                            ₹{selectedTier.originalPrice || selectedTier.price}
                                        </span>
                                    )}
                                    <span style={{ color: couponDiscount > 0 ? 'var(--accent)' : 'inherit' }}>
                                        ₹{Math.round(selectedTier.price * (1 - couponDiscount / 100))}
                                    </span>
                                    {couponDiscount > 0 && (
                                        <span style={{ marginLeft: '1rem', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--glow-cyan)', fontSize: '0.45em', padding: '4px 8px', borderRadius: '4px', verticalAlign: 'middle', textTransform: 'uppercase' }}>
                                            Coupon Applied
                                        </span>
                                    )}
                                    {selectedTier.originalPrice && !couponDiscount && selectedTier.price < selectedTier.originalPrice && (
                                        <span style={{ marginLeft: '1rem', background: 'rgba(255, 170, 0, 0.1)', color: 'var(--accent)', fontSize: '0.45em', padding: '4px 8px', borderRadius: '4px', verticalAlign: 'middle', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            Save {Math.round((1 - selectedTier.price / selectedTier.originalPrice) * 100)}%
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.couponEntry} style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Promo Code</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Enter code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        style={{
                                            flex: 1,
                                            background: '#000',
                                            border: '1px solid rgba(255,184,0,0.2)',
                                            color: '#fff',
                                            padding: '0.6rem',
                                            borderRadius: '4px',
                                            fontSize: '0.9rem',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        onClick={validateCoupon}
                                        style={{
                                            padding: '0 1rem',
                                            background: 'rgba(255,184,0,0.1)',
                                            border: '1px solid #FFB800',
                                            color: '#FFB800',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        APPLY
                                    </button>
                                </div>
                                {couponMsg && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        marginTop: '0.5rem',
                                        color: couponMsg.startsWith('✓') ? '#4caf50' : '#ff5722'
                                    }}>
                                        {couponMsg}
                                    </div>
                                )}
                            </div>

                            <div className={styles.buttonGroup}>
                                <button className={`btn-primary ${styles.buyNowBtn}`} onClick={handleBuyNow}>
                                    ⚡ BUY NOW
                                </button>
                                <button className={`btn-secondary ${styles.secondaryCartBtn}`} onClick={handleAddToCart}>
                                    🛒 Add to Cart
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={styles.detailsSection}>
                        {product.longDescription && (
                            <>
                                <h3 className={styles.sectionTitle}>Description</h3>
                                <p className={styles.longDesc}>{product.longDescription}</p>
                            </>
                        )}

                        {product.features?.length > 0 && (
                            <>
                                <h3 className={styles.sectionTitle}>Features Included</h3>
                                <ul className={styles.featureList}>
                                    {product.features.map((feature: string, i: number) => (
                                        <li key={i}>
                                            <span style={{ color: 'var(--accent)', marginRight: '0.5rem' }}>✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    <ReviewSection productId={product.id} />
                </div>
            </div>
        </div>
    );
}
