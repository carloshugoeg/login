import { postJson } from './api.js';
import { clearErrors, showFieldErrors, showFormError } from './formErrors.js';

const form = document.getElementById('registration-form');
const sentPanel = document.getElementById('sent-panel');
const sentMessage = document.getElementById('sent-message');
const resendButton = document.getElementById('resend-button');
let lastEmail = null;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(form);

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const data = Object.fromEntries(new FormData(form));
    const result = await postJson('/api/registrations', data);
    lastEmail = result.email;
    form.hidden = true;
    sentPanel.hidden = false;
    sentMessage.textContent = result.message;
  } catch (error) {
    const details = error.payload?.error;
    if (details?.fields) showFieldErrors(details.fields);
    else showFormError('_form', details?.message ?? 'No pudimos conectar con el servidor.');
  } finally {
    button.disabled = false;
  }
});

resendButton.addEventListener('click', async () => {
  showFormError('_resend', '');
  resendButton.disabled = true;
  try {
    const result = await postJson('/api/registrations/resend', { email: lastEmail });
    sentMessage.textContent = result.message;
  } catch (error) {
    showFormError('_resend', error.payload?.error?.message ?? 'No pudimos reenviar el correo.');
  } finally {
    resendButton.disabled = false;
  }
});
