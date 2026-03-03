'use client';
import { useState, useEffect } from 'react';
import styles from './LiveVideoSection.module.css';

interface LiveVideoDoc {
    _id: string;
    title: string;
    slug?: { current: string };
    videoUrl?: string;
    description?: string;
    status: string;
    streamDate?: string;
    category?: string;
}

export default function LiveVideoSection() {
    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('youtube.com/embed/')) return url + (url.includes('?') ? '&autoplay=1' : '?autoplay=1');
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.includes('youtu.be') ? url.split('youtu.be/')[1].split('?')[0] : url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }
        return url;
    };

    const [videos, setVideos] = useState<LiveVideoDoc[]>([]);
    const [activeVideo, setActiveVideo] = useState<LiveVideoDoc | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/sanity?type=liveVideo')
            .then(res => res.json())
            .then(data => {
                const liveVideos = data.documents || [];
                // Sort so "Live Now" is first, then "Upcoming", then "Recorded (VOD)"
                const sorted = liveVideos.sort((a: LiveVideoDoc, b: LiveVideoDoc) => {
                    const rank = { 'Live Now': 1, 'Upcoming': 2, 'Recorded (VOD)': 3 };
                    return (rank[a.status as keyof typeof rank] || 4) - (rank[b.status as keyof typeof rank] || 4);
                });
                setVideos(sorted);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);



    if (loading || videos.length === 0) return null;

    return (
        <section className={`container ${styles.section}`}>
            <h2 className={styles.title}>
                <span className={styles.accent}>•</span> Live Broadcasts & Sessions
            </h2>
            <div className={styles.grid}>
                {videos.map(video => (
                    <div
                        key={video._id}
                        className={styles.card}
                        onClick={() => setActiveVideo(video)}
                    >
                        <div className={styles.thumbnailPlaceholder}>
                            <div className={styles.playButton}>▶</div>
                            {video.status === 'Live Now' && (
                                <div className={styles.liveBadge}>
                                    <span className={styles.liveDot}></span> LIVE
                                </div>
                            )}
                            {video.status === 'Upcoming' && (
                                <div className={styles.upcomingBadge}>UPCOMING</div>
                            )}
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.metaRow}>
                                <span className={styles.category}>{video.category}</span>
                                {video.streamDate && (
                                    <span className={styles.date}>
                                        {new Date(video.streamDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                )}
                            </div>
                            <h3 className={styles.vidTitle}>{video.title}</h3>
                            <p className={styles.vidDesc}>{video.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Video Modal */}
            {activeVideo && (
                <div className={styles.modalOverlay} onClick={() => setActiveVideo(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setActiveVideo(null)}>✕</button>

                        <div className={styles.playerWrapper}>
                            {(activeVideo.videoUrl?.includes('youtube') || activeVideo.videoUrl?.includes('youtu.be')) ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={getEmbedUrl(activeVideo.videoUrl || '')}
                                    title={activeVideo.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ borderRadius: '8px', position: 'absolute', top: 0, left: 0, border: 'none' }}
                                ></iframe>
                            ) : (
                                <video
                                    src={activeVideo.videoUrl}
                                    controls
                                    autoPlay
                                    style={{ width: '100%', height: '100%', borderRadius: '8px', position: 'absolute', top: 0, left: 0, objectFit: 'contain', background: '#000' }}
                                />
                            )}
                        </div>

                        <div className={styles.modalInfo}>
                            <div className={styles.modalHeader}>
                                {activeVideo.status === 'Live Now' && <span className={styles.liveDot}></span>}
                                <span style={{ color: activeVideo.status === 'Live Now' ? '#ff3b30' : '#888' }}>
                                    {activeVideo.status}
                                </span>
                                <span style={{ margin: '0 0.5rem', color: '#444' }}>•</span>
                                <span>{activeVideo.category}</span>
                            </div>
                            <h3 className={styles.modalTitle}>{activeVideo.title}</h3>
                            <p className={styles.modalDesc}>{activeVideo.description}</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
