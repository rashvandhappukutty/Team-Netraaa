import React from 'react';
import { ShieldCheck, AlertCircle, HelpCircle } from 'lucide-react';

export function EntityConfidenceBadge({ score }) {
  const numScore = typeof score === 'number' ? score : parseFloat(score) || 0;
  const percentage = Math.round(numScore * 100);

  if (numScore >= 0.90) {
    return (
      <span className="badge" style={{
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        color: '#10b981',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        fontSize: '0.7rem'
      }}>
        <ShieldCheck size={12} strokeWidth={2.5} />
        <span>{percentage}% High Confidence</span>
      </span>
    );
  }

  if (numScore >= 0.70) {
    return (
      <span className="badge" style={{
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        color: '#fbbf24',
        border: '1px solid rgba(245, 158, 11, 0.45)',
        fontSize: '0.7rem'
      }}>
        <AlertCircle size={12} strokeWidth={2.5} />
        <span>{percentage}% Review Required</span>
      </span>
    );
  }

  return (
    <span className="badge" style={{
      backgroundColor: 'rgba(148, 163, 184, 0.12)',
      color: '#94a3b8',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      fontSize: '0.7rem'
    }}>
      <HelpCircle size={12} strokeWidth={2.5} />
      <span>{percentage}% Low Match</span>
    </span>
  );
}

export default EntityConfidenceBadge;
