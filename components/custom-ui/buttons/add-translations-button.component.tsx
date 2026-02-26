"use client"

import { useState } from "react"
import { ChevronDown, Languages } from "lucide-react"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types/common"
import { Button } from "@/components/ui/button"

interface AddTranslationsButtonProps {
  activeLocales: LocaleEnum[]
  onAddLocale: (locale: LocaleEnum) => void
}

export const AddTranslationsButton: React.FC<AddTranslationsButtonProps> = ({
  activeLocales,
  onAddLocale,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const remainingLocales = Object.values(LocaleEnum).filter(
    locale => !activeLocales.includes(locale)
  )

  if (remainingLocales.length === 0) return <div></div>

  return (
    <div className="relative">
      <Button type="button" variant="outline" onClick={() => setIsOpen(prev => !prev)}>
        <Languages className="w-4 h-4 mr-1" />
        Add Translation
        <ChevronDown className="w-4 h-4 ml-1" />
      </Button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-48 rounded-xl shadow-lg bg-popover text-popover-foreground border px-1 border-border">
          <ul className="py-1">
            {remainingLocales.map(locale => (
              <li
                key={locale}
                onClick={() => {
                  onAddLocale(locale)
                  setIsOpen(false)
                }}
                className="px-4 py-2 text-sm hover:bg-muted hover:text-muted-foreground rounded-lg cursor-pointer transition-colors"
              >
                {LocaleEnumLabel[locale]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
