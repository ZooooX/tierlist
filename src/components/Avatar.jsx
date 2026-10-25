import { initials } from '../lib/avatar.js';

export default function Avatar({ src, name, className = '' }) {
  return (
    <span className={'avatar ' + className} aria-hidden="true">
      {src ? <img src={src} alt="" draggable="false" /> : <span className="avatar-initials">{initials(name)}</span>}
    </span>
  );
}
