/**
 * Scripts for the theme
 */
const body = document.querySelector('body');
const menuTrigger = document.querySelector('#toggle-main-menu-mobile');
const menuContainer = document.querySelector('#main-menu-mobile');

menuTrigger.onclick = function() {
  menuContainer.classList.toggle('open');
  menuTrigger.classList.toggle('is-active');
  body.classList.toggle('lock-scroll');
};

// Get the element with class="default-open" and click on it
const defaultOpenTabs = document.getElementsByClassName('default-open');
for (const defaultOpenTab of defaultOpenTabs) {
  defaultOpenTab.click();
}

/**
 * Opens a specific tab and updates the tab content visibility.
 *
 * @param {Event} evt - The click event triggered by the tab button.
 */
function openTab(evt) {
  const tabContents = document.getElementsByClassName('tab-content');
  for (const tabContent of tabContents) {
      tabContent.style.display = 'none';
  }
  const tabLinks = document.getElementsByClassName('tab-links');
  for (const tabLink of tabLinks) {
      tabLink.classList.remove('active');
  }
  const tabName = evt.currentTarget.dataset.tabId;
  document.getElementById(tabName).style.display = 'block';
  evt.currentTarget.className += ' active';
}


// Lazy-load background images marked with data-bg (e.g. list-item-image).
// Browsers fetch inline CSS backgrounds eagerly, even below the fold.
(function() {
  const els = document.querySelectorAll('[data-bg]');
  const show = (el) => {
    el.style.backgroundImage = 'url("' + el.dataset.bg + '")';
    el.removeAttribute('data-bg');
  };
  if (!('IntersectionObserver' in window)) {
    els.forEach(show);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        show(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, {rootMargin: '400px 0px'});
  els.forEach((el) => io.observe(el));
})();
