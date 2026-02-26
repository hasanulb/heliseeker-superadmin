"use client"

import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ContentTableHeaderProps {
    title: string
    description: string
    searchLabel: string
    CreateButtonLabel?: string
    createPath?: string
    search: string
    setSearch: (search: string) => void
    sortLabel?: string
    sort?: { field: string; dir: "asc" | "desc" }
    setSort?: React.Dispatch<React.SetStateAction<{ field: string; dir: "asc" | "desc" }>>
    page: number
    setPage: (page: number) => void
    customButtons?: React.ReactNode
}

export const ContentTableHeader = ({ title, description, searchLabel, CreateButtonLabel, createPath, search, setSearch, sortLabel, sort, setSort, page, setPage, customButtons }: ContentTableHeaderProps) => {
    const router = useRouter()

    return (
        <>
            <div className="flex flex-col md:flex-row gap-2 items-center justify-between">
                <div className="flex flex-col w-full items-start">
                    <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                    <p className="text-sm md:text-base text-muted-foreground">{description}</p>
                </div>
                { createPath && CreateButtonLabel && (
                    <div className="flex w-full md:w-auto justify-start">
                        <Button onClick={() => router.push(createPath)}> <Plus className="w-4 h-4 mr-2" /> {CreateButtonLabel} </Button>
                    </div>
                )}
            </div>

            {/* Search, Sort */}
            <div className="flex flex-col-reverse md:flex-row flex-wrap items-center justify-between gap-2">
                <div className="relative w-full md:w-auto max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder={searchLabel} className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>

                <div className="w-full md:w-auto">
                    <div className="w-full overflow-hidden">
                        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent pb-2 md:pb-0">
                            {sort && setSort && (
                                <Button
                                    variant="outline"
                                    onClick={() => setSort((prev: { field: string; dir: "desc" | "asc" }) => ({
                                        ...prev,
                                        dir: prev.dir === "asc" ? "desc" : "asc"
                                    }))}
                                    className="text-xs md:text-sm flex-shrink-0"
                                >
                                    Sort by {sortLabel} {sort.dir === "asc" ? "↑" : "↓"}
                                </Button>
                            )}
                            {customButtons}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}