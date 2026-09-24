import { File, FileText, ImageIcon, Layers, Palette, Shield, Tags, Users, type LucideIcon } from 'lucide-react';

export interface DashboardStatsProps {
    users?: number;
    roles?: number;
    posts?: number;
    media?: number;
    pages?: number;
    postTypes?: number;
    taxonomies?: number;
    themes?: number;
}

interface StatConfig {
    title: string;
    value: number;
    icon: LucideIcon;
}

export function DashboardStats({
    users = 0,
    roles = 0,
    posts = 0,
    media = 0,
    pages = 0,
    postTypes = 0,
    taxonomies = 0,
    themes = 0,
}: DashboardStatsProps) {
    const stats: StatConfig[] = [
        { title: 'Total Users', value: users, icon: Users },
        { title: 'Roles', value: roles, icon: Shield },
        { title: 'Posts', value: posts, icon: FileText },
        { title: 'Pages', value: pages, icon: File },
        { title: 'Post Types', value: postTypes, icon: Layers },
        { title: 'Taxonomies', value: taxonomies, icon: Tags },
        { title: 'Themes', value: themes, icon: Palette },
        { title: 'Media Files', value: media, icon: ImageIcon },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {stats.map((stat) => {
                const IconComponent = stat.icon;
                return (
                    <div key={stat.title} className="rounded-xl border bg-card p-4 shadow-xs transition-colors hover:border-input">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                            <IconComponent className="size-4 text-muted-foreground" />
                        </div>
                        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{stat.value.toLocaleString()}</p>
                    </div>
                );
            })}
        </div>
    );
}
