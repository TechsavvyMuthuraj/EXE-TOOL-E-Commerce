'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function OrderSuccessPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'checking'>('checking');
    const [licenses, setLicenses] = useState<any[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLicenses = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setStatus('success'); // Fallback to simple success
                return;
            }

            try {
                // Fetch licenses for this user
                const { data, error: err } = await supabase
                    .from('licenses')
                    .select('*, product:product_id(title, download_link)')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (data && data.length > 0) {
                    setLicenses(data);
                    setStatus('success');
                } else {
                    // Maybe webhook hasn't fired yet? Retry in 2 seconds
                    setTimeout(fetchLicenses, 2500);
                }
            } catch (e) {
                console.error(e);
                setStatus('success');
            }
        };

        fetchLicenses();
    }, []);

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.successCard}>
                <div className={styles.icon}>✓</div>
                <h1 className={styles.title}>Payment Successful!</h1>
                <p className={styles.message}>
                    Your transaction was completed. {licenses.length > 0 ? "Your download links are ready below." : "We are preparing your download links..."}
                </p>

                {licenses.length > 0 ? (
                    <div className={styles.licenseGrid} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {licenses.map((lic, i) => (
                            <div key={i} style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.1)', padding: '1rem', borderRadius: '8px', textAlign: 'left' }}>
                                <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    {lic.license_tier} LICENSE
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#555', marginBottom: '1rem', fontFamily: 'monospace' }}>
                                    KEY: {lic.license_key}
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(`/api/products`);
                                            const data = await res.json();
                                            const product = data.products.find((p: any) => p._id === lic.product_id || p.slug === lic.product_id);
                                            const tier = product?.pricingTiers?.find((t: any) => t.name === lic.license_tier);
                                            const link = tier?.downloadLink || product?.downloadLink;
                                            if (link) window.open(link, '_blank');
                                            else alert('Download link not found. Please contact support.');
                                        } catch (e) {
                                            alert('Error fetching download link.');
                                        }
                                    }}
                                    className="btn-primary"
                                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                                >
                                    📥 DOWNLOAD TOOL
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.loadingSpinner} style={{ marginTop: '2rem', color: 'var(--muted)', fontSize: '0.8rem' }}>
                        ⏳ Syncing with global server... (this may take a few seconds)
                    </div>
                )}

                <div className={styles.actions} style={{ marginTop: '2rem' }}>
                    <Link href="/dashboard/licenses" className={`btn-primary ${styles.btn}`}>
                        Go to Dashboard
                    </Link>
                    <Link href="/" className={`btn-secondary ${styles.btn}`}>
                        Back Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
