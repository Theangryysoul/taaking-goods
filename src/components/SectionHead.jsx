export default function SectionHead({ eyebrow, title, action, className = "" }) {
  return (
    <header className={`section-head${className ? ` ${className}` : ""}`}>
      <div className="section-head__main">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="heading-2 section-head__title">{title}</h2>
      </div>
      {action && <div className="section-head__action">{action}</div>}
    </header>
  );
}
