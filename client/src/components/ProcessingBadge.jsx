import React from 'react';
import { 
  UploadCloud, 
  Search, 
  FileCheck2, 
  FileText, 
  Sparkles, 
  CheckCheck, 
  Cpu, 
  AlertOctagon,
  Loader2
} from 'lucide-react';

export function ProcessingBadge({ status }) {
  const normalized = (status || 'UPLOADED').toUpperCase();

  const config = {
    UPLOADED: {
      label: 'Uploaded',
      icon: UploadCloud,
      style: {
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
        color: '#94a3b8',
        borderColor: 'rgba(148, 163, 184, 0.3)'
      }
    },
    VALIDATING: {
      label: 'Validating Format',
      icon: Loader2,
      spin: true,
      style: {
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        color: '#38bdf8',
        borderColor: 'rgba(56, 189, 248, 0.4)'
      }
    },
    VALIDATED: {
      label: 'Format Validated',
      icon: FileCheck2,
      style: {
        backgroundColor: 'rgba(0, 229, 255, 0.12)',
        color: '#00e5ff',
        borderColor: 'rgba(0, 229, 255, 0.35)'
      }
    },
    EXTRACTING: {
      label: 'Extracting Content',
      icon: Loader2,
      spin: true,
      style: {
        backgroundColor: 'rgba(255, 179, 0, 0.15)',
        color: '#ffb300',
        borderColor: 'rgba(255, 179, 0, 0.45)',
        boxShadow: '0 0 10px rgba(255, 179, 0, 0.25)'
      }
    },
    NORMALIZING: {
      label: 'Normalizing Data',
      icon: Loader2,
      spin: true,
      style: {
        backgroundColor: 'rgba(101, 31, 255, 0.15)',
        color: '#a78bfa',
        borderColor: 'rgba(101, 31, 255, 0.45)',
        boxShadow: '0 0 10px rgba(101, 31, 255, 0.25)'
      }
    },
    NORMALIZED: {
      label: 'Normalized',
      icon: CheckCheck,
      style: {
        backgroundColor: 'rgba(0, 230, 118, 0.12)',
        color: '#00e676',
        borderColor: 'rgba(0, 230, 118, 0.35)'
      }
    },
    READY_FOR_AI: {
      label: 'Ready for AI Extraction',
      icon: Cpu,
      style: {
        backgroundColor: 'rgba(0, 230, 118, 0.15)',
        color: '#00e676',
        borderColor: 'rgba(0, 230, 118, 0.45)',
        boxShadow: '0 0 12px rgba(0, 230, 118, 0.25)'
      }
    },
    FAILED: {
      label: 'Extraction Failed',
      icon: AlertOctagon,
      style: {
        backgroundColor: 'rgba(255, 23, 68, 0.15)',
        color: '#ff1744',
        borderColor: 'rgba(255, 23, 68, 0.4)'
      }
    }
  };

  const item = config[normalized] || config.UPLOADED;
  const Icon = item.icon;

  return (
    <span className="badge" style={item.style}>
      <Icon size={12} strokeWidth={2.5} className={item.spin ? 'animate-spin' : ''} />
      <span>{item.label}</span>
    </span>
  );
}

export default ProcessingBadge;
