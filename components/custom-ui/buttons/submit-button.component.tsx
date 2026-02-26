import { Button } from "@/components/ui/button"

export const SubmitButton = ({ loading, LoadingText, DefaultText }: { loading: boolean, LoadingText: string, DefaultText: string }) => {
    return (
        <Button type="submit" disabled={loading} >{loading ? LoadingText : DefaultText}</Button>
    )   
}