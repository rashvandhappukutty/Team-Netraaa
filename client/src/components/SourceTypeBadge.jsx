import React from 'react';
import { 
  FileText, 
  PhoneCall, 
  CreditCard, 
  Eye, 
  UserX, 
  Globe, 
  Layers 
} from 'lucide-react';

export function SourceTypeBadge({ type }) {
  const normalized = (type || 'OTHER').toUpperCase();

  const config = {
    FIR_POLICE_REPORT: {
      label: 'FIR / Police Report',
      icon: FileText,
      style: {
        backgroundColor: 'rgba(0, 229, 255, 0.12)',
        color: '#00e5ff',
        borderColor: 'rgba(0, 229, 255, 0.35)'
      }
    },
    CDR: {
      label: 'Call Records (CDR)',
      icon: PhoneCall,
      style: {
        backgroundColor: 'rgba(101, 31, 255, 0.15)',
        color: '#a78bfa',
        borderColor: 'rgba(101, 31, 255, 0.4)'
      }
    },
    FINANCIAL_TRANSACTIONS: {
      label: 'Financial Records',
      icon: CreditCard,
      style: {
        backgroundColor: 'rgba(255, 179, 0, 0.12)',
        color: '#ffb300',
        borderColor: 'rgba(255, 179, 0, 0.35)'
      }
    },
    SURVEILLANCE_REPORT: {
      label: 'Surveillance Intel',
      icon: Eye,
      style: {
        backgroundColor: 'rgba(0, 230, 118, 0.12)',
        color: '#00e676',
        borderColor: 'rgba(0, 230, 118, 0.35)'
      }
    },
    CRIMINAL_HISTORY: {
      label: 'Criminal History',
      icon: UserX,
      style: {
        backgroundColor: 'rgba(255, 23, 68, 0.15)',
        color: '#ff1744',
        borderColor: 'rgba(255, 23, 68, 0.4)'
      }
    },
    SOCIAL_MEDIA_INTEL: {
      label: 'Digital / OSINT Intel',
      icon: Globe,
      style: {
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        color: '#38bdf8',
        borderColor: 'rgba(56, 189, 248, 0.4)'
      }
    },
    OTHER: {
      label: 'Investigation Data',
      icon: Layers,
      style: {
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
        color: '#94a3b8',
        borderColor: 'rgba(148, 163, 184, 0.3)'
      }
    }
  };

  const item = config[normalized] || config.OTHER;
  const Icon = item.icon;

  return (
    <span className="badge" style={item.style}>
      <Icon size={12} strokeWidth={2.5} />
      <span>{item.label}</span>
    </span>
  );
}

export default SourceTypeBadge;
