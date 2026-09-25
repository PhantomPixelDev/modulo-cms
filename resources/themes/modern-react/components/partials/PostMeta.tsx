import { Check, Facebook, Linkedin, Link as LinkIcon, Twitter } from 'lucide-react';
import { useState } from 'react';
import { buttonClass, formatDate, useThemeT } from './ui';

interface Post {
    id: number;
    title: string;
    slug: string;
    published_at: string;
    updated_at: string;
    author?: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    post_type?: {
        name: string;
        label: string;
        route_prefix?: string;
    };
}

interface PostMetaProps {
    post: Post;
    /** Kept for backwards compatibility with templates that still pass it. */
    theme?: unknown;
}

export default function PostMeta({ post }: PostMetaProps) {
    const tt = useThemeT();
    const [copied, setCopied] = useState(false);
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const encodedTitle = encodeURIComponent(post.title);
    const encodedUrl = encodeURIComponent(currentUrl);

    const shareLinks = [
        { label: 'X / Twitter', icon: Twitter, href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
        { label: 'Facebook', icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
        { label: 'LinkedIn', icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    ];

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard?.writeText(currentUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard unavailable (e.g. insecure context) – nothing to do.
        }
    };

    const updated = post.updated_at && post.updated_at !== post.published_at ? formatDate(post.updated_at, { dateStyle: 'long' }) : '';

    return (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {post.author ? (
                <div className="flex items-center gap-3">
                    {post.author.avatar ? (
                        <img src={post.author.avatar} alt="" className="size-10 rounded-full object-cover" />
                    ) : (
                        <span
                            className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
                            aria-hidden="true"
                        >
                            {post.author.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                    <div className="text-sm">
                        <p className="font-medium text-foreground">{post.author.name}</p>
                        {updated && <p className="text-muted-foreground">{tt('post.updated', 'Updated :date', { date: updated })}</p>}
                    </div>
                </div>
            ) : (
                <span />
            )}

            <div className="flex items-center gap-1">
                <span className="mr-2 text-sm text-muted-foreground">{tt('post.share', 'Share')}</span>
                {shareLinks.map(({ label, icon: Icon, href }) => (
                    <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className={buttonClass('ghost', 'sm', 'size-8 px-0')}
                    >
                        <Icon />
                    </a>
                ))}
                <button
                    type="button"
                    onClick={copyToClipboard}
                    aria-label={tt('post.copy_link', 'Copy link')}
                    className={buttonClass('ghost', 'sm', 'size-8 px-0')}
                >
                    {copied ? <Check className="text-success" /> : <LinkIcon />}
                </button>
            </div>
        </div>
    );
}
