import LiveVideoSection from '@/components/ui/LiveVideoSection';

export const metadata = {
    title: 'Live Videos | EXE TOOL',
    description: 'Watch recent live streams, hardware optimization sessions, and upcoming broadcasts from Muthuraj C.',
};

export default function LiveVideosPage() {
    return (
        <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#050505' }}>
            <LiveVideoSection />
        </div>
    );
}
