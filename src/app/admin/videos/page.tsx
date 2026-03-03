'use client';
import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { useModal } from '@/components/ui/PremiumModal';

interface LiveVideoDoc {
    _id: string;
    title: string;
    slug?: { current: string };
    videoUrl?: string;
    description?: string;
    status: string;
    streamDate?: string;
    category?: string;
    _createdAt: string;
}

const EMPTY_FORM = {
    title: '',
    slug: '',
    videoUrl: '',
    description: '',
    status: 'Upcoming',
    streamDate: '',
    category: 'Web Development'
};

const STATUS_OPTIONS = ['Live Now', 'Upcoming', 'Recorded (VOD)'];
const CATEGORIES = ['Web Development', 'Hardware Config', 'Q&A Session', 'Other'];

export default function AdminLiveVideosPage() {
    const [videos, setVideos] = useState<LiveVideoDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    const { confirm } = useModal();

    const f = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [key]: e.target.value }));

    const loadVideos = () => {
        setLoading(true);
        fetch('/api/admin/sanity?type=liveVideo')
            .then(r => r.json())
            .then(d => { setVideos(d.documents || []); setLoading(false); });
    };

    useEffect(() => { loadVideos(); }, []);

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
        setEditId(null);
        setMsg('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setMsg('');
        const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        const doc: any = {
            _type: 'liveVideo',
            title: form.title,
            slug: { _type: 'slug', current: slug },
            videoUrl: form.videoUrl,
            description: form.description,
            status: form.status,
            category: form.category,
        };

        if (form.streamDate) {
            doc.streamDate = new Date(form.streamDate).toISOString();
        }

        const isEdit = !!editId;
        const res = await fetch('/api/admin/sanity', {
            method: isEdit ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(isEdit ? { id: editId, patch: doc } : { document: doc })
        });
        const data = await res.json();

        if (data.success) {
            setMsg(`✓ Video ${isEdit ? 'updated' : 'added'}!`);
            resetForm();
            loadVideos();
        } else {
            setMsg('Error: ' + JSON.stringify(data.error));
        }
        setSaving(false);
    };

    const handleEdit = (doc: LiveVideoDoc) => {
        setEditId(doc._id);
        const dateStr = doc.streamDate ? new Date(doc.streamDate).toISOString().slice(0, 16) : '';
        setForm({
            title: doc.title || '',
            slug: doc.slug?.current || '',
            videoUrl: doc.videoUrl || '',
            description: doc.description || '',
            status: doc.status || 'Upcoming',
            streamDate: dateStr,
            category: doc.category || 'Web Development'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string, title: string) => {
        confirm({
            title: 'Delete Live Video?',
            message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
            confirmLabel: 'Delete Video',
            variant: 'danger',
            onConfirm: async () => {
                await fetch('/api/admin/sanity', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
                loadVideos();
            }
        });
    };

    // Helper to get embed URL
    const getEmbedUrl = (url: string) => {
        if (!url) return '';

        // YouTube
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1].split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1].split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }

        // Vimeo
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('vimeo.com/')[1].split('?')[0].split('/').pop();
            return `https://player.vimeo.com/video/${videoId}`;
        }

        // Instagram
        if (url.includes('instagram.com/p/') || url.includes('instagram.com/reel/')) {
            let baseUrl = url.split('?')[0];
            if (!baseUrl.endsWith('/')) baseUrl += '/';
            return `${baseUrl}embed`;
        }

        // TikTok
        if (url.includes('tiktok.com/')) {
            const videoId = url.split('/video/')[1]?.split('?')[0];
            if (videoId) return `https://www.tiktok.com/embed/v2/${videoId}`;
        }

        return url; // Direct link or unsupported
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Live Videos</h1>
                <p className={styles.pageSub}>Add recordings, schedule live streams, and preview video embeds right from the dashboard.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                <div className={styles.formCard}>
                    <h2 className={styles.formTitle}>{editId ? '✏️ Edit Video' : '➕ Add Video'}</h2>

                    <form onSubmit={handleSave}>
                        <div className={styles.fieldset}>
                            <div className={styles.field}>
                                <label>Video Title *</label>
                                <input required value={form.title} onChange={f('title')} placeholder="e.g. Building a Next.js App from Scratch" />
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.field}>
                                    <label>Slug (auto-generated if empty)</label>
                                    <input value={form.slug} onChange={f('slug')} placeholder="building-nextjs-app" />
                                </div>
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.field}>
                                    <label>Date / Time</label>
                                    <input type="datetime-local" value={form.streamDate} onChange={f('streamDate')} />
                                </div>
                                <div className={styles.field}>
                                    <label>Status</label>
                                    <select value={form.status} onChange={f('status')}>
                                        {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label>Category</label>
                                <select value={form.category} onChange={f('category')}>
                                    {CATEGORIES.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label>Video URL (YouTube, Vimeo, Instagram, TikTok, MP4) *</label>
                                <input required type="url" value={form.videoUrl} onChange={f('videoUrl')} placeholder="https://www.youtube.com/watch?v=..." />
                            </div>

                            <div className={styles.field}>
                                <label>Description</label>
                                <textarea required value={form.description} onChange={f('description')} placeholder="Detail what will be covered in this stream..." style={{ minHeight: '100px' }} />
                            </div>

                            {msg && <div className={msg.startsWith('✓') ? styles.successMsg : styles.errorMsg}>{msg}</div>}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" className={`btn-primary ${styles.saveBtn}`} disabled={saving}>
                                    {saving ? 'Saving...' : (editId ? '✓ Update Video' : '✓ Save Video')}
                                </button>
                                {editId && (
                                    <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Live Video Preview Pane */}
                <div style={{ background: '#0a0a0c', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '1.5rem', position: 'sticky', top: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#eaeaea', fontFamily: 'var(--font-heading)' }}>
                        <span style={{ marginRight: '0.5rem', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff3b30', verticalAlign: 'middle', boxShadow: '0 0 10px #ff3b30' }}></span>
                        Preview Player
                    </h3>

                    {form.videoUrl ? (
                        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', borderRadius: '8px', overflow: 'hidden', background: '#000', border: '1px solid #1a1a1a' }}>
                            {form.videoUrl.endsWith('.mp4') ? (
                                <video src={form.videoUrl} controls style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                            ) : (
                                <iframe
                                    src={getEmbedUrl(form.videoUrl)}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                            )}
                        </div>
                    ) : (
                        <div style={{ width: '100%', paddingBottom: '56.25%', background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px border #222', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#666', fontSize: '0.9rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📺</div>
                                Paste a video URL to preview
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '1.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem', fontWeight: 600 }}>
                            {form.status || 'Status'} • {form.category || 'Category'}
                        </div>
                        <h4 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.5rem' }}>
                            {form.title || 'Video Title'}
                        </h4>
                        <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            {form.description || 'Video description will appear here...'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Videos List */}
            <div style={{ marginTop: '3rem' }}>
                <div className={styles.toolbarRow}>
                    <h2 className={styles.sectionTitle}>Library ({videos.length})</h2>
                    <button className="btn-secondary" onClick={loadVideos} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Refresh</button>
                </div>
                {loading ? (
                    <div className={styles.emptyState}>Loading videos...</div>
                ) : videos.length === 0 ? (
                    <div className={styles.emptyState}>No videos added yet.</div>
                ) : (
                    <div className={styles.table}>
                        <div className={`${styles.tableRow} ${styles.tableHead} ${styles.docRow}`} style={{ gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr 1fr 150px' }}>
                            <span>Title</span>
                            <span>Category</span>
                            <span>Status</span>
                            <span>Date</span>
                            <span>Actions</span>
                        </div>
                        {videos.map(doc => (
                            <div key={doc._id} className={`${styles.tableRow} ${styles.docRow}`} style={{ gridTemplateColumns: 'minmax(200px, 2fr) 1fr 1fr 1fr 150px' }}>
                                <span style={{ fontWeight: 500 }}>{doc.title}</span>
                                <span className={styles.muted}>{doc.category}</span>
                                <span style={{
                                    color: doc.status === 'Live Now' ? '#ff3b30' : doc.status === 'Upcoming' ? '#2196F3' : '#4CAF50',
                                    fontSize: '0.8rem', fontWeight: 600
                                }}>
                                    {doc.status === 'Live Now' && '🔴'} {doc.status}
                                </span>
                                <span className={styles.muted}>{doc.streamDate ? new Date(doc.streamDate).toLocaleDateString() : '-'}</span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button className={styles.approveBtn} onClick={() => handleEdit(doc)}>Edit</button>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(doc._id, doc.title)}>Del</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
