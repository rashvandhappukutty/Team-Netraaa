import React from 'react';
import { 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  Car, 
  CreditCard, 
  ArrowRightLeft, 
  Smartphone, 
  Calendar, 
  Clock, 
  Zap,
  HelpCircle
} from 'lucide-react';

export function EntityTypeBadge({ type, size = 'md' }) {
  const normalized = (type || 'OTHER').toUpperCase();

  const config = {
    PERSON: {
      label: 'Person',
      icon: User,
      style: {
        backgroundColor: 'rgba(0, 229, 255, 0.12)',
        color: '#00e5ff',
        borderColor: 'rgba(0, 229, 255, 0.4)'
      }
    },
    ORGANIZATION: {
      label: 'Organization',
      icon: Building2,
      style: {
        backgroundColor: 'rgba(147, 51, 234, 0.15)',
        color: '#c084fc',
        borderColor: 'rgba(147, 51, 234, 0.45)'
      }
    },
    PHONE_NUMBER: {
      label: 'Phone Number',
      icon: Phone,
      style: {
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        color: '#fbbf24',
        borderColor: 'rgba(245, 158, 11, 0.4)'
      }
    },
    LOCATION: {
      label: 'Location',
      icon: MapPin,
      style: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        color: '#34d399',
        borderColor: 'rgba(16, 185, 129, 0.4)'
      }
    },
    VEHICLE: {
      label: 'Vehicle',
      icon: Car,
      style: {
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        color: '#fb923c',
        borderColor: 'rgba(249, 115, 22, 0.45)'
      }
    },
    ACCOUNT_NUMBER: {
      label: 'Financial Account',
      icon: CreditCard,
      style: {
        backgroundColor: 'rgba(244, 63, 94, 0.15)',
        color: '#fb7185',
        borderColor: 'rgba(244, 63, 94, 0.45)'
      }
    },
    TRANSACTION: {
      label: 'Transaction',
      icon: ArrowRightLeft,
      style: {
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        color: '#facc15',
        borderColor: 'rgba(234, 179, 8, 0.45)'
      }
    },
    DEVICE_IDENTIFIER: {
      label: 'Hardware ID / IMEI',
      icon: Smartphone,
      style: {
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        color: '#38bdf8',
        borderColor: 'rgba(56, 189, 248, 0.45)'
      }
    },
    DATE: {
      label: 'Date',
      icon: Calendar,
      style: {
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
        color: '#94a3b8',
        borderColor: 'rgba(148, 163, 184, 0.35)'
      }
    },
    TIME: {
      label: 'Time',
      icon: Clock,
      style: {
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
        color: '#cbd5e1',
        borderColor: 'rgba(148, 163, 184, 0.3)'
      }
    },
    EVENT: {
      label: 'Investigation Event',
      icon: Zap,
      style: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        color: '#f87171',
        borderColor: 'rgba(239, 68, 68, 0.45)',
        boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)'
      }
    }
  };

  const item = config[normalized] || {
    label: normalized,
    icon: HelpCircle,
    style: {
      backgroundColor: 'rgba(148, 163, 184, 0.12)',
      color: '#94a3b8',
      borderColor: 'rgba(148, 163, 184, 0.3)'
    }
  };

  const Icon = item.icon;
  const iconSize = size === 'sm' ? 11 : size === 'lg' ? 14 : 12;

  return (
    <span className="badge" style={{ ...item.style, fontSize: size === 'sm' ? '0.675rem' : '0.725rem' }}>
      <Icon size={iconSize} strokeWidth={2.5} />
      <span>{item.label}</span>
    </span>
  );
}

export default EntityTypeBadge;
