// Shared, brand-consistent HTML layout for all DoseLoop emails.
// Pure functions only — no secrets, no server-only imports.
// Inline styles only (email clients strip <style>/external CSS).

const BRAND = {
  pine: "#1f6f6b", // deep desaturated pine-teal (matches app primary)
  ink: "#1c2024",
  muted: "#5c6770",
  paper: "#ffffff",
  surface: "#f4f1ea", // warm paper surface
  border: "#e6e1d6",
  brass: "#c79a4b", // warm brass accent
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface LayoutOptions {
  appName: string;
  previewText: string;
  heading: string;
  /** Inner body HTML — caller is responsible for escaping dynamic values. */
  bodyHtml: string;
  cta?: { label: string; url: string };
  footnote?: string;
}

/** Wraps body content in the shared responsive email shell. */
export function renderLayout(options: LayoutOptions): string {
  const { appName, previewText, heading, bodyHtml, cta, footnote } = options;

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
         <tr>
           <td style="border-radius:12px;background:${BRAND.pine};">
             <a href="${escapeHtml(cta.url)}" target="_blank"
                style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;">
               ${escapeHtml(cta.label)}
             </a>
           </td>
         </tr>
       </table>`
    : "";

  const footnoteHtml = renderFootnote(footnote);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
    <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(previewText)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.paper};border:1px solid ${BRAND.border};border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px;">
                <span style="display:inline-block;font-size:18px;font-weight:700;color:${BRAND.pine};letter-spacing:-0.01em;">${escapeHtml(appName)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.ink};">${escapeHtml(heading)}</h1>
                <div style="font-size:15px;line-height:1.65;color:${BRAND.muted};">${bodyHtml}</div>
                ${ctaHtml}
              </td>
            </tr>
            ${footnoteHtml}
            <tr>
              <td style="padding:24px 32px 30px;border-top:1px solid ${BRAND.border};">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.muted};">
                  You're receiving this email because you use ${escapeHtml(appName)} — a calm health companion for you and your family.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderFootnote(footnote?: string): string {
  if (!footnote) return "";
  return `<tr>
            <td style="padding:0 32px 8px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.muted};background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:12px;padding:12px 14px;">${footnote}</p>
            </td>
          </tr>`;
}

export { escapeHtml };
