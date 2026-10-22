// 首页默认显示音乐节；轮播在购票、键盘操作或页面不可见时暂停。
(function() {
  const carousel = document.getElementById('home-events');
  if (!carousel) return;
  const track = carousel.querySelector('.home-events-track');
  const slides = Array.from(carousel.querySelectorAll('.home-event'));
  const selectors = Array.from(carousel.querySelectorAll('[data-event-index]'));
  const playback = carousel.querySelector('[data-event-playback]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let timer;
  let paused = reducedMotion.matches;
  let hovered = false;
  let visible = true;
  let ticketsOpen = carousel.querySelector('#mf-flip')
      .classList.contains('is-flipped');
  let playbackIntent = null;

  /** 更新轮播按钮文字。 */
  function updatePlayback() {
    playback.textContent = paused ? '继续轮播' : '暂停轮播';
  }

  /** 在活动可见且没有操作时，安排下一次切换。 */
  function schedule() {
    clearTimeout(timer);
    if (paused || hovered || !visible || document.hidden || ticketsOpen) return;
    timer = setTimeout(function() {
      show((current + 1) % slides.length);
    }, 9000);
  }

  /**
   * 显示活动并更新键盘访问范围。
   * @param {number} index 活动序号。
   */
  function show(index) {
    current = index;
    track.style.transform = 'translateX(-' + current * 100 + '%)';
    slides.forEach(function(slide, i) {
      slide.inert = i !== current;
      slide.setAttribute('aria-hidden', String(i !== current));
      selectors[i].setAttribute('aria-pressed', String(i === current));
    });
    const poster = slides[current].querySelector('[data-srcset]');
    if (poster) {
      poster.srcset = poster.getAttribute('data-srcset');
      poster.removeAttribute('data-srcset');
    }
    schedule();
  }

  selectors.forEach(function(button, index) {
    button.addEventListener('click', function() {
      show(index);
    });
  });
  playback.addEventListener('pointerdown', function() {
    playbackIntent = !paused;
  });
  playback.addEventListener('click', function() {
    paused = playbackIntent === null ? !paused : playbackIntent;
    playbackIntent = null;
    updatePlayback();
    schedule();
  });
  carousel.addEventListener('mouseenter', function() {
    hovered = true;
    schedule();
  });
  carousel.addEventListener('mouseleave', function() {
    hovered = false;
    schedule();
  });
  carousel.addEventListener('focusin', function() {
    paused = true;
    updatePlayback();
    schedule();
  });
  carousel.addEventListener('mf-ticket-state', function(event) {
    ticketsOpen = event.detail.open;
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', function(event) {
    if (event.matches) paused = true;
    updatePlayback();
    schedule();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(entries) {
      visible = entries[0].isIntersecting;
      schedule();
    }).observe(carousel);
  }

  // 触摸横滑可以切换活动；横滑结束后不触发海报的点击动作。
  let startX = 0;
  let startY = 0;
  let swipedAt = 0;
  const viewport = carousel.querySelector('.home-events-viewport');
  viewport.addEventListener('touchstart', function(event) {
    if (ticketsOpen || event.touches.length !== 1) return;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    clearTimeout(timer);
  }, {passive: true});
  viewport.addEventListener('touchend', function(event) {
    if (ticketsOpen || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - startX;
    const dy = event.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swipedAt = Date.now();
      show((current + (dx < 0 ? 1 : slides.length - 1)) % slides.length);
    } else schedule();
  }, {passive: true});
  viewport.addEventListener('click', function(event) {
    if (Date.now() - swipedAt < 500) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  carousel.classList.add('is-ready');
  updatePlayback();
  show(location.hash === '#mf-tickets' ? 0 : current);
})();
