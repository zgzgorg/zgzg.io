// 首页两个轮播共用的切换逻辑：近期活动轮播（home-events.js）和云集社团轮播。
// 轮播里的元素用 data 属性标出：data-carousel-viewport、data-carousel-track、
// data-carousel-slide、data-carousel-dot。一屏可以并排显示几张卡片，
// 每次向前或者向后移动一张；第 i 个小点表示「从第 i 张卡片开始显示」。
// 观众把鼠标移进轮播、用键盘操作、点小点或者横滑之后，自动轮播停住；
// 鼠标和焦点都离开之后，再等 resumeDelay 才继续。页面不可见、轮播不在视口里
// 或者系统要求减少动态效果时，轮播不自动切换。
// 带 data-carousel-auto 的轮播由本脚本直接启用，不自动切换。
(function() {
  /**
   * 启用一个轮播。
   * @param {HTMLElement} root 轮播最外层元素。
   * @param {{interval: (number|undefined), resumeDelay: (number|undefined),
   *     blocked: (function(): boolean|undefined),
   *     onShow: (function(number)|undefined),
   *     arrowKeys: (boolean|undefined)}=} options
   *     interval 是自动切换的间隔毫秒数，0 表示不自动切换；
   *     blocked 返回 true 时，轮播不自动切换，也不响应横滑；
   *     onShow 在每次切换之后调用；arrowKeys 让焦点在小点上时可以用左右方向键切换。
   * @return {{show: function(number), engage: function()}}
   */
  window.zgCarousel = function(root, options) {
    options = options || {};
    const interval = options.interval || 0;
    const resumeDelay = options.resumeDelay || 0;
    const blocked = options.blocked || function() { return false; };
    const track = root.querySelector('[data-carousel-track]');
    const viewport = root.querySelector('[data-carousel-viewport]');
    const slides = Array.from(root.querySelectorAll('[data-carousel-slide]'));
    const dots = Array.from(root.querySelectorAll('[data-carousel-dot]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0;
    let perView = 1;
    let timer;
    let hovered = false;
    let focused = false;
    let engaged = false;
    let visible = true;

    /** 一屏能并排显示的卡片数。 */
    function measure() {
      const width = slides[0].getBoundingClientRect().width;
      return width ? Math.max(1, Math.round(viewport.clientWidth / width)) : 1;
    }

    /** 起始卡片一共有几个可选位置。 */
    function positions() {
      return Math.max(1, slides.length - perView + 1);
    }

    /** 记下观众操作过轮播，下一次切换要等 resumeDelay。 */
    function engage() {
      engaged = true;
      schedule();
    }

    /** 在轮播可见且没有人操作时，安排下一次切换。 */
    function schedule() {
      clearTimeout(timer);
      if (!interval || hovered || focused || !visible || document.hidden ||
          blocked() || reducedMotion.matches) return;
      timer = setTimeout(function() {
        engaged = false;
        show((current + 1) % positions());
      }, engaged ? resumeDelay : interval);
    }

    /**
     * 从第 index 张卡片开始显示，并更新键盘访问范围。
     * @param {number} index 起始卡片的序号。
     */
    function show(index) {
      current = index;
      track.style.transform = 'translateX(-' + current * 100 / perView + '%)';
      slides.forEach(function(slide, i) {
        const hidden = i < current || i >= current + perView;
        slide.inert = hidden;
        slide.setAttribute('aria-hidden', String(hidden));
      });
      dots.forEach(function(dot, i) {
        dot.hidden = positions() < 2 || i >= positions();
        dot.setAttribute('aria-current', String(i === current));
      });
      if (options.onShow) options.onShow(current);
      schedule();
    }

    /**
     * 向前或者向后移动一张卡片，两端循环。
     * @param {number} step 1 表示向后，-1 表示向前。
     */
    function move(step) {
      engaged = true;
      show((current + step + positions()) % positions());
    }

    dots.forEach(function(dot, index) {
      dot.addEventListener('click', function() {
        engaged = true;
        show(index);
      });
    });
    if (options.arrowKeys) {
      root.addEventListener('keydown', function(event) {
        if (!event.target.hasAttribute('data-carousel-dot')) return;
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        move(event.key === 'ArrowRight' ? 1 : -1);
        dots[current].focus();
      });
    }
    root.addEventListener('mouseenter', function() {
      hovered = true;
      engage();
    });
    root.addEventListener('mouseleave', function() {
      hovered = false;
      schedule();
    });
    root.addEventListener('focusin', function() {
      focused = true;
      engage();
    });
    root.addEventListener('focusout', function(event) {
      if (root.contains(event.relatedTarget)) return;
      focused = false;
      schedule();
    });
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', schedule);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(entries) {
        visible = entries[0].isIntersecting;
        schedule();
      }).observe(root);
    }
    // 窗口宽度变了、一屏的卡片数跟着变的时候，重新排一次。
    window.addEventListener('resize', function() {
      const next = measure();
      if (next === perView) return;
      perView = next;
      show(Math.min(current, positions() - 1));
    });

    // 触摸横滑可以切换；横滑结束后不触发卡片里的点击动作。
    let startX = 0;
    let startY = 0;
    let swipedAt = 0;
    viewport.addEventListener('touchstart', function(event) {
      if (blocked() || event.touches.length !== 1) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      clearTimeout(timer);
    }, {passive: true});
    viewport.addEventListener('touchend', function(event) {
      if (blocked() || event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        swipedAt = Date.now();
        move(dx < 0 ? 1 : -1);
      } else schedule();
    }, {passive: true});
    viewport.addEventListener('click', function(event) {
      if (Date.now() - swipedAt < 500) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    root.classList.add('is-ready');
    perView = measure();
    show(0);
    return {show: show, engage: engage};
  };

  document.querySelectorAll('[data-carousel-auto]').forEach(function(root) {
    window.zgCarousel(root, {arrowKeys: true});
  });
})();
