'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import ProductCard from '@/components/ProductCard';
import { allProducts, Product } from '@/data/products';
import { slugify } from '@/lib/utils';
import styles from './page.module.css';

const CATEGORIES = ['All', 'Optimization', 'Debloat', 'Diagnostics', 'Privacy', 'Drivers', 'Cleanup', 'Gaming'];

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'newest';

// Normalise a Sanity doc into our Product shape
function sanityToProduct(doc: any): Product {
    const firstTier = doc.pricingTiers?.[0];
    return {
        id: doc._id,
        slug: slugify(doc.title || doc._id), // slugify the title as fallback for reliability
        title: doc.title || 'Untitled',
        category: doc.category || 'Optimization',
        price: firstTier?.price ?? 0,
        image: doc.mainImage || 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        features: doc.features || [],
        shortDescription: doc.shortDescription || '',
        longDescription: doc.longDescription || '',
        pricingTiers: doc.pricingTiers || [],
        galleryUrls: doc.gallery || [],
    };
}

export default function ProductsPage() {
    const [sanityProducts, setSanityProducts] = useState<Product[]>([]);
    const [loadingRemote, setLoadingRemote] = useState(true);
    const [category, setCategory] = useState('All');
    const [sort, setSort] = useState<SortOption>('recommended');
    const [lastSync, setLastSync] = useState<Date | null>(null);

    const fetchSanityProducts = useCallback(async () => {
        try {
            const res = await fetch('/api/products', { cache: 'no-store' });
            const data = await res.json();
            if (data.products?.length > 0) {
                setSanityProducts(data.products.map(sanityToProduct));
            }
            setLastSync(new Date());
        } catch { }
        finally { setLoadingRemote(false); }
    }, []);

    // Fetch on mount + poll every 30 seconds for real-time admin sync
    useEffect(() => {
        fetchSanityProducts();
        const interval = setInterval(fetchSanityProducts, 30_000);
        return () => clearInterval(interval);
    }, [fetchSanityProducts]);

    // If Sanity has products → show ONLY Sanity products
    // If Sanity is empty or still loading → show local static catalog as fallback
    const allMerged = useMemo(() => {
        if (!loadingRemote && sanityProducts.length > 0) {
            return sanityProducts; // Sanity-only mode
        }
        if (loadingRemote) {
            return []; // Still loading, show nothing yet
        }
        return allProducts; // Sanity empty → fallback to local
    }, [sanityProducts, loadingRemote]);

    // Apply category filter
    const filtered = useMemo(() => {
        if (category === 'All') return allMerged;
        return allMerged.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }, [allMerged, category]);

    // Apply sort
    const sorted = useMemo(() => {
        const list = [...filtered];
        switch (sort) {
            case 'price-asc':
                return list.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return list.sort((a, b) => b.price - a.price);
            case 'newest':
                // Sanity products have _createdAt; local ones go to end
                return list.sort((a, b) => {
                    const aNew = sanityProducts.find(s => s.slug === a.slug);
                    const bNew = sanityProducts.find(s => s.slug === b.slug);
                    if (aNew && !bNew) return -1;
                    if (!aNew && bNew) return 1;
                    return 0;
                });
            default:
                return list; // recommended — original order
        }
    }, [filtered, sort, sanityProducts]);

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <div>
                    <h1>PC Tools &amp; Software</h1>
                    {!loadingRemote && sanityProducts.length > 0 && (
                        <p style={{ color: 'var(--accent)', fontSize: '0.78rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.3rem' }}>
                            ● {sanityProducts.length} product{sanityProducts.length !== 1 ? 's' : ''} from Sanity CMS
                        </p>
                    )}
                    {lastSync && (
                        <p style={{ color: '#333', fontSize: '0.65rem', fontFamily: 'var(--font-heading)', marginTop: '0.2rem' }}>
                            Synced {lastSync.toLocaleTimeString()} · auto-refreshes every 30s
                        </p>
                    )}
                </div>
                <div className={styles.filters}>
                    <select
                        className={styles.select}
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                    >
                        {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                        ))}
                    </select>
                    <select
                        className={styles.select}
                        value={sort}
                        onChange={e => setSort(e.target.value as SortOption)}
                    >
                        <option value="recommended">Sort: Recommended</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="newest">Newest First</option>
                    </select>
                </div>
            </div>

            {sorted.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '1.1rem', marginTop: '3rem', textAlign: 'center', padding: '3rem 0' }}>
                    {loadingRemote ? '⏳ Loading products...' : `No products found in "${category}". Try another category.`}
                </div>
            ) : (
                <div className={styles.productGrid}>
                    {sorted.map(product => (
                        <ProductCard key={product.slug} {...product} />
                    ))}
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#333', fontSize: '0.75rem', fontFamily: 'var(--font-heading)' }}>
                Showing {sorted.length} of {allMerged.length} products
                {category !== 'All' && ` in "${category}"`}
            </div>
        </div>
    );
}
