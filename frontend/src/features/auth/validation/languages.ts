import { LANGUAGES } from '../constants/questionsData';
export const MAX_LANGUAGES = 50;
export const MAX_LANGUAGE_LENGTH = 80;
const clean = (value: string) => value.trim().replace(/\s+/g, ' ');
export const languageKey = (value: string) => clean(value).normalize('NFKC').toLocaleLowerCase('en-US');
export function uniqueLanguages(values: string[]): string[] {
  const seen = new Set<string>();
  return values.map(clean).filter(value => { const key = languageKey(value); if (!key || seen.has(key)) return false; seen.add(key); return true; });
}
export function languageChoices(selected: string[], extra: string[] = []): string[] { return uniqueLanguages([...LANGUAGES, ...selected, ...extra]); }
type Addition = { ok: false; message: string } | { ok: true; language: string; selected: string[]; wasSelected: boolean; existing: boolean };
export function addLanguage(raw: string, selected: string[], available = languageChoices(selected)): Addition {
  const value = clean(raw);
  if (!value) return { ok: false, message: 'اكتب اسم اللغة أولًا.' };
  if (raw.length > MAX_LANGUAGE_LENGTH || value.length > MAX_LANGUAGE_LENGTH || [...raw].some(character => { const code = character.charCodeAt(0); return code < 32 || (code >= 127 && code <= 159); })) return { ok: false, message: 'استخدم اسم لغة من سطر واحد، بطول ٨٠ حرفًا أو أقل.' };
  const key = languageKey(value); const chosen = selected.find(language => languageKey(language) === key);
  if (chosen) return { ok: true, language: chosen, selected: [...selected], wasSelected: true, existing: true };
  if (selected.length >= MAX_LANGUAGES) return { ok: false, message: 'وصلت إلى الحد الأقصى: ٥٠ لغة. ألغِ اختيار لغة لإضافة أخرى.' };
  const match = available.find(language => languageKey(language) === key);
  const language = match || value;
  return { ok: true, language, selected: [...selected, language], wasSelected: false, existing: !!match };
}
