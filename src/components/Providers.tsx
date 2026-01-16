"use client";

import { SocketProvider } from "@/components/providers/SocketProvider";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SocketProvider>{children}</SocketProvider>
    </ToastProvider>
  );
}
