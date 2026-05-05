import { useState } from 'react';
import { cn } from '~/lib/utils';
import { Spinner } from '~/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogMedia,
} from '~/components/ui/alert-dialog';
import type { VariantProps } from 'class-variance-authority';
import type { buttonVariants } from '~/components/ui/button';

// ── Sizes ─────────────────────────────────────────────────────────────────────

const SIZE_CLASS = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
} as const;

type ModalSize = keyof typeof SIZE_CLASS;

// ── ModalFooter ───────────────────────────────────────────────────────────────

/**
 * Styled footer bar to be rendered at the bottom of Modal children.
 * Mirrors the AlertDialog / Dialog footer styling for visual consistency.
 *
 * @example
 * <Modal title="Edit">
 *   {({ close }) => (
 *     <form onSubmit={handleSubmit}>
 *       <FieldA /> <FieldB />
 *       <ModalFooter>
 *         <Button variant="outline" onClick={close}>Cancel</Button>
 *         <Button type="submit">Save</Button>
 *       </ModalFooter>
 *     </form>
 *   )}
 * </Modal>
 */
export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        '-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export interface ModalChildrenProps {
  close: () => void;
}

export interface ModalProps {
  // ── Trigger / controlled mode ──
  /** Rendered as the trigger that opens the modal (uncontrolled). */
  trigger?: React.ReactNode;
  /** Controlled open state — use together with `onOpenChange`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // ── Content ──
  title: string;
  description?: string;
  /**
   * Render prop receiving `{ close }`.
   * Responsible for rendering its own form, fields, AND `<ModalFooter>`.
   */
  children: ((props: ModalChildrenProps) => React.ReactNode) | React.ReactNode;

  // ── Appearance ──
  size?: ModalSize;
  /** Extra classes on the dialog content panel. */
  contentClassName?: string;
}

/**
 * Generic modal shell built on the shadcn Dialog primitive.
 *
 * Deliberately has **no built-in footer** — consumers inject their own via
 * `<ModalFooter>` at the bottom of children. This keeps the component
 * composable: edit forms, info panels, pickers, etc. all work without override.
 *
 * Supports both uncontrolled (trigger prop) and controlled (open + onOpenChange) modes.
 *
 * @example — uncontrolled edit form
 * <Modal title="About & Access" trigger={<Button>Edit</Button>}>
 *   {({ close }) => <MyEditForm onSuccess={close} onCancel={close} />}
 * </Modal>
 *
 * @example — controlled
 * <Modal open={open} onOpenChange={setOpen} title="Details">
 *   <SomeContent />
 * </Modal>
 */
export function Modal({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  title,
  description,
  children,
  size = 'md',
  contentClassName,
}: ModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const close = () => setOpen(false);

  const content = typeof children === 'function' ? children({ close }) : children;

  const panel = (
    <DialogContent
      className={cn(
        'max-h-[90dvh] overflow-y-auto',
        SIZE_CLASS[size],
        contentClassName,
      )}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      {content}
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {panel}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {panel}
    </Dialog>
  );
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────

export interface ConfirmModalProps {
  // ── Trigger / controlled mode ──
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // ── Content ──
  title: string;
  description?: React.ReactNode;
  /** Icon or media element rendered above the title (uses AlertDialogMedia slot). */
  media?: React.ReactNode;

  // ── Actions ──
  confirmLabel?: string;
  cancelLabel?: string;
  /** Variant applied to the confirm button. Defaults to `'default'`. */
  variant?: VariantProps<typeof buttonVariants>['variant'];
  onConfirm: () => void;
  isLoading?: boolean;
}

/**
 * Opinionated confirmation modal built on the AlertDialog primitive.
 * Use for "are you sure?" flows — destructive actions, irreversible operations, etc.
 *
 * AlertDialog (vs Dialog) is intentional: it has `role="alertdialog"` which
 * prevents closing by clicking the backdrop, forcing an explicit choice.
 *
 * @example
 * <ConfirmModal
 *   title="Delete event?"
 *   description="This cannot be undone."
 *   trigger={<Button variant="destructive">Delete</Button>}
 *   confirmLabel="Yes, delete"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 *   isLoading={deleting}
 * />
 */
export function ConfirmModal({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  media,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  isLoading = false,
}: ConfirmModalProps) {
  const inner = (
    <AlertDialogContent>
      <AlertDialogHeader>
        {media && <AlertDialogMedia>{media}</AlertDialogMedia>}
        <AlertDialogTitle>{title}</AlertDialogTitle>
        {description && (
          <AlertDialogDescription asChild={typeof description !== 'string'}>
            {typeof description === 'string' ? (
              description
            ) : (
              <div>{description}</div>
            )}
          </AlertDialogDescription>
        )}
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction
          variant={variant}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading && <Spinner size="sm" />}
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  if (trigger) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        {inner}
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {inner}
    </AlertDialog>
  );
}
