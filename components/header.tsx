"use client";

import { SearchCheck, Newspaper, Menu, Sun, Moon, Users, User, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/lib/better-auth-client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import React from "react";
import { useDiagramExpansion } from "@/lib/hooks/useDiagramExpansion";
import { useAuth } from "@/lib/hooks/use-auth";

export function Header() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { isExpanded } = useDiagramExpansion();

  // Compact Avatar Dropdown Component
  const AvatarDropdown = () => {
    const { user, signOut: authSignOut } = useAuth();
    const { theme, setTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    const languages = [
      { code: "en" as const, label: t.english, flag: "🇺🇸" },
      { code: "ms" as const, label: t.malay, flag: "🇲🇾" },
      { code: "zh" as const, label: t.chinese, flag: "🇨🇳" },
    ];

    const handleSignOut = async () => {
      await signOut();
      await authSignOut();
    };

    if (!user) {
      return (
        <Button variant="default" size="sm" asChild>
          <Link href="/sign-in">{t.signIn}</Link>
        </Button>
      );
    }

    const userInitials = user.email
      ? user.email
          .split("@")[0]
          .split(".")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={user.email || "User"} />
              <AvatarFallback className="text-xs font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-3 w-3 absolute -bottom-1 -right-1 bg-background rounded-full p-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium text-sm truncate">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          
          {/* Language Selection */}
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground mb-1">{t.language}</p>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "en" | "ms" | "zh")}
              className="w-full text-sm bg-transparent border rounded px-2 py-1"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Theme Toggle */}
          {mounted && (
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  {t.toggleTheme}
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  {t.toggleTheme}
                </>
              )}
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Controls to show in both desktop and mobile menu
  // Accepts optional closeMenu function for mobile
  const Controls = ({
    closeMenu,
    mobile,
  }: { closeMenu?: () => void; mobile?: boolean } = {}) => (
    <>
      {pathname !== "/news" && (
        <Button
          variant="outline"
          size="sm"
          className={
            mobile ? "w-full justify-start cursor-pointer" : "cursor-pointer"
          }
          asChild
        >
          <Link href="/news" className="inline-flex items-center">
            <Newspaper className="h-4 w-4 mr-2" />
            {t.getNews}
          </Link>
        </Button>
      )}
      {pathname !== "/crowdsource" && (
        <Button
          variant="outline"
          size="sm"
          className={
            mobile ? "w-full justify-start cursor-pointer" : "cursor-pointer"
          }
          asChild
        >
          <Link href="/crowdsource" className="inline-flex items-center">
            <Users className="h-4 w-4 mr-2" />
            {t.voteOnNews}
          </Link>
        </Button>
      )}
      {mobile && <AvatarDropdown />}
    </>
  );

  return (
    <header className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-400 ${isExpanded ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}>
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <SearchCheck className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">Checkmate</span>
          </Link>
          {/* Desktop controls */}
          <div className="hidden sm:flex items-center gap-3">
            <Controls />
            <AvatarDropdown />
          </div>
          {/* Mobile menu */}
          <div className="sm:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex flex-col gap-4 w-56 pt-8"
              >
                <Controls closeMenu={() => setMenuOpen(false)} mobile />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

