import { Toaster } from 'sonner';

export default function GlobalToasts() {
  // Only renders the toaster UI; triggering happens via Inertia router in app.tsx
  return <Toaster richColors position="top-right" />;
}
