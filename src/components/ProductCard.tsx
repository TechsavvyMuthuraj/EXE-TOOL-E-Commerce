'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCompareStore } from '@/store/useCompareStore';
import { slugify } from '@/lib/utils';
import styles from './ProductCard.module.css';

interface ProductCardProps {
    id?: string;
    title: string;
    category: string;
    price: number;
    image: string;
    slug: string;
    features?: string[];
    galleryUrls?: string[];
}

export default function ProductCard({ id = '', title, category, price, image, slug, features = [], galleryUrls = [] }: ProductCardProps) {
    const { compareItems, addToCompare, removeFromCompare } = useCompareStore();
    const isComparing = compareItems.some(item => item.slug === slug);

    const handleCompare = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating to the product page
        if (isComparing) {
            removeFromCompare(slug);
        } else {
            addToCompare({ id, slug, title, price, image, features });
        }
    };
    return (
        <div className={styles.card}>
            <Link href={`/products/${encodeURIComponent(slug)}`} className={styles.imageWrapper}>
                <div
                    className={styles.placeholderImage}
                    style={{
                        background: image.startsWith('http') || image.startsWith('/')
                            ? `url('${image}') center/cover`
                            : image
                    }}
                >
                    {/* We use a colored placeholder for now instead of Next Image to avoid host errors */}
                </div>
                <div className={styles.overlay}>
                    <span className={styles.quickAdd}>View Details</span>
                </div>
                {galleryUrls.length > 0 && (
                    <div className={styles.galleryIndicator}>
                        <span className={styles.galleryCount}>+{galleryUrls.length} Photos</span>
                        <div className={styles.galleryDots}>
                            <span className={styles.dotActive}></span>
                            {galleryUrls.slice(0, 3).map((_, i) => <span key={i} className={styles.dot}></span>)}
                        </div>
                    </div>
                )}
            </Link>
            <div className={styles.content}>
                <div className={styles.header}>
                    <span className={styles.category}>{category}</span>
                    <span className={`pricing-code ${styles.price}`}>₹{price}</span>
                </div>
                <Link href={`/products/${encodeURIComponent(slug)}`}>
                    <h3 className={styles.title}>{title}</h3>
                </Link>
                <button
                    className={`${styles.compareBtn} ${isComparing ? styles.comparing : ''}`}
                    onClick={handleCompare}
                >
                    <span className={styles.compareCheckbox}>{isComparing ? '✓' : '+'}</span>
                    {isComparing ? 'Added to Compare' : 'Add to Compare'}
                </button>
            </div>
        </div>
    );
}
