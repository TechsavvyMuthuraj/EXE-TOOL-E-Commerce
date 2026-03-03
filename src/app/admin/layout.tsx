'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './layout.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CommandPalette from '@/components/ui/CommandPalette';
import { ModalProvider } from '@/components/ui/PremiumModal';

const ADMIN_PASSWORD = 'admin2026@';

const navItems = [
    { href: '/admin', label: '⬛ Dashboard', exact: true },
    { href: '/admin/products', label: '📦 Products' },
    { href: '/admin/blogs', label: '✏️ Blog Posts' },
    { href: '/admin/tutorials', label: '📚 Tutorials' },
    { href: '/admin/coupons', label: '🏷️ Coupons' },
    { href: '/admin/email', label: '📧 Email Blast' },
    { href: '/admin/reviews', label: '⭐ Reviews' },
    { href: '/admin/users', label: '👥 Users' },
    { href: '/admin/licenses', label: '🔑 Licenses' },
    { href: '/admin/orders', label: '📋 Orders' },
    { href: '/admin/pay-links', label: '🔗 Payment Links' },
    { href: '/admin/videos', label: '🎥 Live Videos' },
];

function SidebarSocialBanner() {
    return (
        <div style={{
            margin: 'auto 1.5rem 0 1.5rem',
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.02) 100%)',
            border: '1px solid rgba(33, 150, 243, 0.2)',
            borderRadius: '6px',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            marginBottom: '1rem'
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '2px', height: '100%', background: '#2196F3', boxShadow: '0 0 10px #2196F3' }} />
            <h4 style={{ color: '#fff', fontSize: '0.75rem', fontFamily: 'var(--font-heading)', margin: '0 0 0.75rem 0', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.9rem' }}>📡</span> Social Intel
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888' }}>YOUTUBE</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>+1.2K <span style={{ color: '#4CAF50', fontSize: '0.6rem' }}>▲</span></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888' }}>TWITTER</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>8,450 <span style={{ color: '#4CAF50', fontSize: '0.6rem' }}>▲</span></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#888' }}>GITHUB</span>
                    <span style={{ color: '#2196F3', fontWeight: 600, textShadow: '0 0 5px rgba(33,150,243,0.5)' }}>ACTIVE</span>
                </div>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const stored = sessionStorage.getItem('admin_auth');
        if (stored === 'true') setAuthed(true);
        setChecking(false);
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('admin_auth', 'true');
            setAuthed(true);
        } else {
            setError('Invalid admin password.');
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin_auth');
        setAuthed(false);
    };

    if (checking) return null;

    if (!authed) {
        return (
            <div className={styles.loginPage}>
                <div className={styles.loginBox}>
                    <div className={styles.loginLogo}>EXE<span> TOOL</span></div>
                    <h2 className={styles.loginTitle}>Admin Access</h2>
                    <p className={styles.loginSub}>Restricted zone — enter admin password to continue</p>
                    <form onSubmit={handleLogin} className={styles.loginForm}>
                        <input
                            type="password"
                            placeholder="Admin password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.loginInput}
                            autoFocus
                        />
                        {error && <span className={styles.loginError}>{error}</span>}
                        <button type="submit" className={`btn-primary ${styles.loginBtn}`}>
                            Enter Admin Panel →
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <ModalProvider>
            <div className={styles.adminShell}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarLogo}>EXE<span> TOOL</span></div>
                    <div className={styles.sidebarLabel}>Admin Console</div>

                    {/* Admin Profile Block */}
                    <div className={styles.adminProfile}>
                        <div className={styles.adminAvatar}>M</div>
                        <div className={styles.adminInfo}>
                            <div className={styles.adminName}>Muthuraj C</div>
                            <div className={styles.adminRole}>Super Admin</div>
                        </div>
                    </div>

                    <nav className={styles.sidebarNav}>
                        {navItems.map(item => {
                            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`${styles.navItem} ${active ? styles.navActive : ''}`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <SidebarSocialBanner />

                    <div className={styles.sidebarFooter}>
                        <Link href="/" className={styles.viewSiteLink} target="_blank">↗ View Site</Link>
                        <button className={styles.logoutBtn} onClick={handleLogout}>Log Out</button>
                    </div>
                </aside>
                <main className={styles.adminMain}>
                    {children}
                </main>

                <CommandPalette />
            </div>
        </ModalProvider>
    );
}
