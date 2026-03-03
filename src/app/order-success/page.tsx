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
        let isMounted = true;
        let retryCount = 0;
        const MAX_RETRIES = 10; // Max 25 seconds of polling
        let channel: any;

        const fetchLicenses = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                if (isMounted) setStatus('success');
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
                    if (isMounted) {
                        setLicenses(data);
                        setStatus('success');
                    }
                } else if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    setTimeout(() => { if (isMounted) fetchLicenses(); }, 2500);
                } else {
                    if (isMounted) setStatus('success'); // Stop polling after max retries
                }
            } catch (e) {
                console.error(e);
                if (isMounted) setStatus('success');
            }
        };

        // 1. Initial Fetch Attempt
        fetchLicenses();

        // 2. Setup Realtime Listener
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                channel = supabase.channel('order_success_realtime')
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'licenses',
                        filter: `user_id=eq.${session.user.id}`
                    }, () => {
                        fetchLicenses();
                    })
                    .subscribe();
            }
        });

        return () => {
            isMounted = false;
            if (channel) supabase.removeChannel(channel);
        };
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
