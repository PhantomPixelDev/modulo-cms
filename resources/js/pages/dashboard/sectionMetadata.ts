export function sectionMetadata(section: string | undefined, t: (key: string) => string) {
    const key = (section ?? '').replace(/^dashboard\.admin\./, '').replace(/\.index$/, '');
    const parts = key.split('.');
    const group = parts[0];
    const known =
        !group ||
        [
            'posts',
            'pages',
            'media',
            'menus',
            'comments',
            'themes',
            'plugins',
            'users',
            'roles',
            'locales',
            'languages',
            'post-types',
            'taxonomies',
            'taxonomy-terms',
            'templates',
            'translations',
            'sitemap',
            'site-settings',
            'settings',
            'system',
            'trash',
        ].includes(group);
    const navKeys: Record<string, string> = {
        'post-types': 'post_types',
        'taxonomy-terms': 'taxonomies',
        'site-settings': 'site_settings',
        settings: 'site_settings',
    };
    const labelKey = group === 'system' && parts[1] ? parts[1] : (navKeys[group] ?? group.replaceAll('-', '_'));
    const label = group ? t(`dashboard.nav.${labelKey}`) : t('dashboard.nav.dashboard');
    const action = parts.at(-1);
    const actionLabel = action && ['create', 'edit', 'show'].includes(action) ? t(`dashboard.editor.${action}`) : '';
    return {
        known,
        title: actionLabel ? `${actionLabel} ${label}` : label,
        breadcrumbs: [
            { title: t('dashboard.nav.dashboard'), href: '/dashboard' },
            ...(group
                ? [
                      {
                          title: label,
                          href: `/dashboard/admin/${group === 'site-settings' ? 'settings' : group}${group === 'system' && parts[1] ? `/${parts[1]}` : ''}`,
                      },
                  ]
                : []),
            ...(actionLabel ? [{ title: actionLabel, href: '#' }] : []),
        ],
    };
}
