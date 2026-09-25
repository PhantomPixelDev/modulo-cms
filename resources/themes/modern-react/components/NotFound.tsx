import { Head } from '@inertiajs/react';
import { ArrowLeft, Search } from 'lucide-react';
import React from 'react';
import Layout from './Layout';
import { ButtonLink, useThemeT } from './partials/ui';

const NotFound: React.FC = () => {
    const tt = useThemeT();

    return (
        <Layout title={tt('not_found.title', 'Page not found')}>
            <Head title={tt('not_found.title', 'Page not found')} />
            <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center sm:py-24">
                <p className="text-sm font-semibold text-primary tabular-nums">404</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{tt('not_found.title', 'Page not found')}</h1>
                <p className="mt-4 text-muted-foreground">{tt('not_found.description', "Sorry, we couldn't find the page you're looking for.")}</p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <ButtonLink href="/">
                        <ArrowLeft />
                        {tt('not_found.home', 'Go back home')}
                    </ButtonLink>
                    <ButtonLink href="/search" variant="outline">
                        <Search />
                        {tt('not_found.search', 'Search the site')}
                    </ButtonLink>
                </div>
            </div>
        </Layout>
    );
};

export default NotFound;
