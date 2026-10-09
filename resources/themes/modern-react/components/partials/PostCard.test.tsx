import { describe, expect, it } from 'vitest';
import { postUrl } from './PostCard';

describe('public card links', () => {
    it('uses the server path when available', () => {
        expect(postUrl({ slug: 'about', url: '/about', post_type: { route_prefix: 'posts' } })).toBe('/about');
    });
    it('keeps root pages and legacy page props at the site root', () => {
        expect(postUrl({ slug: 'about', post_type: { name: 'page', route_prefix: null } })).toBe('/about');
        expect(postUrl({ slug: 'about', post_type: { name: 'page' } })).toBe('/about');
        expect(postUrl({ slug: 'about', post_type: { route_prefix: '/' } })).toBe('/about');
    });
    it('retains classic posts, announcements and plugin prefixes', () => {
        expect(postUrl({ slug: 'intro' })).toBe('/posts/intro');
        expect(postUrl({ slug: 'webinar', post_type: { route_prefix: 'infos' } })).toBe('/infos/webinar');
        expect(postUrl({ slug: 'notebook', post_type: { route_prefix: '/shop/' } })).toBe('/shop/notebook');
    });
});
