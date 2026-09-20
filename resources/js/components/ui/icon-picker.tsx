import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getIcon, ICON_OPTIONS } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

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
                <Button variant="outline" className={cn('w-full justify-between gap-2', className)}>
                    <span className="flex items-center gap-2">
                        <SelectedIcon className="h-4 w-4" />
                        <span className="truncate">{value || 'Select icon...'}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-2" align="start">
                <div className="grid grid-cols-6 gap-1">
                    {ICON_OPTIONS.map(({ name, label, Icon }) => (
                        <Button
                            key={name}
                            variant="ghost"
                            size="icon"
                            className={cn('h-9 w-9', value === name && 'bg-primary text-primary-foreground hover:bg-primary/90')}
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
