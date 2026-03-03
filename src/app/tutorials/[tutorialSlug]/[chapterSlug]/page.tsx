import { notFound } from 'next/navigation';
import Link from 'next/link';
import { sanityClient } from '@/lib/sanity';
import PremiumBlogRenderer from '@/components/ui/PremiumBlogRenderer';
import styles from '../../page.module.css';

export const revalidate = 60;

// Tell Next.js which paths to pre-render
export async function generateStaticParams() {
    const query = `*[_type == "tutorial"] { "slug": slug.current, chapters[] { "slug": slug.current } }`;
    const tutorials = await sanityClient.fetch(query);
    const paths: any[] = [];
    tutorials.forEach((t: any) => {
        if (t.chapters) {
            t.chapters.forEach((c: any) => {
                paths.push({ tutorialSlug: t.slug, chapterSlug: c.slug });
            });
        }
    });
    return paths;
}

// Fetch the full tutorial to extract specific chapter and adjacent navigation
async function getTutorialData(tutorialSlug: string) {
    const query = `*[_type == "tutorial" && slug.current == $tutorialSlug][0] {
        chapters[] { title, content, "slug": slug.current }
    }`;
    return await sanityClient.fetch(query, { tutorialSlug });
}

export default async function ChapterPage({ params }: { params: { tutorialSlug: string, chapterSlug: string } }) {
    const { tutorialSlug, chapterSlug } = await params;
    const tutorial = await getTutorialData(tutorialSlug);

    if (!tutorial || !tutorial.chapters) {
        notFound();
    }

    // Find current chapter
    const currentIdx = tutorial.chapters.findIndex((c: any) => c.slug === chapterSlug);
    if (currentIdx === -1) notFound();

    const chapter = tutorial.chapters[currentIdx];
    const prevChapter = currentIdx > 0 ? tutorial.chapters[currentIdx - 1] : null;
    const nextChapter = currentIdx < tutorial.chapters.length - 1 ? tutorial.chapters[currentIdx + 1] : null;

    return (
        <div className={styles.contentArea} style={{ maxWidth: '1000px', fontSize: '1.1rem' }}>
            <div className={styles.overviewHeader} style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h1 className={styles.overviewTitle} style={{ fontSize: '3.5rem', marginBottom: '1rem', letterSpacing: '-1px' }}>{chapter.title}</h1>
            </div>

            <div style={{ lineHeight: '1.8', color: '#eaeaea' }}>
                {/* Our robust markdown renderer component (same used for blogs) */}
                <PremiumBlogRenderer content={chapter.content || ''} />
            </div>

            <div className={styles.navBar} style={{ marginTop: '5rem', padding: '3rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {prevChapter ? (
                    <Link href={`/tutorials/${tutorialSlug}/${prevChapter.slug}`} className={styles.navBtn} style={{ padding: '0.8rem 1.5rem' }}>
                        <span style={{ color: '#888', marginRight: '0.5rem' }}>← Previous:</span> {prevChapter.title}
                    </Link>
                ) : (
                    <Link href={`/tutorials/${tutorialSlug}`} className={styles.navBtn} style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: '#888', padding: '0.8rem 1.5rem' }}>
                        ← Course Overview
                    </Link>
                )}

                {nextChapter ? (
                    <Link href={`/tutorials/${tutorialSlug}/${nextChapter.slug}`} className={styles.navBtn} style={{ padding: '0.8rem 1.5rem' }}>
                        <span style={{ color: '#888', marginRight: '0.5rem' }}>Next:</span> {nextChapter.title} →
                    </Link>
                ) : (
                    <div style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '1rem', background: 'rgba(245, 166, 35, 0.1)', padding: '0.8rem 1.5rem', borderRadius: '6px' }}>
                        Course Completed! 🎉
                    </div>
                )}
            </div>
        </div>
    );
}
