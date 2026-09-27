import React from 'react';
import { Activity, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export function StatusBadge({ status }) {
  const normalized = (status || 'ACTIVE').toUpperCase();

  const config = {
    ACTIVE: {
      label: 'Active',
      icon: Activity,
      style: {
        backgroundColor: 'rgba(0, 229, 255, 0.12)',
        color: '#00e5ff',
        borderColor: 'rgba(0, 229, 255, 0.35)'
      }
    },
    UNDER_INVESTIGATION: {
      label: 'Under Investigation',
      icon: Clock,
      style: {
        backgroundColor: 'rgba(255, 179, 0, 0.12)',
        color: '#ffb300',
        borderColor: 'rgba(255, 179, 0, 0.35)'
      }
    },
    PENDING: {
      label: 'Pending',
      icon: AlertCircle,
      style: {
        backgroundColor: 'rgba(101, 31, 255, 0.15)',
        color: '#a78bfa',
        borderColor: 'rgba(101, 31, 255, 0.4)'
      }
    },
    CLOSED: {
      label: 'Closed',
      icon: CheckCircle2,
      style: {
        backgroundColor: 'rgba(100, 116, 139, 0.15)',
        color: '#94a3b8',
        borderColor: 'rgba(100, 116, 139, 0.35)'
      }
    }
  };

  const item = config[normalized] || config.ACTIVE;
  const Icon = item.icon;

  return (
    <span className="badge" style={item.style}>
      <Icon size={12} strokeWidth={2.5} />
      <span>{item.label}</span>
    </span>
  );
}

export default StatusBadge;
