'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

interface DashboardData {
    activeLicenses: number;
    totalOrders: number;
    wishlistItems: number;
    recentActivity: any[];
}

export default function DashboardOverview() {
    const [stats, setStats] = useState<DashboardData>({
        activeLicenses: 0,
        totalOrders: 0,
        wishlistItems: 0,
        recentActivity: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchDashboardData() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    if (isMounted) setIsLoading(false);
                    return;
                }
                const userId = session.user.id;

                // 1. Fetch Total Orders Count
                const { count: ordersCount } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);

                // 2. Fetch Wishlist Count
                const { count: wishlistCount } = await supabase
                    .from('wishlist')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);

                // 3. Fetch Active Licenses & Recent Activity
                const { data: licenseData } = await supabase
                    .from('licenses')
                    .select(`
                        id,
                        product:product_id(title),
                        license_tier,
                        created_at,
                        order_id
                    `)
                    .eq('user_id', userId);

                if (isMounted) {
                    let activeLicenses = 0;
                    let recentActivity: any[] = [];

                    if (licenseData) {
                        activeLicenses = licenseData.length;

                        // Sort by created_at descending
                        const sorted = [...licenseData].sort((a: any, b: any) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        );

                        recentActivity = sorted.slice(0, 3).map((item: any) => ({
                            id: item.id,
                            title: item.product?.title || 'Unknown Product',
                            tier: item.license_tier?.toUpperCase() || 'STANDARD',
                            date: new Date(item.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })
                        }));
                    }


                    setStats({
                        activeLicenses,
                        totalOrders: ordersCount || 0,
                        wishlistItems: wishlistCount || 0,
                        recentActivity
                    });
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Dashboard live sync failed:", err);
                if (isMounted) setIsLoading(false);
            }
        }

        // Initial fetch
        fetchDashboardData();

        // Setup real-time postgres subscriptions for this user's data
        const channel = supabase.channel('dashboard_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchDashboardData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist' }, () => {
                fetchDashboardData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'licenses' }, () => {
                fetchDashboardData();
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className={styles.dashboardView}>
            <header className={styles.pageHeader}>
                <h1>Dashboard System</h1>
                <p className={styles.lastLogin}>
                    {isLoading ? 'Establishing secure sync...' : `Live Sync Active • ${new Date().toLocaleTimeString()}`}
                </p>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3 className={styles.statLabel}>Active Licenses</h3>
                    <div className={styles.statValue}>{isLoading ? '-' : stats.activeLicenses}</div>
                </div>
                <div className={styles.statCard}>
                    <h3 className={styles.statLabel}>Total Orders</h3>
                    <div className={styles.statValue}>{isLoading ? '-' : stats.totalOrders}</div>
                </div>
                <div className={styles.statCard}>
                    <h3 className={styles.statLabel}>Wishlist Items</h3>
                    <div className={styles.statValue}>{isLoading ? '-' : stats.wishlistItems}</div>
                </div>
            </div>

            <div className={styles.recentSection}>
                <div className={styles.sectionHeader}>
                    <h2>Recent Activity</h2>
                    <Link href="/dashboard/licenses" className={styles.viewLink}>View Directory →</Link>
                </div>

                <div className={styles.activityList}>
                    {isLoading ? (
                        <div style={{ color: 'var(--muted)', padding: '1rem 0' }}>Decrypting system logs...</div>
                    ) : stats.recentActivity.length > 0 ? (
                        stats.recentActivity.map((activity: any) => (
                            <div key={activity.id} className={styles.activityItem}>
                                <div className={styles.activityIcon}>✓</div>
                                <div className={styles.activityContent}>
                                    <div className={styles.activityText}>
                                        {activity.title} <span className={styles.licenseBadge}>{activity.tier}</span>
                                    </div>
                                    <div className={styles.activityTime}>Purchased • {activity.date}</div>
                                </div>
                                <Link href="/dashboard/licenses" className={`btn-secondary ${styles.actionBtn}`}>Download</Link>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: 'var(--muted)', padding: '1rem 0' }}>No recent system activity detected.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
