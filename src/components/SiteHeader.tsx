import { useState, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Heart, LogOut, Menu, Sun, Moon } from "lucide-react";
import { useAuth, signOut } from "@/lib/auth";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Check initial theme state on client mount
    const isDark =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  const isAuthPage = pathname.startsWith("/auth") || pathname.startsWith("/signup");

  return (
    <header className="sticky top-4 z-40 mx-auto w-[calc(100%-2rem)] max-w-6xl rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-xs transition-all duration-300 my-2">
      <div className="flex h-14 items-center justify-between gap-4 px-5">
        {/* Branding Area */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
              <Heart className="h-4 w-4 fill-current text-current" />
            </div>
            <span className="font-display text-sm font-black tracking-tight text-foreground select-none hidden sm:inline-block">
              Kind<span className="text-muted-foreground font-medium">Link</span>
              <span className="text-primary font-black">.</span>
            </span>
          </Link>
        </div>

        {/* Capsule Navigation Track (Desktop only) */}
        <nav className="hidden items-center bg-secondary/35 border border-border/30 rounded-full p-1 gap-1 md:flex">
          <Link
            to="/browse"
            className="rounded-full px-4.5 py-1.5 text-xs font-semibold text-foreground/70 transition-all hover:text-foreground hover:bg-background/50 [&.active]:bg-background [&.active]:text-foreground [&.active]:shadow-xs"
          >
            Browse events
          </Link>
          {role === "volunteer" && (
            <>
              <Link
                to="/volunteer/search"
                className="rounded-full px-4.5 py-1.5 text-xs font-semibold text-foreground/70 transition-all hover:text-foreground hover:bg-background/50 [&.active]:bg-background [&.active]:text-foreground [&.active]:shadow-xs"
              >
                Find events
              </Link>
              <Link
                to="/volunteer/applications"
                className="rounded-full px-4.5 py-1.5 text-xs font-semibold text-foreground/70 transition-all hover:text-foreground hover:bg-background/50 [&.active]:bg-background [&.active]:text-foreground [&.active]:shadow-xs"
              >
                My applications
              </Link>
              <Link
                to="/volunteer/certificates"
                className="rounded-full px-4.5 py-1.5 text-xs font-semibold text-foreground/70 transition-all hover:text-foreground hover:bg-background/50 [&.active]:bg-background [&.active]:text-foreground [&.active]:shadow-xs"
              >
                Certificates
              </Link>
            </>
          )}
          {role === "ngo" && (
            <>
              <Link
                to="/ngo/events"
                className="rounded-full px-4.5 py-1.5 text-xs font-semibold text-foreground/70 transition-all hover:text-foreground hover:bg-background/50 [&.active]:bg-background [&.active]:text-foreground [&.active]:shadow-xs"
              >
                My events
              </Link>
            </>
          )}
          {role === "admin" && (
            <Link
              to="/admin"
              className="rounded-full px-4.5 py-1.5 text-xs font-semibold text-foreground/70 transition-all hover:text-foreground hover:bg-background/50 [&.active]:bg-background [&.active]:text-foreground [&.active]:shadow-xs"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* User Session & Theme Controls */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8.5 w-8.5 rounded-full text-foreground/70 hover:text-foreground hover:bg-secondary/50 cursor-pointer transition-all duration-200"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4.5 w-4.5 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="h-4.5 w-4.5 transition-transform duration-300 hover:-rotate-12" />
            )}
          </Button>

          {user ? (
            <>
              <NotificationBell />

              {/* Profile Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8.5 w-8.5 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center p-0 overflow-hidden border border-border/50 cursor-pointer focus-visible:ring-1 focus-visible:ring-ring transition-all"
                  >
                    <span className="text-xs font-bold text-foreground">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-2xl p-1.5 border-border/40 shadow-md"
                >
                  <div className="px-3 py-2 text-xs">
                    <p className="font-semibold text-foreground/50 uppercase tracking-wider text-[9px]">
                      Account
                    </p>
                    <p className="font-medium text-foreground truncate mt-0.5">{user.email}</p>
                    {role && (
                      <span className="inline-block mt-1.5 rounded-md bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-bold capitalize">
                        {role}
                      </span>
                    )}
                  </div>

                  <DropdownMenuSeparator className="my-1 opacity-50" />

                  {/* Mobile Navigation Links */}
                  <div className="md:hidden">
                    <p className="px-3 py-1 font-semibold text-foreground/50 uppercase tracking-wider text-[9px]">
                      Navigation
                    </p>
                    <DropdownMenuItem
                      className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 focus:bg-secondary/70"
                      onClick={() => navigate({ to: "/browse" })}
                    >
                      Browse events
                    </DropdownMenuItem>
                    {role === "volunteer" && (
                      <>
                        <DropdownMenuItem
                          className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 focus:bg-secondary/70"
                          onClick={() => navigate({ to: "/volunteer/search" })}
                        >
                          Find events
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 focus:bg-secondary/70"
                          onClick={() => navigate({ to: "/volunteer/applications" })}
                        >
                          My applications
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 focus:bg-secondary/70"
                          onClick={() => navigate({ to: "/volunteer/certificates" })}
                        >
                          Certificates
                        </DropdownMenuItem>
                      </>
                    )}
                    {role === "ngo" && (
                      <DropdownMenuItem
                        className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 focus:bg-secondary/70"
                        onClick={() => navigate({ to: "/ngo/events" })}
                      >
                        My events
                      </DropdownMenuItem>
                    )}
                    {role === "admin" && (
                      <DropdownMenuItem
                        className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 focus:bg-secondary/70"
                        onClick={() => navigate({ to: "/admin" })}
                      >
                        Admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="my-1 opacity-50" />
                  </div>

                  {/* Settings / Profile Section */}
                  <p className="px-3 py-1 font-semibold text-foreground/50 uppercase tracking-wider text-[9px]">
                    Settings
                  </p>
                  {role === "volunteer" && (
                    <DropdownMenuItem
                      className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 focus:bg-secondary/70"
                      onClick={() => navigate({ to: "/volunteer/profile" })}
                    >
                      My Profile
                    </DropdownMenuItem>
                  )}
                  {role === "ngo" && (
                    <DropdownMenuItem
                      className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3 focus:bg-secondary/70"
                      onClick={() => navigate({ to: "/ngo/profile" })}
                    >
                      Org Profile
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-1 opacity-50" />

                  <DropdownMenuItem
                    className="rounded-xl text-xs font-bold text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer py-2 px-3"
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : !isAuthPage ? (
            <div className="flex items-center gap-1 md:gap-1.5">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-full text-xs font-semibold h-8.5 px-3.5 text-foreground/85 hover:text-foreground hover:bg-secondary/60 cursor-pointer transition-all duration-200"
              >
                <Link to="/auth">Log in</Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="hidden sm:inline-flex rounded-full bg-primary text-primary-foreground text-xs font-bold h-8.5 px-4.5 cursor-pointer shadow-xs hover:scale-102 hover:shadow-md transition-all active:scale-98"
              >
                <Link to="/signup/volunteer">Sign up</Link>
              </Button>

              {/* Burger menu for logged out mobile views */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden h-8.5 w-8.5 rounded-full text-foreground/70 hover:text-foreground hover:bg-secondary/50 cursor-pointer"
                  >
                    <Menu className="h-4.5 w-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-2xl p-1.5 border-border/40 shadow-md"
                >
                  <DropdownMenuItem
                    className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3"
                    onClick={() => navigate({ to: "/browse" })}
                  >
                    Browse events
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 opacity-50" />
                  <DropdownMenuItem
                    className="rounded-xl text-xs font-semibold cursor-pointer py-2 px-3"
                    onClick={() => navigate({ to: "/auth" })}
                  >
                    Log in
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-xl text-xs font-bold text-primary cursor-pointer py-2 px-3"
                    onClick={() => navigate({ to: "/signup/volunteer" })}
                  >
                    Sign up
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
