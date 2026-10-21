// 从 style.css 里挑出首页首屏用到的规则，写进 _includes/critical/home.css。
//
// 做法：用无头 Chrome 在多个视口宽度下打开本地预览的首页，逐条检查 style.css 的规则。
// 规则的选择器命中首屏以内的元素，或者命中隐藏的元素（例如收起的手机菜单），就保留。
// 各个视口的结果取并集，按 style.css 原来的顺序输出，@media 外壳一起保留。
//
// 用法（先在本地用 jekyll serve 起好预览）：
//   npm i --no-save playwright-core clean-css
//   CHROME=/path/to/chrome node tools/critical-css.js http://localhost:4000/
//
// assets/css/style.scss 或 _sass/ 改了以后，重新跑一遍，把生成的文件一起提交。
// 生成的文件过时了也不会坏页面：完整的 style.css 随后照常加载，只是首屏可能闪一下。

const {chromium} = require('playwright-core');
const CleanCSS = require('clean-css');
const fs = require('fs');
const path = require('path');

const url = process.argv[2] || 'http://localhost:4000/';
const outFile = path.join(__dirname, '..', '_includes', 'critical', 'home.css');
const viewports = [
  [320, 640], [360, 740], [412, 915], [768, 1024],
  [1024, 768], [1280, 800], [1366, 900], [1920, 1080],
];

// 在页面里运行：返回要保留的规则路径，例如 "12" 或 "40.3"（@media 里的第 3 条）
function pickRules(vh) {
  const sheet = [...document.styleSheets]
      .find((s) => s.href && s.href.includes('/assets/css/style.css'));
  // 交互之后才出现的状态类，首屏看不到，但是用户可能在完整样式到达之前就点了
  const forced = /\.(open|is-active|lock-scroll|show|collapsing)\b/;
  const dynamic = new RegExp('::?(hover|focus|focus-within|focus-visible|active|' +
      'visited|before|after|placeholder|selection|first-line|first-letter|' +
      '-webkit-[\\w-]+|-moz-[\\w-]+|-ms-[\\w-]+|marker|backdrop|disabled|' +
      'checked|invalid|valid|indeterminate|default|target|link)(\\([^)]*\\))?',
  'g');
  const aboveFold = (selector) => {
    if (forced.test(selector)) return true;
    const s = selector.replace(dynamic, '').replace(/[>+~]\s*$/, '').trim() || '*';
    let els;
    try {
      els = document.querySelectorAll(s);
    } catch (e) {
      return false;
    }
    for (const el of els) {
      // 隐藏元素的 top 是 0，也算首屏，免得收起的菜单先露出来
      if (el.getBoundingClientRect().top < vh) return true;
    }
    return false;
  };
  const kept = [];
  const walk = (rules, prefix) => {
    [...rules].forEach((rule, i) => {
      const p = prefix.concat(i);
      if (rule instanceof CSSStyleRule) {
        if (rule.selectorText.split(',').some(aboveFold)) kept.push(p.join('.'));
      } else if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
        walk(rule.cssRules, p);
      }
      // @font-face、@import 等首屏用不到，跳过；@keyframes 在输出时按需补上
    });
  };
  walk(sheet.cssRules, []);
  return kept;
}

// 在页面里运行：按原顺序拼出保留的规则
function emitRules(keepList) {
  const keep = new Set(keepList);
  const sheet = [...document.styleSheets]
      .find((s) => s.href && s.href.includes('/assets/css/style.css'));
  const emit = (rules, prefix) => [...rules].map((rule, i) => {
    const p = prefix.concat(i);
    if (rule instanceof CSSStyleRule) return keep.has(p.join('.')) ? rule.cssText : '';
    if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
      const inner = emit(rule.cssRules, p);
      return inner ? rule.cssText.slice(0, rule.cssText.indexOf('{')) + '{' + inner + '}' : '';
    }
    return '';
  }).join('\n');
  const css = emit(sheet.cssRules, []);
  // 补上保留的规则里用到的 @keyframes，例如手机菜单逐项淡入的 fadeInRight
  const frames = [...sheet.cssRules]
      .filter((r) => r instanceof CSSKeyframesRule &&
          new RegExp('animation(-name)?:[^;}]*\\b' + r.name + '\\b').test(css))
      .map((r) => r.cssText);
  return [css].concat(frames).join('\n');
}

(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROME});
  const keep = new Set();
  for (const [width, height] of viewports) {
    const page = await browser.newPage({viewport: {width, height}, javaScriptEnabled: false});
    await page.goto(url, {waitUntil: 'load'});
    (await page.evaluate(pickRules, height)).forEach((k) => keep.add(k));
    await page.close();
  }
  const page = await browser.newPage();
  await page.goto(url, {waitUntil: 'load'});
  const css = await page.evaluate(emitRules, [...keep]);
  await browser.close();
  const min = new CleanCSS({level: 1}).minify(css).styles;
  fs.mkdirSync(path.dirname(outFile), {recursive: true});
  fs.writeFileSync(outFile, min + '\n');
  console.log(`${keep.size} rules, ${min.length} bytes -> ${outFile}`);
})();
