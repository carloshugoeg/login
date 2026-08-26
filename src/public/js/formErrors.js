/** Pinta y limpia los mensajes de error del formulario. */
export function clearErrors(form) {
  for (const node of document.querySelectorAll('[data-error-for]')) node.textContent = '';
  for (const input of form.elements) input.removeAttribute?.('aria-invalid');
}

export function showFieldErrors(fields) {
  for (const [field, messages] of Object.entries(fields ?? {})) {
    const node = document.querySelector(`[data-error-for="${field}"]`);
    if (node) node.textContent = messages.join('\n');
    document.getElementById(field)?.setAttribute('aria-invalid', 'true');
  }
}

export function showFormError(target, message) {
  const node = document.querySelector(`[data-error-for="${target}"]`);
  if (node) node.textContent = message;
}
