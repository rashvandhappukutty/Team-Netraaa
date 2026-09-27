import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

export function IntegrityBadge({ status }) {
  const normalized = (status || 'VERIFIED').toUpperCase();

  const config = {
    VERIFIED: {
      label: 'Verified',
      icon: ShieldCheck,
      style: {
        backgroundColor: 'rgba(0, 230, 118, 0.12)',
        color: '#00e676',
        borderColor: 'rgba(0, 230, 118, 0.4)',
        boxShadow: '0 0 10px rgba(0, 230, 118, 0.2)'
      }
    },
    HASH_GENERATED: {
      label: 'Hash Generated',
      icon: Shield,
      style: {
        backgroundColor: 'rgba(0, 229, 255, 0.12)',
        color: '#00e5ff',
        borderColor: 'rgba(0, 229, 255, 0.35)'
      }
    },
    VERIFICATION_FAILED: {
      label: 'Integrity Alert',
      icon: ShieldAlert,
      style: {
        backgroundColor: 'rgba(255, 23, 68, 0.2)',
        color: '#ff1744',
        borderColor: 'rgba(255, 23, 68, 0.5)',
        boxShadow: '0 0 12px rgba(255, 23, 68, 0.35)'
      }
    }
  };

  const item = config[normalized] || config.VERIFIED;
  const Icon = item.icon;

  return (
    <span className="badge" style={item.style}>
      <Icon size={13} strokeWidth={2.5} />
      <span>{item.label}</span>
    </span>
  );
}

export default IntegrityBadge;
