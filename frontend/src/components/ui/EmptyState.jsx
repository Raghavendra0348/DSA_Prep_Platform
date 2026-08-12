import { Inbox } from 'lucide-react';
import './EmptyState.css';

export default function EmptyState({ message = 'Nothing to show', icon: Icon = Inbox, action }) {
  return (
    <div className="empty-state">
      <Icon size={48} className="empty-state-icon" />
      <p className="empty-state-message">{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
