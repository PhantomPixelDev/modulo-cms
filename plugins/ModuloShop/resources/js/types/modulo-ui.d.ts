/**
 * Types for @modulo/ui, the admin kit the core hands to plugin bundles at runtime
 * (resources/js/plugin-ui.ts in the core). Common components carry their real props;
 * the rest are typed loosely so the SDK needn't ship the core's types.
 */
declare module '@modulo/ui' {
    import type {
        ButtonHTMLAttributes,
        ComponentType,
        HTMLAttributes,
        InputHTMLAttributes,
        LabelHTMLAttributes,
        ReactNode,
        TextareaHTMLAttributes,
    } from 'react';

    type Props = Record<string, unknown> & { children?: ReactNode; className?: string };

    /** A file from the media library, as MediaPickerDialog hands it back. */
    export interface MediaItem {
        id: number;
        name: string;
        file_name: string;
        mime_type: string;
        url: string;
        thumb?: string;
        custom_properties?: Record<string, unknown>;
    }

    export const AdminLayout: ComponentType<{ title?: string; description?: string; breadcrumbs?: Array<{ title: string; href: string }>; children?: ReactNode }>;
    export const Alert: ComponentType<Props>;
    export const AlertDescription: ComponentType<Props>;
    export const AlertTitle: ComponentType<Props>;
    export const Badge: ComponentType<HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }>;
    export const Button: ComponentType<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'; size?: 'default' | 'sm' | 'lg' | 'icon'; asChild?: boolean }>;
    export const Card: ComponentType<Props>;
    export const CardContent: ComponentType<Props>;
    export const CardDescription: ComponentType<Props>;
    export const CardFooter: ComponentType<Props>;
    export const CardHeader: ComponentType<Props>;
    export const CardTitle: ComponentType<Props>;
    export const Checkbox: ComponentType<Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'checked'> & { checked?: boolean | 'indeterminate'; onCheckedChange?: (checked: boolean | 'indeterminate') => void }>;
    export const CustomFieldInputs: ComponentType<Props>;
    export const Dialog: ComponentType<{ open?: boolean; onOpenChange?: (open: boolean) => void; children?: ReactNode }>;
    export const DialogClose: ComponentType<Props>;
    export const DialogContent: ComponentType<Props>;
    export const DialogDescription: ComponentType<Props>;
    export const DialogFooter: ComponentType<Props>;
    export const DialogHeader: ComponentType<Props>;
    export const DialogTitle: ComponentType<Props>;
    export const DialogTrigger: ComponentType<Props>;
    export const DropdownMenu: ComponentType<Props>;
    export const DropdownMenuContent: ComponentType<Props>;
    export const DropdownMenuItem: ComponentType<Props>;
    export const DropdownMenuLabel: ComponentType<Props>;
    export const DropdownMenuSeparator: ComponentType<Props>;
    export const DropdownMenuTrigger: ComponentType<Props>;
    export const EmptyState: ComponentType<{ title: string; description?: string }>;
    export const Input: ComponentType<InputHTMLAttributes<HTMLInputElement>>;
    export const Label: ComponentType<LabelHTMLAttributes<HTMLLabelElement>>;
    export const MediaPickerDialog: ComponentType<{ open: boolean; onOpenChange: (open: boolean) => void; onSelect: (item: MediaItem) => void; type?: string }>;
    export const SectionHeader: ComponentType<{ title: string; description?: string; actions?: ReactNode; className?: string }>;
    export const SectionWrapper: ComponentType<{ title: string; description?: string; actions?: ReactNode; className?: string; children?: ReactNode }>;
    export const Select: ComponentType<{ value?: string; defaultValue?: string; onValueChange?(value: string): void; disabled?: boolean; children?: ReactNode }>;
    export const SelectContent: ComponentType<Props>;
    export const SelectGroup: ComponentType<Props>;
    export const SelectItem: ComponentType<Props>;
    export const SelectLabel: ComponentType<Props>;
    export const SelectTrigger: ComponentType<Props>;
    export const SelectValue: ComponentType<Props>;
    export const Separator: ComponentType<Props>;
    export const Skeleton: ComponentType<Props>;
    export const Switch: ComponentType<Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'checked'> & { checked?: boolean; onCheckedChange?: (checked: boolean) => void }>;
    export const Table: ComponentType<Props>;
    export const TableBody: ComponentType<Props>;
    export const TableCaption: ComponentType<Props>;
    export const TableCell: ComponentType<Props>;
    export const TableContainer: ComponentType<Props>;
    export const TableHead: ComponentType<Props>;
    export const TableHeader: ComponentType<Props>;
    export const TableRow: ComponentType<Props>;
    export const Tabs: ComponentType<Props & { value?: string; defaultValue?: string; onValueChange?(value: string): void }>;
    export const TabsContent: ComponentType<Props>;
    export const TabsList: ComponentType<Props>;
    export const TabsTrigger: ComponentType<Props>;
    export const Textarea: ComponentType<TextareaHTMLAttributes<HTMLTextAreaElement>>;
    export const Tooltip: ComponentType<Props>;
    export const TooltipContent: ComponentType<Props>;
    export const TooltipProvider: ComponentType<Props>;
    export const TooltipTrigger: ComponentType<Props>;
    export function cn(...classes: Array<string | false | null | undefined>): string;
    export function useAcl(): { isAdmin: () => boolean; hasPermission: (permission: string) => boolean; canAny: (permissions: string[]) => boolean };
    export function useAdminToast(): { success: (message: string) => void; error: (message: string) => void; info: (message: string) => void; warning: (message: string) => void };
    export function useTranslation(): { t: (key: string, replacements?: Record<string, string | number>, fallback?: string) => string; locale: string };
}
