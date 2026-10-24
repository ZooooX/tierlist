import { MAX_SCORE } from '../lib/config.js';

export default function ScoreInput({ id, value, onChange, label, className = '' }) {
  return (
    <input
      id={id}
      className={'score ' + className}
      type="number"
      min="0"
      max={MAX_SCORE}
      step="1"
      inputMode="numeric"
      value={value ?? ''}
      aria-label={label}
      onChange={(e) => {
        const s = e.target.value;
        if (s === '') return onChange(null);
        const v = Math.round(parseFloat(s));
        if (!Number.isNaN(v)) onChange(Math.max(0, Math.min(MAX_SCORE, v)));
      }}
    />
  );
}
