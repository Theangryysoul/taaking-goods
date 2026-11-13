import { Plus } from "@phosphor-icons/react";

export default function Accordion({ items, name, tight = false }) {
  return (
    <div className={`accordion${tight ? " accordion--tight" : ""}`}>
      {items.map((item) => (
        <details className="accordion__item" key={item.question || item.title} name={name}>
          <summary className="accordion__summary">
            <span className="title-2">{item.question || item.title}</span>
            <span className="accordion__icon" aria-hidden="true">
              <Plus size={16} weight="regular" />
            </span>
          </summary>
          <div className="accordion__body">
            <p className="body-3">{item.answer || item.copy}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
