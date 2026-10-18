export default function NotFound() {
  return (
    <main className="login">
      <div className="login__glow" aria-hidden />
      <div className="login__card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Techwitpro" width={160} height={20} className="login__logo" />
        <h1>This link isn&apos;t available</h1>
        <p>It may have been removed or mistyped. Ask the person who sent it for a fresh link.</p>
      </div>
    </main>
  );
}
