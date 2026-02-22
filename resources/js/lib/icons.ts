import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

/**
 * Convert kebab-case icon name to PascalCase and get the Lucide icon component
 * e.g., "shopping-bag" -> ShoppingBag
 */
export function getIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) {
    return LucideIcons.Circle;
  }

  // Convert kebab-case to PascalCase
  const pascalCase = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // Look up the icon in Lucide
  const icon = (LucideIcons as unknown as Record<string, LucideIcon>)[pascalCase];
  
  return icon || LucideIcons.Circle;
}

/**
 * Common icon mappings for quick reference
 */
export const iconMap: Record<string, LucideIcon> = {
  // Content
  'file-text': LucideIcons.FileText,
  'file': LucideIcons.File,
  'files': LucideIcons.Files,
  'newspaper': LucideIcons.Newspaper,
  
  // Organization
  'folder': LucideIcons.Folder,
  'folder-tree': LucideIcons.FolderTree,
  'tag': LucideIcons.Tag,
  'tags': LucideIcons.Tags,
  'boxes': LucideIcons.Boxes,
  
  // Shop
  'shopping-bag': LucideIcons.ShoppingBag,
  'shopping-cart': LucideIcons.ShoppingCart,
  'store': LucideIcons.Store,
  'package': LucideIcons.Package,
  'credit-card': LucideIcons.CreditCard,
  
  // Users & Security
  'users': LucideIcons.Users,
  'user': LucideIcons.User,
  'shield': LucideIcons.Shield,
  'shield-check': LucideIcons.ShieldCheck,
  'lock': LucideIcons.Lock,
  
  // Media
  'image': LucideIcons.Image,
  'images': LucideIcons.Images,
  'camera': LucideIcons.Camera,
  'video': LucideIcons.Video,
  
  // Navigation & Layout
  'menu': LucideIcons.Menu,
  'layout-dashboard': LucideIcons.LayoutDashboard,
  'layout-grid': LucideIcons.LayoutGrid,
  'list': LucideIcons.List,
  
  // Settings & Tools
  'settings': LucideIcons.Settings,
  'cog': LucideIcons.Cog,
  'wrench': LucideIcons.Wrench,
  'puzzle': LucideIcons.Puzzle,
  'plug': LucideIcons.Plug,
  
  // Communication
  'mail': LucideIcons.Mail,
  'message-circle': LucideIcons.MessageCircle,
  'send': LucideIcons.Send,
  
  // Misc
  'palette': LucideIcons.Palette,
  'globe': LucideIcons.Globe,
  'map-pin': LucideIcons.MapPin,
  'calendar': LucideIcons.Calendar,
  'star': LucideIcons.Star,
  'heart': LucideIcons.Heart,
  'briefcase': LucideIcons.Briefcase,
  'trending-up': LucideIcons.TrendingUp,
  'help-circle': LucideIcons.HelpCircle,
  'info': LucideIcons.Info,
  'book-open': LucideIcons.BookOpen,
  'github': LucideIcons.Github,
  'circle': LucideIcons.Circle,
  'plus': LucideIcons.Plus,
};
