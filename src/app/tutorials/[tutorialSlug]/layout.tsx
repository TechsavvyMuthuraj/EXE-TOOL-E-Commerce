import { notFound } from 'next/navigation';
import Link from 'next/link';
import { sanityClient } from '@/lib/sanity';
import styles from '../page.module.css';

export const revalidate = 60;

export async function generateStaticParams() {
    const query = `*[_type == "tutorial"] { "slug": slug.current }`;
    const tutorials = await sanityClient.fetch(query);
    return tutorials.map((t: any) => ({ tutorialSlug: t.slug }));
}

import { slugify } from '@/lib/utils';

async function getTutorialDetails(tutorialSlug: string) {
    // 1. Try direct slug match first (fast)
    const query = `*[_type == "tutorial" && slug.current == $tutorialSlug][0] {
        title,
        chapters[] { title, "slug": slug.current }
    }`;
    const direct = await sanityClient.fetch(query, { tutorialSlug });
    if (direct) return (direct.title ? direct : null); // Ensure it's found

    // 2. Fallback: Scan all for a title-slug match (robust for dirty data)
    const allQuery = `*[_type == "tutorial"] { title, chapters[] { title, "slug": slug.current } }`;
    const all = await sanityClient.fetch(allQuery);
    return all.find((t: any) => slugify(t.title) === tutorialSlug) || null;
}

export default async function TutorialShellLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ tutorialSlug: string }>;
}) {
    const { tutorialSlug } = await params;
    const tutorial = await getTutorialDetails(tutorialSlug);

    if (!tutorial) {
        notFound();
    }

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarTitle}>Course Outline</div>

                <nav>
                    {tutorial.chapters?.map((chap: any, idx: number) => (
                        <Link
                            key={chap.slug}
                            href={`/tutorials/${tutorialSlug}/${chap.slug}`}
                            className={styles.sidebarItem}
                        >
                            <span className={styles.sidebarNum}>
                                {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            {chap.title}
                        </Link>
                    ))}
                </nav>
            </aside>

            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
