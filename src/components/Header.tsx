import Link from "next/link";

const NAV_ITEMS = [
  { href: "/hospitals", label: "병원 검색" },
  { href: "/nonpayment", label: "비급여 진료비 비교" },
  { href: "/diseases", label: "질병별 진료비 통계" },
  { href: "/drug-usage", label: "의약품 사용정보" },
  { href: "/actual-costs", label: "실제 진료비 통계" },
];

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
        <Link href="/" className="font-semibold tracking-tight">
          병원비 조회
        </Link>
        <nav className="flex gap-4 text-sm text-muted">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
