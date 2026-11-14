// The studio logo. One component so the nav, mobile menu, and footer all stay
// in sync. Swap `public/logo.png` to update it everywhere.
export default function Wordmark({ wordmark = "taaking goods" }) {
  return (
    <span className="brand">
      <img
        className="brand__logo"
        src="/logo.png"
        alt={`${wordmark} logo`}
        width={44}
        height={44}
        decoding="async"
      />
      <span className="brand__word">{wordmark}</span>
    </span>
  );
}
