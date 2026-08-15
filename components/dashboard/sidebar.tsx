"use client";

import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UserIcon,
  TrophyIcon,
  ShoppingCartIcon,
  WalletIcon,
  ChevronDownIcon,
  SearchIcon,
  ShieldIcon,
  SendIcon,
  SettingsIcon,
  UsersIcon,
  CreditCardIcon,
  LogOutIcon,
  AnnouncementIcon,
} from "@/components/icons";
import { useState } from "react";
import { signOut } from "next-auth/react";

const navMain = [
  { href: "/panel", label: "Ana Sayfa", icon: HomeIcon },
];
const navUser = [
  { href: "/panel/profilim", label: "Profilim", icon: UserIcon },
  { href: "/panel/kullanici-siralamasi", label: "Kullanıcı Sıralaması", icon: TrophyIcon },
];
const navMarket = [
  { href: "/panel/market", label: "Market", icon: ShoppingCartIcon },
  { href: "/panel/market/satin-alimlarim", label: "Satın Alımlarım", icon: CreditCardIcon },
  { href: "/panel/bakiye-yukle", label: "Bakiye Yükle", icon: WalletIcon, badge: "Bonus" },
];

type NavChild = { href: string; label: string; badge?: string };
type NavItem =
  | { href: string; label: string; icon: React.ComponentType<{ className?: string }>; sub?: false; badge?: string }
  | { label: string; icon: React.ComponentType<{ className?: string }>; sub: true; children: NavChild[] };

const navChecker: NavItem[] = [
  {
    href: "/panel/checker/usom",
    label: "USOM Sorgulama",
    icon: ShieldIcon,
  },
  {
    href: "/panel/checker/shodan",
    label: "IP Sorgulama",
    icon: SearchIcon,
  },
  {
    label: "Checker Çözümleri",
    icon: CreditCardIcon,
    sub: true,
    children: [
      { href: "/panel/checker/kart-checker", label: "Kart Checker" },
      { href: "/panel/checker/bin-checker", label: "BIN Checker" },
      { href: "/panel/checker/card-parser", label: "Card Parser" },
      { href: "/panel/checker/json-parser", label: "JSON Parser" },
    ],
  },
];

const navSupport = [
  { href: "/panel/destek", label: "Destek", icon: ShieldIcon },
  { href: "/panel/telegram", label: "Telegram", icon: SendIcon },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 first:mt-0">
      {children}
    </p>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
        active
          ? "bg-accent/10 text-accent"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-accent" : "text-muted-foreground/70 group-hover:text-foreground"}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
          {badge}
        </span>
      )}
    </Link>
  );
}

function SubMenu({ item, pathname }: { item: Extract<NavItem, { sub: true }>; pathname: string }) {
  const isAnyChildActive = item.children.some((c) => pathname === c.href);
  const [open, setOpen] = useState(isAnyChildActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
          isAnyChildActive
            ? "bg-accent/10 text-accent"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        }`}
      >
        <item.icon className={`h-4 w-4 shrink-0 ${isAnyChildActive ? "text-accent" : "text-muted-foreground/70 group-hover:text-foreground"}`} />
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${isAnyChildActive ? "text-accent" : "text-muted-foreground/50"}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3 pb-1">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors ${
                    pathname === child.href
                      ? "text-accent font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`h-1 w-1 rounded-full shrink-0 ${pathname === child.href ? "bg-accent" : "bg-muted-foreground/40"}`} />
                  <span className="truncate">{child.label}</span>
                  {child.badge && (
                    <span className="rounded bg-accent/15 px-1 text-[10px] font-semibold text-accent">
                      {child.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavSection({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <div className="space-y-0.5">
      {items.map((item, i) => {
        if (item.sub) return <SubMenu key={i} item={item} pathname={pathname} />;
        return (
          <NavLink
            key={(item as { href: string }).href}
            href={(item as { href: string }).href}
            label={item.label}
            icon={item.icon}
            {...((item as { badge?: string }).badge ? { badge: (item as { badge?: string }).badge } : {})}
            active={pathname === (item as { href: string }).href}
          />
        );
      })}
    </div>
  );
}

const PERM_LABELS: Record<string, string> = {
  none: "Ücretsiz",
  checker: "Checker",
};

const PERM_COLORS: Record<string, string> = {
  none: "text-muted-foreground",
  checker: "text-violet-400",
};

const MEMBERSHIP_COLORS: Record<string, string> = {
  free: "text-muted-foreground",
  basic: "text-blue-400",
  pro: "text-accent",
  enterprise: "text-amber-400",
};

export function Sidebar({
  user,
}: {
  user: { name?: string | null; email?: string | null; role?: string; membership?: string; balance?: number; permissions?: string; avatar?: string | null };
}) {
  const pathname = usePathname();
  const isAdmin = user?.role === "super_admin" || user?.role === "mini_admin";
  const membershipColor = MEMBERSHIP_COLORS[user?.membership ?? "free"] ?? "text-muted-foreground";

  const perms = user?.permissions ?? "none";
  const canChecker = isAdmin || perms === "checker";

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 overflow-y-auto overflow-x-hidden border-r border-border bg-card scrollbar-hide">
      {/* Logo - sticky */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-4 py-3.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15">
          <SearchIcon className="h-3.5 w-3.5 text-accent" />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-foreground">dark<span className="text-accent">check</span></span>
      </div>

      {/* Nav content */}
      <div className="flex flex-col px-3 py-3">
        {/* User card */}
        <div className="mb-3 rounded-xl border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent ring-1 ring-accent/20 overflow-hidden">
              {user?.avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                : (user?.name ?? "K").charAt(0).toUpperCase()
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground leading-tight">{user?.name ?? "Kullanıcı"}</p>
              <p className={`text-[11px] font-medium leading-tight ${PERM_COLORS[perms] ?? "text-muted-foreground"}`}>
                {PERM_LABELS[perms] ?? "Ücretsiz"}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground leading-tight mt-0.5">
                <WalletIcon className="h-3 w-3 shrink-0" />
                <span className="font-medium text-foreground">{user?.balance ?? 0}€</span>
                <span>bakiye</span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-0.5">
          {navMain.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={pathname === item.href} />
          ))}
          {navUser.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={pathname === item.href} />
          ))}
        </div>

        <SectionLabel>Market</SectionLabel>
        <div className="space-y-0.5">
          {navMarket.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} {...(item.badge ? { badge: item.badge } : {})} active={pathname === item.href} />
          ))}
        </div>

        <SectionLabel>Checker</SectionLabel>
        <NavSection items={navChecker} pathname={pathname} />

        <SectionLabel>Destek</SectionLabel>
        <div className="space-y-0.5">
          {navSupport.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} active={pathname === item.href} />
          ))}
        </div>

        {isAdmin && (
          <>
            <SectionLabel>Yönetim</SectionLabel>
            <div className="space-y-0.5">
              <NavLink href="/panel/admin" label="Admin Paneli" icon={ShieldIcon} active={pathname === "/panel/admin"} />
              <NavLink href="/panel/admin/duyurular" label="Duyurular" icon={AnnouncementIcon} active={pathname === "/panel/admin/duyurular"} />
              <NavLink href="/panel/admin/odemeler" label="Ödemeler" icon={WalletIcon} active={pathname === "/panel/admin/odemeler"} />
              <NavLink href="/panel/admin/market" label="Market Yönetimi" icon={ShoppingCartIcon} active={pathname === "/panel/admin/market"} />
              <NavLink href="/panel/admin/destek" label="Destek Talepleri" icon={SendIcon} active={pathname === "/panel/admin/destek"} />
              {user?.role === "super_admin" && (
                <>
                  <NavLink href="/panel/admin/kullanicilar" label="Kullanıcılar" icon={UsersIcon} active={pathname === "/panel/admin/kullanicilar"} />
                  <NavLink href="/panel/admin/api-ayarlari" label="API Ayarları" icon={SettingsIcon} active={pathname === "/panel/admin/api-ayarlari"} />
                </>
              )}
            </div>
          </>
        )}

        <div className="pb-16" />
      </div>

      {/* Logout - sticky bottom */}
      <div className="sticky bottom-0 border-t border-border bg-card px-3 py-2.5">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOutIcon className="h-4 w-4 shrink-0" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
