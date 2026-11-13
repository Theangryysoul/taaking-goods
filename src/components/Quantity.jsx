import { Minus, Plus } from "@phosphor-icons/react";

export default function Quantity({ value, onChange, min = 1, max = 9, label = "Quantity" }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={14} weight="bold" aria-hidden="true" />
      </button>
      <span className="qty__value" aria-live="polite">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={14} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}
