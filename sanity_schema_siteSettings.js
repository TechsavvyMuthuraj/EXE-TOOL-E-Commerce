// Sanity `siteSettings.js` Schema
// Add this to your Sanity Studio schemas/index.js alongside other schemas

export default {
    name: 'siteSettings',
    title: 'Site Settings',
    type: 'document',
    fields: [
        {
            name: 'bannerActive',
            title: 'Global Banner Active',
            type: 'boolean',
            description: 'Turn the pulsing neon alert banner ON or OFF across the public site.',
        },
        {
            name: 'bannerText',
            title: 'Banner Text',
            type: 'string',
            description: 'The message shown on the banner (e.g. FLASH SALE: 50% OFF PREMIUM PACK).',
        }
    ],
    // Setup singleton structure in desk structure if preferred,
    // otherwise it will just be a normal document where you only use the first instance.
};
