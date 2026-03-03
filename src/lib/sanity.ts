import { createClient } from '@sanity/client';

export const sanityClient = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    useCdn: false, // Set to false to see real-time changes instantly
    apiVersion: '2023-05-03',
    token: process.env.SANITY_API_TOKEN,
});
