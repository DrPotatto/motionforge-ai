import { auth } from '../core/auth.js';
import { applyConfigToPage } from '../core/config.js';
applyConfigToPage();
document.getElementById('signup-form').addEventListener('submit', async e => {
  e.preventDefault();
  const errEl = document.getElementById('error');
  errEl.classList.add('hidden');
  try {
    await auth.signUp(document.getElementById('email').value.trim(), document.getElementById('password').value);
    location.href = 'app.html';
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
});
