export function HomeSkeleton() {
  return (
    <main className="app-shell min-h-[100dvh]" aria-busy="true" aria-label="正在加载首页">
      <div className="page-content">
        <div className="skeleton skeleton-guide" />
        <div className="skeleton skeleton-feature" />
        <div className="skeleton skeleton-feature" />
        <div className="skeleton skeleton-feature" />
      </div>
      <div className="question-dock" aria-hidden="true">
        <div className="skeleton skeleton-question" />
      </div>
    </main>
  );
}
