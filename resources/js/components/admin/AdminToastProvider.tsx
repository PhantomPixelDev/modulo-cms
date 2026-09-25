import { router } from '@inertiajs/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Toaster, toast } from 'sonner';

type AdminToastVariant = 'default' | 'success' | 'error' | 'info' | 'warning';

type AdminToastMessage =
    | string
    | {
          title?: string;
          description?: string;
          duration?: number;
      };

type ToastConfig = NonNullable<Parameters<typeof toast>[1]>;

type AdminToastContextValue = {
    notify: (variant: AdminToastVariant, message: AdminToastMessage, options?: ToastConfig) => string | number;
    success: (message: AdminToastMessage, options?: ToastConfig) => string | number;
    error: (message: AdminToastMessage, options?: ToastConfig) => string | number;
    info: (message: AdminToastMessage, options?: ToastConfig) => string | number;
    warning: (message: AdminToastMessage, options?: ToastConfig) => string | number;
    promise: typeof toast.promise;
    dismiss: (toastId?: string | number) => void;
};

const AdminToastContext = createContext<AdminToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 4000;

const normalizeMessage = (message: AdminToastMessage) =>
    typeof message === 'string'
        ? { title: message }
        : {
              title: message.title,
              description: message.description,
              duration: message.duration,
          };

type FlashBag = Partial<Record<'success' | 'error' | 'warning' | 'info' | 'message', string | null>>;

export function AdminToastProvider({ children }: { children: ReactNode }) {
    // When a page already toasted its own success message for a visit, the
    // server's flash for the same action would only repeat it.
    const lastClientSuccess = useRef(0);

    const notify = useCallback((variant: AdminToastVariant, message: AdminToastMessage, options?: ToastConfig) => {
        const normalized = normalizeMessage(message);
        const finalTitle = normalized.title || normalized.description || 'Notification';
        const finalOptions: ToastConfig = {
            ...options,
            description: normalized.description,
            duration: options?.duration ?? normalized.duration ?? DEFAULT_DURATION,
        };

        switch (variant) {
            case 'success':
                return toast.success(finalTitle, finalOptions);
            case 'error':
                return toast.error(finalTitle, finalOptions);
            case 'info':
                return toast.info(finalTitle, finalOptions);
            case 'warning':
                return toast.warning(finalTitle, finalOptions);
            default:
                return toast(finalTitle, finalOptions);
        }
    }, []);

    const success = useCallback(
        (message: AdminToastMessage, options?: ToastConfig) => {
            lastClientSuccess.current = Date.now();
            return notify('success', message, options);
        },
        [notify],
    );

    // Server-side flash messages (back()->with('error', ...)) as toasts.
    useEffect(
        () =>
            router.on('success', (event) => {
                const flash = (event.detail.page.props as { flash?: FlashBag }).flash;
                if (!flash) return;

                // Deferred so a visit's own onSuccess toast runs first.
                window.setTimeout(() => {
                    if (flash.error) notify('error', flash.error);
                    if (flash.warning) notify('warning', flash.warning);
                    if (flash.info) notify('info', flash.info);
                    if (flash.message) notify('default', flash.message);
                    if (flash.success && Date.now() - lastClientSuccess.current > 1500) notify('success', flash.success);
                }, 0);
            }),
        [notify],
    );
    const error = useCallback((message: AdminToastMessage, options?: ToastConfig) => notify('error', message, options), [notify]);
    const info = useCallback((message: AdminToastMessage, options?: ToastConfig) => notify('info', message, options), [notify]);
    const warning = useCallback((message: AdminToastMessage, options?: ToastConfig) => notify('warning', message, options), [notify]);

    const value = useMemo<AdminToastContextValue>(
        () => ({
            notify,
            success,
            error,
            info,
            warning,
            promise: toast.promise,
            dismiss: toast.dismiss,
        }),
        [notify, success, error, info, warning],
    );

    return (
        <AdminToastContext.Provider value={value}>
            {children}
            <Toaster
                richColors
                position="top-right"
                toastOptions={{
                    duration: DEFAULT_DURATION,
                    closeButton: true,
                }}
            />
        </AdminToastContext.Provider>
    );
}

export function useAdminToast(): AdminToastContextValue {
    const context = useContext(AdminToastContext);
    if (!context) {
        throw new Error('useAdminToast must be used within an AdminToastProvider');
    }
    return context;
}
