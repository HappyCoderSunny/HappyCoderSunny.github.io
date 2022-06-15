---
title: Hexo框架Butterfly主题配置（持续更新）
tags:
  - Hexo
  - Butterfly
  - 教程
categories:
  - Hexo
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover10.jpg
abbrlink: 391caf66
date: 2022-05-14 14:35:45
---

## 升级建议

为了减少升级以后带来的不便，建议请按照下面的方式进行操作：

在博客根目录下创建一个文件：`_config.butterfly.yml`，并把`butterfly`主题目录下的`_config.yml`内容复制到该文件中（注意：复制的是[butterfly主题目录]()下的`_config.yml`不是博客根目录中的`_config.yml`）。

以后只需要在`_config.butterfly.yml`文件里进行修改即可。

> **注意**：butterly主题目录下的`_config.yml`**不要删除，不要删除，不要删除，重要的事情说三遍。**

> **注意**：如果你项目中使用了`_config.butterfly.yml`文件，在主题目录下的`_config.yml`修改不会有效果。

如图，以后我们只需要关注这两个配置文件即可：

![20220514_01_01](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_01.png)

## scaffolds文件夹

博客目录下有一个文件夹`scaffolds`，这个是模版文件夹，当我们新建页面或者文章时，`hexo` 会根据`scaffolds`来建立文件。

顾名思义，模版就是指新建的文章或页面默认的内容，比如我修改了`scaffolds`下的`post.md`：

![20220514_01_02](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_02.png)

这样每次我新建的文章顶部都有这些默认内容，能添加的字段很多，具体参考[butterfly主题官方文档](https://butterfly.js.org/posts/dc584b87/#Post-Front-matter)。

## _config.yml文件

### 修改网站标题、副标题等信息

```yaml
# 网站设置
title: Sunny # 网站名称
subtitle: '' # 副标题
description: 千里之行，始于足下 #  描述行文字：你可以理解为个性签名
keywords: # 关键词
author: Sunny # 作者 
language: zh-CN # 语言 default(en)/ zh-CN（简体）/ zh-TW（繁体）
timezone: Asia/Shanghai # 时区
```

### url相关配置

```yaml
# 网站url 默认是https://example.com 如果使用的是github pages 请设置成 https://xxx.github.io
url: https://codersunny.com
permalink: :title/ # 永久链接
permalink_defaults: # 默认永久链接
pretty_urls:
  trailing_index: true # Set to false to remove trailing 'index.html' from permalinks
  trailing_html: true # Set to false to remove trailing '.html' from permalinks
```

> **注意**：如果`url`不修改使用默认`https://example.com`，文章末尾的链接是打不开的。

![20220514_01_03](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_03.png)

## _config.butterfly.yml文件

### 写在前面

本文基本上是按照`_config.butterfly.yml`文件从上到下的顺序来总结的，大家看的时候对照着设置即可。

### 导航栏菜单

```yaml
menu:
   首页: / || fas fa-home
   音乐库: /music/ || fas fa-music
  # Archives: /archives/ || fas fa-archive
  # Tags: /tags/ || fas fa-tags
  # Categories: /categories/ || fas fa-folder-open
  # List||fas fa-list:
  # Movie: /movies/ || fas fa-video
  # Link: /link/ || fas fa-link
  # About: /about/ || fas fa-heart
```

> **注意**：必须是`/xxx/` + `||` + `图标名`，如果不想展示图标可以不写图标名。

我这里暂时只配置了两个，效果如下：

![20220514_01_06](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_06.png)

### 代码高亮相关设置

```yaml
highlight_theme: mac # 高亮主题： darker / pale night / light / ocean / mac / mac light / false
highlight_copy: true # 是否展示复制按钮 copy button
highlight_lang: true # 是否展示代码块语言 show the code language
highlight_shrink: false # 是否展开代码框 true: shrink the code blocks / false: expand the code blocks | none: expand code blocks and hide the button
highlight_height_limit: false # unit: px
code_word_wrap: true # 是否关闭代码滚动条
```

显示效果如下：

![20220514_01_07](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_07.png)

### 复制相关配置

```yaml
# copy settings
# copyright: Add the copyright information after copied content (复制的内容加上版权信息)
copy:
  enable: true # 是否开启网站复制权限
  copyright:
    enable: true # 是否开启复制版权信息添加
    limit_count: 50 # 超过这个字数会在复制内容后面加上版权信息
```

### 社交图标

```yaml
# social settings (社交图标设置)
# formal:
#   icon: link || the description
# 书写格式：图标名:url || 描述性文字
social:
   fab fa-github: https://github.com/xxx || Github
   fas fa-envelope:  mailto:xxx@gmail.com || Email
```

显示效果如下：

![20220514_01_08](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_08.png)

### 头像和顶部图配置

```yaml
# Favicon（网站图标）
favicon: /images/avatar.png
# Avatar (头像)
avatar:
  img: /images/avatar.png
  effect: false # 是否开启头像的动效
disable_top_img: false # 如果不需要展示顶部图 设置为true
index_img: /images/background.png # 主页的top_img
default_top_img: /images/default_post_cover.png # 默认的顶部图 如果top_img没有配置时，会显示default_top_img
archive_img: /images/default_post_cover.png # 归档页面的top_img
tag_img: /images/default_post_cover.png # tag子页面的top_img
tag_per_img: # tag子页面的 top_img，可配置每个tag 的 top_img
category_img: /images/default_post_cover.png  # category子页面的top_img
category_per_img:  # category子页面的 category_img，可配置每个category 的 top_img
```

部分效果图如下：

![20220514_01_09](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_09.png)

### 文章封面配置

```yaml
cover:
  index_enable: true # 是否显示文章封面
  aside_enable: true # 文章侧边栏是否开启
  archives_enable: true # 归档是否开启
  position: both # 封面显示的位置 left/right/both both表示左右两边交替显示
  default_cover: # 当没有设置文章封面时 默认的封面展示
     - https://sunny-blog.oss-cn-beijing.aliyuncs.com/default_post_cover.png
```

显示效果如下：

![20220514_01_10](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_10.png)

### 404页面和无法显示的图片配置

```yaml
# 替换无法显示的图片的图片
error_img:
  flink: /images/friend_404.gif
  post_page: /images/404.jpg
# 404页面
error_404:
  enable: true
  subtitle: '抱歉，页面没有找到～'
  background: https://i.loli.net/2020/05/19/aKOcLiyPl2JQdFD.png
```

### 文章显示信息配置

```yaml
post_meta:
  page: # Home Page
    date_type: created # created or updated or both 主页文章日期是创建日或者更新日或都显示
    date_format: date # date/relative 显示日期还是相对日期
    categories: true # true or false 主页是否显示分类
    tags: true # true or false 主页是否显示标签
    label: true # true or false 显示描述性文字
  post:
    date_type: created # created or updated or both 文章日期是创建日或者更新日或都显示
    date_format: date # date/relative 显示日期还是相对日期
    categories: true # true or false 文章是否显示分类
    tags: true # true or false 文章頁是否显示标签
    label: true # true or false 显示描述性文字
```

### 字数统计

```yaml
# wordcount (字数统计)
# see https://butterfly.js.org/posts/ceeb73f/#字数统计
wordcount:
  enable: true
  post_wordcount: true
  min2read: true
  total_wordcount: true
```

> **注意**：如果打开字数统计插件，请务必要先安装插件。
>
> 进入根目录下，使用命令`npm install hexo-wordcount --save`或`yarn add hexo-wordcount`安装字数统计的插件。

### 文章末尾版权信息设置

```yaml
post_copyright:
  enable: true # 是否开启文章后面的复制信息
  decode: true # 是否解码
  author_href:
  license: CC BY-NC-SA 4.0
  license_url: https://creativecommons.org/licenses/by-nc-sa/4.0/
```

显示效果如下：

![20220514_01_11](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_11.png)

### 打赏功能配置

```yaml
# 打赏功能
reward:
  enable: true # 是否开启
  QR_code:
     - img: /images/wechat_pay.png
       link:
       text: 微信
     - img: /images/ali_pay.png
       link:
       text: 支付宝
```

显示效果如下：

![20220514_01_12](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_12.png)

### 分享功能配置

有三个分享服务商：`AddThis`、`Sharejs`、`Addtoany`，只能选择其中一个，我这里使用默认的`Sharejs`。

```yaml
# Share.js
# https://github.com/overtrue/share.js
sharejs:
  enable: true
  sites: facebook,twitter,wechat,weibo,qq
```

### 网站页脚配置

```yaml
footer:
  owner:
    enable: true
    since: 2020
  custom_text: Hi, welcome to my <a href="https://codersunny.com">blog</a>!
  copyright: true # Copyright of theme and framework
```

显示效果如下：

![20220514_01_13](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_13.png)

### 网站背景图片配置

```yaml
# Website Background (设置网站背景)
# can set it to color or image (可設置图片 或者 颜色)
# The formal of image: url(http://xxxxxx.com/xxx.jpg)
background: /images/background.png
```

显示效果如下：

![20220514_01_14](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_14.png)

### 网站副标题设置

```yaml
# the subtitle on homepage (主页subtitle)
subtitle:
  enable: true
  # Typewriter Effect (打字效果)
  effect: false
  # loop (循环打字)
  loop: true
  # source 调用第三方服务
  # source: false 开闭调用
  # source: 1  调用一言网的一句話（简体） https://hitokoto.cn/
  # source: 2  调用一句网（简体） http://yijuzhan.com/
  # source: 3  调用今日诗词（简体） https://www.jinrishici.com/
  # subtitle 會先显示 source , 再显示 sub 的內容
  source: false
  # 如果关闭打字效果，subtitle 只会显示 sub 的第一行文字
  sub:
  - 自信且温和，温和且坚定

# Loading Animation (加载动画)
preloader: true
```

### 侧边栏配置

```yaml
aside:
  enable: true # 侧边栏是否开启
  hide: false
  button: true
  mobile: true # 是否在手机上显示
  position: left # 侧边栏位置 left or right
  archives: true
  card_author:
    enable: true
    description:
    button:
      enable: true
      icon: fab fa-github
      text: Github
      link: https://github.com/xxx
  card_announcement: # 公告栏内容
    enable: true
    content: 欢迎来到Sunny的技术杂货铺，如果喜欢记得收藏奥～
  card_recent_post: # 最新文章
    enable: true
    limit: 5 # 如果设置为0 将会展示所有文章
    sort: date # date or updated
    sort_order: # Don't modify the setting unless you know how it works
```

显示效果如下：

![20220514_01_15](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_15.png)



### 简繁转换、夜间模式等配置

```yaml
# Conversion between Traditional and Simplified Chinese (简繁转换)
translate:
  enable: true
  default: 简 # 默认的按钮文字
  # the language of website (1 - Traditional Chinese/ 2 - Simplified Chinese）
  defaultEncoding: 2
  # Time delay
  translateDelay: 0
  msgToTraditionalChinese: '繁' # 当前是简体时 按钮文字
  msgToSimplifiedChinese: '简' # 当前是繁体时 按钮文字

# Read Mode (阅读模式)
readmode: true # 是否打开阅读模式

# 深色模式
darkmode:
  enable: true
  # Toggle Button to switch dark/light mode
  button: true
  autoChangeMode: false # 是否自动切换
```

显示效果如下：

![20220514_01_16](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_16.png)

### 查看大图配置

```yaml
# Lightbox (图片大图查看模式)
# You can only choose one, or neither (只能选择一个 或者 两个都不选)

# medium-zoom
# https://github.com/francoischalifour/medium-zoom
medium_zoom: false

# fancybox
# http://fancyapps.com/fancybox/3/
fancybox: true
```

显示效果如下：

![20220514_01_17](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220514_01_17.png)

## 最后

基本上到这里，关于`butterfly`主题的一些基础配置就可以了，关于更多的模块配置可以参考[butterfly主题官方文档](https://butterfly.js.org/)。

官方文档永远是最好的学习资料。

