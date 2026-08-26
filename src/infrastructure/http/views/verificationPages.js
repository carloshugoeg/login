/** Páginas mínimas para el enlace del correo. Sin motor de plantillas. */
export function renderVerificationSuccess(user) {
  return page(
    'Cuenta confirmada',
    `<h1 class="ok">¡Listo, ${escapeHtml(user.firstName)}!</h1>
     <p>Tu cuenta <strong>${escapeHtml(user.email)}</strong> quedó confirmada y guardada.</p>
     <p><a href="/users.html">Ver usuarios registrados</a></p>`,
  );
}

export function renderVerificationError(message) {
  return page(
    'No pudimos confirmar la cuenta',
    `<h1 class="error">No pudimos confirmar la cuenta</h1>
     <p>${escapeHtml(message)}</p>
     <p><a href="/">Volver al formulario</a></p>`,
  );
}

function page(title, body) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body class="centered">
  <main class="card">${body}</main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
