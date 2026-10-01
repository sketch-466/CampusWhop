export type InstitutionKey = "funai" | "ebsu" | "unizik";

export interface MatricFormat {
  pattern: RegExp;
  placeholder: string;
  helpText: string;
  errorMessage: string;
}

export const MATRIC_FORMATS: Record<InstitutionKey, MatricFormat> = {
  funai: {
    pattern: /^[0-9]{4}\/[A-Z]{2}\/[0-9]{5}$/,
    placeholder: "2024/EN/32213",
    helpText: "Format: YEAR/FACULTY/NUMBER (e.g. 2024/EN/32213)",
    errorMessage: "Invalid FUNAI matric number. Use YYYY/XX/NNNNN",
  },
  ebsu: {
    pattern: /^EBSU\/[0-9]{4}\/[0-9]{7}$/,
    placeholder: "EBSU/2024/1234567",
    helpText: "Format: EBSU/YEAR/NUMBER (e.g. EBSU/2024/1234567)",
    errorMessage: "Invalid EBSU matric number. Use EBSU/YYYY/NNNNNNN",
  },
  unizik: {
    pattern: /^[0-9]{10}$/,
    placeholder: "2023274019",
    helpText: "Format: 10 digits (e.g. 2023274019)",
    errorMessage: "Invalid UNIZIK matric number. Use exactly 10 digits",
  },
};

export function normalizeMatric(raw: string): string {
  return raw.trim().toUpperCase();
}

export function validateMatric(
  institution: string,
  raw: string
): { ok: true; value: string } | { ok: false; error: string } {
  const fmt = MATRIC_FORMATS[institution as InstitutionKey];
  if (!fmt) return { ok: false, error: "Unsupported institution" };
  const value = normalizeMatric(raw);
  return fmt.pattern.test(value)
    ? { ok: true, value }
    : { ok: false, error: fmt.errorMessage };
}

export const SUPPORTED_INSTITUTIONS: { key: InstitutionKey; name: string }[] = [
  { key: "funai", name: "Federal University Ndufu-Alike Ikwo (FUNAI)" },
  { key: "unizik", name: "Nnamdi Azikiwe University, Awka (UNIZIK)" },
  { key: "ebsu", name: "Ebonyi State University, Abakaliki (EBSU)" },
];

export function getInstitutionKey(name: string): InstitutionKey | null {
  return SUPPORTED_INSTITUTIONS.find((i) => i.name === name)?.key ?? null;
}