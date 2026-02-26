import { Button } from "@/components/ui/button"

export const CancelButton = ({ handleCancel, loading }: { handleCancel: () => void, loading: boolean }) => {
    return (
        <Button type="button" variant="destructive" onClick={handleCancel} disabled={loading}>Cancel</Button>
    )
}