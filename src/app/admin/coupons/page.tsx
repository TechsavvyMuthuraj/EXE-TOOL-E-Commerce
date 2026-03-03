'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from '../page.module.css';
import { useModal } from '@/components/ui/PremiumModal';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const { confirm } = useModal();
    const [form, setForm] = useState({
        code: '', discount_percentage: '', max_uses: '', expires_at: '', global_coupon: true, product_id: ''
    });

    const load = () => {
        setLoading(true);
        supabase.from('coupons').select('*').order('created_at', { ascending: false })
            .then(({ data }) => { setCoupons(data || []); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setMsg('');
        const { error } = await supabase.from('coupons').insert({
            code: form.code.toUpperCase(),
            discount_percentage: Number(form.discount_percentage),
            max_uses: form.max_uses ? Number(form.max_uses) : null,
            expires_at: form.expires_at || null,
            product_id: form.global_coupon ? null : form.product_id || null,
            active: true,
            uses: 0,
        });
        if (error) {
            setMsg('Error: ' + error.message);
        } else {
            setMsg('✓ Coupon created!');
            setForm({ code: '', discount_percentage: '', max_uses: '', expires_at: '', global_coupon: true, product_id: '' });
            load();
        }
        setSaving(false);
    };

    const handleToggle = async (id: string, active: boolean) => {
        await supabase.from('coupons').update({ active: !active }).eq('id', id);
        load();
    };

    const handleDelete = async (id: string) => {
        confirm({
            title: 'Delete Coupon?',
            message: 'This will permanently remove the coupon code and it will no longer be usable.',
            confirmLabel: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
                await supabase.from('coupons').delete().eq('id', id);
                load();
            }
        });
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Coupons</h1>
                <p className={styles.pageSub}>Create discount codes. Applied at checkout and validated server-side.</p>
            </div>

            <div className={styles.formCard}>
                <h2 className={styles.formTitle}>Create Coupon</h2>
                <form onSubmit={handleSave}>
                    <div className={styles.fieldset}>
                        <div className={styles.fieldRow}>
                            <div className={styles.field}>
                                <label>Coupon Code *</label>
                                <input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. WINDOWS50" style={{ textTransform: 'uppercase' }} />
                            </div>
                            <div className={styles.field}>
                                <label>Discount % *</label>
                                <input required type="number" min="1" max="100" value={form.discount_percentage} onChange={e => setForm(p => ({ ...p, discount_percentage: e.target.value }))} placeholder="e.g. 20" />
                            </div>
                        </div>
                        <div className={styles.fieldRow}>
                            <div className={styles.field}>
                                <label>Max Uses (leave blank for unlimited)</label>
                                <input type="number" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))} placeholder="e.g. 100" />
                            </div>
                            <div className={styles.field}>
                                <label>Expiry Date</label>
                                <input type="date" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textTransform: 'none', fontSize: '0.85rem' }}>
                                <input type="checkbox" checked={form.global_coupon} onChange={e => setForm(p => ({ ...p, global_coupon: e.target.checked }))} />
                                Global Coupon (applies to any product)
                            </label>
                        </div>
                        {!form.global_coupon && (
                            <div className={styles.field}>
                                <label>Specific Product ID</label>
                                <input value={form.product_id} onChange={e => setForm(p => ({ ...p, product_id: e.target.value }))} placeholder="Product slug or Supabase product ID" />
                            </div>
                        )}
                        {msg && <div className={msg.startsWith('✓') ? styles.successMsg : styles.errorMsg}>{msg}</div>}
                        <button type="submit" className={`btn-primary ${styles.saveBtn}`} disabled={saving}>
                            {saving ? 'Creating...' : '+ Create Coupon'}
                        </button>
                    </div>
                </form>
            </div>

            <div>
                <h2 className={styles.sectionTitle}>All Coupons ({coupons.length})</h2>
                {loading ? (
                    <div className={styles.emptyState}>Loading...</div>
                ) : coupons.length === 0 ? (
                    <div className={styles.emptyState}>No coupons yet.</div>
                ) : (
                    <div className={styles.table}>
                        <div className={`${styles.tableRow} ${styles.tableHead}`} style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto' }}>
                            <span>Code</span><span>Discount</span><span>Uses</span><span>Expiry</span><span>Status</span><span>—</span>
                        </div>
                        {coupons.map(c => (
                            <div key={c.id} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr auto' }}>
                                <span className={styles.mono} style={{ color: 'var(--accent)' }}>{c.code}</span>
                                <span>{c.discount_percentage}% OFF</span>
                                <span className={styles.muted}>{c.uses || 0}{c.max_uses ? `/${c.max_uses}` : '/∞'}</span>
                                <span className={styles.muted}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'No expiry'}</span>
                                <span className={`${styles.badge} ${c.active ? styles.badge_approved : styles.badge_rejected}`}>{c.active ? 'Active' : 'Disabled'}</span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button className={styles.approveBtn} onClick={() => handleToggle(c.id, c.active)}>{c.active ? 'Disable' : 'Enable'}</button>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(c.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
