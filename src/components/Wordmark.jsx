export default function Wordmark({ wordmark = "taaking goods" }) {
  return (
    <span className="brand">
      <svg className="brand__mark" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9.2" cy="12" r="6.8" fill="#C88A48" />
        <circle cx="14.8" cy="12" r="6.8" fill="#55604A" fillOpacity="0.88" />
        <circle cx="12" cy="12" r="2.4" fill="#F3EFE6" fillOpacity="0.55" />
      </svg>
      <span className="brand__word">{wordmark}</span>
    </span>
  );
}
