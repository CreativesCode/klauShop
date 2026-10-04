// Bidi overrides/isolates (U+202A-202E, U+2066-2069) can make an address or note read
// differently than what was typed; C0 control characters break CSV and WhatsApp text.
// Keeps \n and \t.
const UNSAFE_CHARS =
  // eslint-disable-next-line no-control-regex -- matching control characters is the point
  /[\u202A-\u202E\u2066-\u2069\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function stripUnsafeChars(value: string): string {
  return value.replace(UNSAFE_CHARS, "");
}
