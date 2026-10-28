import { create } from 'zustand';

export type ConfirmationVariant = 'default' | 'destructive' | 'warning' | 'info';

export interface ConfirmationOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  onConfirm?: () => Promise<void> | void;
}

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: ConfirmationVariant;
  isLoading: boolean;
  onConfirmCallback: (() => Promise<void> | void) | null;
  resolver: ((confirmed: boolean) => void) | null;

  confirm: (options: ConfirmationOptions) => Promise<boolean>;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
  setOpen: (open: boolean) => void;
}

export const useConfirmationStore = create<ConfirmationState>((set, get) => ({
  isOpen: false,
  title: '',
  description: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'default',
  isLoading: false,
  onConfirmCallback: null,
  resolver: null,

  confirm: (options) => {
    // If a previous confirmation was somehow hanging, resolve it false
    const existingResolver = get().resolver;
    if (existingResolver) {
      existingResolver(false);
    }

    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title: options.title,
        description: options.description,
        confirmText: options.confirmText || (options.variant === 'destructive' ? 'Delete' : 'Confirm'),
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'default',
        isLoading: false,
        onConfirmCallback: options.onConfirm || null,
        resolver: resolve,
      });
    });
  },

  handleConfirm: async () => {
    const { onConfirmCallback, resolver } = get();
    if (onConfirmCallback) {
      try {
        set({ isLoading: true });
        await onConfirmCallback();
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    }

    set({ isOpen: false, isLoading: false, onConfirmCallback: null, resolver: null });
    if (resolver) {
      resolver(true);
    }
  },

  handleCancel: () => {
    const { resolver } = get();
    set({ isOpen: false, isLoading: false, onConfirmCallback: null, resolver: null });
    if (resolver) {
      resolver(false);
    }
  },

  setOpen: (open) => {
    if (!open) {
      get().handleCancel();
    } else {
      set({ isOpen: true });
    }
  },
}));

/**
 * Convenient React Hook for calling confirmation modal
 */
export const useConfirmation = () => {
  const confirm = useConfirmationStore((state) => state.confirm);
  return { confirm };
};
