'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function LicensesPage() {
    const [licenses, setLicenses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchLicenses() {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // Fetch real licenses
                    const { data: dbLicenses, error } = await supabase
                        .from('licenses')
                        .select(`
                            id,
                            product_id,
                            license_tier,
                            created_at
                        `)
                        .eq('user_id', session.user.id);

                    if (error) throw error;

                    if (dbLicenses && isMounted) {
                        // Fetch Sanity products to get real names & download links
                        const res = await fetch('/api/products');
                        const sanityData = await res.json();
                        const sanityProducts = sanityData.products || [];

                        // Sort descending
                        const sortedData = dbLicenses.sort((a, b) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        );

                        const mappedLicenses = sortedData.map((item) => {
                            const match = sanityProducts.find((p: any) => p._id === item.product_id);

                            // Find the correct tier to grab the real secure download link
                            let downloadUrl = '';
                            if (match && match.pricingTiers) {
                                const tierMatch = match.pricingTiers.find((t: any) => t.name?.toLowerCase() === item.license_tier?.toLowerCase());
                                if (tierMatch) downloadUrl = tierMatch.downloadLink;
                            }

                            return {
                                id: `LIC-${item.id.split('-')[0].toUpperCase()}`,
                                rawId: item.id,
                                productTitle: match?.title || 'Unknown Product',
                                tier: item.license_tier?.toUpperCase() || 'STANDARD',
                                issueDate: new Date(item.created_at).toISOString().split('T')[0],
                                expires: 'Never',
                                downloadUrl: downloadUrl || '#'
                            };
                        });
                        setLicenses(mappedLicenses);
                    }
                }
            } catch (err) {
                console.error("Supabase license fetch failed:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchLicenses();

        const channel = supabase.channel('licenses_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'licenses' }, () => {
                fetchLicenses();
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, []);

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDownload = (id: string, downloadUrl: string) => {
        // If there is an actual downloadUrl set by admin, route them straight to it (e.g. Google Drive / S3 vault).
        if (downloadUrl && downloadUrl !== '#') {
            window.open(downloadUrl, '_blank');
            return;
        }

        setDownloadingId(id);
        setTimeout(() => {
            const license = licenses.find(l => l.id === id);
            const content = `LICENSE KEY: ${id}\nPRODUCT: ${license?.productTitle}\nTIER: ${license?.tier}\n\nWARNING: Contact admin, valid download link missing from database for this specific tier.`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${license?.productTitle?.replace(/\s+/g, '-').toLowerCase()}-recovery.txt`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setDownloadingId(null);
        }, 1500);
    };

    return (
        <div className={styles.licensesView}>
            <header className={styles.pageHeader}>
                <h1>My Licenses</h1>
                <p className={styles.subtitle}>Active software keys and secure downloads.</p>
            </header>

            <div className={styles.licensesGrid}>
                {isLoading ? (
                    <div style={{ color: 'var(--muted)', padding: '2rem' }}>Decrypting active license keys...</div>
                ) : licenses.length === 0 ? (
                    <div style={{ color: 'var(--muted)', padding: '2rem' }}>No active licenses found.</div>
                ) : (
                    licenses.map(license => (
                        <div key={license.id} className={styles.licenseCard}>
                            <div className={styles.licenseHeader}>
                                <h3 className={styles.productTitle}>{license.productTitle}</h3>
                                <span className={styles.tierBadge}>{license.tier}</span>
                            </div>

                            <div className={styles.keyBox}>
                                <div className={styles.keyLabel}>License Key</div>
                                <div className={styles.keyRow}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={license.rawId}
                                        className={`pricing-code ${styles.keyInput}`}
                                    />
                                    <button
                                        className={`btn-secondary ${styles.copyBtn}`}
                                        onClick={() => handleCopy(license.rawId)}
                                    >
                                        {copiedId === license.rawId ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.metaInfo}>
                                <div className={styles.metaCol}>
                                    <span>Issued</span>
                                    <span>{license.issueDate}</span>
                                </div>
                                <div className={styles.metaCol}>
                                    <span>Expires</span>
                                    <span>{license.expires}</span>
                                </div>
                            </div>

                            <button
                                className={`btn-primary ${styles.downloadBtn}`}
                                onClick={() => handleDownload(license.id, license.downloadUrl)}
                                disabled={downloadingId === license.id}
                            >
                                <span className={styles.dlIcon}>↓</span>
                                {downloadingId === license.id ? 'Generating Secure Link...' : (license.downloadUrl && license.downloadUrl !== '#' ? 'Access Download' : 'Missing Link (Fallback)')}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
