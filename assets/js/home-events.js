// Native dialog + optional JSON endpoint; no backend or dependencies required.
(function() {
  const root = document.getElementById('home-events');
  if (!root) return;
  const dialog = root.querySelector('#gala-dialog');
  const form = root.querySelector('#gala-subscribe');
  const email = form.elements.email;
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
    error.hidden = true;
  });
  // Human check (Cloudflare Turnstile): after a valid email, the widget pops
  // up under the button; the POST goes out only with its token, which
  // d.zgzg.io verifies. The widget is removed after every attempt, so each
  // try gets a fresh single-use token.
  const verify = root.querySelector('#gala-verify');
  const widgetBox = root.querySelector('#gala-turnstile');
  const siteKey = form.dataset.sitekey.trim();
  let widgetId = null;
  let turnstileReady = null;
  // Bumped whenever a verification closes, so a submit still waiting for the
  // script cannot render a widget (with its old email) after a cancel.
  let attempt = 0;
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (turnstileReady) return turnstileReady;
    turnstileReady = new Promise((resolve, reject) => {
      window.__galaTurnstileReady = () => resolve();
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js' +
          '?render=explicit&onload=__galaTurnstileReady';
      script.async = true;
      script.onerror = () => {
        turnstileReady = null;
        reject(new Error('Turnstile failed to load'));
      };
      document.head.appendChild(script);
    });
    return turnstileReady;
  }
  function closeVerify() {
    attempt += 1;
    if (widgetId !== null && window.turnstile) window.turnstile.remove(widgetId);
    widgetId = null;
    verify.hidden = true;
    submit.hidden = false;
  }
  function showError(message) {
    error.textContent = message;
    error.hidden = false;
  }
  root.querySelector('#gala-verify-cancel').addEventListener('click', () => {
    closeVerify();
    submit.focus();
  });
  dialog.addEventListener('close', () => {
    if (!busy) closeVerify();
  });

  async function send(address, token) {
    busy = true;
    closeVerify();
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
            event: '2027-gala', email: address,
            locale: document.documentElement.lang,
            website: form.elements.website.value,
            turnstileToken: token,
          }),
        });
        if (response.status === 403) throw new Error('human');
        if (!response.ok) throw new Error('Subscription failed');
      }
      form.hidden = true;
      success.hidden = false;
      form.reset();
      dialog.setAttribute('aria-labelledby', 'gala-success-title');
      if (dialog.open) root.querySelector('#gala-success-title').focus();
    } catch (failure) {
      showError(failure.message === 'human' ?
        form.dataset.verifyFailed : form.dataset.error);
    } finally {
      clearTimeout(timeout);
      busy = false;
      submit.disabled = false;
      submit.textContent = submitLabel;
      form.removeAttribute('aria-busy');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !verify.hidden) return;
    const address = email.value.trim();
    email.setCustomValidity(!address ? form.dataset.required : '');
    if (!form.reportValidity()) return;
    if (!endpoint && !demo) {
      showError(form.dataset.unavailable);
      return;
    }
    error.hidden = true;
    if (demo) {
      send(address, 'demo');
      return;
    }
    if (!siteKey) {
      showError(form.dataset.unavailable);
      return;
    }
    submit.hidden = true;
    verify.hidden = false;
    const mine = attempt;
    try {
      await loadTurnstile();
    } catch (failure) {
      closeVerify();
      showError(form.dataset.error);
      return;
    }
    if (mine !== attempt || verify.hidden || widgetId !== null) return;
    widgetId = window.turnstile.render(widgetBox, {
      sitekey: siteKey,
      language: form.dataset.lang,
      theme: 'light',
      callback: (token) => send(address, token),
      'error-callback': () => {
        closeVerify();
        showError(form.dataset.verifyFailed);
      },
      'expired-callback': () => {
        closeVerify();
        showError(form.dataset.verifyFailed);
      },
    });
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
