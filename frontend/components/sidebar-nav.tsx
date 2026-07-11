"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: Route;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

type UtilityItem = {
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

const primaryItems: NavItem[] = [
  {
    href: "/analytics",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
      </svg>
    )
  },
  {
    href: "/patients",
    label: "Patients",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 18.5c1.1-3 3.1-4.5 5.5-4.5s4.4 1.5 5.5 4.5" />
        <path d="M16 9.5h4.5" />
        <path d="M18.25 7.25v4.5" />
      </svg>
    ),
    badge: "Focus"
  },
  {
    href: "/ai-genie",
    label: "AI Genie",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M12 3.5c1.8 2.7 2.8 5 2.8 7 0 1.3-.4 2.4-1.1 3.3" />
        <path d="M12 3.5c-1.8 2.7-2.8 5-2.8 7 0 1.3.4 2.4 1.1 3.3" />
        <path d="M7.8 12.1c-1.4.2-2.5.8-3.3 1.8 1.2 3.7 3.9 5.6 7.5 5.6s6.3-1.9 7.5-5.6c-.8-1-1.9-1.6-3.3-1.8" />
        <path d="M9.4 14.7c.6.7 1.5 1.1 2.6 1.1s2-.4 2.6-1.1" />
      </svg>
    )
  }
];

const utilityItems: UtilityItem[] = [
  {
    label: "Notifications",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M6.5 9.5a5.5 5.5 0 1 1 11 0c0 5 2 6 2 6h-15s2-1 2-6" />
        <path d="M10 18.5a2.2 2.2 0 0 0 4 0" />
      </svg>
    ),
    badge: "3"
  },
  {
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <circle cx="12" cy="12" r="3.3" />
        <path d="M19.4 15a1.1 1.1 0 0 0 .2 1.2l.1.1a1.4 1.4 0 0 1 0 2l-.1.1a1.4 1.4 0 0 1-2 0l-.1-.1a1.1 1.1 0 0 0-1.2-.2 1.1 1.1 0 0 0-.7 1v.3a1.4 1.4 0 0 1-1.4 1.4h-.3a1.4 1.4 0 0 1-1.4-1.4V19a1.1 1.1 0 0 0-.7-1 1.1 1.1 0 0 0-1.2.2l-.1.1a1.4 1.4 0 0 1-2 0l-.1-.1a1.4 1.4 0 0 1 0-2l.1-.1a1.1 1.1 0 0 0 .2-1.2 1.1 1.1 0 0 0-1-.7H4.6A1.4 1.4 0 0 1 3.2 13v-.3a1.4 1.4 0 0 1 1.4-1.4H5a1.1 1.1 0 0 0 1-.7 1.1 1.1 0 0 0-.2-1.2l-.1-.1a1.4 1.4 0 0 1 0-2l.1-.1a1.4 1.4 0 0 1 2 0l.1.1a1.1 1.1 0 0 0 1.2.2 1.1 1.1 0 0 0 .7-1V4.6A1.4 1.4 0 0 1 11.2 3.2h.3a1.4 1.4 0 0 1 1.4 1.4V5a1.1 1.1 0 0 0 .7 1 1.1 1.1 0 0 0 1.2-.2l.1-.1a1.4 1.4 0 0 1 2 0l.1.1a1.4 1.4 0 0 1 0 2l-.1.1a1.1 1.1 0 0 0-.2 1.2 1.1 1.1 0 0 0 1 .7h.3a1.4 1.4 0 0 1 1.4 1.4v.3a1.4 1.4 0 0 1-1.4 1.4h-.3a1.1 1.1 0 0 0-1 .7Z" />
      </svg>
    )
  }
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={[
        "group flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] transition-colors",
        active
          ? "bg-[#2a2420] text-[#d29a54]"
          : "text-[#857b71] hover:bg-[#241f1c] hover:text-[#efe4d8]"
      ].join(" ")}
    >
      <span className="flex items-center gap-3">
        <span className="opacity-90">{item.icon}</span>
        <span className="font-medium">{item.label}</span>
      </span>
      {item.badge ? (
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            active ? "bg-[#3b3027] text-[#d29a54]" : "bg-[#302924] text-[#d7a76b]"
          ].join(" ")}
        >
          {item.badge}
        </span>
      ) : (
        <span className={active ? "text-[#d29a54]" : "text-[#5f564d]"}>•</span>
      )}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5f564d]">
          Menu
        </p>
        <nav className="mt-4 flex flex-col gap-2" aria-label="Primary">
          {primaryItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href}
            />
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/6 pt-6">
        <nav className="flex flex-col gap-2" aria-label="Secondary">
          {utilityItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-[15px] text-[#857b71]"
            >
              <span className="flex items-center gap-3">
                <span className="opacity-90">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </span>
              {item.badge ? (
                <span className="rounded-full bg-[#3b3027] px-2 py-0.5 text-[11px] font-semibold text-[#d7a76b]">
                  {item.badge}
                </span>
              ) : (
                <span className="text-[#5f564d]">•</span>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#201b18] px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3b2d1e] text-sm font-semibold text-[#d6a464]">
            JW
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#f0e3d6]">
              Jessica Wu
            </p>
            <p className="truncate text-xs text-[#7c746c]">Front Desk</p>
          </div>
        </div>
      </div>
    </div>
  );
}
