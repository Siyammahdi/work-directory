export default function Loading() {
  return (
    <>
      <div className="app-header">
        <div className="app-header__inner" />
      </div>
      <main className="page" aria-busy="true" aria-label="Loading work">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--text" />
        <div className="grid">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="card card--skeleton">
              <div className="skeleton card__media" />
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--line short" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
