import { notFound } from 'next/navigation';
import Link from 'next/link';
import { sanityClient } from '@/lib/sanity';
import styles from '../page.module.css';

export const revalidate = 60;

import { slugify } from '@/lib/utils';

async function getTutorialOverview(tutorialSlug: string) {
    // 1. Try direct slug match (fast)
    let query = `*[_type == "tutorial" && slug.current == $tutorialSlug][0] {
        title, shortDescription, image, chapters[] { title, "slug": slug.current }
    }`;
    const direct = await sanityClient.fetch(query, { tutorialSlug });
    if (direct && direct.title) return direct;

    // 2. Fallback scan for title-slug match (robust for ampersands, spaces etc.)
    query = `*[_type == "tutorial"] { title, shortDescription, image, chapters[] { title, "slug": slug.current } }`;
    const all = await sanityClient.fetch(query);
    return all.find((t: any) => slugify(t.title) === tutorialSlug) || null;
}

export default async function TutorialOverviewPage({ params }: { params: { tutorialSlug: string } }) {
    const { tutorialSlug } = await params;
    const tutorial = await getTutorialOverview(tutorialSlug);

    if (!tutorial) {
        notFound();
    }

    const firstChapter = tutorial.chapters && tutorial.chapters.length > 0 ? tutorial.chapters[0] : null;

    // A helper to split the title nicely (like the HTML mockup)
    const renderTitle = (title: string) => {
        const words = title.split(' ');
        if (words.length <= 1) return <>{title}</>;

        // Simple heuristic: highlight the second word usually, or middle word, to match mockup style
        const highlightIndex = Math.min(1, words.length - 1);

        return (
            <>
                {words.map((w, i) => (
                    <span key={i} className={i === highlightIndex ? styles.pageTitleAccent : ''}>
                        {w}{' '}
                        {i === highlightIndex && <br />}
                    </span>
                ))}
            </>
        );
    };

    return (
        <>
            {tutorial.image && (
                <div className={styles.heroImageWrap}>
                    <img src={tutorial.image} alt={tutorial.title} className={styles.heroImage} />
                    <div className={styles.heroScanline}></div>
                    <div className={`${styles.heroCorner} ${styles.heroCornerTl}`}></div>
                    <div className={`${styles.heroCorner} ${styles.heroCornerTr}`}></div>
                    <div className={`${styles.heroCorner} ${styles.heroCornerBl}`}></div>
                    <div className={`${styles.heroCorner} ${styles.heroCornerBr}`}></div>
                </div>
            )}

            <h1 className={styles.pageTitle}>
                {renderTitle(tutorial.title)}
            </h1>

            <p className={styles.pageDesc}>
                {tutorial.shortDescription}
            </p>

            <div className={styles.card}>
                <div className={styles.cardLabel}>Mission Briefing</div>
                <h2 className={styles.cardTitle}>Get Started</h2>
                <p className={styles.cardBody}>
                    Welcome to the <strong style={{ color: 'var(--gold)' }}>{tutorial.title}</strong> tutorial series!
                    To begin your learning journey:
                </p>

                <div className={styles.steps}>
                    <div className={styles.step}>
                        <span className={styles.stepNum}>01</span>
                        <p className={styles.stepText}>Select a lesson from the course outline on the left sidebar.</p>
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNum}>02</span>
                        <p className={styles.stepText}>Read through the concepts, copy the code snippets, and try the practical examples.</p>
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNum}>03</span>
                        <p className={styles.stepText}>Use the navigation buttons at the bottom of each page to progress sequentially.</p>
                    </div>
                </div>

                {firstChapter ? (
                    <Link href={`/tutorials/${tutorialSlug}/${firstChapter.slug}`} className={styles.ctaBtn}>
                        Start Lesson 1: {firstChapter.title}
                        <span className={styles.ctaArrow}>→</span>
                    </Link>
                ) : (
                    <div style={{ padding: '1.5rem', background: 'rgba(244, 67, 54, 0.05)', color: '#f44336', borderRadius: '4px', border: '1px solid rgba(244, 67, 54, 0.2)' }}>
                        This tutorial has no chapters yet. Please check back later!
                    </div>
                )}
            </div>
        </>
    );
}
