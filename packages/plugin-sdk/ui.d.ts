/**
 * Types for @modulo/ui, the admin kit the core hands to plugin bundles at runtime
 * (resources/js/plugin-ui.ts in the core). Components take the same props as in
 * the core; they are typed loosely here so the SDK needn't ship the core's types.
 */
declare module '@modulo/ui' {
    import type { ComponentType, ReactNode } from 'react';

    type Props = Record<string, unknown> & { children?: ReactNode; className?: string };

    export const AdminLayout: ComponentType<Props>;
    export const Alert: ComponentType<Props>;
    export const AlertDescription: ComponentType<Props>;
    export const AlertTitle: ComponentType<Props>;
    export const Badge: ComponentType<Props>;
    export const Button: ComponentType<Props>;
    export const Card: ComponentType<Props>;
    export const CardContent: ComponentType<Props>;
    export const CardDescription: ComponentType<Props>;
    export const CardFooter: ComponentType<Props>;
    export const CardHeader: ComponentType<Props>;
    export const CardTitle: ComponentType<Props>;
    export const Checkbox: ComponentType<Props>;
    export const CustomFieldInputs: ComponentType<Props>;
    export const Dialog: ComponentType<Props>;
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
    export const EmptyState: ComponentType<Props>;
    export const Input: ComponentType<Props>;
    export const Label: ComponentType<Props>;
    export const MediaPickerDialog: ComponentType<Props>;
    export const SectionHeader: ComponentType<Props>;
    export const SectionWrapper: ComponentType<Props>;
    export const Select: ComponentType<Props>;
    export const SelectContent: ComponentType<Props>;
    export const SelectGroup: ComponentType<Props>;
    export const SelectItem: ComponentType<Props>;
    export const SelectLabel: ComponentType<Props>;
    export const SelectTrigger: ComponentType<Props>;
    export const SelectValue: ComponentType<Props>;
    export const Separator: ComponentType<Props>;
    export const Skeleton: ComponentType<Props>;
    export const Switch: ComponentType<Props>;
    export const Table: ComponentType<Props>;
    export const TableBody: ComponentType<Props>;
    export const TableCaption: ComponentType<Props>;
    export const TableCell: ComponentType<Props>;
    export const TableContainer: ComponentType<Props>;
    export const TableHead: ComponentType<Props>;
    export const TableHeader: ComponentType<Props>;
    export const TableRow: ComponentType<Props>;
    export const Tabs: ComponentType<Props>;
    export const TabsContent: ComponentType<Props>;
    export const TabsList: ComponentType<Props>;
    export const TabsTrigger: ComponentType<Props>;
    export const Textarea: ComponentType<Props>;
    export const Tooltip: ComponentType<Props>;
    export const TooltipContent: ComponentType<Props>;
    export const TooltipProvider: ComponentType<Props>;
    export const TooltipTrigger: ComponentType<Props>;
    export function cn(...classes: Array<string | false | null | undefined>): string;
    export function useAcl(): { isAdmin: () => boolean; hasPermission: (permission: string) => boolean; canAny: (permissions: string[]) => boolean };
    export function useAdminToast(): { success: (message: string) => void; error: (message: string) => void; info: (message: string) => void; warning: (message: string) => void };
    export function useTranslation(): {
        t: (key: string, replacements?: Record<string, string | number>, fallback?: string) => string;
        locale: string;
    };
}
