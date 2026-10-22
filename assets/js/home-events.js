// 首页默认显示音乐节，每 9 秒切换一次。观众把鼠标移进轮播、用键盘操作、
// 点小点或横滑之后，轮播停住；鼠标和焦点都离开之后，再等 1 分钟才继续轮播。
// 购票、页面不可见或系统要求减少动态效果时，轮播不自动切换。
(function() {
  const carousel = document.getElementById('home-events');
  if (!carousel) return;
  const track = carousel.querySelector('.home-events-track');
  const slides = Array.from(carousel.querySelectorAll('.home-event'));
  const selectors = Array.from(carousel.querySelectorAll('[data-event-index]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const INTERVAL = 9000;
  const RESUME_DELAY = 60000;
  let current = 0;
  let timer;
  let hovered = false;
  let focused = false;
  let engaged = false;
  let visible = true;
  let ticketsOpen = carousel.querySelector('#mf-flip')
      .classList.contains('is-flipped');

  /** 记下观众操作过轮播，下一次切换要等 1 分钟。 */
  function engage() {
    engaged = true;
    schedule();
  }

  /** 在活动可见且没有人操作时，安排下一次切换。 */
  function schedule() {
    clearTimeout(timer);
    if (hovered || focused || !visible || document.hidden || ticketsOpen ||
        reducedMotion.matches) return;
    timer = setTimeout(function() {
      engaged = false;
      show((current + 1) % slides.length);
    }, engaged ? RESUME_DELAY : INTERVAL);
  }

  /**
   * 显示活动并更新键盘访问范围。
   * @param {number} index 活动序号。
   */
  function show(index) {
    current = index;
    track.style.transform = 'translateX(-' + current * 100 + '%)';
    carousel.dataset.current = String(current);
    slides.forEach(function(slide, i) {
      slide.inert = i !== current;
      slide.setAttribute('aria-hidden', String(i !== current));
      selectors[i].setAttribute('aria-current', String(i === current));
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
      engaged = true;
      show(index);
    });
  });
  carousel.addEventListener('mouseenter', function() {
    hovered = true;
    engage();
  });
  carousel.addEventListener('mouseleave', function() {
    hovered = false;
    schedule();
  });
  carousel.addEventListener('focusin', function() {
    focused = true;
    engage();
  });
  carousel.addEventListener('focusout', function(event) {
    if (carousel.contains(event.relatedTarget)) return;
    focused = false;
    schedule();
  });
  carousel.addEventListener('mf-ticket-state', function(event) {
    ticketsOpen = event.detail.open;
    engage();
  });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
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
      engaged = true;
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
  show(location.hash === '#mf-tickets' ? 0 : current);
})();
