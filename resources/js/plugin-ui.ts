/**
 * The admin building blocks a plugin's screens import as `@modulo/ui`.
 *
 * A plugin bundle can't import the core's source, so the core hands these
 * over at runtime (window.Modulo.ui) and public/modulo-sdk/ui.js re-exports
 * them as an ES module. Using them keeps plugin screens looking like the rest
 * of the admin and following its theme, dark mode and language.
 *
 * Only add, never rename or remove: installed plugins import these names.
 * `npm run build:shims` regenerates the shim from the export lists below.
 */
export { useAdminToast } from '@/components/admin/AdminToastProvider';
export { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
export { Badge } from '@/components/ui/badge';
export { Button } from '@/components/ui/button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
export { Checkbox } from '@/components/ui/checkbox';
export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
export {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
export { Input } from '@/components/ui/input';
export { Label } from '@/components/ui/label';
export { SectionHeader } from '@/components/ui/section-header';
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
export { Separator } from '@/components/ui/separator';
export { Skeleton } from '@/components/ui/skeleton';
export { Switch } from '@/components/ui/switch';
export { Table, TableBody, TableCaption, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@/components/ui/table';
export { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
export { Textarea } from '@/components/ui/textarea';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export { useTranslation } from '@/hooks/useTranslation';
export { default as AdminLayout } from '@/layouts/admin-layout';
export { useAcl } from '@/lib/acl';
export { cn } from '@/lib/utils';
export { EmptyState } from '@/pages/dashboard/components/common/EmptyState';
export { SectionWrapper } from '@/pages/dashboard/components/common/SectionWrapper';
export { MediaPickerDialog } from '@/pages/dashboard/components/media/MediaPickerDialog';
export { CustomFieldInputs } from '@/pages/dashboard/components/posts/CustomFieldInputs';
