'use client';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import TerminalLogger from '@/components/ui/TerminalLogger';
import SystemCoreMonitor from '@/components/ui/SystemCoreMonitor';
import RevenueChart from '@/components/ui/RevenueChart';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [auditLogs, setAuditLogs] = useState<string[]>([]);

    // Site Settings (Banner)
    const [settingsId, setSettingsId] = useState<string | null>(null);
    const [bannerActive, setBannerActive] = useState(false);
    const [bannerText, setBannerText] = useState('');
    const [razorpayHandle, setRazorpayHandle] = useState('');
    const [savingBanner, setSavingBanner] = useState(false);
    const [bannerMsg, setBannerMsg] = useState('');

    useEffect(() => {
        // Load Stats
        fetch('/api/admin/stats')
            .then(r => r.json())
            .then(data => { setStats(data); setLoading(false); })
            .catch(() => setLoading(false));

        // Load Audit Logs
        fetch('/api/admin/logs')
            .then(r => r.json())
            .then(data => {
                if (data.success && data.logs) {
                    setAuditLogs(data.logs.map((L: any) => `> ${new Date(L.created_at).toLocaleTimeString()} - ${L.action_type}: ${L.description}`));
                }
            })
            .catch(() => { });

        // Load Site Settings (Banner)
        fetch('/api/admin/sanity?type=siteSettings')
            .then(r => r.json())
            .then(data => {
                const settings = data.documents?.[0];
                if (settings) {
                    setSettingsId(settings._id);
                    setBannerActive(!!settings.bannerActive);
                    setBannerText(settings.bannerText || '');
                    setRazorpayHandle(settings.razorpayHandle || '');
                }
            })
            .catch(() => { });
    }, []);

    const handleSaveBanner = async () => {
        setSavingBanner(true); setBannerMsg('');
        const document = { _type: 'siteSettings', bannerActive, bannerText, razorpayHandle };
        const patch = { bannerActive, bannerText, razorpayHandle };

        try {
            const res = await fetch('/api/admin/sanity', {
                method: settingsId ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsId ? { id: settingsId, patch } : { document })
            });
            const data = await res.json();
            if (data.success) {
                setBannerMsg('✓ Banner updated live!');
                if (!settingsId && data.result?.results?.[0]?.id) {
                    setSettingsId(data.result.results[0].id);
                }

                // Add Audit Log
                fetch('/api/admin/logs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action_type: 'SITE_SETTINGS', description: `Global Banner updated` })
                }).catch(() => null);

                setTimeout(() => setBannerMsg(''), 3000);
            } else {
                setBannerMsg('⚠ Error saving banner');
            }
        } catch (err: any) {
            setBannerMsg('⚠ Network error');
        }
        setSavingBanner(false);
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Dashboard</h1>
                <p className={styles.pageSub}>Welcome back, Muthuraj. Here&apos;s your store overview.</p>
            </div>

            <div className={styles.statsGrid}>
                <StatCard label="Total Orders" value={loading ? '...' : (stats?.stats?.totalOrders ?? 0)} icon="📋" color="#f5a623" />
                <StatCard label="Total Revenue" value={loading ? '...' : `₹${(stats?.stats?.totalRevenue ?? 0).toFixed(0)}`} icon="💰" color="#4CAF50" />
                <StatCard label="Pending Reviews" value={loading ? '...' : (stats?.stats?.pendingReviews ?? 0)} icon="⭐" color="#2196F3" />
                <StatCard label="Active Licenses" value={loading ? '...' : (stats?.stats?.totalUsers ?? 0)} icon="🔑" color="#9C27B0" />
            </div>

            {/* --- Site Settings & Audits --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '2.5rem' }}>

                {/* Global Alert Banner Manager */}
                <div style={{ background: '#0a0a0c', border: '1px solid #222', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📢 Global Alert Banner
                    </h2>
                    <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                        Broadcast a pulsing neon banner across the top of all public pages instantly. Very useful for flash sales or new tool releases.
                    </p>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
                        <input type="checkbox" checked={bannerActive} onChange={e => setBannerActive(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                        <span style={{ color: bannerActive ? '#4CAF50' : '#888', fontWeight: 600 }}>Enable Banner</span>
                    </label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>Banner Text</label>
                        <input
                            value={bannerText}
                            onChange={e => setBannerText(e.target.value)}
                            placeholder="e.g. ⚡ FLASH SALE: 50% OFF PREMIUM PACK"
                            style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '0.6rem 1rem', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>Razorpay Dynamic Link</label>
                            <span style={{ fontSize: '0.6rem', color: 'var(--accent)', background: 'rgba(255,184,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>NEW FEAT</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #333', borderRadius: '4px' }}>
                            <span style={{ padding: '0 0.8rem', color: '#444', fontSize: '0.85rem', fontWeight: 700 }}>razorpay.me/@</span>
                            <input
                                value={razorpayHandle}
                                onChange={e => setRazorpayHandle(e.target.value.toLowerCase().trim())}
                                placeholder="muthurajecommerce"
                                style={{ flex: 1, background: 'none', border: 'none', color: '#fff', padding: '0.6rem 0.5rem', outline: 'none', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                            />
                        </div>
                        <p style={{ color: '#555', fontSize: '0.65rem', margin: '0 0 0.5rem 0' }}>
                            Links automatically append product price: <code>razorpay.me/@handle/<b>₹999</b></code>
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                        <button onClick={handleSaveBanner} disabled={savingBanner} style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>
                            {savingBanner ? 'Saving...' : 'Update Settings'}
                        </button>
                        {bannerMsg && <span style={{ color: bannerMsg.includes('✓') ? '#4CAF50' : '#ff5f56', fontSize: '0.85rem' }}>{bannerMsg}</span>}
                    </div>
                </div>

                {/* Animated Revenue Chart */}
                <div style={{ marginTop: '0' }}>
                    <RevenueChart initialData={stats?.timeline} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '2.5rem' }}>
                <div className={styles.recentSection} style={{ marginTop: 0 }}>
                    <h2 className={styles.sectionTitle}>Recent Orders</h2>
                    <div className={styles.table}>
                        <div className={`${styles.tableRow} ${styles.tableHead}`}>
                            <span>Order ID</span>
                            <span>Amount</span>
                            <span>Status</span>
                            <span>Date</span>
                        </div>
                        {loading ? (
                            <div className={styles.emptyState}>Loading...</div>
                        ) : stats?.recentOrders?.length === 0 ? (
                            <div className={styles.emptyState}>No orders yet. Orders will appear here after first purchase.</div>
                        ) : stats?.recentOrders?.map((o: any) => (
                            <div key={o.id} className={styles.tableRow}>
                                <span className={styles.mono}>{o.id?.slice(0, 8)}...</span>
                                <span>₹{o.amount}</span>
                                <span className={`${styles.badge} ${styles[`badge_${o.status}`]}`}>{o.status}</span>
                                <span className={styles.muted}>{new Date(o.created_at).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Audit Terminal */}
                <div style={{ marginTop: '0' }}>
                    <TerminalLogger logs={auditLogs.length > 0 ? auditLogs : stats?.recentOrders?.map((o: any) => `> ${new Date(o.created_at).toLocaleDateString()} - Payment Captured: ₹${o.amount} [${o.id}]`) || []} />
                </div>

                {/* System Core Health */}
                <div style={{ marginTop: '0' }}>
                    <SystemCoreMonitor />
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: any; icon: string; color: string }) {
    return (
        <div className={styles.statCard} style={{ borderTop: `2px solid ${color}` }}>
            <div className={styles.statIcon}>{icon}</div>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
        </div>
    );
}
