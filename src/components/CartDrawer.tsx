'use client';

import { useCartStore } from '@/store/useCartStore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
    const {
        items, isDrawerOpen, closeDrawer, removeItem, getCartTotal,
        discountPercentage, applyCoupon
    } = useCartStore();
    const [mounted, setMounted] = useState(false);

    const [couponCode, setCouponCode] = useState('');
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
                    cartItems: items.map(i => ({ productId: i.productId, price: i.price }))
                })
            });
            const data = await res.json();
            if (data.success) {
                applyCoupon(couponCode, data.discountPercentage);
                setCouponMsg(`✓ ${data.discountPercentage}% discount applied!`);
            } else {
                applyCoupon('', 0);
                setCouponMsg(`⚠ ${data.error}`);
            }
        } catch (err) {
            setCouponMsg('Error validating coupon');
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <>
            {isDrawerOpen && <div className={styles.backdrop} onClick={closeDrawer} />}
            <div className={`${styles.drawer} ${isDrawerOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <h2>Your Cart</h2>
                    <button className={styles.closeBtn} onClick={closeDrawer}>✕</button>
                </div>

                <div className={styles.content}>
                    {items.length === 0 ? (
                        <div className={styles.empty}>
                            <p>Your cart is empty.</p>
                            <button className="btn-secondary" onClick={closeDrawer}>Continue Shopping</button>
                        </div>
                    ) : (
                        <div className={styles.itemsList}>
                            {items.map((item) => (
                                <div key={item.id} className={styles.cartItem}>
                                    <div className={styles.itemImage} style={{ background: item.image }}></div>
                                    <div className={styles.itemDetails}>
                                        <div className={styles.itemHeader}>
                                            <h4>{item.title}</h4>
                                            <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>Remove</button>
                                        </div>
                                        <div className={styles.itemMeta}>
                                            <span className={styles.tierBadge}>{item.licenseTier}</span>
                                            <span className={`pricing-code ${styles.price}`}>₹{item.price}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className={styles.footer}>
                        <div className={styles.totalRow}>
                            <span>Subtotal</span>
                            <div style={{ textAlign: 'right' }}>
                                {discountPercentage > 0 && (
                                    <div style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: '0.8rem' }}>
                                        ₹{getCartTotal()}
                                    </div>
                                )}
                                <span className={`pricing-code ${styles.totalPrice}`}>
                                    ₹{Math.round(getCartTotal() * (1 - discountPercentage / 100))}
                                </span>
                            </div>
                        </div>

                        <div className={styles.couponSection} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    placeholder="COUPON CODE"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,184,0,0.2)',
                                        color: '#fff',
                                        padding: '0.5rem',
                                        flex: 1,
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                    }}
                                />
                                <button
                                    onClick={validateCoupon}
                                    style={{
                                        padding: '0 0.8rem',
                                        background: '#FFB800',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                    }}
                                >
                                    APPLY
                                </button>
                            </div>
                            {couponMsg && (
                                <div style={{ fontSize: '0.65rem', marginTop: '0.3rem', color: couponMsg.startsWith('✓') ? '#4caf50' : '#ff5722' }}>
                                    {couponMsg}
                                </div>
                            )}
                        </div>

                        {items.some(item => item.paymentLink) ? (
                            <button
                                className={`btn-primary ${styles.checkoutBtn}`}
                                style={{ marginTop: '1rem' }}
                                onClick={async () => {
                                    // 1. Fetch Dynamic Handle if available
                                    const settingsRes = await fetch('/api/admin/sanity?type=siteSettings');
                                    const settingsData = await settingsRes.json();
                                    const handle = settingsData.documents?.[0]?.razorpayHandle;

                                    const item = items[0]; // For now, handle first item or lead item
                                    if (item) {
                                        let finalLink = (discountPercentage > 0 && item.couponPaymentLink)
                                            ? item.couponPaymentLink
                                            : item.paymentLink;

                                        // Fallback to Dynamic Handle if no link configured
                                        if (!finalLink && handle) {
                                            const cleanHandle = handle.replace(/^(https?:\/\/)?(razorpay\.me\/)?@?/, '');
                                            const price = discountPercentage > 0 ? Math.round(item.price * (1 - discountPercentage / 100)) : item.price;
                                            finalLink = `https://razorpay.me/@${cleanHandle}/${price}`;
                                        }

                                        if (finalLink) window.location.href = finalLink;
                                        else alert('No Payment Link or Razorpay Handle configured.');
                                    }
                                    closeDrawer();
                                }}
                            >
                                PAY NOW (DIRECT LINK)
                            </button>
                        ) : (
                            <button
                                className={`btn-primary ${styles.checkoutBtn}`}
                                onClick={() => alert('No Payment Link configured for these items.')}
                                style={{ opacity: 0.5, cursor: 'not-allowed', marginTop: '1rem' }}
                            >
                                CHECKOUT DISABLED (NO LINK)
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
