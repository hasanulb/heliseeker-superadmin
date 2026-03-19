import * as React from "react"

import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

import { Input } from "./input"

type SearchInputProps = React.ComponentProps<typeof Input> & {
  containerClassName?: string
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", containerClassName)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input ref={ref} className={cn("pl-10", className)} {...props} />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }

