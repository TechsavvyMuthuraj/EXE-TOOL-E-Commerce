import Link from 'next/link';
import { sanityClient } from '@/lib/sanity';
import { slugify } from '@/lib/utils';
import styles from './page.module.css';

// Revalidate the page frequently or statically re-build
export const revalidate = 60; // 1 minute

async function getTutorials() {
    const query = `*[_type == "tutorial"] | order(_createdAt desc) {
        _id,
        title,
        "slug": slug.current,
        category,
        shortDescription,
        icon,
        image,
        "chapterCount": count(chapters)
    }`;
    return await sanityClient.fetch(query);
}

export default async function TutorialsPage() {
    const tutorials = await getTutorials();

    // Group tutorials by category if needed, or just list them all
    const categories: Record<string, any[]> = {};
    tutorials.forEach((t: any) => {
        const cat = t.category || 'Other Topics';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(t);
    });

    return (
        <div className="container" style={{ padding: '4rem 1.5rem', minHeight: '100vh', display: 'block', position: 'relative', zIndex: 10 }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative', zIndex: 2 }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Learning Center</h1>
                <p style={{ color: '#888', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', fontFamily: 'var(--font-body)' }}>
                    Master your tools and optimize your workflow with our comprehensive guided tutorials.
                </p>
            </div>

            {Object.keys(categories).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '4rem' }}>
                    Tutorials coming soon.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                    {Object.entries(categories).map(([cat, tuts]) => (
                        <div key={cat} style={{ position: 'relative', zIndex: 2 }}>
                            <h2 style={{ fontSize: '1.8rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem', marginBottom: '2rem', fontFamily: 'var(--font-orbitron)', letterSpacing: '1px', textTransform: 'uppercase', color: '#fff' }}>
                                {cat}
                            </h2>
                            <div className={styles.grid}>
                                {tuts.map((tut) => (
                                    <div key={tut._id} className={styles.card}>
                                        {tut.image ? (
                                            <div className={styles.cardImageContainer}>
                                                <img src={tut.image} alt={tut.title} className={styles.cardImage} />
                                            </div>
                                        ) : (
                                            <div className={styles.cardHeader}>
                                                <div className={`${styles.icon} ${styles[tut.icon || 'html']}`}>
                                                    {/* Fallback to text initials if icon class doesn't use pure logos */}
                                                    {(tut.icon === 'nextjs' ? 'N' :
                                                        tut.icon === 'tailwindcss' ? 'T' :
                                                            tut.icon === 'nodejs' ? 'Node' :
                                                                tut.icon === 'react' ? '⚛' :
                                                                    tut.icon === 'docker' ? '🐳' :
                                                                        tut.icon === 'python' ? '🐍' :
                                                                            tut.icon === 'git' ? 'G' :
                                                                                (tut.icon || '📚').slice(0, 2).toUpperCase())}
                                                </div>
                                            </div>
                                        )}
                                        <h3 className={styles.cardTitle} style={{ marginBottom: tut.image ? '1rem' : '0' }}>{tut.title}</h3>
                                        <p className={styles.cardDesc}>{tut.shortDescription}</p>
                                        <div className={styles.cardFooter}>
                                            <span className={styles.lessonCount}>{tut.chapterCount || 0} Lessons Available</span>
                                            <Link href={`/tutorials/${slugify(tut.title)}`} className={`${styles.shimmerBtn} ${styles.startBtn}`} style={{ textDecoration: 'none', display: 'flex', background: 'transparent', border: '1px solid #FFB800', color: '#FFB800' }}>
                                                Start Learning
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
