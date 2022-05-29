---
title: Butterfly 如何替换jsdelivr提升网站访问速度
date: 2022-05-29 13:54:19
tags:	
 - Hexo
 - Butterfly
catergories:
 - Hexo
cover: https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220529/20220529_01.png
---

## 写在前面

大家都知道`jsdelivr`，而且经常用这个CDN服务，这是一个很快而且免费的CDN服务，但是从去年还是啥时候开始就逐渐出现挂掉，不太好用的情况，前段时间更是大规模的挂掉，对我最直接的影响就是：我这个博客网站打开就是巨慢无比，控制台一堆报错，各种图片无法显示，这对于一个强迫症来说真的不能忍，于是打算换掉Butterfly主题下的`jsdelivr`CDN服务。

## 解决办法

### 办法一

这种方法超级简单，只需要简单的一步：

`butterfly主题下` - `scripts` - `events` - `config.js`文件 修改`jsdelivr`cdn。

将`https://cdn.jsdelivr.net` 换成 `https://fastly.jsdelivr.net`或`https://gcore.jsdelivr.net`

![20220529_01](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220529/20220529_01.png)

其中`fastly`是美国的服务器，`gcore`是俄罗斯的服务器，两个都亲测好用，嫌弃麻烦的同学可以直接替换成这个，访问速度目前来看还是很快的。

### 办法二

修改`butterfly主题`中的`_config.yml`文件：

将`third_party_provider`由`jsdelivr`换成`local`：

![20220529_02](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220529/20220529_02-20220529144032212.png)

替换CDN（部分）：

```yaml
main_css: /css/index.css
main: /js/main.js
utils: /js/utils.js

jquery: https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.6.0/jquery.min.js
translate: https://npm.elemecdn.com/js-heo@1.0.6/translate/tw_cn.js
pjax: https://npm.elemecdn.com/pjax/pjax.min.js
twikoo: https://npm.elemecdn.com/js-heo@1.0.3/twikoo/twikoo.all.min.js
lazyload: https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/vanilla-lazyload/17.3.1/lazyload.iife.min.js
instantpage: https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/instant.page/5.1.0/instantpage.min.js
fancybox_css_v4: https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/fancybox/3.5.7/jquery.fancybox.min.css
fancybox_v4: https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/fancybox/3.5.7/jquery.fancybox.min.js
snackbar_css: https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/node-snackbar/0.1.16/snackbar.min.css
snackbar: https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/node-snackbar/0.1.16/snackbar.min.js
fontawesomeV6: https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/font-awesome/6.0.0/css/all.min.css
aplayer_css: https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/aplayer/1.10.1/APlayer.min.css
aplayer_js: https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/aplayer/1.10.1/APlayer.min.js
meting_js: https://npm.elemecdn.com/js-heo@1.0.12/metingjs/Meting.min.js
```

以上是我使用的一些cdn，其他的cdn如有补充的可以在评论里留言。

这里推荐字节跳动的静态资源公共库：https://cdn.bytedance.com

### 办法三

为`jsdelivr`搭建反向代理服务，比如使用[Cloudflare](https://www.cloudflare.com/zh-cn/)自行去搭建。

## 最后

本文就写到这里了，如有问题，欢迎随时联系博主，博主马上修改。





























