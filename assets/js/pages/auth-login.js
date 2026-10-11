import { auth } from '../core/auth.js';
import { applyConfigToPage } from '../core/config.js';
applyConfigToPage();
const params = new URLSearchParams(location.search);
const next = params.get('next') || 'app.html';
const form = document.getElementById('login-form');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = document.getElementById('error');
  errEl.classList.add('hidden');
  try {
    await auth.signIn(document.getElementById('email').value.trim(), document.getElementById('password').value);
    location.href = next;
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
});
