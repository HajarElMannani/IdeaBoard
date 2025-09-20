"use client";
import * as React from "react";

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

const DialogContext = React.createContext<{
  open: boolean;
  setOpen: (o: boolean) => void;
} | null>(null);

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [internal, setInternal] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? !!open : internal;
  const setOpen = (o: boolean) => {
    if (!isControlled) setInternal(o);
    onOpenChange?.(o);
  };
  return (
    <DialogContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) return null;
  return (
    <button type="button" onClick={() => ctx.setOpen(true)}>{children}</button>
  );
}

export function DialogContent({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(DialogContext);
  if (!ctx || !ctx.open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => ctx.setOpen(false)} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full max-w-md rounded-lg bg-white shadow-lg border border-gray-200 p-4 sm:p-6 ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogHeader({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`mb-3 ${className}`}>{children}</div>;
}
export function DialogTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={`text-lg font-semibold leading-tight ${className}`}>{children}</h3>;
}
export function DialogDescription({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <p className={`text-sm text-gray-600 ${className}`}>{children}</p>;
}
export function DialogFooter({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`mt-4 flex items-center justify-end gap-2 ${className}`}>{children}</div>;
}


