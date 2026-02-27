"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { Header, MobileSidebar, SearchModal, SecondarySidebar, PrimarySidebar, MAIN_MENU, getDefaultSubmenuKey } from "@/components/common"
import { ProfileProvider } from "@/app/contexts/profile.context"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [routeChanging, setRouteChanging] = useState(false)
  const [secondarySelected, setSecondarySelected] = useState("")
  const [secondaryCollapsed, setSecondaryCollapsed] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Prevent background scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Clean up in case component unmounts with sidebar open
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const selected =
    MAIN_MENU.find((item) => {
      return pathname.startsWith(item.href)
    })?.key || "home"

  const useIsMdUp = () => {
    const [isMdUp, setIsMdUp] = useState(false)
  
    useEffect(() => {
      const checkSize = () => {
        setIsMdUp(window.matchMedia("(min-width: 768px)").matches)
      }
  
      checkSize()
      window.addEventListener("resize", checkSize)
      return () => window.removeEventListener("resize", checkSize)
    }, [])
  
    return isMdUp
  }

  const isMdUp = useIsMdUp()

  useEffect(() => {
    setRouteChanging(true)

    const timeout = setTimeout(() => {
      setRouteChanging(false)
    }, 300) // fade duration, tweak as needed

    return () => clearTimeout(timeout)
  }, [pathname]) // Triggers on full page navigation

  useEffect(() => {
    const menu = MAIN_MENU.find((item) => item.key === selected);
    if (menu && Array.isArray(menu.submenu) && menu.submenu.length > 0) {
      const queryKind = searchParams.get("kind")
      const matchedKind = queryKind
        ? menu.submenu.find((sub) => "kind" in sub && sub.kind === queryKind)
        : undefined
      // Find a submenu whose href matches the current pathname
      const matchedSub = matchedKind || menu.submenu.find((sub) => pathname.startsWith(sub.href));
      if (matchedSub) {
        setSecondarySelected(matchedSub.key);
      } else {
        setSecondarySelected(getDefaultSubmenuKey(selected));
      }
    } else {
      setSecondarySelected("");
    }
  }, [selected, pathname]);

  const marginLeft = secondaryCollapsed
    ? 64 + 64
    : MAIN_MENU.find((item) => item.key === selected)?.submenu
    ? 16 + 270
    : 64

  return (
    <ProfileProvider>
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebars */}
        <div className="hidden md:block">
          <PrimarySidebar />
        </div>
        <div className="hidden md:block">
          <SecondarySidebar
            selected={selected}
            secondarySelected={secondarySelected}
            onSecondarySelect={setSecondarySelected}
            collapsed={secondaryCollapsed}
            onCollapse={setSecondaryCollapsed}
          />
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden ml-0 md:ml-16" style={isMdUp ? { marginLeft } : undefined}>
          <Header 
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            mobileSidebarOpen={mobileSidebarOpen}
          />

          {/* Top loading bar */}
          {routeChanging && (
            <div className="h-1 w-full bg-primary animate-pulse transition-all duration-300" />
          )}

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        {/* Mobile Sidebar Overlay */}
        <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </div>
    </ProfileProvider>
  )
}
