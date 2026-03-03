// Sanity `liveVideo.js` Schema
// Add this to your Sanity Studio schemas/index.js alongside other schemas

export default {
    name: 'liveVideo',
    title: 'Live Video',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Video Title',
            type: 'string',
        },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'title', maxLength: 96 },
        },
        {
            name: 'videoUrl',
            title: 'Video URL',
            type: 'url',
            description: 'Provide YouTube, Vimeo, Instagram, TikTok, or a direct .mp4 link.',
        },
        {
            name: 'description',
            title: 'Description',
            type: 'text',
        },
        {
            name: 'status',
            title: 'Stream Status',
            type: 'string',
            options: {
                list: [
                    { title: 'Live Now', value: 'Live' },
                    { title: 'Upcoming', value: 'Upcoming' },
                    { title: 'Recorded (VOD)', value: 'Recorded' }
                ]
            }
        },
        {
            name: 'streamDate',
            title: 'Stream Date',
            type: 'datetime',
        },
        {
            name: 'category',
            title: 'Category',
            type: 'string',
            options: {
                list: [
                    { title: 'Web Development', value: 'Web Development' },
                    { title: 'Hardware Config', value: 'Hardware Config' },
                    { title: 'Q&A Session', value: 'Q&A Session' },
                    { title: 'Other', value: 'Other' }
                ]
            }
        }
    ]
};
