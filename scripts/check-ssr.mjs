import assert from 'node:assert/strict';

const ziggy = {
    url: 'http://localhost',
    port: null,
    defaults: {},
    location: 'http://localhost/login',
    routes: Object.fromEntries(
        [
            ['home', '/'],
            ['login', 'login'],
            ['register', 'register'],
            ['password.request', 'forgot-password'],
        ].map(([name, uri]) => [name, { uri, methods: ['GET', 'HEAD'] }]),
    ),
};
const base = {
    url: '/login',
    version: null,
    clearHistory: false,
    encryptHistory: false,
    rememberedState: {},
    props: { errors: {}, ziggy, auth: { user: null } },
};
for (const [component, props, expected] of [
    ['auth/login', { canResetPassword: true }, 'Log in to your account'],
    [
        'Themes/ModernReact/Page',
        {
            page: { id: 1, title: 'SSR theme probe', slug: 'ssr-probe', content: '<p>Rendered on the server</p>', published_at: '', updated_at: '' },
            site: { name: 'SSR site' },
            menus: {},
            theme: {},
        },
        'Rendered on the server',
    ],
]) {
    const response = await fetch('http://127.0.0.1:13714/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...base, component, props: { ...base.props, ...props } }),
        signal: AbortSignal.timeout(10_000),
    });
    assert.equal(response.status, 200, await response.clone().text());
    const rendered = await response.json();
    assert.ok(rendered.body.includes(expected), `Missing rendered content for ${component}`);
    assert.ok(Array.isArray(rendered.head), 'SSR must return the document head');
    console.log(`PASS: SSR renders ${component}`);
}
