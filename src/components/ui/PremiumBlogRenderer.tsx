'use client';
import StaggeredTitle from '@/components/ui/StaggeredTitle';
import StepCard from '@/components/ui/StepCard';
import TerminalBlock from '@/components/ui/TerminalBlock';
// Since this is a shared UI component, we will inline the core text styles 
// so it looks good in both the admin preview and the public frontend.

export default function PremiumBlogRenderer({ content }: { content: string }) {
    if (!content) return null;

    return (
        <div className="premium-blog-content">
            {content.split('\n\n').map((block, i) => {
                const b = block.trim();

                // 1. STAGGERED TITLE
                if (b.startsWith('[StaggeredTitle]') && b.endsWith('[/StaggeredTitle]')) {
                    const inner = b.slice(16, -17).trim();
                    const lines = inner.split('\n');
                    return (
                        <div key={i} style={{ margin: '3rem 0 1.5rem' }}>
                            <StaggeredTitle title={lines} className="staggered-heading" />
                        </div>
                    );
                }

                // 2. STEP CARD
                if (b.startsWith('[StepCard:') && b.endsWith('[/StepCard]')) {
                    const firstLineEnd = b.indexOf(']');
                    const step = b.slice(10, firstLineEnd).trim();
                    const inner = b.slice(firstLineEnd + 1, -11).trim();
                    const lines = inner.split('\n');
                    const title = lines[0] || '';
                    const desc = lines.slice(1).join(' ') || '';
                    return (
                        <div key={i} style={{ margin: '2.5rem 0' }}>
                            <StepCard step={step} title={title} description={desc} />
                        </div>
                    );
                }

                // 3. TERMINAL BLOCK
                if (b.startsWith('[Terminal]') && b.endsWith('[/Terminal]')) {
                    const inner = b.slice(10, -11).trim();
                    const lines = inner.split('\n');
                    return (
                        <div key={i} style={{ margin: '2.5rem 0' }}>
                            <TerminalBlock lines={lines} />
                        </div>
                    );
                }

                // 4. CODE BLOCK ``` (Multi-line)
                if (b.startsWith('```') && b.endsWith('```') && b.length > 6) {
                    const lines = b.split('\n');
                    const langMatch = lines[0].replace('```', '').trim();
                    const lang = langMatch || 'markup';
                    const codeContent = lines.slice(1, -1).join('\n');

                    return (
                        <div key={i} style={{ margin: '2.5rem 0', background: '#0a0a0c', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            <div style={{ padding: '0.8rem 1rem', background: '#111', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></span>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></span>
                                </div>
                                <span style={{ marginLeft: 'auto', color: '#666', fontSize: '0.75rem', fontFamily: 'monospace', textTransform: 'uppercase' }}>{lang}</span>
                            </div>
                            <pre style={{ margin: 0, padding: '1.5rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                <code style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#e0e0e0', lineHeight: '1.6' }}>{codeContent}</code>
                            </pre>
                        </div>
                    );
                }

                // 5. PROMPT / QUOTE BLOCK (> quote)
                if (b.startsWith('> ')) {
                    const quoteText = b.split('\n').map(line => line.replace(/^>\s?/, '')).join(' ');
                    // Process inline code/links within blockquote
                    const formattedQuote = quoteText
                        .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #ffbd2e;">$1</code>')
                        .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:none;border-bottom:1px dotted var(--accent);">$1 ↗</a>`);

                    return (
                        <blockquote key={i} style={{ margin: '2.5rem 0', padding: '1.5rem 2rem', background: 'rgba(245, 166, 35, 0.05)', borderLeft: '4px solid var(--accent)', borderRadius: '0 8px 8px 0', color: '#e0e0e0', fontSize: '1.1rem', fontStyle: 'italic', lineHeight: '1.8', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <span style={{ color: 'var(--accent)', fontSize: '1.5rem', display: 'flex', marginTop: '0.2rem' }}>💡</span>
                            <div dangerouslySetInnerHTML={{ __html: formattedQuote }} />
                        </blockquote>
                    );
                }

                // 6. Inline Images `![alt](url)`
                let parsed = b.replace(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 2rem 0; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />');

                // 7. YouTube Embeds & Inline Links within paragraphs
                parsed = parsed.replace(/(^|[^!])\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (match, prefix, label, url) => {
                    if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
                        const vidId = url.includes('v=') ? new URL(url).searchParams.get('v') : url.split('youtu.be/')[1]?.split('?')[0];
                        if (vidId) {
                            return `${prefix}<div style="margin: 2rem 0"><iframe width="100%" height="400" src="https://www.youtube.com/embed/${vidId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius: 8px; border: 1px solid #333;"></iframe></div><a href="${url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:none;border-bottom:1px dotted var(--accent);">${label} ↗</a>`;
                        }
                    }
                    return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:none;border-bottom:1px dotted var(--accent);">${label} ↗</a>`;
                });

                // Parse inline code segments (`code`) in regular text paragraphs
                parsed = parsed.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #ffbd2e; border: 1px solid rgba(255,255,255,0.1);">$1</code>');

                // Raw Youtube Link Fallback
                if (parsed.match(/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+/)) {
                    const url = parsed.trim();
                    const vidId = url.includes('v=') ? new URL(url).searchParams.get('v') : url.split('youtu.be/')[1]?.split('?')[0];
                    if (vidId) {
                        return <div key={i} style={{ margin: '2rem 0' }} dangerouslySetInnerHTML={{ __html: `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${vidId}" frameborder="0" allowfullscreen style="border-radius: 8px; border: 1px solid #333;"></iframe>` }} />;
                    }
                }

                // 7. Standard Markdown Tags
                if (b.startsWith('### ')) return <h3 key={i} style={{ fontFamily: 'var(--font-heading)', background: 'linear-gradient(90deg, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.4rem', margin: '3rem 0 1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>{b.slice(4)}</h3>;
                if (b.startsWith('## ')) return <h2 key={i} style={{ fontFamily: 'var(--font-heading)', background: 'linear-gradient(90deg, var(--accent), #f9d423)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2rem', margin: '4rem 0 1.5rem', textTransform: 'uppercase', letterSpacing: '0.02em', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', fontWeight: '900', display: 'inline-block', width: '100%' }}>{b.slice(3)}</h2>;

                // Unordered lists
                if (b.startsWith('- ') || b.startsWith('* ')) {
                    return (
                        <ul key={i} style={{ color: '#eaeaea', paddingLeft: '2rem', lineHeight: '2.2', margin: '1.5rem 0', fontFamily: 'var(--font-body)', fontSize: '1.1rem' }}>
                            {b.split('\n').map((item, j) => {
                                let itemParsed = item.replace(/^[-*]\s/, '');
                                itemParsed = itemParsed.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff; font-weight:700;">$1</strong>');
                                itemParsed = itemParsed.replace(/\*(.*?)\*/g, '<em style="color:#e0e0e0; font-style:italic;">$1</em>');
                                // Support lists with images and links
                                itemParsed = itemParsed.replace(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 6px; display: block; margin: 1rem 0;" />');
                                itemParsed = itemParsed.replace(/(^|[^!])\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, `$1<a href="$3" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:none;border-bottom:1px dotted var(--accent);">$2 ↗</a>`);
                                itemParsed = itemParsed.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #ffbd2e; border: 1px solid rgba(255,255,255,0.1);">$1</code>');
                                return <li key={j} style={{ marginBottom: '0.5rem' }} dangerouslySetInnerHTML={{ __html: itemParsed }} />
                            })}
                        </ul>
                    );
                }

                // Extra Font Styles (Bold / Italic)
                parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fff; font-weight:700;">$1</strong>');
                parsed = parsed.replace(/\*(.*?)\*/g, '<em style="color:#e0e0e0; font-style:italic;">$1</em>');

                // Default paragraph
                return <p key={i} style={{ color: '#eaeaea', fontSize: '1.15rem', lineHeight: '1.8', margin: '0 0 1.5rem 0', fontFamily: 'var(--font-body)' }} dangerouslySetInnerHTML={{ __html: parsed }} />;
            })}

            <style jsx global>{`
                .premium-blog-content .staggered-heading {
                    font-family: var(--font-heading);
                    font-size: 2.2rem;
                    color: #fff;
                    letter-spacing: 0.02em;
                    text-transform: uppercase;
                }
            `}</style>
        </div>
    );
}
