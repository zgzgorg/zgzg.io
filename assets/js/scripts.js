const body = document.querySelector('body');
const menuTrigger = document.querySelector('#toggle-main-menu-mobile');
const menuContainer = document.querySelector('#main-menu-mobile');

menuTrigger.onclick = function() {
  menuContainer.classList.toggle('open');
  menuTrigger.classList.toggle('is-active');
  body.classList.toggle('lock-scroll');
};

function openTab(evt, tabName) {
  const tabContents = document.getElementsByClassName('tab-content');
  for (const tabContent of tabContents) {
    tabContent.style.display = 'none';
  }
  const tabLinks = document.getElementsByClassName('tab-links');
  for (const tabLink of tabLinks) {
    tabLink.classList.remove('active');
  }
  document.getElementById(tabName).style.display = 'block';
  evt.currentTarget.className += ' active';
}

// Get the element with id="defaultOpen" and click on it
document.getElementById('defaultOpen').click();
