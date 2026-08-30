export default function MockBanner({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-foreground">
      {children ?? (
        <>
          현재 샘플(mock) 데이터로 동작 중입니다. 공공데이터포털 서비스키를{" "}
          <code className="rounded bg-black/10 px-1 py-0.5 dark:bg-white/10">.env.local</code>의{" "}
          <code className="rounded bg-black/10 px-1 py-0.5 dark:bg-white/10">HIRA_SERVICE_KEY</code>에 설정하면 실제
          데이터로 전환됩니다.
        </>
      )}
    </div>
  );
}
