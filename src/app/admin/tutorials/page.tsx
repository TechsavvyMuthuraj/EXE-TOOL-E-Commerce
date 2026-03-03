'use client';
import { useState, useEffect, useRef } from 'react';
import styles from '../page.module.css';
import PremiumBlogRenderer from '@/components/ui/PremiumBlogRenderer';
import { useModal } from '@/components/ui/PremiumModal';

interface Chapter {
    title: string;
    slug: { current: string };
    content: string;
}

interface TutorialDoc {
    _id: string;
    title: string;
    slug?: { current: string };
    category?: string;
    shortDescription?: string;
    icon?: string;
    image?: string;
    _createdAt: string;
    chapters?: Chapter[];
}

const EMPTY_CHAPTER: Chapter = { title: '', slug: { current: '' }, content: '' };
const EMPTY_FORM = {
    title: '', slug: '', category: 'Web Development', shortDescription: '', icon: '', image: ''
};

const CATEGORIES = [
    'Web Development', 'Frameworks & Libraries', 'Programming Languages',
    'Backend & Database', 'DevOps & Tooling', 'Design & UI/UX', 'Data Science',
    'Windows Optimize', 'Windows Tips'
];

const ICONS = [
    { value: '', label: 'None (No Icon)' },
    { value: 'html', label: 'HTML5' }, { value: 'css', label: 'CSS3' },
    { value: 'javascript', label: 'JavaScript' }, { value: 'typescript', label: 'TypeScript' },
    { value: 'react', label: 'React' }, { value: 'nextjs', label: 'Next.js' },
    { value: 'tailwindcss', label: 'Tailwind CSS' }, { value: 'nodejs', label: 'Node.js' },
    { value: 'python', label: 'Python' }, { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' }, { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' }, { value: 'rust', label: 'Rust' },
    { value: 'git', label: 'Git & GitHub' }, { value: 'docker', label: 'Docker' },
    { value: 'figma', label: 'Figma' }
];

export default function AdminTutorialsPage() {
    const [docs, setDocs] = useState<TutorialDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [activeChapterIdx, setActiveChapterIdx] = useState<number | null>(null);
    const [chapterTab, setChapterTab] = useState<'write' | 'preview' | 'split'>('split');

    // Image Upload State
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [coverPreview, setCoverPreview] = useState('');
    const [uploadingCover, setUploadingCover] = useState(false);
    const coverFileRef = useRef<HTMLInputElement>(null);

    const [uploadingChapterImg, setUploadingChapterImg] = useState(false);
    const chapterImgFileRef = useRef<HTMLInputElement>(null);

    const { confirm } = useModal();

    const f = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [key]: e.target.value }));

    const loadDocs = () => {
        setLoading(true);
        fetch('/api/admin/sanity?type=tutorial')
            .then(r => r.json())
            .then(d => { setDocs(d.documents || []); setLoading(false); });
    };
    useEffect(() => { loadDocs(); }, []);

    /* ── Chapters Management ── */
    const addChapter = () => {
        setChapters(p => [...p, { ...EMPTY_CHAPTER }]);
        setActiveChapterIdx(chapters.length);
        setChapterTab('split');
    };

    const updateActiveChapter = (key: keyof Chapter, value: any) => {
        if (activeChapterIdx === null) return;
        setChapters(p => {
            const newChaps = [...p];
            if (key === 'slug') {
                newChaps[activeChapterIdx].slug = { current: value };
            } else {
                newChaps[activeChapterIdx] = { ...newChaps[activeChapterIdx], [key]: value };
            }
            return newChaps;
        });
    };

    const removeChapter = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setChapters(p => p.filter((_, i) => i !== idx));
        if (activeChapterIdx === idx) setActiveChapterIdx(null);
        else if (activeChapterIdx !== null && activeChapterIdx > idx) setActiveChapterIdx(activeChapterIdx - 1);
    };

    // Auto-generate slug for chapter if missing when blurring title
    const handleChapterTitleBlur = () => {
        if (activeChapterIdx !== null && !chapters[activeChapterIdx].slug.current && chapters[activeChapterIdx].title) {
            updateActiveChapter('slug', chapters[activeChapterIdx].title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        }
    };

    /* ── Image Uploads ──────────────────── */
    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCover(true);
        setMsg('');
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.url) {
                setCoverImageUrl(data.url);
                setCoverPreview(data.url);
                setMsg('✓ Cover image uploaded!');
            } else {
                setMsg('⚠ Upload failed: ' + (data.error || 'Unknown'));
            }
        } catch (err: any) {
            setMsg('⚠ Network error: ' + err.message);
        }
        setUploadingCover(false);
    };

    const handleChapterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || activeChapterIdx === null) return;
        setUploadingChapterImg(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.url) {
                const imgMarkdown = `\n![${file.name.split('.')[0]}](${data.url})\n`;
                const currentContent = chapters[activeChapterIdx].content || '';
                updateActiveChapter('content', currentContent + imgMarkdown);
                setMsg('✓ Image inserted into chapter!');
            } else {
                setMsg('⚠ Image upload failed: ' + (data.error || 'Unknown'));
            }
        } catch (err: any) {
            setMsg('⚠ Network error: ' + err.message);
        }
        setUploadingChapterImg(false);
        if (chapterImgFileRef.current) chapterImgFileRef.current.value = '';
    };

    /* ── Save ─────────────────────────── */
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setMsg('');
        const baseSlug = form.slug || form.title.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        // Ensure all chapters have current slugs
        const cleanChapters = chapters.map(c => ({
            ...c,
            slug: { _type: 'slug', current: c.slug?.current || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
        }));

        const doc: any = {
            _type: 'tutorial',
            title: form.title,
            slug: { _type: 'slug', current: baseSlug },
            category: form.category,
            shortDescription: form.shortDescription,
            icon: form.icon,
            chapters: cleanChapters
        };
        if (coverImageUrl) doc.image = coverImageUrl;

        const isEdit = !!editId;
        const res = await fetch('/api/admin/sanity', {
            method: isEdit ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(isEdit ? { id: editId, patch: doc } : { document: doc })
        });
        const data = await res.json();
        if (data.success) {
            setMsg(`✓ Tutorial ${isEdit ? 'updated' : 'published'}!`);
            resetForm();
            loadDocs();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setMsg('Error: ' + JSON.stringify(data.error));
        }
        setSaving(false);
    };

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
        setChapters([]);
        setActiveChapterIdx(null);
        setEditId(null);
        setCoverImageUrl(''); setCoverPreview('');
        setMsg('');
    };

    const handleEdit = (doc: TutorialDoc) => {
        setEditId(doc._id);
        setForm({
            title: doc.title || '',
            slug: doc.slug?.current || '',
            category: doc.category || 'Web Development',
            shortDescription: doc.shortDescription || '',
            icon: doc.icon || 'html',
            image: doc.image || ''
        });
        setCoverImageUrl(doc.image || '');
        setCoverPreview(doc.image || '');
        setChapters(doc.chapters || []);
        setActiveChapterIdx(doc.chapters && doc.chapters.length > 0 ? 0 : null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        confirm({
            title: 'Delete Tutorial?',
            message: 'This will permanently remove the entire tutorial and all its chapters. This cannot be undone.',
            confirmLabel: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
                await fetch('/api/admin/sanity', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
                loadDocs();
            }
        });
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Tutorials</h1>
                <p className={styles.pageSub}>Create complete courses with nested chapters. Courses appear at /tutorials.</p>
            </div>

            <div className={styles.formCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 className={styles.formTitle} style={{ margin: 0 }}>{editId ? '✏️ Edit Tutorial Course' : '📚 New Tutorial Course'}</h2>
                </div>

                <form onSubmit={handleSave}>
                    <div className={styles.fieldset}>

                        {/* ── Tutorial Core Details ── */}
                        <div className={styles.fieldRow}>
                            <div className={styles.field} style={{ flex: 2 }}>
                                <label>Course Title *</label>
                                <input required value={form.title} onChange={f('title')} placeholder="e.g. Next.js Masterclass" />
                            </div>
                            <div className={styles.field} style={{ flex: 1 }}>
                                <label>Slug (auto-generated)</label>
                                <input value={form.slug} onChange={f('slug')} placeholder="nextjs-masterclass" />
                            </div>
                        </div>

                        <div className={styles.fieldRow}>
                            <div className={styles.field}>
                                <label>Category</label>
                                <select value={form.category} onChange={f('category')}>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label>Course Icon</label>
                                <select value={form.icon} onChange={f('icon')}>
                                    {ICONS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label>Short Description *</label>
                            <textarea required value={form.shortDescription} onChange={f('shortDescription')} placeholder="Summarize what this course covers..." style={{ minHeight: '60px' }} />
                        </div>

                        {/* ── Cover Image Upload ── */}
                        <div className={styles.field}>
                            <label>Course Cover Image</label>
                            <div style={{ border: '2px dashed #2a2a2a', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: 'pointer', transition: 'border-color 0.2s', background: '#0a0a0c', borderRadius: '8px' }}
                                onClick={() => coverFileRef.current?.click()}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                            >
                                <input ref={coverFileRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
                                {coverPreview ? (
                                    <img src={coverPreview} alt="Cover preview" style={{ height: '80px', width: '140px', objectFit: 'cover', border: '1px solid #2a2a2a', borderRadius: '4px' }} />
                                ) : (
                                    <div style={{ width: '140px', height: '80px', background: '#111', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '0.75rem', borderRadius: '4px' }}>
                                        No image
                                    </div>
                                )}
                                <div>
                                    <div style={{ color: uploadingCover ? 'var(--accent)' : '#888', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                                        {uploadingCover ? '⏳ Uploading...' : '📷 Click to upload cover image'}
                                    </div>
                                    <div style={{ color: '#444', fontSize: '0.72rem' }}>PNG, JPG, WEBP — shown on the tutorials directory</div>
                                    {coverImageUrl && <div style={{ color: '#4CAF50', fontSize: '0.72rem', marginTop: '0.3rem' }}>✓ Uploaded: {coverImageUrl.slice(0, 50)}...</div>}
                                </div>
                            </div>
                        </div>

                        {/* ── Chapters Manager ── */}
                        <div className={styles.field} style={{ background: '#080808', border: '1px solid #1a1a1a', padding: '1.25rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label style={{ margin: 0 }}>Course Chapters ({chapters.length})</label>
                                <button type="button" onClick={addChapter} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>+ Add Chapter</button>
                            </div>

                            {chapters.length === 0 ? (
                                <div style={{ color: '#666', fontSize: '0.85rem', padding: '1rem', border: '1px dashed #333', textAlign: 'center' }}>
                                    No chapters added yet. A tutorial needs at least one chapter to be viewed.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 3fr', gap: '1.5rem', alignItems: 'start' }}>

                                    {/* Sidebar: Chapter List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderRight: '1px solid #222', paddingRight: '1rem' }}>
                                        {chapters.map((chap, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setActiveChapterIdx(i)}
                                                style={{
                                                    padding: '0.6rem 1rem',
                                                    background: activeChapterIdx === i ? 'rgba(245, 166, 35, 0.1)' : '#111',
                                                    border: `1px solid ${activeChapterIdx === i ? 'var(--accent)' : '#2a2a2a'}`,
                                                    cursor: 'pointer',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    borderRadius: '4px', borderLeft: activeChapterIdx === i ? '3px solid var(--accent)' : 'none'
                                                }}
                                            >
                                                <span style={{ fontSize: '0.85rem', color: activeChapterIdx === i ? '#fff' : '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {i + 1}. {chap.title || 'Untitled Chapter'}
                                                </span>
                                                <span onClick={(e) => removeChapter(i, e)} style={{ color: '#f44336', cursor: 'pointer', padding: '0 0.3rem' }}>✕</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Main: Chapter Editor */}
                                    {activeChapterIdx !== null && chapters[activeChapterIdx] && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div className={styles.fieldRow}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.75rem' }}>Chapter Title</label>
                                                    <input
                                                        value={chapters[activeChapterIdx].title}
                                                        onChange={e => updateActiveChapter('title', e.target.value)}
                                                        onBlur={handleChapterTitleBlur}
                                                        placeholder="e.g. Introduction to Variables"
                                                        style={{ background: '#0a0a0c', margin: 0 }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.75rem' }}>Chapter Slug</label>
                                                    <input
                                                        value={chapters[activeChapterIdx].slug?.current || ''}
                                                        onChange={e => updateActiveChapter('slug', e.target.value)}
                                                        placeholder="introduction-to-variables"
                                                        style={{ background: '#0a0a0c', margin: 0 }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                    <button type="button" onClick={() => setChapterTab('write')} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', background: chapterTab === 'write' ? '#222' : 'transparent', color: chapterTab === 'write' ? '#fff' : '#888' }}>Write</button>
                                                    <button type="button" onClick={() => setChapterTab('preview')} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', background: chapterTab === 'preview' ? '#222' : 'transparent', color: chapterTab === 'preview' ? '#fff' : '#888' }}>Preview</button>
                                                    <button type="button" onClick={() => setChapterTab('split')} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', background: chapterTab === 'split' ? '#222' : 'transparent', color: chapterTab === 'split' ? '#fff' : '#888' }}>Split View</button>

                                                    {/* Markdown Inserters */}
                                                    {(chapterTab === 'write' || chapterTab === 'split') && (
                                                        <>
                                                            <div style={{ width: '1px', height: '15px', background: '#333', margin: '0 0.5rem' }}></div>
                                                            <button type="button" onClick={() => updateActiveChapter('content', (chapters[activeChapterIdx].content || '') + '\n\n## Section Heading\n\n')} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderColor: '#333' }}>H2</button>
                                                            <button type="button" onClick={() => updateActiveChapter('content', (chapters[activeChapterIdx].content || '') + '\n\n### Sub Heading\n\n')} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderColor: '#333' }}>H3</button>
                                                            <button type="button" onClick={() => updateActiveChapter('content', (chapters[activeChapterIdx].content || '') + '\n\n```javascript\n// Your code here\n```\n\n')} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderColor: '#333' }}>&lt;/&gt;</button>
                                                            <button type="button" onClick={() => updateActiveChapter('content', (chapters[activeChapterIdx].content || '') + '\n\n> **Tip:** Important information here.\n\n')} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderColor: '#333' }}>💡 Quote</button>
                                                            <button type="button" onClick={() => updateActiveChapter('content', (chapters[activeChapterIdx].content || '') + ' [Link Text](https://...) ')} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderColor: '#333' }}>🔗 Link</button>

                                                            <div style={{ flex: 1 }}></div>

                                                            <input ref={chapterImgFileRef} type="file" accept="image/*" onChange={handleChapterImageUpload} style={{ display: 'none' }} />
                                                            <button
                                                                type="button"
                                                                onClick={() => chapterImgFileRef.current?.click()}
                                                                className="btn-secondary"
                                                                style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', borderColor: '#333' }}
                                                                disabled={uploadingChapterImg}
                                                            >
                                                                {uploadingChapterImg ? '⏳ Uploading...' : '📷 Insert Image'}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>

                                                {chapterTab === 'write' ? (
                                                    <textarea
                                                        value={chapters[activeChapterIdx].content}
                                                        onChange={e => updateActiveChapter('content', e.target.value)}
                                                        placeholder="Markdown content for this chapter..."
                                                        style={{ minHeight: '300px', width: '100%', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6', background: '#0a0a0c', margin: 0 }}
                                                    />
                                                ) : chapterTab === 'preview' ? (
                                                    <div style={{ minHeight: '300px', background: '#0a0a0c', border: '1px solid #2a2a2a', padding: '1.5rem', overflowY: 'auto' }}>
                                                        <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '1rem' }}>{chapters[activeChapterIdx].title || 'Untitled Chapter'}</h2>
                                                        <PremiumBlogRenderer content={chapters[activeChapterIdx].content || '*No content yet.*'} />
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', height: '600px' }}>
                                                        <textarea
                                                            value={chapters[activeChapterIdx].content}
                                                            onChange={e => updateActiveChapter('content', e.target.value)}
                                                            placeholder="Markdown content for this chapter..."
                                                            style={{ height: '100%', width: '100%', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.6', background: '#0a0a0c', margin: 0, resize: 'none' }}
                                                        />
                                                        <div style={{ height: '100%', background: '#0a0a0c', border: '1px solid #2a2a2a', padding: '1.5rem', overflowY: 'auto', borderRadius: '8px' }}>
                                                            <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '1rem' }}>{chapters[activeChapterIdx].title || 'Untitled Chapter'}</h2>
                                                            <PremiumBlogRenderer content={chapters[activeChapterIdx].content || '*No content yet.*'} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {msg && <div className={msg.startsWith('✓') ? styles.successMsg : styles.errorMsg}>{msg}</div>}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className={`btn-primary ${styles.saveBtn}`} disabled={saving || chapters.length === 0} style={{ margin: 0 }}>
                                {saving ? 'Saving...' : (editId ? '✓ Update Tutorial' : '↑ Publish Tutorial')}
                            </button>
                            {editId && (
                                <button type="button" className="btn-secondary" onClick={resetForm}>Cancel Edit</button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Published Tutorials Table */}
            <div style={{ marginTop: '3rem' }}>
                <div className={styles.toolbarRow}>
                    <h2 className={styles.sectionTitle}>Published Courses ({docs.length})</h2>
                    <button className="btn-secondary" onClick={loadDocs} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>Refresh</button>
                </div>
                {loading ? (
                    <div className={styles.emptyState}>Loading from Sanity...</div>
                ) : docs.length === 0 ? (
                    <div className={styles.emptyState}>No tutorials yet.</div>
                ) : (
                    <div className={styles.table}>
                        <div className={`${styles.tableRow} ${styles.tableHead} ${styles.docRow}`}>
                            <span>Title</span><span>Category</span><span>Chapters</span><span>Slug</span><span>Actions</span>
                        </div>
                        {docs.map(doc => (
                            <div key={doc._id} className={`${styles.tableRow} ${styles.docRow}`}>
                                <span>{doc.title}</span>
                                <span className={styles.muted}>{doc.category}</span>
                                <span className={styles.muted}>{doc.chapters?.length || 0} chapters</span>
                                <span className={styles.mono}>{doc.slug?.current}</span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button className={styles.approveBtn} onClick={() => handleEdit(doc)}>Edit</button>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(doc._id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
