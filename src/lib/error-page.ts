export function renderErrorPage(error?: any): string {
  const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : String(error || ''));
  const stack = error instanceof Error ? error.stack : '';
  
  // Escape HTML entities to prevent XSS
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const escapedMessage = message ? escapeHtml(message) : '';
  const escapedStack = stack ? escapeHtml(stack) : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 36rem; width: 100%; text-align: center; padding: 2rem; background: #fff; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); border: 1px solid #e5e7eb; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; color: #dc2626; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .error-details { text-align: left; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 0.375rem; padding: 1rem; margin-bottom: 1.5rem; overflow-x: auto; font-family: monospace; font-size: 0.875rem; color: #991b1b; white-space: pre-wrap; word-break: break-all; }
      .error-title { font-weight: bold; margin-bottom: 0.5rem; }
      .error-stack { font-size: 0.75rem; color: #b91c1c; border-top: 1px dashed #fecaca; margin-top: 0.5rem; padding-top: 0.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      ${escapedMessage ? `
      <div class="error-details">
        <div class="error-title">Error Details:</div>
        <div>${escapedMessage}</div>
        ${escapedStack ? `<div class="error-stack"><strong>Stack Trace:</strong><br/>${escapedStack.replace(/\n/g, '<br/>')}</div>` : ''}
      </div>
      ` : ''}
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
