import React from 'react';
import { Flame, AlertTriangle, Info, Minus } from 'lucide-react';

export function PriorityBadge({ priority }) {
  const normalized = (priority || 'MEDIUM').toUpperCase();

  const config = {
    CRITICAL: {
      label: 'Critical',
      icon: Flame,
      style: {
        backgroundColor: 'rgba(255, 23, 68, 0.15)',
        color: '#ff1744',
        borderColor: 'rgba(255, 23, 68, 0.45)',
        boxShadow: '0 0 10px rgba(255, 23, 68, 0.25)'
      }
    },
    HIGH: {
      label: 'High',
      icon: AlertTriangle,
      style: {
        backgroundColor: 'rgba(255, 145, 0, 0.15)',
        color: '#ff9100',
        borderColor: 'rgba(255, 145, 0, 0.4)'
      }
    },
    MEDIUM: {
      label: 'Medium',
      icon: Info,
      style: {
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
        color: '#38bdf8',
        borderColor: 'rgba(0, 229, 255, 0.3)'
      }
    },
    LOW: {
      label: 'Low',
      icon: Minus,
      style: {
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
        color: '#94a3b8',
        borderColor: 'rgba(148, 163, 184, 0.25)'
      }
    }
  };

  const item = config[normalized] || config.MEDIUM;
  const Icon = item.icon;

  return (
    <span className="badge" style={item.style}>
      <Icon size={12} strokeWidth={2.5} />
      <span>{item.label}</span>
    </span>
  );
}

export default PriorityBadge;
