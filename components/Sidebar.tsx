"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { clsx } from "clsx";
import { Building2, LogOut, User } from "lucide-react";
import { CLIENTS } from "@/lib/config";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const clientId = (session?.user as any)?.clientId;

  const navItems =
    role === "admin"
      ? [
          { href: "/dashboard", label: "Agency Overview", icon: Building2, sub: null },
          ...CLIENTS.map((c) => ({
            href: `/dashboard/${c.id}`,
            label: c.name,
            icon: User,
            sub: c.state,
          })),
        ]
      : [
          { href: `/dashboard/${clientId}`, label: "My Dashboard", icon: Building2, sub: null },
        ];

  return (
    <aside className="w-56 shrink-0 border-r bg-white dark:bg-black border-gray-100 dark:border-[#1c1c1c] flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-gray-100 dark:border-[#1c1c1c] flex justify-center">
        <Logo className="w-40 text-black dark:text-white" />
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
                  : "text-gray-600 dark:text-[#888] hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              <Icon size={15} />
              <div>
                <div>{item.label}</div>
                {item.sub && (
                  <div className={clsx("text-xs", active ? "opacity-60" : "text-gray-400 dark:text-[#555]")}>
                    {item.sub}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 dark:border-[#1c1c1c] flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-[#555] truncate">
          {session?.user?.name}
        </span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
