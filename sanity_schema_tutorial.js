// Sanity `tutorial.js` Schema Reference
// Add this to your Sanity Studio schemas/index.js

export default {
    name: 'tutorial',
    title: 'Tutorial Course',
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Tutorial Title',
            type: 'string',
        },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: { source: 'title', maxLength: 96 },
        },
        {
            name: 'category',
            title: 'Category',
            type: 'string',
            options: {
                list: [
                    { title: 'Web Development', value: 'Web Development' },
                    { title: 'Frameworks & Libraries', value: 'Frameworks & Libraries' },
                    { title: 'Programming Languages', value: 'Programming Languages' },
                    { title: 'Backend & Database', value: 'Backend & Database' },
                    { title: 'DevOps & Tooling', value: 'DevOps & Tooling' },
                    { title: 'Design & UI/UX', value: 'Design & UI/UX' },
                    { title: 'Data Science', value: 'Data Science' },
                    { title: 'Windows Optimize', value: 'Windows Optimize' },
                    { title: 'Windows Tips', value: 'Windows Tips' }
                ]
            }
        },
        {
            name: 'shortDescription',
            title: 'Short Description',
            type: 'text',
            description: 'Summary shown on the tutorial cards.',
        },
        {
            name: 'icon',
            title: 'Icon Type',
            type: 'string',
            description: 'Can be a recognized name like html, css, js, python, react, cplusplus, java, etc. for frontend displaying icons. Alternatively, you could use an image field, but string is easier for CSS icons.',
            options: {
                list: [
                    { title: 'HTML5', value: 'html' },
                    { title: 'CSS3', value: 'css' },
                    { title: 'JavaScript', value: 'javascript' },
                    { title: 'TypeScript', value: 'typescript' },
                    { title: 'React', value: 'react' },
                    { title: 'Next.js', value: 'nextjs' },
                    { title: 'Tailwind CSS', value: 'tailwindcss' },
                    { title: 'Node.js', value: 'nodejs' },
                    { title: 'Python', value: 'python' },
                    { title: 'Java', value: 'java' },
                    { title: 'C++', value: 'cpp' },
                    { title: 'C#', value: 'csharp' },
                    { title: 'Go', value: 'go' },
                    { title: 'Rust', value: 'rust' },
                    { title: 'Git & GitHub', value: 'git' },
                    { title: 'Docker', value: 'docker' },
                    { title: 'Figma', value: 'figma' }
                ]
            }
        },
        {
            name: 'image',
            title: 'Course Image URL',
            type: 'string',
            description: 'URL to the course cover image.'
        },
        {
            name: 'chapters',
            title: 'Chapters',
            description: 'The curriculum of the tutorial. Order matters.',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'title', title: 'Chapter Title', type: 'string' },
                        {
                            name: 'slug',
                            title: 'Chapter Slug',
                            type: 'slug',
                            options: { source: (doc, options) => options.parent.title, maxLength: 96 }
                        },
                        { name: 'content', title: 'Markdown Content', type: 'text' }
                    ]
                }
            ]
        }
    ]
}
