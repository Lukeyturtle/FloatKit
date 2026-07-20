// ─────────────────────────────────────────────────────────────────────────
// FloatKit configuration — fill these in to enable the Google Form + Sheet.
//
// Until you fill these, FloatKit still works: finishing a design gives you a
// 6-digit code and a self-contained share link (the link always works on its
// own). Only two things need the values below:
//   • the "Open the early-access form" button, and
//   • loading a design from a bare code like  .../?c=123456
//
// ── HOW TO GET THESE ──────────────────────────────────────────────────────
// 1. Create a Google Form with (at least) these questions, in any order:
//      - your own early-access questions (name, email, …)
//      - "Code"   → Short answer
//      - "Design" → Paragraph (long answer)
//    Link it to a Google Sheet (Responses tab → green Sheets icon).
//
// 2. Form → ⋮ menu → "Get pre-filled link". Put anything in Code & Design,
//    click "Get link", copy it. It looks like:
//      https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url
//        &entry.1111111111=CODE&entry.2222222222=DESIGN
//    Copy FORM.prefillBase (everything up to and including usp=pp_url) and the
//    two entry.XXXX numbers into codeEntry / designEntry below.
//
// 3. Publish the Sheet: File → Share → Publish to web → choose the responses
//    sheet → CSV → Publish. Copy that URL into SHEET_CSV_URL.
//    Make sure the column headers in the Sheet match CODE_COLUMN / DESIGN_COLUMN.
// ─────────────────────────────────────────────────────────────────────────

export const FORM = {
  // e.g. 'https://docs.google.com/forms/d/e/FORM_ID/viewform?usp=pp_url'
  prefillBase: 'https://docs.google.com/forms/d/e/1FAIpQLScBKwNh1bNtof4xv7Ju4DlsuCj8WSyFYClvkV4XBUrJOt8SCA/viewform?usp=pp_url',
  // e.g. 'entry.1111111111'
  codeEntry: 'entry.1498135098',
  // e.g. 'entry.2222222222'
  designEntry: 'entry.2606285',
};

// e.g. 'https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv'
export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgSdCIxDCJZ5WqY7sUZjw67AxGfY0rwrP8CkMxsISbdWozvWg9BeIr_gDXvZr8se-UZzje8pw1y8V0/pub?output=csv';

// The Sheet column headers that hold the code and the encoded design.
export const CODE_COLUMN = 'Code';
export const DESIGN_COLUMN = 'Design';

// Convenience flags derived from the above.
export const formConfigured = () =>
  !!(FORM.prefillBase && FORM.codeEntry && FORM.designEntry);
export const sheetConfigured = () => !!SHEET_CSV_URL;
