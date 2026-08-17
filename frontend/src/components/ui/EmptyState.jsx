import { Inbox } from 'lucide-react';
import './EmptyState.css';

export default function EmptyState({ message = 'Nothing to show', icon: Icon = Inbox, action }) {
  return (
    <div className="empty-state animate-in">
      <div className="empty-state-icon-wrap" aria-hidden="true">
        <Icon size={40} className="empty-state-icon" />
      </div>
      <p className="empty-state-message">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
