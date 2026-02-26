import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export const SortButtonComponent = () => {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState<{ field: string, dir: "asc" | "desc" }>({ field: "created_at", dir: "desc" })
    return (
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search services..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>

            <Button
                variant="outline"
                onClick={() => setSort(prev => ({
                    ...prev,    
                    dir: prev.dir === "asc" ? "desc" : "asc"
                }))}
            >
                Sort by Created {sort.dir === "asc" ? "↑" : "↓"}
            </Button>
        </div>
    )
}