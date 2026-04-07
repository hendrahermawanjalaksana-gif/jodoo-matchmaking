/**
 * Client-side chat safety checks (Indonesian context + anti-phishing).
 * Not a substitute for server-side moderation or Firestore rules.
 */

function digitsOnly(s) {
  return s.replace(/\D/g, "");
}

/**
 * Detect Indonesian-style mobile substrings in a digit-only string (handles spaces/dots removed).
 */
function hasIndonesianPhoneInDigitString(d) {
  if (d.length < 10) return false;

  for (let i = 0; i <= d.length - 10; i++) {
    for (let len = 10; len <= 13 && i + len <= d.length; len++) {
      const w = d.slice(i, i + len);
      // 628… / 62 8… international
      if (/^628[1-9]\d{7,10}$/.test(w)) return true;
      // 08… national
      if (/^08[1-9]\d{7,9}$/.test(w)) return true;
      // Shorthand 8xx… (10–12 digits), not part of a longer intl match we already cover
      if (/^8[1-9]\d{8,10}$/.test(w) && len >= 10 && len <= 12) {
        // Avoid treating the "8" in "628…" as a standalone 8xx number
        if (i >= 2 && d.slice(i - 2, i) === "62") continue;
        return true;
      }
    }
  }
  return false;
}

function hasIndonesianPhoneInText(text) {
  const full = digitsOnly(text);
  if (hasIndonesianPhoneInDigitString(full)) return true;

  const runs = text.match(/\d[\d\s().\-/]*\d/g) || [];
  for (const run of runs) {
    const d = digitsOnly(run);
    if (d.length >= 10 && hasIndonesianPhoneInDigitString(d)) return true;
  }
  return false;
}

const URLISH = [
  /\bhttps?:\/\//i,
  /\bftp:\/\//i,
  /\bwww\./i,
  /\b[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\.(?:com|net|org|id|co\.id|io|me|app|gov|edu|mil|int|xyz|info|online|site|shop|store|click|link|fun|top|club|buzz|rest|cloud|dev|tech|asia|my\.id|or\.id|go\.id)(?:\/[^\s]*)?\b/i,
];

const SHORTENERS_AND_TRACKERS = [
  /\b(?:bit\.ly|tinyurl|goo\.gl|t\.co|cutt\.ly|short\.link|is\.gd|rebrand\.ly|rb\.gy|s\.id|linktr\.ee|lnk\.bio|taplink)\b/i,
];

const MESSAGING_LINKS = [
  /\b(?:wa\.me|api\.whatsapp|chat\.whatsapp|web\.whatsapp)\b/i,
  /\b(?:t\.me|telegram\.me|telegram\.dog)\b/i,
  /\b(?:signal\.me|discord\.gg|discord\.com\/invite)\b/i,
  /\b(?:line\.me|line\.nv|line\.naver)\b/i,
];

const SOCIAL_DOMAINS = [
  /\b(?:instagram|facebook|fb)\.(?:com|net)\b/i,
  /\b(?:tiktok|twitter|x)\.(?:com|net)\b/i,
  /\b(?:linkedin|snapchat|pinterest|youtube|youtu\.be)\.(?:com|net|be)\b/i,
];

const EMAIL_LIKE = [
  /\b[\w.+-]{2,64}@[a-z0-9][a-z0-9.-]*\.[a-z]{2,24}\b/i,
  /\b[\w.+-]{2,64}\s*(?:@|\[at\]|\(at\)|\{\s*at\s*\}|\s+at\s+)[\w.-]+\s*(?:\.|\s+dot\s+|\[dot\]|\(dot\))\s*[a-z]{2,24}\b/i,
];

/**
 * Returns true if the message should be blocked.
 */
export function isChatMessageUnsafe(text) {
  const raw = text.trim();
  if (!raw) return false;

  const lower = raw.toLowerCase();

  if (hasIndonesianPhoneInText(raw)) return true;

  const compactDigits = raw.replace(/[\s.\-()]/g, "");
  if (/\d{12,}/.test(compactDigits)) return true;

  if (URLISH.some((re) => re.test(raw))) return true;
  if (SHORTENERS_AND_TRACKERS.some((re) => re.test(lower))) return true;
  if (MESSAGING_LINKS.some((re) => re.test(lower))) return true;
  if (SOCIAL_DOMAINS.some((re) => re.test(lower))) return true;
  if (EMAIL_LIKE.some((re) => re.test(raw))) return true;

  if (/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?(?:\/[^\s]*)?\b/.test(raw)) return true;

  if (/\b(?:verify|login|klik|click)\s*(?:disini|di\s*sini|here)\b/i.test(raw) && /(\.|\/\/|www)/i.test(raw))
    return true;

  return false;
}
