import React, { forwardRef, useMemo } from 'react';

const SCOPE_ID = 'cert-render';

// Escape regex meta-characters in a schema key so they never break the RegExp constructor.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Prefix every CSS selector with #cert-render so injected <style> blocks
// cannot leak into the host page. Skips @-rules and keyframe stops.
// Special-cases: body/html → #cert-render itself; * → #cert-render, #cert-render *
function scopeCss(css) {
  return css.replace(/([^{}]+)\{/g, (match, selectors) => {
    const trimmed = selectors.trim();
    if (/^@/.test(trimmed)) return match;                  // @media, @keyframes, @font-face …
    if (/^(from|to|\d+%)$/.test(trimmed)) return match;  // keyframe stops
    const scoped = trimmed
      .split(',')
      .map((s) => {
        const sel = s.trim();
        // "body", "html", "html body" etc. → the container element itself
        if (/^(html|body)(\s+(html|body))*$/i.test(sel)) return `#${SCOPE_ID}`;
        // Universal selector → container + all its descendants
        if (sel === '*') return `#${SCOPE_ID}, #${SCOPE_ID} *`;
        // Strip leading "html " / "body " combinator (e.g. "body .cls" → ".cls")
        const stripped = sel.replace(/^(html\s+)?(body\s+)?/i, '').trim();
        return `#${SCOPE_ID} ${stripped || sel}`;
      })
      .join(', ');
    return `${scoped} {`;
  });
}

export const CertificateRenderer = forwardRef(({ template, rowData, assets, scale = 1 }, ref) => {
  if (!template || !template.layout || !template.layout.html) return null;

  const injectedHtml = useMemo(() => {
    try {
      let rawHtml = template.layout.html;

      // 1. Replace {{text}} handlebars with rowData
      if (rowData && template.layout.csv_schema) {
        const hiddenFields = template.layout.hidden_fields || [];
        template.layout.csv_schema.forEach((key) => {
          const escaped = escapeRegex(key);
          const regex = new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, 'g');
          const value = rowData[key] ?? '';   // ?? preserves 0 / false
          rawHtml = rawHtml.replace(
            regex,
            hiddenFields.includes(key)
              ? `<span style="opacity:0;pointer-events:none">${String(value)}</span>`
              : String(value)
          );
        });
      }

      // 2. Scope all <style> blocks so they don't pollute the host page's CSS
      rawHtml = rawHtml.replace(/<style>([\s\S]*?)<\/style>/gi, (_, css) =>
        `<style>${scopeCss(css)}</style>`
      );

      // 3. Parse the HTML to inject image assets into <img data-asset-id="...">
      //    Only run the expensive DOM parse when there are actually assets to inject.
      if (assets && template.layout.required_assets?.length > 0) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawHtml, 'text/html');

        // The browser's HTML parser moves <style>/<link> tags into <head>.
        // Move them back so doc.body.innerHTML doesn't drop the CSS.
        doc.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
          doc.body.insertBefore(el, doc.body.firstChild);
        });

        template.layout.required_assets.forEach((key) => {
          const base64Src = assets[key];
          if (base64Src) {
            doc.querySelectorAll(`img[data-asset-id="${key}"]`).forEach((img) => {
              img.src = base64Src;
              img.removeAttribute('data-asset-id');
              if (img.style.objectFit === '') img.style.objectFit = 'contain';
            });
          }
        });

        rawHtml = doc.body.innerHTML;
      }

      return rawHtml;
    } catch {
      // Fallback: return unprocessed HTML so something always renders
      return template.layout.html;
    }
  }, [template.layout.html, template.layout.csv_schema, template.layout.required_assets, template.layout.hidden_fields, rowData, assets]);

  // CSS `transform` does not affect layout flow, so at scale != 1 the element
  // would occupy its original unscaled space. Wrapping with overflow:hidden
  // and a proportional width prevents surrounding layout from being pushed.
  return (
    <div
      style={
        scale !== 1
          ? { width: `${scale * 100}%`, overflow: 'hidden' }
          : undefined
      }
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <div
          id={SCOPE_ID}
          ref={ref}
          style={{
            position: 'relative',
            width: 'max-content',
            height: 'max-content',
            backgroundColor: '#fff',
          }}
          dangerouslySetInnerHTML={{ __html: injectedHtml }}
        />
      </div>
    </div>
  );
});

CertificateRenderer.displayName = 'CertificateRenderer';
