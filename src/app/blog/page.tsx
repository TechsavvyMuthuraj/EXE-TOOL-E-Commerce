'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    readTime: string;
    publishedAt: string;
    _createdAt: string;
    coverImage?: string;
}

// Fallback static posts (shown when Sanity has no posts yet)
const FALLBACK_POSTS: BlogPost[] = [
    {
        _id: 'f1',
        slug: 'how-to-speed-up-windows-11',
        title: 'How to Speed Up Windows 11 in 10 Steps',
        excerpt: 'Windows 11 ships with a lot of background services that eat RAM and CPU. Here are 10 battle-tested tweaks to reclaim performance.',
        date: 'February 28, 2026',
        category: 'Windows Tips',
        readTime: '5 min read',
        publishedAt: '2026-02-28',
        _createdAt: '2026-02-28',
    } as any,
    {
        _id: 'f2',
        slug: 'debloat-windows-the-right-way',
        title: 'Debloat Windows — The Right Way',
        excerpt: 'Removing the wrong apps can break Windows Update. This guide shows you which apps are safe to remove and which to leave alone.',
        date: 'February 20, 2026',
        category: 'Optimization Guides',
        readTime: '8 min read',
        publishedAt: '2026-02-20',
        _createdAt: '2026-02-20',
    } as any,
    {
        _id: 'f3',
        slug: 'windows-gaming-performance-guide',
        title: 'The Ultimate Windows Gaming Performance Guide',
        excerpt: 'From BIOS settings to GPU driver tweaks — everything you need to squeeze out those extra frames.',
        date: 'February 10, 2026',
        category: 'Gaming Performance',
        readTime: '12 min read',
        publishedAt: '2026-02-10',
        _createdAt: '2026-02-10',
    } as any,
];

function formatDate(dateStr: string) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
}

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [usingFallback, setUsingFallback] = useState(false);

    const fetchPosts = useCallback(async () => {
        try {
            const res = await fetch('/api/blog', { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setPosts(data.posts || []);
            setUsingFallback(false);
        } catch {
            setPosts(FALLBACK_POSTS);
            setUsingFallback(true);
        } finally {
            setLoading(false);
            setLastRefresh(new Date());
        }
    }, []);

    useEffect(() => {
        fetchPosts();
        // Poll every 30 seconds for real-time admin sync
        const interval = setInterval(fetchPosts, 30_000);
        return () => clearInterval(interval);
    }, [fetchPosts]);

    return (
        <div className={`container ${styles.page}`}>
            <div className={styles.header}>
                <div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {!usingFallback && !loading && (
                        <div style={{ color: 'var(--accent)', fontSize: '0.75rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>
                            ● {posts.length} post{posts.length !== 1 ? 's' : ''} from Sanity CMS
                        </div>
                    )}
                    {usingFallback && !loading && (
                        <div style={{ color: '#555', fontSize: '0.7rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>
                            Showing sample posts — publish from Admin → Blog Posts
                        </div>
                    )}
                    <div style={{ color: '#333', fontSize: '0.65rem', fontFamily: 'var(--font-heading)' }}>
                        Synced {lastRefresh.toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className={styles.postsList} style={{ color: 'var(--muted)', padding: '3rem 0' }}>
                    ⏳ Loading articles...
                </div>
            ) : posts.length === 0 ? (
                <div className={styles.postsList} style={{ color: 'var(--muted)', padding: '3rem 0' }}>
                    No blog posts published yet.
                </div>
            ) : (
                <div className={styles.postsList}>
                    {posts.map(post => (
                        <Link
                            href={`/blog/${post.slug || post._id}`}
                            key={post._id}
                            className={styles.postCard}
                        >
                            <article>
                                {post.coverImage && (
                                    <div style={{ height: '180px', background: `url(${post.coverImage}) center/cover`, marginBottom: '1.5rem', border: '1px solid #1e1e1e' }} />
                                )}
                                <div className={styles.meta}>
                                    <span className={styles.category}>{post.category}</span>
                                    <span className={styles.separator}>•</span>
                                    <span className={styles.date}>{formatDate(post.publishedAt || post._createdAt)}</span>
                                    {post.readTime && (
                                        <>
                                            <span className={styles.separator}>•</span>
                                            <span className={styles.readTime}>{post.readTime}</span>
                                        </>
                                    )}
                                </div>
                                <h2 className={styles.title}>{post.title}</h2>
                                <p className={styles.excerpt}>{post.excerpt}</p>
                                <div className={styles.readMore}>Read Article <span>→</span></div>
                            </article>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
