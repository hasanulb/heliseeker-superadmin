"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"

import { MAIN_MENU } from "./sidebar.component"

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const pathname = usePathname();
    // Track open submenus by main menu key
    const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({})

    useEffect(() => {
        // Expand submenu if pathname matches any submenu href
        const newOpenSubmenus: { [key: string]: boolean } = {}
        MAIN_MENU.forEach(item => {
            if (Array.isArray(item.submenu) && item.submenu && item.submenu.length > 0) {
                const match = item.submenu.some(sub => pathname && pathname.startsWith(sub.href))
                if (match) newOpenSubmenus[item.key] = true
            }
        })
        setOpenSubmenus(prev => ({ ...prev, ...newOpenSubmenus }))
    }, [pathname])

    const handleToggleSubmenu = (key: string) => {
        setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    const handleItemClick = () => {
        onClose()
    }

    return (
        <div
            className={cn(
                "fixed inset-0 z-20 bg-black/60 transition-opacity duration-300 md:hidden mt-16",
                open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            aria-hidden={!open}
            onClick={onClose}
        >
            {/* Sidebar */}
            <aside
                className={cn(
                    "absolute left-0 top-0 h-full w-full max-w-xs bg-background shadow-lg flex flex-col p-6 transition-transform duration-300",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
                onClick={e => e.stopPropagation()}
            >
                <nav className="flex flex-col gap-2">
                    {MAIN_MENU.map(item => {
                        const hasSubmenu = Array.isArray(item.submenu) && item.submenu && item.submenu.length > 0
                        const isOpen = !!openSubmenus[item.key]
                        return (
                            <div key={item.key}>
                                <div className="flex items-center">
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium hover:bg-muted transition flex-1",
                                            pathname && pathname.startsWith(item.href) && "text-purple-one font-semibold"
                                        )}
                                        onClick={handleItemClick}
                                    >
                                        {item.icon && <item.icon className="w-5 h-5" />}
                                        <span>{item.label}</span>
                                    </Link>
                                    {hasSubmenu && (
                                        <button
                                            type="button"
                                            aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                                            className={cn(
                                                "ml-2 transition-transform duration-200",
                                                pathname && pathname.startsWith(item.href) && "text-purple-one font-semibold",
                                                isOpen ? "rotate-180" : "rotate-0"
                                            )}
                                            onClick={() => handleToggleSubmenu(item.key)}
                                        >
                                            <ChevronDown className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                {hasSubmenu && isOpen && (
                                    <div className="ml-8 mt-1 flex flex-col gap-1 border-l-2 border-muted pl-4">
                                        {item.submenu.map(sub => (
                                            <Link
                                                key={sub.key}
                                                href={sub.href}
                                                className={cn(
                                                    "flex items-center gap-2 px-2 py-2 rounded hover:bg-muted text-sm text-muted-foreground",
                                                    pathname && pathname.startsWith(sub.href) && "bg-muted text-primary font-semibold"
                                                )}
                                                onClick={handleItemClick}
                                            >
                                                {sub.icon && <sub.icon className="w-4 h-4" />}
                                                <span>{sub.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>
            </aside>
        </div>
    )
}
