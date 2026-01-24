// Validation for street-level location input
// Rejects area, ward, suburb, region names - only accepts street descriptions

const FORBIDDEN_KEYWORDS = [
  'ward',
  'area',
  'suburb',
  'region',
  'district',
  'zone',
  'municipality',
  'township',
  'location',
  'section',
  'phase',
  'ext',
  'extension',
];

export interface StreetValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateStreetInput(input: string): StreetValidationResult {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { isValid: false, error: "Please enter a street name" };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: "Street name is too short" };
  }

  if (trimmed.length > 200) {
    return { isValid: false, error: "Street name is too long" };
  }

  const lowerInput = trimmed.toLowerCase();
  
  for (const keyword of FORBIDDEN_KEYWORDS) {
    // Check for standalone word match (not part of another word)
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lowerInput)) {
      return { 
        isValid: false, 
        error: `Please enter a street name, not an ${keyword}. Example: "Church Street" or "Near Jan Smuts Drive"` 
      };
    }
  }

  return { isValid: true };
}

export function formatStreetLocation(street: string): string {
  const trimmed = street.trim();
  
  // If it already starts with "Near" or similar, keep as is
  if (/^(near|corner|at|on)\s/i.test(trimmed)) {
    return trimmed;
  }
  
  // Add "Near" prefix for consistency
  return trimmed;
}
