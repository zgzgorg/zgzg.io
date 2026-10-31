// Native dialog + optional JSON endpoint; no backend or dependencies required.
(function() {
  const root = document.getElementById('home-events');
  if (!root) return;
  const dialog = root.querySelector('#gala-dialog');
  const form = root.querySelector('#gala-subscribe');
  const email = form.elements.email;
  const phone = form.elements.phone;
  const consent = form.elements.sms_consent;
  const submit = form.querySelector('[type=submit]');
  const submitLabel = submit.textContent;
  const error = root.querySelector('#gala-error');
  const success = root.querySelector('#gala-success');
  const endpoint = form.dataset.endpoint.trim();
  // Explicit, visibly labelled UI preview. Never sends or saves contact data.
  const demo = !endpoint && new URLSearchParams(location.search)
      .get('gala-preview') === '1';
  root.querySelector('#gala-demo').hidden = !demo;
  let opener;
  let busy = false;

  root.querySelectorAll('[data-gala-open]').forEach((button) => {
    button.addEventListener('click', () => {
      opener = button;
      if (!busy) {
        form.hidden = false;
        success.hidden = true;
        error.hidden = true;
        dialog.setAttribute('aria-labelledby', 'gala-dialog-title');
      }
      dialog.showModal();
      document.documentElement.classList.add('gala-dialog-open');
      root.querySelector('#gala-dialog-title').focus();
    });
  });
  root.querySelectorAll('[data-gala-close]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('gala-dialog-open');
    if (opener) opener.focus({preventScroll: true});
  });
  let dragStart;
  const handle = root.querySelector('.gala-handle');
  handle.addEventListener('pointerdown', (event) => {
    dragStart = event.clientY;
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointerup', (event) => {
    if (event.clientY - dragStart > 60) dialog.close();
  });

  form.addEventListener('input', () => {
    email.setCustomValidity('');
    phone.setCustomValidity('');
    consent.required = Boolean(phone.value.trim());
    error.hidden = true;
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    const address = email.value.trim();
    const number = phone.value.trim().replace(/[\s().-]/g, '')
        .replace(/^\+?1(?=\d{10}$)/, '');
    email.setCustomValidity(!address && !number ? form.dataset.required : '');
    phone.setCustomValidity(number && !/^[2-9]\d{2}[2-9]\d{6}$/.test(number) ?
      form.dataset.phone : '');
    consent.required = Boolean(number);
    if (!form.reportValidity()) return;
    if (!endpoint && !demo) {
      error.textContent = form.dataset.unavailable;
      error.hidden = false;
      return;
    }
    busy = true;
    submit.disabled = true;
    submit.textContent = form.dataset.submitting;
    form.setAttribute('aria-busy', 'true');
    error.hidden = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      if (demo) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      } else {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          signal: controller.signal,
          body: JSON.stringify({
            event: '2027-gala', email: address || null,
            phone: number ? '+1' + number : null,
            sms_consent: Boolean(number && consent.checked),
            locale: document.documentElement.lang,
          }),
        });
        if (!response.ok) throw new Error('Subscription failed');
      }
      form.hidden = true;
      success.hidden = false;
      form.reset();
      consent.required = false;
      dialog.setAttribute('aria-labelledby', 'gala-success-title');
      if (dialog.open) root.querySelector('#gala-success-title').focus();
    } catch (failure) {
      error.textContent = form.dataset.error;
      error.hidden = false;
    } finally {
      clearTimeout(timeout);
      busy = false;
      submit.disabled = false;
      submit.textContent = submitLabel;
      form.removeAttribute('aria-busy');
    }
  });
  root.querySelector('a[href="#gala-recruit"]').addEventListener('click',
      (event) => {
        event.preventDefault();
        root.querySelector('#gala-recruit').scrollIntoView({
          behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ?
            'instant' : 'smooth',
        });
      });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      const visible = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      root.querySelector('#gala-sticky').hidden = !visible;
      document.body.classList.toggle('gala-sticky-visible', visible);
    }).observe(root.querySelector('#gala-primary'));
  }
})();
