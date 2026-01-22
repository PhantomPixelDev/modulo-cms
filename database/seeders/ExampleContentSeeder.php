<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Post;
use App\Models\PostType;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use App\Models\User;
use Illuminate\Support\Str;

class ExampleContentSeeder extends Seeder
{
    public function run(): void
    {
        $authorId = User::value('id');

        $postType = PostType::where('name', 'post')->first();
        $pageType = PostType::where('name', 'page')->first();
        $infoType = PostType::where('name', 'info')->first();
        // Product type is now handled by ModuloShop plugin - do not seed demo products here
        $portfolioType = PostType::where('name', 'portfolio')->first();
        $testimonialType = PostType::where('name', 'testimonial')->first();
        $eventType = PostType::where('name', 'event')->first();
        $faqType = PostType::where('name', 'faq')->first();
        $caseStudyType = PostType::where('name', 'case-study')->first();
        if (!$postType || !$pageType || !$infoType) {
            $this->command?->warn('Post types not found. Run ContentSeeder first.');
            return;
        }

        // Categories and tags - get additional ones from ContentSeeder
        $business = TaxonomyTerm::where('slug', 'business')->first();
        $lifestyle = TaxonomyTerm::where('slug', 'lifestyle')->first();
        $travel = TaxonomyTerm::where('slug', 'travel')->first();
        $food = TaxonomyTerm::where('slug', 'food')->first();
        $health = TaxonomyTerm::where('slug', 'health')->first();
        $categoryTax = Taxonomy::where('name', 'category')->first();
        $tagTax = Taxonomy::where('name', 'post_tag')->first();
        $uncat = TaxonomyTerm::where('slug', 'uncategorized')->first();
        $tech = TaxonomyTerm::where('slug', 'technology')->first();
        $design = TaxonomyTerm::where('slug', 'design')->first();
        $laravel = TaxonomyTerm::where('slug', 'laravel')->first();
        $react = TaxonomyTerm::where('slug', 'react')->first();

        $php = TaxonomyTerm::where('slug', 'php')->first();
        $javascript = TaxonomyTerm::where('slug', 'javascript')->first();
        $typescript = TaxonomyTerm::where('slug', 'typescript')->first();
        $tailwindcss = TaxonomyTerm::where('slug', 'tailwindcss')->first();
        $docker = TaxonomyTerm::where('slug', 'docker')->first();
        $aws = TaxonomyTerm::where('slug', 'aws')->first();
        $api = TaxonomyTerm::where('slug', 'api')->first();
        $database = TaxonomyTerm::where('slug', 'database')->first();
        $security = TaxonomyTerm::where('slug', 'security')->first();
        $performance = TaxonomyTerm::where('slug', 'performance')->first();
        $testing = TaxonomyTerm::where('slug', 'testing')->first();
        $deployment = TaxonomyTerm::where('slug', 'deployment')->first();
        $tutorial = TaxonomyTerm::where('slug', 'tutorial')->first();
        $beginner = TaxonomyTerm::where('slug', 'beginner')->first();
        $advanced = TaxonomyTerm::where('slug', 'advanced')->first();
        $tips = TaxonomyTerm::where('slug', 'tips')->first();
        $bestpractices = TaxonomyTerm::where('slug', 'best-practices')->first();
        $mobile = TaxonomyTerm::where('slug', 'mobile')->first();

        $saas = TaxonomyTerm::where('slug', 'saas')->first();
        $cms = TaxonomyTerm::where('slug', 'cms')->first();
        $ecommerce = TaxonomyTerm::where('slug', 'ecommerce')->first();
        $apiintegration = TaxonomyTerm::where('slug', 'api-integration')->first();
        $uxui = TaxonomyTerm::where('slug', 'ux-ui')->first();
        $webdev = TaxonomyTerm::where('slug', 'web-development')->first();
        $fullstack = TaxonomyTerm::where('slug', 'full-stack')->first();
        $backend = TaxonomyTerm::where('slug', 'backend')->first();
        $portfolio = TaxonomyTerm::where('slug', 'portfolio')->first();
        $casestudies = TaxonomyTerm::where('slug', 'case-studies')->first();
        $cloud = TaxonomyTerm::where('slug', 'cloud-computing')->first();
        $eventsTerm = TaxonomyTerm::where('slug', 'events')->first();

        // Example posts - greatly expanded
        $posts = [
            [
                'title' => 'Welcome to Modulo CMS',
                'excerpt' => 'This is a demo post to showcase your new CMS.',
                'content' => '<p>Modulo CMS is installed and ready. Edit or delete this post, then start writing!</p>',
                'terms' => [$uncat?->id, $tech?->id, $laravel?->id],
            ],
            [
                'title' => 'Design System Overview',
                'excerpt' => 'A quick look at the design system and components.',
                'content' => '<p>Our design system focuses on accessibility, consistency, and performance.</p>',
                'terms' => [$design?->id, $react?->id],
            ],
            [
                'title' => 'Getting Started Guide',
                'excerpt' => 'Steps to build your first site with Modulo CMS.',
                'content' => '<ol><li>Create content types</li><li>Customize theme</li><li>Publish</li></ol>',
                'terms' => [$uncat?->id],
            ],
            [
                'title' => '10 Laravel Tips for Better Performance',
                'excerpt' => 'Optimize your Laravel applications with these proven techniques.',
                'content' => '<p>Laravel is a powerful framework, but performance optimization is crucial for production applications. Here are 10 tips to make your Laravel apps faster.</p><h3>1. Use Database Indexes</h3><p>Always add indexes to frequently queried columns...</p>',
                'terms' => [$tech?->id, $laravel?->id, $performance?->id],
            ],
            [
                'title' => 'Building Modern React Components',
                'excerpt' => 'Learn how to create reusable and performant React components.',
                'content' => '<p>React components are the building blocks of modern web applications. Here are best practices for creating maintainable components.</p><h3>Component Composition</h3><p>Use composition over inheritance...</p>',
                'terms' => [$tech?->id, $react?->id, $bestpractices?->id],
            ],
            [
                'title' => 'Database Design Principles',
                'excerpt' => 'Essential principles for designing scalable database schemas.',
                'content' => '<p>Good database design is crucial for application performance and maintainability. Here are the key principles to follow.</p><h3>Normalization</h3><p>Proper normalization reduces data redundancy...</p>',
                'terms' => [$tech?->id, $database?->id, $tutorial?->id],
            ],
            [
                'title' => 'Docker for PHP Development',
                'excerpt' => 'Set up a consistent development environment with Docker.',
                'content' => '<p>Docker provides a consistent environment across different machines. Here is how to set it up for PHP development.</p><h3>Dockerfile Basics</h3><p>Create a Dockerfile with PHP and required extensions...</p>',
                'terms' => [$tech?->id, $php?->id, $docker?->id, $deployment?->id],
            ],
            [
                'title' => 'CSS Grid vs Flexbox',
                'excerpt' => 'Understanding when to use CSS Grid versus Flexbox for layouts.',
                'content' => '<p>Both CSS Grid and Flexbox are powerful layout tools, but they serve different purposes. Here is when to use each.</p><h3>CSS Grid</h3><p>Best for two-dimensional layouts...</p>',
                'terms' => [$design?->id, $tailwindcss?->id, $tutorial?->id],
            ],
            [
                'title' => 'API Security Best Practices',
                'excerpt' => 'Protect your APIs from common security vulnerabilities.',
                'content' => '<p>APIs are critical components that need proper security measures. Here are essential security practices.</p><h3>Authentication</h3><p>Always use secure authentication methods...</p>',
                'terms' => [$tech?->id, $api?->id, $security?->id],
            ],
            [
                'title' => 'JavaScript Testing Strategies',
                'excerpt' => 'Different approaches to testing JavaScript applications.',
                'content' => '<p>Testing JavaScript applications ensures reliability and maintainability. Here are different testing strategies.</p><h3>Unit Testing</h3><p>Test individual functions and components...</p>',
                'terms' => [$tech?->id, $javascript?->id, $testing?->id],
            ],
            [
                'title' => 'AWS Deployment Guide',
                'excerpt' => 'Deploy your Laravel application to AWS with best practices.',
                'content' => '<p>AWS provides scalable infrastructure for web applications. Here is how to deploy Laravel to AWS.</p><h3>EC2 Setup</h3><p>Launch an EC2 instance with proper specifications...</p>',
                'terms' => [$tech?->id, $aws?->id, $deployment?->id, $laravel?->id],
            ],
            [
                'title' => 'TypeScript for React Developers',
                'excerpt' => 'Add type safety to your React applications with TypeScript.',
                'content' => '<p>TypeScript adds static typing to JavaScript, making React development more robust. Here is how to get started.</p><h3>Basic Types</h3><p>Define interfaces for your props and state...</p>',
                'terms' => [$tech?->id, $react?->id, $typescript?->id, $beginner?->id],
            ],
            [
                'title' => 'Tailwind CSS Tips and Tricks',
                'excerpt' => 'Maximize your productivity with Tailwind CSS utility classes.',
                'content' => '<p>Tailwind CSS provides utility classes for rapid styling. Here are some advanced tips and tricks.</p><h3>Custom Components</h3><p>Create reusable component classes...</p>',
                'terms' => [$design?->id, $tailwindcss?->id, $tips?->id],
            ],
            [
                'title' => 'Building a REST API with Laravel',
                'excerpt' => 'Create a complete REST API using Laravel and best practices.',
                'content' => '<p>Laravel makes API development straightforward. Here is how to build a robust REST API.</p><h3>API Routes</h3><p>Define API routes in routes/api.php...</p>',
                'terms' => [$tech?->id, $laravel?->id, $api?->id, $tutorial?->id],
            ],
            [
                'title' => 'React Hooks Deep Dive',
                'excerpt' => 'Master React Hooks for state management and side effects.',
                'content' => '<p>React Hooks revolutionized state management in React. Here is an in-depth look at custom hooks.</p><h3>Custom Hooks</h3><p>Create reusable stateful logic...</p>',
                'terms' => [$tech?->id, $react?->id, $advanced?->id],
            ],
            [
                'title' => 'Database Optimization Techniques',
                'excerpt' => 'Improve database performance with these optimization strategies.',
                'content' => '<p>Database performance is critical for application speed. Here are proven optimization techniques.</p><h3>Query Optimization</h3><p>Use EXPLAIN to analyze query performance...</p>',
                'terms' => [$tech?->id, $database?->id, $performance?->id],
            ],
            [
                'title' => 'CSS Animations and Transitions',
                'excerpt' => 'Create smooth and performant animations with CSS.',
                'content' => '<p>CSS animations can enhance user experience. Here is how to create smooth animations.</p><h3>Transition Property</h3><p>Use transitions for simple state changes...</p>',
                'terms' => [$design?->id, $tailwindcss?->id, $tutorial?->id],
            ],
            [
                'title' => 'Security Headers for Web Applications',
                'excerpt' => 'Implement essential security headers to protect your web app.',
                'content' => '<p>Security headers help protect against common web vulnerabilities. Here are essential headers to implement.</p><h3>Content Security Policy</h3><p>Prevent XSS attacks with CSP...</p>',
                'terms' => [$tech?->id, $security?->id, $bestpractices?->id],
            ],
            [
                'title' => 'Automated Testing with PHPUnit',
                'excerpt' => 'Set up automated testing for your PHP applications.',
                'content' => '<p>Automated testing ensures code quality and prevents regressions. Here is how to set up PHPUnit.</p><h3>Test Structure</h3><p>Organize tests in a logical structure...</p>',
                'terms' => [$tech?->id, $php?->id, $testing?->id],
            ],
            [
                'title' => 'Continuous Integration with GitHub Actions',
                'excerpt' => 'Automate your development workflow with GitHub Actions.',
                'content' => '<p>CI/CD pipelines improve development efficiency. Here is how to set up GitHub Actions for your project.</p><h3>Workflow Basics</h3><p>Create a .github/workflows directory...</p>',
                'terms' => [$tech?->id, $deployment?->id, $tutorial?->id],
            ],
            [
                'title' => 'Building Scalable Web Applications',
                'excerpt' => 'Architect your applications for growth and performance.',
                'content' => '<p>Scalability should be considered from the beginning. Here are architectural patterns for scalable web apps.</p><h3>Microservices vs Monolith</h3><p>Choose the right architecture for your needs...</p>',
                'terms' => [$tech?->id, $advanced?->id, $performance?->id],
            ],
            [
                'title' => 'Modern CSS Layout Techniques',
                'excerpt' => 'Master modern CSS layout methods for responsive design.',
                'content' => '<p>CSS has evolved significantly. Here are modern layout techniques every developer should know.</p><h3>Container Queries</h3><p>Style components based on their container size...</p>',
                'terms' => [$design?->id, $tailwindcss?->id, $advanced?->id],
            ],
            [
                'title' => 'PHP 8 Features You Should Know',
                'excerpt' => 'Explore the powerful features introduced in PHP 8.',
                'content' => '<p>PHP 8 brings many improvements and new features. Here are the most important ones for developers.</p><h3>Named Parameters</h3><p>Improve function call readability...</p>',
                'terms' => [$tech?->id, $php?->id, $tutorial?->id],
            ],
            [
                'title' => 'State Management in React',
                'excerpt' => 'Compare different state management solutions for React apps.',
                'content' => '<p>Managing state in React applications can be challenging. Here are popular state management solutions.</p><h3>Redux vs Context</h3><p>When to use each approach...</p>',
                'terms' => [$tech?->id, $react?->id, $advanced?->id],
            ],
            [
                'title' => 'Database Indexing Strategies',
                'excerpt' => 'Optimize your database queries with proper indexing.',
                'content' => '<p>Database indexes are crucial for performance. Here are strategies for effective indexing.</p><h3>Composite Indexes</h3><p>Use multiple columns for better performance...</p>',
                'terms' => [$tech?->id, $database?->id, $performance?->id],
            ],
            [
                'title' => 'Responsive Design Best Practices',
                'excerpt' => 'Create websites that work perfectly on all devices.',
                'content' => '<p>Responsive design ensures great user experience across devices. Here are best practices.</p><h3>Mobile-First Approach</h3><p>Design for mobile devices first...</p>',
                'terms' => [$design?->id, $bestpractices?->id, $tutorial?->id],
            ],
            [
                'title' => 'Laravel Package Development',
                'excerpt' => 'Create reusable Laravel packages for the community.',
                'content' => '<p>Laravel packages extend functionality. Here is how to create and publish your own packages.</p><h3>Package Structure</h3><p>Follow Laravel package conventions...</p>',
                'terms' => [$tech?->id, $laravel?->id, $advanced?->id],
            ],
            [
                'title' => 'JavaScript Performance Optimization',
                'excerpt' => 'Make your JavaScript applications faster and more efficient.',
                'content' => '<p>JavaScript performance affects user experience. Here are optimization techniques.</p><h3>Code Splitting</h3><p>Split your bundle into smaller chunks...</p>',
                'terms' => [$tech?->id, $javascript?->id, $performance?->id],
            ],
            [
                'title' => 'Docker Compose for Development',
                'excerpt' => 'Set up complex development environments with Docker Compose.',
                'content' => '<p>Docker Compose simplifies multi-container applications. Here is how to use it for development.</p><h3>Service Definition</h3><p>Define services in docker-compose.yml...</p>',
                'terms' => [$tech?->id, $docker?->id, $deployment?->id],
            ],
            [
                'title' => 'CSS-in-JS vs Traditional CSS',
                'excerpt' => 'Compare different approaches to styling React components.',
                'content' => '<p>Styling React components can be done in multiple ways. Here is a comparison of popular approaches.</p><h3>Styled Components</h3><p>Write CSS in your JavaScript files...</p>',
                'terms' => [$design?->id, $react?->id, $tutorial?->id],
            ],
            [
                'title' => 'API Rate Limiting Strategies',
                'excerpt' => 'Implement rate limiting to protect your APIs from abuse.',
                'content' => '<p>Rate limiting prevents API abuse and ensures fair usage. Here are implementation strategies.</p><h3>Token Bucket Algorithm</h3><p>Allow bursts of requests while maintaining limits...</p>',
                'terms' => [$tech?->id, $api?->id, $security?->id],
            ],
            [
                'title' => 'E-commerce Website Best Practices',
                'excerpt' => 'Build successful e-commerce websites with these proven strategies.',
                'content' => '<p>E-commerce websites require special considerations. Here are best practices for building them.</p><h3>Performance</h3><p>Fast loading times are crucial for conversions...</p>',
                'terms' => [$business?->id, $performance?->id, $bestpractices?->id],
            ],
            [
                'title' => 'GraphQL vs REST APIs',
                'excerpt' => 'Compare GraphQL and REST for API development.',
                'content' => '<p>GraphQL and REST are both popular API paradigms. Here is when to use each approach.</p><h3>Over-fetching</h3><p>REST APIs often return more data than needed...</p>',
                'terms' => [$tech?->id, $api?->id, $tutorial?->id],
            ],
            [
                'title' => 'Web Accessibility Guidelines',
                'excerpt' => 'Make your websites accessible to all users.',
                'content' => '<p>Web accessibility ensures everyone can use your website. Here are essential guidelines.</p><h3>Semantic HTML</h3><p>Use proper HTML elements for meaning...</p>',
                'terms' => [$design?->id, $bestpractices?->id, $tutorial?->id],
            ],
            [
                'title' => 'Progressive Web Apps Guide',
                'excerpt' => 'Convert your website into a progressive web app.',
                'content' => '<p>Progressive Web Apps combine web and native app features. Here is how to build them.</p><h3>Service Workers</h3><p>Enable offline functionality...</p>',
                'terms' => [$tech?->id, $advanced?->id, $deployment?->id],
            ],
            [
                'title' => 'MySQL vs PostgreSQL',
                'excerpt' => 'Compare MySQL and PostgreSQL for your projects.',
                'content' => '<p>Choosing the right database is important. Here is a comparison of MySQL and PostgreSQL.</p><h3>Features</h3><p>PostgreSQL offers more advanced features...</p>',
                'terms' => [$tech?->id, $database?->id, $tutorial?->id],
            ],
            [
                'title' => 'React Native Development',
                'excerpt' => 'Build mobile apps with React Native.',
                'content' => '<p>React Native allows building native mobile apps with React. Here is how to get started.</p><h3>Setup</h3><p>Install React Native CLI and set up your environment...</p>',
                'terms' => [$tech?->id, $react?->id, $mobile?->id, $beginner?->id],
            ],
            [
                'title' => 'SEO Fundamentals for Developers',
                'excerpt' => 'Improve your website search engine rankings.',
                'content' => '<p>SEO is crucial for website visibility. Here are fundamental SEO practices for developers.</p><h3>Meta Tags</h3><p>Use proper meta descriptions and titles...</p>',
                'terms' => [$tech?->id, $tutorial?->id, $bestpractices?->id],
            ],
            [
                'title' => 'Git Workflow Best Practices',
                'excerpt' => 'Improve your development workflow with Git.',
                'content' => '<p>Git workflows help teams collaborate effectively. Here are best practices for Git usage.</p><h3>Branch Strategy</h3><p>Use feature branches for development...</p>',
                'terms' => [$tech?->id, $deployment?->id, $bestpractices?->id],
            ],
            [
                'title' => 'Laravel Sanctum API Authentication',
                'excerpt' => 'Implement API authentication with Laravel Sanctum.',
                'content' => '<p>Laravel Sanctum provides a simple API authentication system. Here is how to implement it.</p><h3>Installation</h3><p>Add Sanctum to your Laravel project...</p>',
                'terms' => [$tech?->id, $laravel?->id, $api?->id, $security?->id],
            ],
            [
                'title' => 'CSS Custom Properties Guide',
                'excerpt' => 'Master CSS custom properties (CSS variables) for maintainable styles.',
                'content' => '<p>CSS custom properties make stylesheets more maintainable. Here is how to use them effectively.</p><h3>Global Variables</h3><p>Define site-wide design tokens...</p>',
                'terms' => [$design?->id, $tailwindcss?->id, $tutorial?->id],
            ],
            [
                'title' => 'Database Migration Strategies',
                'excerpt' => 'Handle database schema changes safely in production.',
                'content' => '<p>Database migrations need careful planning. Here are strategies for safe schema changes.</p><h3>Zero Downtime</h3><p>Plan migrations that don\'t require downtime...</p>',
                'terms' => [$tech?->id, $database?->id, $deployment?->id],
            ],
            [
                'title' => 'Vue.js vs React Comparison',
                'excerpt' => 'Compare Vue.js and React for your next project.',
                'content' => '<p>Vue.js and React are both popular frameworks. Here is an objective comparison.</p><h3>Learning Curve</h3><p>Vue.js has a gentler learning curve...</p>',
                'terms' => [$tech?->id, $react?->id, $tutorial?->id],
            ],
        ];

        foreach ($posts as $p) {
            $slug = Str::slug($p['title']);
            $post = Post::updateOrCreate(
                ['slug' => $slug, 'post_type_id' => $postType->id],
                [
                    'author_id' => $authorId,
                    'title' => $p['title'],
                    'excerpt' => $p['excerpt'],
                    'content' => $p['content'],
                    'status' => 'published',
                    'published_at' => now()->subDays(rand(1, 90)),
                ]
            );

            if (!empty($p['terms'])) {
                $post->taxonomyTerms()->syncWithoutDetaching(array_filter($p['terms']));
            }
        }

        // Example pages - expanded
        $pages = [
            [
                'title' => 'Home',
                'content' => '<h2>Welcome to Our Site</h2><p>This is the homepage of our amazing website built with Modulo CMS. Here you will find all the latest news, articles, and information about our services.</p><p>Feel free to explore and discover what we have to offer!</p>',
            ],
            [
                'title' => 'About Us',
                'content' => '<h2>About Our Company</h2><p>We are a modern digital agency specializing in web development, content management systems, and digital transformation. Our team of experienced developers and designers work together to create exceptional digital experiences.</p><h3>Our Mission</h3><p>To empower businesses with cutting-edge technology and intuitive content management solutions.</p>',
            ],
            [
                'title' => 'Services',
                'content' => '<h2>Our Services</h2><p>We offer comprehensive web development services including custom CMS solutions, e-commerce platforms, and digital marketing websites.</p><h3>Web Development</h3><p>Custom websites built with modern technologies and best practices.</p><h3>CMS Solutions</h3><p>Powerful content management systems tailored to your needs.</p>',
            ],
            [
                'title' => 'Portfolio',
                'content' => '<h2>Our Work</h2><p>Check out some of our recent projects and see how we help our clients achieve their digital goals.</p><p>Each project showcases our commitment to quality, performance, and user experience.</p>',
            ],
            [
                'title' => 'Blog',
                'content' => '<h2>Latest Insights</h2><p>Stay updated with the latest trends in web development, design, and technology. Our blog features articles written by industry experts.</p><p>From Laravel tips to React best practices, we cover topics that matter to developers and businesses alike.</p>',
            ],
            [
                'title' => 'Contact',
                'content' => '<h2>Get In Touch</h2><p>We would love to hear from you! Whether you have a project in mind or just want to say hello, don\'t hesitate to reach out.</p><h3>Contact Information</h3><p><strong>Email:</strong> hello@modulocms.com<br><strong>Phone:</strong> +1 (555) 123-4567<br><strong>Address:</strong> 123 Tech Street, Digital City, DC 12345</p>',
            ],
            [
                'title' => 'Privacy Policy',
                'content' => '<h2>Privacy Policy</h2><p>This privacy policy explains how we collect, use, and protect your personal information when you use our website.</p><h3>Information We Collect</h3><p>We collect information you provide directly to us, such as when you contact us or sign up for our newsletter.</p><h3>How We Use Information</h3><p>We use the information we collect to provide, maintain, and improve our services.</p>',
            ],
            [
                'title' => 'Terms of Service',
                'content' => '<h2>Terms of Service</h2><p>These terms and conditions outline the rules and regulations for the use of Modulo CMS.</p><h3>Acceptance of Terms</h3><p>By accessing this website, you accept these terms and conditions in full.</p><h3>Use License</h3><p>Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only.</p>',
            ],
            [
                'title' => 'FAQ',
                'content' => '<h2>Frequently Asked Questions</h2><h3>What is Modulo CMS?</h3><p>Modulo CMS is a modern, flexible content management system built with Laravel and React.</p><h3>How do I get started?</h3><p>Simply install Modulo CMS, run the setup wizard, and start creating content!</p><h3>Is it free?</h3><p>Yes, Modulo CMS is open source and free to use for personal and commercial projects.</p>',
            ],
            [
                'title' => 'Support',
                'content' => '<h2>Support</h2><p>Need help with Modulo CMS? Here are the resources available to you.</p><h3>Documentation</h3><p>Check our comprehensive documentation for detailed guides and tutorials.</p><h3>Community Forum</h3><p>Join our community forum to ask questions and share ideas with other users.</p><h3>GitHub Issues</h3><p>Report bugs or request features on our GitHub repository.</p>',
            ],
        ];

        foreach ($pages as $p) {
            $slug = Str::slug($p['title']);
            $post = Post::updateOrCreate(
                ['slug' => $slug, 'post_type_id' => $pageType->id],
                [
                    'author_id' => $authorId,
                    'title' => $p['title'],
                    'content' => $p['content'],
                    'status' => 'published',
                    'published_at' => now()->subDays(rand(1, 60)),
                ]
            );
            $createdPages[$p['title']] = $post;
        }

        // Example info items - greatly expanded
        $infoItems = [
            [
                'title' => 'Modulo CMS Version 1.0 Released',
                'excerpt' => 'We are excited to announce the official release of Modulo CMS version 1.0!',
                'content' => '<p>Today marks a significant milestone for our team as we release Modulo CMS version 1.0. This release includes all the features we promised in our roadmap and is now ready for production use.</p><p>Key features include:</p><ul><li>Intuitive content management</li><li>Flexible post types and taxonomies</li><li>Role-based access control</li><li>Modern React-based admin interface</li></ul>',
                'terms' => [$tech?->id],
            ],
            [
                'title' => 'Upcoming Webinar: Getting Started with Modulo',
                'excerpt' => 'Join us for a free webinar to learn how to get started with Modulo CMS.',
                'content' => '<p>We are hosting a free webinar next week to help new users get started with Modulo CMS. Our team will walk you through the key features and answer any questions you might have.</p><p><strong>Date:</strong> ' . now()->addWeek()->format('F j, Y') . '</p><p><strong>Time:</strong> 2:00 PM - 3:00 PM (EST)</p><p>Space is limited, so please register early to secure your spot!</p>',
                'terms' => [$tech?->id],
            ],
            [
                'title' => 'New Theme Collection Available',
                'excerpt' => 'We have released a collection of beautiful, responsive themes for Modulo CMS.',
                'content' => '<p>We are excited to announce the release of our new theme collection! These professionally designed themes are fully responsive and customizable.</p><p><strong>Features:</strong></p><ul><li>Modern, clean design</li><li>Fully responsive layout</li><li>Easy customization options</li><li>SEO optimized</li><li>Fast loading times</li></ul>',
                'terms' => [$design?->id],
            ],
            [
                'title' => 'Security Update: Version 1.0.1',
                'excerpt' => 'A security update has been released to address several important vulnerabilities.',
                'content' => '<p>We have released version 1.0.1 which includes important security fixes. We recommend updating your installations immediately.</p><p><strong>Changes:</strong></p><ul><li>Fixed XSS vulnerability in content rendering</li><li>Improved input validation</li><li>Enhanced CSRF protection</li><li>Updated dependencies to latest secure versions</li></ul>',
                'terms' => [$security?->id],
            ],
            [
                'title' => 'Holiday Schedule 2024',
                'excerpt' => 'Our office will be closed during the holiday season. Here are the important dates.',
                'content' => '<p>As we approach the holiday season, we want to inform you about our office schedule.</p><p><strong>Holiday Closures:</strong></p><ul><li>December 24-26: Closed for Christmas</li><li>December 31-January 1: Closed for New Year</li><li>January 15: Closed for Martin Luther King Jr. Day</li></ul><p>We will resume normal business hours on the next business day following each closure.</p>',
                'terms' => [$business?->id],
            ],
            [
                'title' => 'Performance Improvements in Latest Release',
                'excerpt' => 'The latest update includes significant performance improvements and optimizations.',
                'content' => '<p>We are pleased to announce that our latest release includes major performance improvements that will make your CMS faster and more efficient.</p><p><strong>Performance Enhancements:</strong></p><ul><li>30% faster page load times</li><li>Optimized database queries</li><li>Improved caching mechanisms</li><li>Reduced memory usage</li><li>Better asset optimization</li></ul>',
                'terms' => [$performance?->id, $tech?->id],
            ],
            [
                'title' => 'New Partnership Announcement',
                'excerpt' => 'We are excited to announce our new partnership with leading web hosting provider.',
                'content' => '<p>We are thrilled to announce our strategic partnership with CloudHost Pro, a leading web hosting provider. This partnership will allow us to offer our customers enhanced hosting solutions optimized for Modulo CMS.</p><p><strong>Benefits:</strong></p><ul><li>99.9% uptime guarantee</li><li>Free SSL certificates</li><li>Automated backups</li><li>24/7 technical support</li><li>Optimized servers for Modulo CMS</li></ul>',
                'terms' => [$business?->id, $deployment?->id],
            ],
            [
                'title' => 'Content Strategy Workshop',
                'excerpt' => 'Join our free workshop on developing effective content strategies for your business.',
                'content' => '<p>Are you struggling to create engaging content that drives results? Join our comprehensive workshop on content strategy development.</p><p><strong>Workshop Topics:</strong></p><ul><li>Understanding your audience</li><li>Creating content that converts</li><li>SEO optimization strategies</li><li>Social media content planning</li><li>Measuring content success</li></ul><p><strong>Date:</strong> ' . now()->addDays(14)->format('F j, Y') . '<br><strong>Time:</strong> 10:00 AM - 4:00 PM<br><strong>Location:</strong> Online (Zoom)</p>',
                'terms' => [$business?->id, $tutorial?->id],
            ],
            [
                'title' => 'Database Migration Best Practices',
                'excerpt' => 'Learn how to safely migrate your database schema in production environments.',
                'content' => '<p>Database migrations require careful planning and execution. Here are best practices for zero-downtime migrations.</p><p><strong>Planning Phase:</strong></p><ul><li>Analyze impact on existing data</li><li>Create rollback plan</li><li>Test thoroughly in staging</li><li>Schedule during low-traffic periods</li></ul>',
                'terms' => [$tech?->id, $database?->id, $deployment?->id],
            ],
            [
                'title' => 'Mobile-First Design Principles',
                'excerpt' => 'Design for mobile devices first, then enhance for larger screens.',
                'content' => '<p>Mobile-first design ensures great user experience on all devices. Here are the key principles to follow.</p><p><strong>Progressive Enhancement:</strong></p><ul><li>Start with core functionality</li><li>Add enhancements for larger screens</li><li>Test on actual devices</li><li>Optimize for touch interactions</li></ul>',
                'terms' => [$design?->id, null, $bestpractices?->id],
            ],
        ];

        foreach ($infoItems as $info) {
            $slug = Str::slug($info['title']);
            $post = Post::updateOrCreate(
                ['slug' => $slug, 'post_type_id' => $infoType->id],
                [
                    'author_id' => $authorId,
                    'title' => $info['title'],
                    'excerpt' => $info['excerpt'],
                    'content' => $info['content'],
                    'status' => 'published',
                    'published_at' => now()->subDays(rand(1, 90)),
                ]
            );

            if (!empty($info['terms'])) {
                $post->taxonomyTerms()->syncWithoutDetaching(array_filter($info['terms']));
            }
        }

        $createdPages = [];
        foreach ($pages as $pg) {
            $slug = Str::slug($pg['title']);
            $page = Post::updateOrCreate(
                ['slug' => $slug, 'post_type_id' => $pageType->id],
                [
                    'author_id' => $authorId,
                    'title' => $pg['title'],
                    'content' => $pg['content'],
                    'status' => 'published',
                    'published_at' => now(),
                ]
            );
            $createdPages[$pg['title']] = $page;
        }

        // Optional: child page under About
        if (isset($createdPages['About'])) {
            $team = Post::updateOrCreate(
                ['slug' => 'team', 'post_type_id' => $pageType->id],
                [
                    'author_id' => $authorId,
                    'title' => 'Team',
                    'content' => '<p>Meet the team behind Modulo CMS.</p>',
                    'parent_id' => $createdPages['About']->id,
                    'status' => 'published',
                    'published_at' => now(),
                ]
            );
        }

        // Product content is now handled by ModuloShop plugin

        if ($portfolioType) {
            $portfolioContent = [
                [
                    'title' => 'TechCorp Website Redesign',
                    'excerpt' => 'Complete website redesign for a leading technology company.',
                    'content' => '<p>TechCorp needed a modern, professional website that reflected their innovative culture and cutting-edge technology solutions.</p><h3>Challenge:</h3><p>Outdated design and poor user experience</p><h3>Solution:</h3><p>Modern React-based frontend with Laravel backend</p><h3>Results:</h3><p>300% increase in user engagement, 50% faster load times</p>',
                    'terms' => [$webdev?->id, $portfolio?->id, $fullstack?->id],
                ],
                [
                    'title' => 'E-commerce Platform',
                    'excerpt' => 'Full-featured online store with advanced product management.',
                    'content' => '<p>Built a comprehensive e-commerce platform for a retail client with complex product catalog and inventory management needs.</p><h3>Features:</h3><ul><li>Advanced product filtering</li><li>Inventory management</li><li>Multi-vendor support</li><li>Analytics dashboard</li></ul>',
                    'terms' => [$ecommerce?->id, $portfolio?->id, $backend?->id],
                ],
                [
                    'title' => 'Healthcare Management System',
                    'excerpt' => 'Secure patient management system for medical practices.',
                    'content' => '<p>Developed a HIPAA-compliant patient management system with secure data handling and appointment scheduling.</p><h3>Security:</h3><p>End-to-end encryption, audit trails, role-based access</p><h3>Features:</h3><p>Patient records, appointment scheduling, billing integration</p>',
                    'terms' => [$health?->id, $portfolio?->id, $security?->id],
                ],
            ];

            foreach ($portfolioContent as $item) {
                $slug = Str::slug($item['title']);
                $post = Post::updateOrCreate(
                    ['slug' => $slug, 'post_type_id' => $portfolioType->id],
                    [
                        'author_id' => $authorId,
                        'title' => $item['title'],
                        'excerpt' => $item['excerpt'],
                        'content' => $item['content'],
                        'status' => 'published',
                        'published_at' => now()->subDays(rand(1, 60)),
                    ]
                );

                if (!empty($item['terms'])) {
                    $post->taxonomyTerms()->syncWithoutDetaching(array_filter($item['terms']));
                }
            }
        }

        if ($testimonialType) {
            $testimonials = [
                [
                    'title' => 'Sarah Johnson - CEO, TechCorp',
                    'excerpt' => 'Modulo CMS transformed our online presence completely.',
                    'content' => '"Working with Modulo CMS was a game-changer for our company. The intuitive interface and powerful features allowed us to launch our new website in record time. Our users love the improved experience, and we\'ve seen a significant increase in engagement."',
                ],
                [
                    'title' => 'Mike Chen - CTO, StartupXYZ',
                    'excerpt' => 'The flexibility and performance exceeded our expectations.',
                    'content' => '"We evaluated several CMS solutions and Modulo stood out for its modern architecture and developer-friendly approach. The API integrations and customization options gave us exactly what we needed to build a unique user experience."',
                ],
                [
                    'title' => 'Emily Davis - Marketing Director, RetailPlus',
                    'excerpt' => 'Easy to use and incredibly powerful at the same time.',
                    'content' => '"Our marketing team loves how easy it is to update content and create new campaigns. The SEO features and social media integration have significantly improved our online visibility and customer engagement."',
                ],
            ];

            foreach ($testimonials as $testimonial) {
                $slug = Str::slug($testimonial['title']);
                Post::updateOrCreate(
                    ['slug' => $slug, 'post_type_id' => $testimonialType->id],
                    [
                        'author_id' => $authorId,
                        'title' => $testimonial['title'],
                        'excerpt' => $testimonial['excerpt'],
                        'content' => $testimonial['content'],
                        'status' => 'published',
                        'published_at' => now()->subDays(rand(1, 90)),
                    ]
                );
            }
        }

        if ($eventType) {
            $events = [
                [
                    'title' => 'Modulo CMS Developer Conference 2024',
                    'excerpt' => 'Join us for our annual developer conference featuring workshops and networking.',
                    'content' => '<p>The Modulo CMS Developer Conference brings together developers, designers, and business leaders to share knowledge and network.</p><h3>Agenda:</h3><ul><li>Keynote: Future of Content Management</li><li>Workshop: Advanced Theme Development</li><li>Panel: Scaling Web Applications</li><li>Networking Reception</li></ul><p><strong>Date:</strong> March 15-16, 2024<br><strong>Location:</strong> San Francisco, CA<br><strong>Cost:</strong> $299 (Early Bird)</p>',
                    'terms' => [$eventsTerm?->id, $tech?->id],
                ],
                [
                    'title' => 'Web Performance Optimization Workshop',
                    'excerpt' => 'Learn advanced techniques for optimizing web application performance.',
                    'content' => '<p>This hands-on workshop covers advanced performance optimization techniques for modern web applications.</p><h3>Topics:</h3><ul><li>Database query optimization</li><li>Asset optimization and caching</li><li>CDN configuration</li><li>Monitoring and analytics</li></ul><p><strong>Instructor:</strong> Performance expert Jane Smith<br><strong>Duration:</strong> 4 hours<br><strong>Format:</strong> Online interactive workshop</p>',
                    'terms' => [$eventsTerm?->id, $performance?->id],
                ],
            ];

            foreach ($events as $event) {
                $slug = Str::slug($event['title']);
                $post = Post::updateOrCreate(
                    ['slug' => $slug, 'post_type_id' => $eventType->id],
                    [
                        'author_id' => $authorId,
                        'title' => $event['title'],
                        'excerpt' => $event['excerpt'],
                        'content' => $event['content'],
                        'status' => 'published',
                        'published_at' => now()->subDays(rand(1, 30)),
                    ]
                );

                if (!empty($event['terms'])) {
                    $post->taxonomyTerms()->syncWithoutDetaching(array_filter($event['terms']));
                }
            }
        }

        if ($faqType) {
            $faqs = [
                [
                    'title' => 'How do I install Modulo CMS?',
                    'excerpt' => 'Step-by-step guide to installing Modulo CMS on your server.',
                    'content' => '<p>Installing Modulo CMS is straightforward:</p><ol><li>Download the latest release from our website</li><li>Upload files to your web server</li><li>Create a database and run the installer</li><li>Configure your settings and you\'re ready to go!</li></ol><p>Check our documentation for detailed instructions.</p>',
                ],
                [
                    'title' => 'What are the system requirements?',
                    'excerpt' => 'Minimum and recommended system requirements for Modulo CMS.',
                    'content' => '<p><strong>Minimum Requirements:</strong></p><ul><li>PHP 8.1 or higher</li><li>MySQL 5.7 or PostgreSQL 9.5</li><li>512MB RAM</li><li>100MB disk space</li></ul><p><strong>Recommended:</strong></p><ul><li>PHP 8.2+</li><li>MySQL 8.0 or PostgreSQL 13+</li><li>1GB RAM</li><li>SSD storage</li></ul>',
                ],
                [
                    'title' => 'Is Modulo CMS free?',
                    'excerpt' => 'Information about Modulo CMS pricing and licensing.',
                    'content' => '<p>Yes! Modulo CMS is open source and completely free to use. You can download, install, and use it for personal and commercial projects without any licensing fees.</p><p>We offer premium support and hosting options for those who need additional services.</p>',
                ],
                [
                    'title' => 'How do I create custom themes?',
                    'excerpt' => 'Guide to creating and customizing themes in Modulo CMS.',
                    'content' => '<p>Creating custom themes in Modulo CMS is easy:</p><ol><li>Use our theme builder tool</li><li>Customize existing templates</li><li>Add your own CSS and JavaScript</li><li>Publish and activate your theme</li></ol><p>Check our theme development documentation for detailed guides.</p>',
                ],
            ];

            foreach ($faqs as $faq) {
                $slug = Str::slug($faq['title']);
                Post::updateOrCreate(
                    ['slug' => $slug, 'post_type_id' => $faqType->id],
                    [
                        'author_id' => $authorId,
                        'title' => $faq['title'],
                        'excerpt' => $faq['excerpt'],
                        'content' => $faq['content'],
                        'status' => 'published',
                        'published_at' => now()->subDays(rand(1, 30)),
                    ]
                );
            }
        }

        if ($caseStudyType) {
            $caseStudies = [
                [
                    'title' => 'E-commerce Success: 300% Revenue Increase',
                    'excerpt' => 'How TechStore increased revenue by 300% with Modulo CMS.',
                    'content' => '<h2>Challenge</h2><p>TechStore was struggling with an outdated e-commerce platform that was slow, difficult to manage, and not mobile-friendly.</p><h2>Solution</h2><p>We implemented Modulo CMS with our e-commerce integration, creating a modern, fast, and user-friendly online store.</p><h2>Results</h2><ul><li>300% increase in online revenue</li><li>50% faster page load times</li><li>70% increase in mobile conversions</li><li>Significant improvement in user experience</li></ul><h2>Technologies Used</h2><p>Laravel, React, Tailwind CSS, Stripe integration, advanced caching</p>',
                    'terms' => [$casestudies?->id, $ecommerce?->id, $performance?->id],
                ],
                [
                    'title' => 'B2B Platform: Scaling from 1K to 100K Users',
                    'excerpt' => 'How a B2B platform scaled successfully using Modulo CMS.',
                    'content' => '<h2>The Challenge</h2><p>Our client\'s B2B platform was built on legacy technology and couldn\'t handle growing user demand.</p><h2>Our Approach</h2><p>We rebuilt the platform using Modulo CMS with a microservices architecture, implementing advanced caching, database optimization, and cloud infrastructure.</p><h2>Outcomes</h2><ul><li>Successfully scaled to 100,000+ users</li><li>99.9% uptime achieved</li><li>10x performance improvement</li><li>Reduced infrastructure costs by 40%</li></ul><h2>Key Features</h2><p>Advanced user management, API integrations, real-time analytics, multi-tenant architecture</p>',
                    'terms' => [$casestudies?->id, $saas?->id, $cloud?->id],
                ],
            ];

            foreach ($caseStudies as $case) {
                $slug = Str::slug($case['title']);
                $post = Post::updateOrCreate(
                    ['slug' => $slug, 'post_type_id' => $caseStudyType->id],
                    [
                        'author_id' => $authorId,
                        'title' => $case['title'],
                        'excerpt' => $case['excerpt'],
                        'content' => $case['content'],
                        'status' => 'published',
                        'published_at' => now()->subDays(rand(1, 60)),
                    ]
                );

                if (!empty($case['terms'])) {
                    $post->taxonomyTerms()->syncWithoutDetaching(array_filter($case['terms']));
                }
            }
        }
    }
}
