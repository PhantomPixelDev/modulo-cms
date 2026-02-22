import * as React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getIcon } from '@/lib/icons';
import {
  FileText, Newspaper, File, Files,
  Folder, FolderTree, Tag, Tags, Boxes,
  ShoppingBag, ShoppingCart, Store, Package, CreditCard,
  Users, User, ShieldCheck, Lock,
  Image, Images, Camera, Video,
  Menu, LayoutDashboard, LayoutGrid, List,
  Settings, Cog, Wrench, Puzzle, Plug,
  Mail, MessageCircle, Send,
  Palette, Globe, MapPin, Calendar, Star, Heart,
  Briefcase, TrendingUp, HelpCircle, Info, BookOpen,
  ChevronDown
} from 'lucide-react';

const iconOptions = [
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
];

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const SelectedIcon = getIcon(value);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-between gap-2', className)}
        >
          <span className="flex items-center gap-2">
            <SelectedIcon className="h-4 w-4" />
            <span className="truncate">{value || 'Select icon...'}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-2" align="start">
        <div className="grid grid-cols-6 gap-1">
          {iconOptions.map(({ name, label, Icon }) => (
            <Button
              key={name}
              variant="ghost"
              size="icon"
              className={cn(
                'h-9 w-9',
                value === name && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
              onClick={() => {
                onChange(name);
                setOpen(false);
              }}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
