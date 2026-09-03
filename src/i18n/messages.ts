import ar from "./messages/ar.json";
import fr from "./messages/fr.json";
import en from "./messages/en.json";
import { DEFAULT_LOCALE, type Locale } from "./config";

export type Messages = typeof ar;

const CATALOGUE: Record<Locale, Messages> = { ar, fr: fr as Messages, en: en as Messages };

export function getMessages(locale: Locale): Messages {
  return CATALOGUE[locale] ?? CATALOGUE[DEFAULT_LOCALE];
}

type Primitive = string | number;

function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Replaces `{placeholder}` tokens in a message. */
export function interpolate(template: string, values?: Record<string, Primitive>) {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
  );
}

export type Translator = (key: string, values?: Record<string, Primitive>) => string;

export function createTranslator(locale: Locale): Translator {
  const messages = getMessages(locale);
  const fallback = getMessages(DEFAULT_LOCALE);
  return (key, values) => {
    const template = lookup(messages, key) ?? lookup(fallback, key);
    if (template === undefined) {
      // Surfacing the key beats rendering an empty string in production.
      return key;
    }
    return interpolate(template, values);
  };
}
