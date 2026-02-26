"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home as HomeIcon,
  ChevronRight,
  Building2,
  UsersRound,
  SlidersHorizontal,
  ShieldCheck,
  Files,
  Search,
  Package,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { makeApiCall } from "@/lib/utils"
import { AuthService } from "@/services/api/auth.service"
import { useProfile } from "@/app/contexts/profile.context"

export const MAIN_MENU = [
  { key: "home", icon: HomeIcon, label: "Dashboard", href: "/admin/home", submenu: null },
  { key: "centers", icon: Building2, label: "Centers", href: "/admin/centers", submenu: null },
  { key: "patients", icon: UsersRound, label: "Patients", href: "/admin/patients", submenu: null },
  { key: "search-filters", icon: SlidersHorizontal, label: "Search Filters", href: "/admin/search-filters", submenu: null },
  { key: "access", icon: ShieldCheck, label: "Access", href: "/admin/access", submenu: null },
  { key: "flat-pages", icon: Files, label: "Flat Pages", href: "/admin/flat-pages", submenu: null },
  { key: "seo-tags", icon: Search, label: "SEO & Tags", href: "/admin/seo-tags", submenu: null },
]

// Utility to get the default submenu key for a given primary key
export function getDefaultSubmenuKey(primaryKey: string): string {
  const menu = MAIN_MENU.find(item => item.key === primaryKey)
  if (menu && Array.isArray(menu.submenu) && menu.submenu.length > 0) {
    return menu.submenu[0].key
  }
  return ""
}

// type PrimarySidebarProps = {
//   selected: string
//   onSelect: (key: string) => void
// }

type SecondarySidebarProps = {
  selected: string
  secondarySelected: string
  onSecondarySelect: (key: string) => void
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

export function PrimarySidebar() {
  const [hovered, setHovered] = useState(false)
  const isExpanded = hovered
  const pathname = usePathname();
  const { toast } = useToast();
  const { setProfile } = useProfile();

  const handleLogout = async () => {
    await makeApiCall(() => new AuthService().logout(), {
      afterSuccess: () => {
        window.location.href = "/login";
      }
    })
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
      variant: "success",
    })
    setProfile({});
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-full bg-card border-r border-border flex flex-col items-center py-4 transition-all duration-200 z-50",
        isExpanded ? "w-56 px-4" : "w-16"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ zIndex: 50 }}
    >
      {/* Logo and Admin Panel Name */}
      <div className={cn("flex items-center w-full px-2 mb-8", isExpanded ? "justify-start" : "justify-center")}> 
        <Package className="w-8 h-8 text-purple-one" />
        {isExpanded && <span className="ml-2 font-bold text-lg whitespace-nowrap">Burjcon CMS</span>}
      </div>
      {MAIN_MENU.map((item) => {
        const hasSubmenu = Array.isArray(item.submenu) && item.submenu.length > 0;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "mb-6 flex items-center justify-center w-12 h-12 rounded-lg transition relative group",
              pathname.startsWith(item.href) && "bg-sidebar-hovered text-sidebar-hovered-foreground",
              isExpanded ? "w-full px-4 justify-start" : "w-12 justify-center",
              !pathname.startsWith(item.href) && "hover:bg-sidebar-hovered hover:text-sidebar-hovered-foreground"
            )}
            title={item.label}
          >
            <item.icon className="w-6 h-6" />
            {isExpanded && (
              <>
                <span className="ml-4 text-sm font-medium whitespace-nowrap">{item.label}</span>
                {hasSubmenu && <ChevronRight className="ml-2 w-4 h-4 text-muted-foreground" />}
              </>
            )}
            {!isExpanded && hasSubmenu && (
              <ChevronRight className="absolute right-2 w-4 h-4 text-muted-foreground" />
            )}
          </Link>
        );
      })}
      {/* Quick Logout Button */}
      <button
        onClick={handleLogout}
        className={cn(
          "mt-auto flex items-center justify-center w-12 h-12 rounded-lg transition relative group text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30",
          isExpanded ? "w-full px-4 justify-start" : "w-12 justify-center"
        )}
        title="Log out"
      >
        <LogOut className="w-6 h-6" />
        {isExpanded && <span className="ml-4 text-sm font-medium whitespace-nowrap">Log out</span>}
      </button>
    </div>
  )
}

export function SecondarySidebar({ selected, secondarySelected, onSecondarySelect, collapsed, onCollapse }: SecondarySidebarProps) {
  const menu = MAIN_MENU.find((item) => item.key === selected)
  const [internalExpanded, setInternalExpanded] = useState(true)
  const [hovered, setHovered] = useState(false)
  if (!menu || !Array.isArray(menu.submenu)) return null
  const isControlled = typeof collapsed === 'boolean' && typeof onCollapse === 'function'
  const expanded = isControlled ? !collapsed : internalExpanded
  const setExpanded = isControlled
    ? (v: boolean) => { if (onCollapse) onCollapse(!v); }
    : setInternalExpanded;
  const isExpanded = expanded || hovered

  return (
    <div
      className={cn(
        "fixed top-0 left-16 h-full bg-background border-r border-border flex flex-col py-8 transition-all duration-200 z-40",
        isExpanded ? "w-56" : "w-16"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ zIndex: 40 }}
    >
      <div className="flex items-center justify-between px-4 mb-6">
        {isExpanded && <div className="font-bold text-lg">{menu.label}</div>}
        <button
          className="ml-auto p-1 rounded hover:bg-muted"
          onClick={() => setExpanded(!expanded)}
          tabIndex={-1}
          title={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? "⏴" : "⏵"}
        </button>
      </div>
      <nav className="flex flex-col gap-2 px-2">
        {menu.submenu.map((sub) => (
          <Link
            key={sub.key}
            href={sub.href}
            className={cn(
              "flex items-center rounded px-3 py-2 hover:bg-muted transition",
              secondarySelected === sub.key && "bg-muted text-primary",
              !isExpanded && "justify-center"
            )}
            onClick={() => onSecondarySelect(sub.key)}
            title={sub.label}
          >
            <sub.icon className="w-5 h-5" />
            {isExpanded && <span className="ml-3">{sub.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  )
}
