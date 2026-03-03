'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { slugify } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import { allProducts, Product } from '@/data/products';
import styles from '@/app/products/page.module.css';

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'newest';

function sanityToProduct(doc: any): Product {
    const firstTier = doc.pricingTiers?.[0];
    return {
        id: doc._id,
        slug: slugify(doc.title || doc._id),
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

export default function CategoryPage() {
    const params = useParams();
    const categorySlug = (params?.slug as string) || '';
    const normalizedCategory = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);

    const [sanityProducts, setSanityProducts] = useState<Product[]>([]);
    const [loadingRemote, setLoadingRemote] = useState(true);
    const [sort, setSort] = useState<SortOption>('recommended');

    useEffect(() => {
        fetch('/api/products')
            .then(r => r.json())
            .then(data => {
                if (data.products?.length > 0) {
                    setSanityProducts(data.products.map(sanityToProduct));
                }
            })
            .catch(() => { })
            .finally(() => setLoadingRemote(false));
    }, []);

    // If Sanity has products → show ONLY Sanity products
    // If Sanity is empty → fallback to local static catalog
    const allMerged = useMemo(() => {
        if (!loadingRemote && sanityProducts.length > 0) {
            return sanityProducts;
        }
        if (loadingRemote) return [];
        return allProducts;
    }, [sanityProducts, loadingRemote]);

    const filtered = useMemo(() => {
        return allMerged.filter(p => p.category.toLowerCase() === categorySlug.toLowerCase());
    }, [allMerged, categorySlug]);

    const sorted = useMemo(() => {
        const list = [...filtered];
        switch (sort) {
            case 'price-asc': return list.sort((a, b) => a.price - b.price);
            case 'price-desc': return list.sort((a, b) => b.price - a.price);
            case 'newest':
                return list.sort((a, b) => {
                    const aNew = sanityProducts.find(s => s.slug === a.slug);
                    const bNew = sanityProducts.find(s => s.slug === b.slug);
                    if (aNew && !bNew) return -1;
                    if (!aNew && bNew) return 1;
                    return 0;
                });
            default: return list;
        }
    }, [filtered, sort, sanityProducts]);

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <h1>{normalizedCategory} Tools</h1>
                <div className={styles.filters}>
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

            {loadingRemote && sorted.length === 0 ? (
                <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '3rem 0' }}>⏳ Loading products...</div>
            ) : sorted.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '1.2rem', marginTop: '2rem' }}>
                    No products found in <strong>{normalizedCategory}</strong> yet.
                </div>
            ) : (
                <>
                    <div className={styles.productGrid}>
                        {sorted.map(product => (
                            <ProductCard key={product.slug} {...product} />
                        ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#333', fontSize: '0.75rem', fontFamily: 'var(--font-heading)' }}>
                        Showing {sorted.length} product{sorted.length !== 1 ? 's' : ''} in {normalizedCategory}
                    </div>
                </>
            )}
        </div>
    );
}
