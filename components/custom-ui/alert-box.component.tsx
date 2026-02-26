"use client"

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface AlertBoxComponentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  loading?: boolean
  onDiscard?: () => void
}

export const AlertBoxComponent = ({
  open,
  onOpenChange,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone.",
  confirmText = "Yes, confirm",
  cancelText = "Cancel",
  onConfirm,
  loading = false,
  onDiscard,
}: AlertBoxComponentProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={onDiscard}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
