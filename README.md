# 《载歌在谷》志愿者社区官方网站
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-5-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/c7624c6e88564a0988cb2a0dd82ebd85)](https://www.codacy.com/gh/zgzgorg/yj.zgzg.io/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=zgzgorg/yj.zgzg.io&amp;utm_campaign=Badge_Grade)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/zgzgorg/yj.zgzg.io/main.svg)](https://results.pre-commit.ci/latest/github/zgzgorg/yj.zgzg.io/main)
[![Netlify Status](https://api.netlify.com/api/v1/badges/6cee17f2-e6ed-45a0-bfb6-dd8234734ebf/deploy-status)](https://app.netlify.com/projects/zgzg-io/deploys)

为《载歌在谷》志愿者社区，本代码库托管[其官方网站](https://zgzg.io/)的源代码。部署在 [Netlify](https://app.netlify.com/projects/zgzg-io/deploys) 上。

## 贡献指南

想要开发这个网站，需要用到以下工具：

### 在本地渲染该网站
本网站使用 [Jekyll](https://jekyllrb.com/) 渲染。安装 Jekyll 之后，您可以运行以下命令来在您的电脑上（"本地"）打开这个网站：

```shell
bundle exec jekyll serve
```

### Pre-commit hooks
本代码库使用 [pre-commit hooks](https://pre-commit.com/) 来自动化一些琐事。（请参见 `.pre-commit-config.yaml` 来熟悉一下都启用了哪些 hooks。）

Assuming you have `pre-commit` installed (perhaps via `brew install pre-commit`), after cloning this repo to your local machine, you need to execute this command in the root directory of this repo:

```shell
pre-commit install
```

One of the hooks use the [ESLint](https://eslint.org/) tool to check JavaScript files, including enforcing the [Google JavaScript Code Style](https://google.github.io/styleguide/jsguide.html). (See `.eslintrc.json` for the exact config.) As a [npm package](https://www.npmjs.com/), ESLint is installed via npm and specified in the `package.json`.

## 本代码库结构简介
根据您想要贡献的内容的类型划分，您可能想要专注于认识不同的部分。

### 如果你想要加入、更新内容
对于内容贡献者来说，最重要的几个文件夹是：
- `pages`：这里存放了每个页面的内容。每个页面都是一个单独的 Markdown 文本文档。在每个文件开头，有个符合 YAML 语法的区块，叫"[front matter](https://jekyllrb.com/docs/front-matter/)""，是会被 Jekyll 特殊处理的"元数据"（metadata）。元数据包括（显示在浏览器标签页卡片上的）标题、布局（layout）名称等。对于布局，大部分的页面都可以使用 `layout: page`（例如[《关于我们》](https://github.com/zgzgorg/yj.zgzg.io/blob/68c1e9f1d7072eda10a20c168512daa451b29a22/pages/about.md?plain=1#L3)、[《常见问题》](https://github.com/zgzgorg/yj.zgzg.io/blob/68c1e9f1d7072eda10a20c168512daa451b29a22/pages/faq.md?plain=1#L3)）。
- `_data`：这里存放了任何需要被 enumerate （"枚举"/"罗列"/"用循环读出"）出来的信息。每个文件都是一个 YAML 文件。例如：
  - `data.yml`：定义了网站顶栏、底栏应该有哪些链接；我们有哪些伙伴社区、赞助商；春晚板块有哪些节目；歌手赛有哪些节目；云集板块有哪些栏目…… **这是最主要的、最杂的数据文件。** 当某个列表太大时，您也可以选择把它单独拆出来、成为一个单独的文件，就像下面两项这样👇
  - `past-events.yml`：定义了[《往届回顾》](https://www.zgzg.io/past-events/)页面的内容。
  - `trailer-images.yml`：罗列了一些春晚宣传片的拍摄花絮照片。

⚠️ **注意**：本代码库虽然包含一个 `images` 文件夹，但它仅应该被用来存放 svg 等源代码格式的图片。若需要存放 jpg、png 等二进制格式的图片，请使用我们自己的 Cloudinary 服务。

### 如果你想要开发网站功能
- `_layouts`：当朴素的 `layout: page` 难以满足您的表达需求时，您可以创建新的 layout，存放于这里。请参见下文"如何自由排版"一节。
- `_includes`：存放可复用的一些元件。复用可以发生在：
  - 几页之间。例如：**赞助商列表**（`_includes/sponsor-section.html`）被复用于歌手赛、游园、春晚等页面底部。
  - 一页之内。例如：**栏目卡片**（`_includes/programme.html`）被复用于首页。
  - 其他可复用的元件之内。例如，上述**栏目卡片**也在**云集节目列表**（`_includes/programmes.html`）里被复用：
    <img width="800" alt="image" src="https://user-images.githubusercontent.com/594058/194156682-19832792-da81-4f84-bcb7-a43cc2c3e5cf.png">

首页通过 `_includes/home-events.html` 横向轮播活动，默认展示音乐节，每 9 秒切换。音乐节海报点击后翻面购票，春晚海报直达节目及主持人报名。观众把鼠标移进轮播、用键盘操作、点小点或者横滑之后，轮播停住；鼠标和焦点都离开 1 分钟之后，轮播才继续。购票时轮播也停住。经维护者批准，2027 春晚招募海报随本次网站静态文件发布，存放在 `images/2027-gala/`。轮播底部有两个小点，当前活动的小点显示为横线。

首页的「云集社团」也是一个轮播，排法和活动轮播一样：每个社团占满一张幻灯片，宽屏左边是大图、右边是介绍和按钮，手机上图片在上、文字在下。四个社团对应四个小点。幻灯片模板是 `_includes/programme-slide.html`。社团轮播和活动轮播一样每 9 秒切到下一个社团，切到最后一个之后回到开头。观众点小点、在小点上按左右方向键或者横滑，轮播也切换社团，并且停住；鼠标和焦点都离开 1 分钟之后，轮播才继续。两个轮播共用 `assets/js/carousel.js` 的切换逻辑和 `_includes/carousel-style.html` 的小点样式。首页在 include `programmes.html` 之前设置 `programmes_carousel = true` 才启用社团轮播，云集专页 `/yj/` 仍然用 `_includes/programme.html` 显示网格。

首页轮播下方的 `_includes/home-logo-marquee.html` 显示「我们的志愿者们主要来自硅谷科技圈」：公司 logo 一排向右滚动，学校 logo 一排向左滚动。logo 清单在 `_data/home-logos.yml`，图片存放在 `images/home-logos/`。经维护者批准，这批 logo 的 WebP 也放在仓库里。原图下载好之前，页面先用单色轮廓拼图 `images/home-logos/silhouettes.webp`（约 8 KB）占位；增删 logo 之后，请运行 `python3 tools/home-logo-silhouettes.py` 重新生成拼图。

首页最下方的「报名服务」章节放着书法「有爱载歌，有家在谷」和报名按钮。书法图片在 `images/volunteer/`。

页脚的社交媒体图标分两行，清单在 `_data/social.yml`：第一行是最主要的微信公众号、小红书、YouTube，图标大一些；第二行是 Luma、Eventbrite 两个活动报名平台和其余平台。国内平台点开弹出二维码，海外平台点开直接跳转。二维码在 `images/social/qr/`，由 `tools/social-qr.py` 生成，中间叠了圆形社区 logo。header 右侧也放了这三个最主要的平台和两个活动报名平台（手机和 768px 到 991px 之间的屏幕上只放三个主要平台）。header 默认显示四字横排 logo `images/zgzglogo-horizontal.webp`；768px 到 991px 之间导航菜单已经展开、放不下横排 logo，这一段显示圆形 logo；横排 logo 取自共享云端硬盘「ZGZG Logo Various Size 载歌在谷各种尺寸的Logo」文件夹里的 `logo 16.png`。

- `assets`：存放了一些脚本和样式表文件。
  - `assets/css/style.scss`：许多仅对《载歌在谷》有意义的样式（与"对其他网站也有用"相对），都被存放到了这里。如春晚横幅：https://github.com/zgzgorg/yj.zgzg.io/blob/d11235a52359996f299a1bdab37669251c10d21c/assets/css/style.scss#L357-L364
  - `assets/js/sidenotes.js`： is a pure-JavaScript plugin that puts `.footnotes` into `#sidebar`, aligning each piece of note at their corresponding superscript, developed by [@tslmy](https://github.com/tslmy).
  - `_includes/critical/home.css`：首页首屏用到的样式，内联进首页的 `<head>`，完整的 `style.css` 随后异步加载。这个文件由 `tools/critical-css.js` 从 `style.css` 生成。改了 `assets/css/style.scss` 或 `_sass/` 以后，请按脚本开头的说明重新生成，并一起提交。
  - `_includes/schema-org/`：页面的 schema.org 结构化数据（JSON-LD）。页面在 front matter 里写 `schema_org: schema-org/xxx.html`，`_layouts/default.html` 就把它放进 `<head>` 的最前面。
  - `_layouts/default.html` 开头的 `zgzgPhase` 脚本负责分阶段加载。`zgzgIsSlow()` 判断访客是不是慢网：慢网时不下载中文网络字体，统计脚本、购票窗口、Bootstrap 都等访客动手以后再下载。
- `_sass`：这里存放各种对其他网站也有复用意义的样式表。其实，本网站采用的即是他人制作的、现成的主题——由 [Robert Austin](https://github.com/zerostaticthemes) 制作的 [Serif](https://github.com/zerostaticthemes/jekyll-serif-theme)。

### 网站有中文版和英文版，两版共用模板

中文页的网址不带前缀，英文页的网址以 `/en/` 开头。英文版只覆盖首页和主导航页面，归档、公告、理事会等页面只有中文版。旧网址 `/english/` 跳转到英文首页 `/en/`。

```
pages/
├── index.md、gala.md ……      中文页（不改）
└── en/                        英文页，网址 /en/…，_config.yml 自动给这里的页面设 lang: en
    ├── index.md               英文首页，和中文首页共用 _layouts/home.html
    ├── about.md、yj.md        和中文页共用 page、programmes 两个 layout
    └── gala.html、singer.html、music-festival.html ……
                               英文正文；样式和中文 layout 共用 _includes/page-assets/<页面名>.html
_data/i18n/zh.yml、en.yml      页头、菜单、页脚、首页、二维码弹窗等界面文字，两个文件的键一一对应
_includes/i18n.html            在 default.html 开头算出 t（当前语言的文字）和 alt_url（另一种语言的同一页面）
```

文字按长短放在三个地方：

1. 页头、页脚、首页上的短句放在 `_data/i18n/zh.yml` 和 `en.yml`。模板写 `{{ t.home.about_heading }}` 这样的引用，中文页和英文页用同一个模板。
2. 数据文件里的条目（社团、伙伴社区、游园摊位、菜单、社交平台、logo）在同一个条目里加带 `_en` 后缀的字段，例如 `name_en`、`description_en`、`button-url_en`。英文页优先取 `_en` 字段，没有 `_en` 字段时显示中文字段。
3. 活动页的成段正文写在 `pages/en/` 下的英文页里。

**加一句新的界面文字**：在 `zh.yml` 和 `en.yml` 的同一个位置各加一个键，然后在模板里写 `{{ t.<键> }}`。只改一个文件的话，另一种语言的页面会显示空白。

**给一个已有的中文页加英文版**：在 `pages/en/` 下新建同名文件，front matter 写 `permalink: /en/<原网址>/`。构建之后，菜单的语言按钮和 `<head>` 里的 hreflang 自动指向两个版本。没有英文版的中文页，语言按钮跳到英文首页。

**改了中文活动页的正文**：英文版不会自动更新，请同时改 `pages/en/` 下对应的英文页，或者在 PR 里写明英文版待更新。

本网站托管于 [Netlify](https://www.netlify.com/) 之上，域名为 [zgzg.io](https://zgzg.io/)。请参见 [zgzg.link/site-notes](https://zgzg.link/site-notes) 更多信息，包括《载歌在谷》的所有网络服务资源、各代网站特点及制作背景等。（仅限内部访问。）

#### 如何自由地排版
当朴素的 `layout: page` 难以满足您的表达需求时，您可以创建新的 layout。

假设我们想做一个[《春晚》](https://www.zgzg.io/gala/)页面。通常，我们只需要创建一个 `pages/gala.md` 来提供内容。但是，假设这次我们想要做一些复杂的结构，如图所示：

![](https://user-images.githubusercontent.com/594058/194150455-816766bc-dd14-4b6f-9f59-4f2136b24fca.jpeg)

我们首先要做的是，在 `pages/gala.md` 的 front matter 上写明"请用一个叫 gala 的 layout 来渲染这个文档，而不是默认的叫 page 的那个 layout"：

https://github.com/zgzgorg/yj.zgzg.io/blob/d11235a52359996f299a1bdab37669251c10d21c/pages/gala.md?plain=1#L3

接下来，我们创建一个 `_layouts/gala.html` 文件。虽然这是一个 HTML 文档，但是我们依然可以写入 front matter。在它的 front matter 里，我们写"请把这个 layout 嵌套在叫 default 的那个 layout 里"：

https://github.com/zgzgorg/yj.zgzg.io/blob/d11235a52359996f299a1bdab37669251c10d21c/_layouts/gala.html#L1-L3

接下来的工作，就是常见的"写 HTML"了。其实，我们写的不会是纯粹的 HTML，而是一种叫 [Liquid](https://jekyllrb.com/docs/liquid/) 的"模板语言"（templating language）。模板语言提供一些高阶功能，比如引用一些模块。例如，在现今的 `_layouts/gala.html` 底部，我们就有引用两个模块：

https://github.com/zgzgorg/yj.zgzg.io/blob/d11235a52359996f299a1bdab37669251c10d21c/_layouts/gala.html#L32-L33

这些模块存放于 `_includes/` 文件夹下。例如，上面引用的第一个模块，就在 `_includes/galalist.html`：

https://github.com/zgzgorg/yj.zgzg.io/blob/d11235a52359996f299a1bdab37669251c10d21c/_includes/galalist.html#L1-L14

这个模块很好地体现了 Jekyll 里的"枚举"该怎么用。注意这一行：

https://github.com/zgzgorg/yj.zgzg.io/blob/d11235a52359996f299a1bdab37669251c10d21c/_includes/galalist.html#L7

它说："请在本网站（`site`）的 `data` 文件夹下，找到叫 `data` 的 YAML 文件，读取其中的 `galalist` 列表。对于其中每个项目（以 `pic` 指代），重复渲染下述内容"。这里所指的"下述内容"，即是：

https://github.com/zgzgorg/yj.zgzg.io/blob/d11235a52359996f299a1bdab37669251c10d21c/_includes/galalist.html#L8-L12

它说：

> 放置一个 `galalist-section` 类型的分区（**div**ision，`div`）。在里面放：
> * 一个图片（`img`），图片链接为 `pic.image`；
> * 在那之后放一个三级标题（`h3`），内容为 `pic.title`；
> * 最后，把 `pic.description` 直接放上去。

这里，`galalist-section` 和 `galalist-pic` 是用来排版的。它们所对应的 CSS 规则在这里：

https://github.com/zgzgorg/yj.zgzg.io/blob/d11235a52359996f299a1bdab37669251c10d21c/assets/css/style.scss#L184-L190

（⚠️**注意**：我们采用 [SCSS](https://sass-lang.com/) 作为"样式语言"（styling language）。它是 CSS 的一种超集（superset）。）

## 样式表编译器说明（Sass/SCSS）

本项目所有 SCSS 文件均由 Jekyll 内置的 Ruby Sass（sassc）编译。**请勿使用 Dart Sass 新语法**（如 `@use`、`@forward`、`color.adjust()` 等），只使用 `@import`、`lighten()` 等传统语法。

- 所有开发、预览、部署请务必使用：

  ```shell
  bundle exec jekyll serve
  ```

- 团队依赖已在 Gemfile 中锁定，确保所有人编译结果一致。
- 如遇 Dart Sass 相关 warning，说明未用 bundle exec 或本地误装 Dart Sass CLI。

## LICENSE
The MIT License (MIT).

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center"><a href="http://myli.page"><img src="https://avatars.githubusercontent.com/u/594058?v=4?s=100" width="100px;" alt="Ming"/><br /><sub><b>Ming</b></sub></a><br /><a href="#infra-tslmy" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/zgzgorg/yj.zgzg.io/commits?author=tslmy" title="Tests">⚠️</a> <a href="https://github.com/zgzgorg/yj.zgzg.io/commits?author=tslmy" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/xubowenhaoren"><img src="https://avatars.githubusercontent.com/u/20229080?v=4?s=100" width="100px;" alt="Bowen Xu"/><br /><sub><b>Bowen Xu</b></sub></a><br /><a href="https://github.com/zgzgorg/yj.zgzg.io/commits?author=xubowenhaoren" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/rtq998916"><img src="https://avatars.githubusercontent.com/u/92650213?v=4?s=100" width="100px;" alt="rtq998916"/><br /><sub><b>rtq998916</b></sub></a><br /><a href="https://github.com/zgzgorg/yj.zgzg.io/commits?author=rtq998916" title="Code">💻</a></td>
      <td align="center"><a href="http://floraxue.github.io"><img src="https://avatars.githubusercontent.com/u/5152856?v=4?s=100" width="100px;" alt="Flora Xue"/><br /><sub><b>Flora Xue</b></sub></a><br /><a href="https://github.com/zgzgorg/yj.zgzg.io/commits?author=floraxue" title="Code">💻</a> <a href="https://github.com/zgzgorg/yj.zgzg.io/pulls?q=is%3Apr+reviewed-by%3Afloraxue" title="Reviewed Pull Requests">👀</a></td>
      <td align="center"><a href="https://github.com/ckt624"><img src="https://avatars.githubusercontent.com/u/13848196?v=4?s=100" width="100px;" alt="Kongtao Chen"/><br /><sub><b>Kongtao Chen</b></sub></a><br /><a href="https://github.com/zgzgorg/yj.zgzg.io/commits?author=ckt624" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
