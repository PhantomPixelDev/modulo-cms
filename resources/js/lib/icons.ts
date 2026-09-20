import {
    BookOpen,
    Boxes,
    Briefcase,
    Calendar,
    Camera,
    Circle,
    Cog,
    CreditCard,
    File,
    Files,
    FileText,
    Folder,
    FolderTree,
    Github,
    Globe,
    Heart,
    HelpCircle,
    Image,
    Images,
    Info,
    LayoutDashboard,
    LayoutGrid,
    List,
    Lock,
    type LucideIcon,
    Mail,
    MapPin,
    Menu,
    MessageCircle,
    Newspaper,
    Package,
    Palette,
    Plug,
    Plus,
    Puzzle,
    Send,
    Settings,
    Shield,
    ShieldCheck,
    ShoppingBag,
    ShoppingCart,
    Star,
    Store,
    Tag,
    Tags,
    TrendingUp,
    User,
    Users,
    Video,
    Wrench,
} from 'lucide-react';

/**
 * Icons offered by the icon picker and resolvable from stored names
 * (post type / taxonomy menu_icon).
 *
 * Import every icon explicitly: `import * as LucideIcons` plus a dynamic
 * lookup defeats tree shaking and pulled the whole icon library (~540 kB)
 * into the admin bundle.
 */
export const ICON_OPTIONS: ReadonlyArray<{ name: string; label: string; Icon: LucideIcon }> = [
    { name: 'file-text', label: 'Document', Icon: FileText },
    { name: 'newspaper', label: 'News', Icon: Newspaper },
    { name: 'file', label: 'File', Icon: File },
    { name: 'files', label: 'Files', Icon: Files },
    { name: 'folder', label: 'Folder', Icon: Folder },
    { name: 'folder-tree', label: 'Folder Tree', Icon: FolderTree },
    { name: 'tag', label: 'Tag', Icon: Tag },
    { name: 'tags', label: 'Tags', Icon: Tags },
    { name: 'boxes', label: 'Boxes', Icon: Boxes },
    { name: 'shopping-bag', label: 'Shopping Bag', Icon: ShoppingBag },
    { name: 'shopping-cart', label: 'Cart', Icon: ShoppingCart },
    { name: 'store', label: 'Store', Icon: Store },
    { name: 'package', label: 'Package', Icon: Package },
    { name: 'credit-card', label: 'Payment', Icon: CreditCard },
    { name: 'users', label: 'Users', Icon: Users },
    { name: 'user', label: 'User', Icon: User },
    { name: 'shield', label: 'Shield', Icon: Shield },
    { name: 'shield-check', label: 'Security', Icon: ShieldCheck },
    { name: 'lock', label: 'Lock', Icon: Lock },
    { name: 'image', label: 'Image', Icon: Image },
    { name: 'images', label: 'Gallery', Icon: Images },
    { name: 'camera', label: 'Camera', Icon: Camera },
    { name: 'video', label: 'Video', Icon: Video },
    { name: 'menu', label: 'Menu', Icon: Menu },
    { name: 'layout-dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { name: 'layout-grid', label: 'Grid', Icon: LayoutGrid },
    { name: 'list', label: 'List', Icon: List },
    { name: 'settings', label: 'Settings', Icon: Settings },
    { name: 'cog', label: 'Cog', Icon: Cog },
    { name: 'wrench', label: 'Tools', Icon: Wrench },
    { name: 'puzzle', label: 'Plugin', Icon: Puzzle },
    { name: 'plug', label: 'Connect', Icon: Plug },
    { name: 'mail', label: 'Email', Icon: Mail },
    { name: 'message-circle', label: 'Message', Icon: MessageCircle },
    { name: 'send', label: 'Send', Icon: Send },
    { name: 'palette', label: 'Theme', Icon: Palette },
    { name: 'globe', label: 'Globe', Icon: Globe },
    { name: 'map-pin', label: 'Location', Icon: MapPin },
    { name: 'calendar', label: 'Calendar', Icon: Calendar },
    { name: 'star', label: 'Star', Icon: Star },
    { name: 'heart', label: 'Heart', Icon: Heart },
    { name: 'briefcase', label: 'Portfolio', Icon: Briefcase },
    { name: 'trending-up', label: 'Trending', Icon: TrendingUp },
    { name: 'help-circle', label: 'Help', Icon: HelpCircle },
    { name: 'info', label: 'Info', Icon: Info },
    { name: 'book-open', label: 'Docs', Icon: BookOpen },
    { name: 'github', label: 'GitHub', Icon: Github },
    { name: 'circle', label: 'Circle', Icon: Circle },
    { name: 'plus', label: 'Plus', Icon: Plus },
];

export const iconMap: Record<string, LucideIcon> = Object.fromEntries(ICON_OPTIONS.map(({ name, Icon }) => [name, Icon]));

/**
 * Resolve a stored kebab-case icon name; unknown names fall back to a circle.
 */
export function getIcon(iconName: string | null | undefined): LucideIcon {
    if (!iconName) {
        return Circle;
    }

    return iconMap[iconName] ?? Circle;
}
