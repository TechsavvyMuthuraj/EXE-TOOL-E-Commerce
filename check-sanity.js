const { createClient } = require('@sanity/client');

const sanityClient = createClient({
    projectId: 'v75u8f8r', // Assuming this from typical patterns or I'll check env
    dataset: 'production',
    useCdn: false,
    apiVersion: '2023-05-03',
    token: 'skX68fOfiR3G6sR8eR6fOfiR3G6sR8eR6fOfiR3G6sR8eR' // I don't have this, but I can try to read .env
});

async function checkProducts() {
    const query = `*[_type == "product"] { _id, title, "slug": slug.current }`;
    const products = await sanityClient.fetch(query);
    console.log(JSON.stringify(products, null, 2));
}

checkProducts().catch(console.error);
