import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/invoices/new", label: "New Invoice" },
  { href: "/invoices", label: "History" },
  { href: "/catalog", label: "Catalog" },
  { href: "/settings/brand", label: "Brand Settings" },
];

export function TopNav() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-panel px-6 py-4">
      <div className="flex items-center gap-8">
        <Link href="/invoices/new" className="flex items-center">
          <img src="/logo.png" alt="UnboundYou" className="h-8 w-auto nav-logo" />
        </Link>
        <nav className="flex gap-5 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted hover:text-foreground transition">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <ThemeToggle />
    </header>
  );
}
