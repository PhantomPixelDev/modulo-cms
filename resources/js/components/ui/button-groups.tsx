import * as React from "react"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"

type ButtonGroupProps = {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end' | 'between'
  spacing?: 'none' | 'sm' | 'md' | 'lg'
}

export function ButtonGroup({
  children,
  className,
  align = 'end',
  spacing = 'md',
  ...props
}: ButtonGroupProps) {
  return (
    <div 
      className={cn(
        'flex flex-wrap items-center gap-2',
        {
          'justify-start': align === 'start',
          'justify-center': align === 'center',
          'justify-end': align === 'end',
          'justify-between': align === 'between',
          'gap-0': spacing === 'none',
          'gap-2': spacing === 'sm',
          'gap-3': spacing === 'md',
          'gap-4': spacing === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type ActionButtonGroupProps = {
  onSave?: () => void
  onCancel: () => void
  onDelete?: () => void
  saveLabel?: string
  cancelLabel?: string
  deleteLabel?: string
  isSubmitting?: boolean
  showDelete?: boolean
  className?: string
  align?: 'start' | 'center' | 'end' | 'between'
}

export function ActionButtonGroup({
  onSave,
  onCancel,
  onDelete,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  deleteLabel = 'Delete',
  isSubmitting = false,
  showDelete = false,
  className,
  align = 'end',
}: ActionButtonGroupProps) {
  return (
    <ButtonGroup align={align} className={className}>
      {showDelete && onDelete && (
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={isSubmitting}
        >
          {deleteLabel}
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </Button>
      {onSave && (
        <Button 
          type={onSave ? 'button' : 'submit'}
          onClick={onSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : saveLabel}
        </Button>
      )}
    </ButtonGroup>
  )
}

type CreateButtonProps = ButtonProps & {
  to: string
  label: string
  icon?: React.ReactNode
}

export function CreateButton({ to, label, icon, ...props }: CreateButtonProps) {
  return (
    <Button 
      size="sm" 
      onClick={() => window.location.href = to}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </Button>
  )
}

type BackButtonProps = ButtonProps & {
  to: string
  label?: string
}

export function BackButton({ to, label = 'Back', ...props }: BackButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.location.href = to}
      {...props}
    >
      {label}
    </Button>
  )
}
