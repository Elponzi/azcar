export const removeTashkeel = (text: string) => {
    // Range includes standard Arabic diacritics, Quranic marks, and Tatweel
    return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0640]/g, '');
}

export const normalizeArabic = (text: string) => {
  let normalized = removeTashkeel(text);
  
  // Normalize Alif forms (أ, إ, آ, ٱ -> ا) using unicode points for safety
  // \u0622 (Madda), \u0623 (Hamza Above), \u0625 (Hamza Below), \u0671 (Wasla)
  normalized = normalized.replace(/[\u0622\u0623\u0625\u0671]/g, 'ا');
  
  // Normalize Ta-Marbuta (ة -> ه)
  normalized = normalized.replace(/ة/g, 'ه');
  
  // Normalize Ya/Alif Maqsura (ى -> ي)
  normalized = normalized.replace(/ى/g, 'ي');

  // Remove punctuation: Arabic comma, full stop, question mark, semicolon, etc.
  // \u060C = ، | \u061B = ؛ | \u061F = ؟
  normalized = normalized.replace(/[\u060C\u061B\u061F\.\,؛،؟\!:\-\(\)]/g, '');

  return normalized;
};