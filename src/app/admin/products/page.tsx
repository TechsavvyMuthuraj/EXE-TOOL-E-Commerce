'use client';
import { useState, useEffect, useRef } from 'react';
import styles from '../page.module.css';
import { useModal } from '@/components/ui/PremiumModal';

interface PricingTier { name: string; price: number; originalPrice?: number; licenseType: string; downloadLink?: string; paymentLink?: string; couponPaymentLink?: string; }

interface GalleryImage {
    assetId: string;
    url: string;
}

interface SanityDoc {
    _id: string;
    title: string;
    slug?: { current: string };
    category?: string;
    _createdAt: string;
    shortDescription?: string;
    longDescription?: string;
    features?: string[];
    pricingTiers?: PricingTier[];
    mainImage?: { url: string; ref: string };
    gallery?: Array<{ url: string; ref: string }>;
}

const EMPTY_FORM = {
    title: '', slug: '', category: 'Optimization', shortDescription: '',
    longDescription: '', tier1Name: 'Personal', tier1Price: '', tier1OriginalPrice: '', tier1Download: '', tier1PayLink: '', tier1CouponPayLink: '',
    tier2Name: 'Business', tier2Price: '', tier2OriginalPrice: '', tier2Download: '', tier2PayLink: '', tier2CouponPayLink: ''
};

export default function AdminProductsPage() {
    const [docs, setDocs] = useState<SanityDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const { confirm } = useModal();

    // Main Image
    const [imageAssetId, setImageAssetId] = useState('');
    const [imagePreview, setImagePreview] = useState('');

    // Gallery Images
    const [gallery, setGallery] = useState<GalleryImage[]>([]);

    const [uploading, setUploading] = useState(false);
    const [uploadSource, setUploadSource] = useState<'sanity' | 'supabase' | null>(null);

    const [features, setFeatures] = useState<string[]>([]);
    const [featureInput, setFeatureInput] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({ ...EMPTY_FORM });
    const f = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [key]: e.target.value }));

    /* ── Load all products ─────────────── */
    const loadDocs = () => {
        setLoading(true);
        fetch('/api/admin/sanity?type=product')
            .then(r => r.json())
            .then(d => { setDocs(d.documents || []); setLoading(false); });
    };
    useEffect(() => { loadDocs(); }, []);

    /* ── Image upload ──────────────────── */
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true); setMsg(''); setImagePreview(''); setImageAssetId(''); setUploadSource(null);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.assetId) {
                setImageAssetId(data.assetId);
                setImagePreview(data.url);
                setUploadSource(data.source);
            } else {
                setMsg('⚠ Upload failed: ' + (data.supabaseNote || data.sanityNote || data.error || 'Unknown'));
            }
        } catch (err: any) { setMsg('⚠ Network error: ' + err.message); }
        setUploading(false);
    };

    /* ── Gallery upload ────────────────── */
    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newImages: GalleryImage[] = [];

        for (let i = 0; i < files.length; i++) {
            const fd = new FormData();
            fd.append('file', files[i]);
            try {
                const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.assetId) {
                    newImages.push({ assetId: data.assetId, url: data.url });
                }
            } catch (err) {
                console.error('Gallery upload error:', err);
            }
        }

        setGallery(prev => [...prev, ...newImages]);
        setUploading(false);
    };

    const removeGalleryImage = (index: number) => {
        setGallery(prev => prev.filter((_, i) => i !== index));
    };

    /* ── Fill form from existing doc ───── */
    const handleEdit = (doc: SanityDoc) => {
        setEditId(doc._id);
        const t1 = doc.pricingTiers?.[0];
        const t2 = doc.pricingTiers?.[1];
        setForm({
            title: doc.title || '',
            slug: doc.slug?.current || '',
            category: doc.category || 'Optimization',
            shortDescription: doc.shortDescription || '',
            longDescription: doc.longDescription || '',
            tier1Name: t1?.name || 'Personal',
            tier1Price: t1?.price?.toString() || '',
            tier1OriginalPrice: t1?.originalPrice?.toString() || '',
            tier1Download: t1?.downloadLink || '',
            tier1PayLink: t1?.paymentLink || '',
            tier1CouponPayLink: t1?.couponPaymentLink || '',
            tier2Name: t2?.name || 'Business',
            tier2Price: t2?.price?.toString() || '',
            tier2OriginalPrice: t2?.originalPrice?.toString() || '',
            tier2Download: t2?.downloadLink || '',
            tier2PayLink: t2?.paymentLink || '',
            tier2CouponPayLink: t2?.couponPaymentLink || '',
        });
        setFeatures(doc.features || []);

        // Main image
        if (doc.mainImage?.url) {
            setImagePreview(doc.mainImage.url);
            setImageAssetId(doc.mainImage.ref || '');
        } else {
            setImagePreview(''); setImageAssetId('');
        }

        // Gallery images
        if (doc.gallery) {
            setGallery(doc.gallery.map(img => ({ assetId: img.ref || '', url: img.url })));
        } else {
            setGallery([]);
        }

        setUploadSource(null);
        setMsg('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setFeatures([]); setImageAssetId(''); setImagePreview(''); setGallery([]); setUploadSource(null); setMsg('');
    };

    /* ── Save (Create or Update) ───────── */
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setMsg('');
        const slug = form.slug || form.title.toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        const galleryPayload = gallery.map(img => ({
            _type: 'image',
            asset: { _type: 'reference', _ref: img.assetId }
        })).filter(img => img.asset._ref);

        const doc: any = {
            _type: 'product',
            title: form.title,
            slug: { _type: 'slug', current: slug },
            category: form.category,
            shortDescription: form.shortDescription,
            longDescription: form.longDescription,
            features,
            pricingTiers: [
                {
                    name: form.tier1Name,
                    price: Number(form.tier1Price),
                    ...(form.tier1OriginalPrice ? { originalPrice: Number(form.tier1OriginalPrice) } : {}),
                    licenseType: 'PER',
                    downloadLink: form.tier1Download,
                    paymentLink: form.tier1PayLink,
                    couponPaymentLink: form.tier1CouponPayLink
                },
                ...(form.tier2Price ? [{
                    name: form.tier2Name,
                    price: Number(form.tier2Price),
                    ...(form.tier2OriginalPrice ? { originalPrice: Number(form.tier2OriginalPrice) } : {}),
                    licenseType: 'BUS',
                    downloadLink: form.tier2Download,
                    paymentLink: form.tier2PayLink,
                    couponPaymentLink: form.tier2CouponPayLink
                }] : [])
            ]
        };

        if (imageAssetId) {
            doc.mainImage = { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } };
        }

        doc.gallery = galleryPayload;

        const isEdit = !!editId;
        const res = await fetch('/api/admin/sanity', {
            method: isEdit ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(isEdit ? { id: editId, patch: doc } : { document: doc })
        });
        const data = await res.json();
        if (data.success) {
            setMsg(`✓ Product ${isEdit ? 'updated' : 'published'} successfully!`);
            handleCancelEdit();
            loadDocs();
        } else {
            setMsg('Error: ' + JSON.stringify(data.error));
        }
        setSaving(false);
    };

    /* ── Delete ────────────────────────── */
    const handleDelete = async (id: string, title: string) => {
        confirm({
            title: `Delete "${title}"?`,
            message: 'This will permanently remove the product from Sanity. This cannot be undone.',
            confirmLabel: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
                await fetch('/api/admin/sanity', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
                if (editId === id) handleCancelEdit();
                loadDocs();
            }
        });
    };

    const addFeature = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && featureInput.trim()) {
            e.preventDefault();
            setFeatures(prev => [...prev, featureInput.trim()]);
            setFeatureInput('');
        }
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Products</h1>
                <p className={styles.pageSub}>
                    {editId ? '✏️ Editing product details — setting custom payment links or download links.' : 'Manage your product catalog. Set custom payment links for direct checkouts.'}
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', background: 'rgba(0,229,255,0.05)', color: 'var(--glow-cyan)', padding: '8px 12px', borderLeft: '3px solid var(--glow-cyan)', borderRadius: '4px' }}>
                    💡 <strong>TIP:</strong> For custom payment links to update your dashboard, add <code>productId</code> and <code>tier</code> to the <strong>Notes</strong> section in your Razorpay Dashboard for that link.
                </div>
            </div>

            {/* ── Form (Create / Edit) ─────────── */}
            <div className={styles.formCard} style={editId ? { borderColor: 'var(--accent)', borderWidth: '1px', borderStyle: 'solid' } : {}}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 className={styles.formTitle} style={{ margin: 0 }}>
                        {editId ? '✏️ Edit Product' : 'Create New Product'}
                    </h2>
                    {editId && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: 'var(--accent)', fontSize: '0.7rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '1px', padding: '0.25rem 0.6rem' }}>
                                Edit Mode
                            </span>
                            <button type="button" className="btn-secondary" onClick={handleCancelEdit} style={{ fontSize: '0.75rem', padding: '0.35rem 0.9rem' }}>
                                ✕ Cancel
                            </button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSave}>
                    <div className={styles.fieldset}>
                        {/* Title + Slug */}
                        <div className={styles.fieldRow}>
                            <div className={styles.field}>
                                <label>Product Title *</label>
                                <input required value={form.title} onChange={f('title')} placeholder="e.g. Windows 10 Optimizer Pack" />
                            </div>
                            <div className={styles.field}>
                                <label>Slug (auto-generated if empty)</label>
                                <input value={form.slug} onChange={f('slug')} placeholder="e.g. win10-optimizer-pack" />
                            </div>
                        </div>

                        {/* Category + Main Image */}
                        <div className={styles.fieldRow}>
                            <div className={styles.field}>
                                <label>Category</label>
                                <select value={form.category} onChange={f('category')}>
                                    {['Optimization', 'Debloat', 'Diagnostics', 'Privacy', 'Drivers', 'Cleanup', 'Gaming'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label>Main Image</label>
                                <div className={styles.uploadZone}>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileRef} />
                                    {imagePreview ? (
                                        <div style={{ position: 'relative' }}>
                                            <img src={imagePreview} className={styles.uploadPreview} alt="preview" />
                                            {!uploading && (
                                                <div
                                                    style={{ position: 'absolute', top: '0', right: '0', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.8rem', padding: '2px 8px', cursor: 'pointer' }}
                                                    onClick={() => { setImageAssetId(''); setImagePreview(''); }}
                                                >Change</div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={styles.uploadZoneText}>{uploading ? '⏳ Uploading...' : '📁 Click to upload main image'}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <div className={styles.field}>
                            <label>Gallery (Screenshots)</label>
                            <div className={styles.galleryGrid}>
                                {gallery.map((img, i) => (
                                    <div key={i} className={styles.galleryItem}>
                                        <img src={img.url} alt={`gallery-${i}`} />
                                        <button type="button" onClick={() => removeGalleryImage(i)} className={styles.galleryRemove}>✕</button>
                                    </div>
                                ))}
                                <label className={styles.galleryAdd}>
                                    +
                                    <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} />
                                </label>
                            </div>
                        </div>

                        {/* Descriptions */}
                        <div className={styles.field}><label>Short Description *</label><input required value={form.shortDescription} onChange={f('shortDescription')} /></div>
                        <div className={styles.field}><label>Long Description</label><textarea value={form.longDescription} onChange={f('longDescription')} /></div>

                        {/* Features */}
                        <div className={styles.field}>
                            <label>Features (press Enter to add)</label>
                            <div className={styles.tagInput}>
                                {features.map((feat, i) => (
                                    <span key={i} className={styles.tag}>
                                        {feat} <span className={styles.tagRemove} onClick={() => setFeatures(prev => prev.filter((_, ii) => ii !== i))}>✕</span>
                                    </span>
                                ))}
                                <input className={styles.tagInputField} value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={addFeature} />
                            </div>
                        </div>

                        {/* TIER 1 ────────────────── */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', border: '1px solid #1a1a1a' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>License Tier 1</div>
                            <div className={styles.fieldRow}>
                                <div className={styles.field} style={{ flex: 1.5 }}><label>Name</label><input value={form.tier1Name} onChange={f('tier1Name')} /></div>
                                <div className={styles.field} style={{ flex: 1 }}><label>Offer Price (₹)</label><input type="number" required value={form.tier1Price} onChange={f('tier1Price')} /></div>
                                <div className={styles.field} style={{ flex: 1 }}><label>Original Price (₹)</label><input type="number" placeholder="Optional MSRP" value={form.tier1OriginalPrice} onChange={f('tier1OriginalPrice')} /></div>
                            </div>
                            <div className={styles.fieldRow} style={{ marginTop: '1rem' }}>
                                <div className={styles.field}>
                                    <label>🔗 Download Link</label>
                                    <input value={form.tier1Download} onChange={f('tier1Download')} placeholder="https://..." style={{ fontFamily: 'monospace' }} />
                                </div>
                                <div className={styles.field}>
                                    <label>💰 Standard Payment Link (No Coupon)</label>
                                    <input value={form.tier1PayLink} onChange={f('tier1PayLink')} placeholder="Direct Checkout URL (Razorpay, Stripe, etc.)" style={{ fontFamily: 'monospace' }} />
                                </div>
                                <div className={styles.field}>
                                    <label>🎟️ Coupon Payment Link (Special Offer)</label>
                                    <input value={form.tier1CouponPayLink} onChange={f('tier1CouponPayLink')} placeholder="Direct Checkout URL for discounted price" style={{ fontFamily: 'monospace' }} />
                                </div>
                            </div>
                        </div>

                        {/* TIER 2 ────────────────── */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', border: '1px solid #1a1a1a', marginTop: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>License Tier 2 (Optional)</div>
                            <div className={styles.fieldRow}>
                                <div className={styles.field} style={{ flex: 1.5 }}><label>Name</label><input value={form.tier2Name} onChange={f('tier2Name')} /></div>
                                <div className={styles.field} style={{ flex: 1 }}><label>Offer Price (₹)</label><input type="number" value={form.tier2Price} onChange={f('tier2Price')} /></div>
                                <div className={styles.field} style={{ flex: 1 }}><label>Original Price (₹)</label><input type="number" placeholder="Optional MSRP" value={form.tier2OriginalPrice} onChange={f('tier2OriginalPrice')} /></div>
                            </div>
                            {form.tier2Price && (
                                <div className={styles.fieldRow} style={{ marginTop: '1rem' }}>
                                    <div className={styles.field}>
                                        <label>🔗 Download Link</label>
                                        <input value={form.tier2Download} onChange={f('tier2Download')} placeholder="https://..." style={{ fontFamily: 'monospace' }} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>💰 Standard Payment Link (No Coupon)</label>
                                        <input value={form.tier2PayLink} onChange={f('tier2PayLink')} placeholder="Direct Checkout URL" style={{ fontFamily: 'monospace' }} />
                                    </div>
                                    <div className={styles.field}>
                                        <label>🎟️ Coupon Payment Link</label>
                                        <input value={form.tier2CouponPayLink} onChange={f('tier2CouponPayLink')} placeholder="Direct Checkout URL for coupon users" style={{ fontFamily: 'monospace' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {msg && <div className={msg.startsWith('✓') ? styles.successMsg : styles.errorMsg}>{msg}</div>}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className={`btn-primary ${styles.saveBtn}`} disabled={saving} style={{ margin: 0 }}>
                                {saving ? 'Saving...' : (editId ? '✓ Update Product' : '↑ Publish to Sanity')}
                            </button>
                            {editId && <button type="button" className="btn-secondary" onClick={handleCancelEdit}>Cancel</button>}
                        </div>
                    </div>
                </form>
            </div>

            {/* ── Table ─────────── */}
            <div>
                <div className={styles.toolbarRow}>
                    <h2 className={styles.sectionTitle}>Published Products ({docs.length})</h2>
                    <button className="btn-secondary" onClick={loadDocs} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>Refresh</button>
                </div>
                {loading ? <div className={styles.emptyState}>Loading...</div> : (
                    <div className={styles.table}>
                        <div className={`${styles.tableRow} ${styles.tableHead} ${styles.docRow}`}>
                            <span>Title</span><span>Category</span><span>Slug</span><span>Tiers</span><span>Created</span><span>Actions</span>
                        </div>
                        {docs.map(doc => (
                            <div key={doc._id} className={`${styles.tableRow} ${styles.docRow}`}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {doc.mainImage?.url && <img src={doc.mainImage.url} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover' }} />}
                                    <span>{doc.title}</span>
                                </span>
                                <span className={styles.muted}>{doc.category}</span>
                                <span className={styles.mono} style={{ fontSize: '0.75rem' }}>{doc.slug?.current}</span>
                                <span className={styles.muted} style={{ fontSize: '0.78rem' }}>{doc.pricingTiers?.map((t: any) => `₹${t.price}${t.originalPrice ? ` (was ₹${t.originalPrice})` : ''}`).join(' / ') || '—'}</span>
                                <span className={styles.muted}>{new Date(doc._createdAt).toLocaleDateString()}</span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button className={styles.approveBtn} onClick={() => handleEdit(doc)}>Edit</button>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(doc._id, doc.title)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
