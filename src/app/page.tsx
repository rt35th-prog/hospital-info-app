import Link from "next/link";

const CARDS = [
  {
    href: "/hospitals",
    title: "병원 검색",
    desc: "지역·진료과목·병원명으로 전국 병의원 기본정보를 검색합니다.",
  },
  {
    href: "/nonpayment",
    title: "비급여 진료비 비교",
    desc: "지역 내 병원들의 비급여 진료 항목 가격을 비교합니다.",
  },
  {
    href: "/diseases",
    title: "질병별 진료비 통계",
    desc: "질병(상병)별 다빈도 진료비·진료인원 통계를 확인합니다.",
  },
  {
    href: "/drug-usage",
    title: "의약품 사용정보",
    desc: "약효분류군·성분별 처방/사용량과 사용금액 통계를 확인합니다.",
  },
  {
    href: "/actual-costs",
    title: "실제 진료비 통계",
    desc: "지역·기관종별·진료과목·연령·희귀질환별 실제 요양급여비용 청구 통계입니다.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">심평원 공공데이터로 병원비 알아보기</h1>
        <p className="mt-2 text-muted">
          건강보험심사평가원(HIRA)의 공공데이터를 활용해 병원 정보, 비급여 진료비, 질병별 진료비 통계를 조회할 수 있습니다.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-border bg-surface p-5 hover:border-accent transition-colors"
          >
            <h2 className="font-medium">{card.title}</h2>
            <p className="mt-1.5 text-sm text-muted">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
