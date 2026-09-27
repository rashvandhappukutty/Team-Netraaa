/**
 * NETRA Entity Normalization Engine
 * Standardizes extracted entity mentions across heterogeneous intelligence sources
 * while preserving original extracted values for complete source traceability.
 */

// Common titles and honorific prefixes to strip from canonical names
const PERSON_TITLE_REGEX = /^(mr\.|mrs\.|ms\.|dr\.|prof\.|inspector|insp\.|officer|director|shri|smt\.|adv\.|advocate|constable|sub-inspector|si|asi|accused|suspect|witness|complainant|target|operative)\s+/i;

/**
 * Converts a string to Title Case
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

/**
 * Normalizes a Person Name
 */
export function normalizePersonName(name) {
  if (!name) return '';
  let cleaned = name.trim().replace(/['"“”]/g, '');
  cleaned = cleaned.replace(PERSON_TITLE_REGEX, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ');
  return toTitleCase(cleaned);
}

/**
 * Normalizes a Phone Number (Standardized numeric string, preserving + if international)
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  const hasPlus = phone.trim().startsWith('+');
  const digits = phone.replace(/\D/g, '');
  if (!digits) return phone.trim();
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Normalizes a Vehicle Registration Number (Uppercase alphanumeric without separators)
 */
export function normalizeVehiclePlate(plate) {
  if (!plate) return '';
  return plate
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

/**
 * Normalizes a Location Name
 */
export function normalizeLocation(loc) {
  if (!loc) return '';
  let cleaned = loc.trim().replace(/['"“”]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ');
  return toTitleCase(cleaned);
}

/**
 * Normalizes an Organization Name
 */
export function normalizeOrganization(org) {
  if (!org) return '';
  let cleaned = org.trim().replace(/['"“”]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ');
  return toTitleCase(cleaned);
}

/**
 * Normalizes a Bank Account or Wallet Identifier
 */
export function normalizeAccountNumber(acc) {
  if (!acc) return '';
  return acc.trim().replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Normalizes a Device Identifier (IMEI, IMSI, MAC)
 */
export function normalizeDeviceIdentifier(dev) {
  if (!dev) return '';
  return dev.trim().replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Normalizes a Date string into standard YYYY-MM-DD
 */
export function normalizeDate(dateStr) {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();

  // Pattern: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Pattern: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Fallback to JS Date parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return trimmed;
}

/**
 * Normalizes a Time string
 */
export function normalizeTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.trim().replace(/\s+/g, ' ');
}

/**
 * Masks sensitive values in investigator general UI views
 */
export function maskSensitiveValue(entityType, value) {
  if (!value) return '';
  const val = String(value);

  switch (entityType) {
    case 'ACCOUNT_NUMBER':
      if (val.length <= 4) return '****';
      return `${val.substring(0, 2)}****${val.substring(val.length - 4)}`;
    case 'PHONE_NUMBER':
      if (val.length <= 4) return '****';
      return `${val.substring(0, 4)}****${val.substring(val.length - 2)}`;
    case 'DEVICE_IDENTIFIER':
      if (val.length <= 6) return '******';
      return `${val.substring(0, 4)}******${val.substring(val.length - 4)}`;
    default:
      return val;
  }
}

/**
 * Master Normalizer Router by Entity Type
 */
export function normalizeEntity(entityType, rawValue) {
  const original = String(rawValue || '').trim();
  let normalized = original;
  let canonical = original;

  switch (entityType) {
    case 'PERSON':
      normalized = normalizePersonName(original);
      canonical = normalized;
      break;
    case 'PHONE_NUMBER':
      normalized = normalizePhoneNumber(original);
      canonical = normalized;
      break;
    case 'VEHICLE':
      normalized = normalizeVehiclePlate(original);
      canonical = normalized;
      break;
    case 'LOCATION':
      normalized = normalizeLocation(original);
      canonical = normalized;
      break;
    case 'ORGANIZATION':
      normalized = normalizeOrganization(original);
      canonical = normalized;
      break;
    case 'ACCOUNT_NUMBER':
      normalized = normalizeAccountNumber(original);
      canonical = normalized;
      break;
    case 'DEVICE_IDENTIFIER':
      normalized = normalizeDeviceIdentifier(original);
      canonical = normalized;
      break;
    case 'DATE':
      normalized = normalizeDate(original);
      canonical = normalized;
      break;
    case 'TIME':
      normalized = normalizeTime(original);
      canonical = normalized;
      break;
    case 'TRANSACTION':
      normalized = original.toUpperCase().trim();
      canonical = normalized;
      break;
    case 'EVENT':
      normalized = original.trim();
      canonical = original.trim();
      break;
    default:
      normalized = original.trim();
      canonical = original.trim();
  }

  return {
    original_value: original,
    normalized_value: normalized,
    canonical_candidate: canonical
  };
}
