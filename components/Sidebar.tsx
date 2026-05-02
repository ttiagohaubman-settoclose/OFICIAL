"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { clsx } from "clsx";
import { LayoutDashboard, LogOut, User } from "lucide-react";
import { CLIENTS } from "@/lib/config";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const clientId = (session?.user as any)?.clientId;

  const navItems =
    role === "admin"
      ? [
          { href: "/dashboard", label: "Agency Overview", icon: LayoutDashboard },
          ...CLIENTS.map((c) => ({
            href: `/dashboard/${c.id}`,
            label: c.name,
            icon: User,
            sub: c.state,
          })),
        ]
      : [
          {
            href: `/dashboard/${clientId}`,
            label: "My Dashboard",
            icon: LayoutDashboard,
          },
        ];

  return (
    <aside className="w-56 shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <Logo className="w-36 text-black dark:text-white" />
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Icon size={15} />
              <div>
                <div>{item.label}</div>
                {"sub" in item && item.sub && (
                  <div className={clsx("text-xs", active ? "opacity-70" : "text-gray-400 dark:text-gray-500")}>
                    {item.sub}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
          {session?.user?.name}
        </span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
