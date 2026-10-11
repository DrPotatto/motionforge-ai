import { renderSidebar } from '../components/sidebar.js';
import { storage } from '../core/storage.js';
import { defaultBrand } from '../engine/storyboard.js';
import { toast } from '../components/toast.js';
import { applyConfigToPage } from '../core/config.js';
applyConfigToPage();
renderSidebar();
const brand = storage.loadBrand() || { ...defaultBrand };
const $ = id => document.getElementById(id);
function apply() {
  $('brandName').value = brand.name;
  $('accent').value = brand.accent; $('accentText').value = brand.accent;
  $('secondary').value = brand.secondary; $('secondaryText').value = brand.secondary;
  $('text').value = brand.text; $('textText').value = brand.text;
  $('background').value = brand.background; $('backgroundText').value = brand.background;
  $('fontFamily').value = brand.fontFamily;
}
apply();
function bindColor(pickerId, textId, key) {
  const p = $(pickerId), t = $(textId);
  p.addEventListener('input', e => { t.value = e.target.value; brand[key] = e.target.value; storage.saveBrand(brand); });
  t.addEventListener('input', e => { p.value = e.target.value; brand[key] = e.target.value; storage.saveBrand(brand); });
}
bindColor('accent', 'accentText', 'accent');
bindColor('secondary', 'secondaryText', 'secondary');
bindColor('text', 'textText', 'text');
bindColor('background', 'backgroundText', 'background');
$('brandName').addEventListener('input', e => { brand.name = e.target.value; storage.saveBrand(brand); });
$('fontFamily').addEventListener('change', e => { brand.fontFamily = e.target.value; storage.saveBrand(brand); toast('Font updated', 'success'); });
