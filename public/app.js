const form = document.querySelector('#builder-form');
const nameInput = document.querySelector('#name');
const teamInput = document.querySelector('#teamName');
const photoInput = document.querySelector('#photo');
const preview = document.querySelector('#preview');
const download = document.querySelector('#download');
const share = document.querySelector('#share');
const errorEl = document.querySelector('#error');
const generateBtn = document.querySelector('#generate');
const status = document.querySelector('#id-status');
const existingId = document.querySelector('#existing-id');
const builderIdValue = document.querySelector('#builder-id-value');
const emptyState = document.querySelector('#empty-state');

let currentCardUrl = null;
let currentBuilderId = null;

function setError(message = '') {
  errorEl.textContent = message;
}

function showUser(user, cardUrl) {
  if (user?.name) nameInput.value = user.name;
  if (user?.teamName) teamInput.value = user.teamName;
  currentBuilderId = user?.builderId || null;

  if (currentBuilderId) {
    builderIdValue.textContent = currentBuilderId;
    existingId.classList.remove('hidden');
    status.textContent = user?.name ? 'Active Builder' : 'New Builder ID';
  } else {
    existingId.classList.add('hidden');
    status.textContent = 'New Builder';
  }

  if (user?.photoUrl || cardUrl) {
    photoInput.required = false;
  } else {
    photoInput.required = true;
  }

  const btnSpan = generateBtn.querySelector('span');

  if (cardUrl) {
    currentCardUrl = `${cardUrl}${cardUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
    preview.src = currentCardUrl;
    download.href = '/api/card/download';
    download.classList.remove('disabled');
    share.disabled = false;
    emptyState.classList.add('hidden');
    if (btnSpan) btnSpan.textContent = 'REGENERATE BUILDER ID CARD';
  } else {
    preview.src = `/master-template.png?v=${Date.now()}`;
    download.href = '#';
    download.classList.add('disabled');
    share.disabled = true;
    if (btnSpan) btnSpan.textContent = 'GENERATE BUILDER ID CARD';
  }
}

async function loadExistingUser() {
  nameInput.value = '';
  teamInput.value = '';
  photoInput.value = '';
  photoInput.required = true;
  currentCardUrl = null;
  currentBuilderId = null;
  builderIdValue.textContent = '—';
  existingId.classList.add('hidden');
  status.textContent = 'New Builder';
  preview.src = `/master-template.png?reset=${Date.now()}`;
  download.href = '#';
  download.classList.add('disabled');
  share.disabled = true;
  emptyState.classList.add('hidden');
  setError('');

  const btnSpan = generateBtn.querySelector('span');
  if (btnSpan) btnSpan.textContent = 'GENERATE BUILDER ID CARD';

  try {
    const response = await fetch('/api/session/refresh', { method: 'POST', cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not start a fresh Builder ID session.');

    currentBuilderId = data.builderId;
    builderIdValue.textContent = data.builderId;
    existingId.classList.remove('hidden');
    status.textContent = 'New Builder ID';
  } catch (error) {
    setError(error.message);
  }
}

photoInput.addEventListener('change', () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    photoInput.value = '';
    setError('Photo must be 8 MB or smaller.');
  } else {
    setError('');
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setError('');

  if (photoInput.required && !photoInput.files?.[0]) {
    setError('Please upload a photo.');
    return;
  }

  const btnSpan = generateBtn.querySelector('span');
  generateBtn.disabled = true;
  if (btnSpan) btnSpan.textContent = 'Generating…';

  try {
    const body = new FormData();
    body.append('name', nameInput.value.trim());
    body.append('teamName', teamInput.value.trim());
    if (photoInput.files?.[0]) {
      body.append('photo', photoInput.files[0]);
    }

    const response = await fetch('/api/profile', { method: 'POST', body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Generation failed.');

    showUser(data.user, data.cardUrl);
  } catch (error) {
    setError(error.message);
  } finally {
    generateBtn.disabled = false;
    if (btnSpan) btnSpan.textContent = 'REGENERATE BUILDER ID CARD';
  }
});

share.addEventListener('click', async () => {
  if (!currentCardUrl || !currentBuilderId) return;
  try {
    const response = await fetch(currentCardUrl);
    const blob = await response.blob();
    const file = new File([blob], `${currentBuilderId}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: 'Hacker House Goa 2026 Builder ID',
        text: `My Hacker House Goa 2026 Builder ID is ${currentBuilderId}.`,
        files: [file]
      });
    } else {
      await navigator.clipboard?.writeText(currentBuilderId);
      alert(`Builder ID copied: ${currentBuilderId}`);
    }
  } catch (error) {
    if (error.name !== 'AbortError') setError('Sharing was not available on this device.');
  }
});

loadExistingUser();

window.addEventListener('pageshow', (event) => {
  if (event.persisted) loadExistingUser();
});
