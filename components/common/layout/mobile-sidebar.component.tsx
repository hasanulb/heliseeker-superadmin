"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

import { MASTER_MENU, PRIMARY_MENU, SECONDARY_MENU } from "./sidebar.component"

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const pathname = usePathname();

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
                    {PRIMARY_MENU.map(item => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium hover:bg-muted transition",
                                pathname && pathname.startsWith(item.href) && "text-purple-one font-semibold"
                            )}
                            onClick={handleItemClick}
                        >
                            {item.icon && <item.icon className="w-5 h-5" />}
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <div className="mt-3 border-t border-border pt-3">
                        <div className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Masters</div>
                    </div>

                    {MASTER_MENU.map(item => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium hover:bg-muted transition",
                                pathname && pathname.startsWith(item.href) && "text-purple-one font-semibold"
                            )}
                            onClick={handleItemClick}
                        >
                            {item.icon && <item.icon className="w-5 h-5" />}
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    {SECONDARY_MENU.map(item => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium hover:bg-muted transition",
                                pathname && pathname.startsWith(item.href) && "text-purple-one font-semibold"
                            )}
                            onClick={handleItemClick}
                        >
                            {item.icon && <item.icon className="w-5 h-5" />}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>
        </div>
    )
}
