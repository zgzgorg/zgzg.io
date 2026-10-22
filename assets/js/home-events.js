// 首页默认显示音乐节，每 9 秒切换一次。观众把鼠标移进轮播、用键盘操作、
// 点小点或横滑之后，轮播停住；鼠标和焦点都离开之后，再等 1 分钟才继续轮播。
// 购票、页面不可见或系统要求减少动态效果时，轮播不自动切换。
// 切换逻辑在共用的 carousel.js 里，本文件只放活动轮播自己的规则。
(function() {
  const carousel = document.getElementById('home-events');
  if (!carousel || !window.zgCarousel) return;
  let ticketsOpen = carousel.querySelector('#mf-flip')
      .classList.contains('is-flipped');

  const api = window.zgCarousel(carousel, {
    interval: 9000,
    resumeDelay: 60000,
    blocked: function() { return ticketsOpen; },
    onShow: function(current) {
      carousel.dataset.current = String(current);
      const poster = carousel.querySelectorAll('.home-event')[current]
          .querySelector('[data-srcset]');
      if (poster) {
        poster.srcset = poster.getAttribute('data-srcset');
        poster.removeAttribute('data-srcset');
      }
    },
  });
  carousel.addEventListener('mf-ticket-state', function(event) {
    ticketsOpen = event.detail.open;
    api.engage();
  });
})();
