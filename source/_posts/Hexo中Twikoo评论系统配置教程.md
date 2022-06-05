---



title: Hexo中Twikoo评论系统配置教程
author: Sunny
date: 2022-06-05 12:36:44
tags:
categories:
cover: https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover2.jpg
---

## 写在前面

Hexo博客里面支持的评论系统有：`Disqus`、`Disqusjs`、`Livere`、`Gitalk`、`Valine`、`Waline`、`Utterances`、`Facebook Comments`、`Twikoo`、`Giscus`，这里面有的评论有的是国外的服务器、有的有广告，本文要讲的`Twikoo`是在butterfly3.3之后支持的，它支持邮件提醒、微信提醒等功能，还是非常好用的。

> **注意**：本文仅针对腾讯云的部署方式中的「手动部署」，其他详细部署方式请参考[官方文档](https://cloud.tencent.com/act?cps_key=44b3b34da3e3b77bae971b11ed4b2639&fromSource=gwzcw.3814800.3814800.3814800&utm_id=gwzcw.3814800.3814800.3814800&utm_medium=cps&page=cloudbase01)。

## 购买云开发套餐

**温馨提示**：如果你已经拥有云开发环境，可以忽略这一步，直接到【登录授权】。

**1、**进入[云开发CloudBase](https://cloud.tencent.com/act?cps_key=44b3b34da3e3b77bae971b11ed4b2639&fromSource=gwzcw.3814800.3814800.3814800&utm_id=gwzcw.3814800.3814800.3814800&utm_medium=cps&page=cloudbase01)，进行**登录**、**实名认证**操作，点击**控制台**：

![2022060501](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060501.png)

**2、**点击**云产品**，选择**云开发CloudBase**：

![2022060502](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060502.png)

**3、**点击**新建**，选择**空模板**，点击下一步：

![2022060503](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060503.png)

![2022060504](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060504.png)

**4、**选择合适的套餐进行购买：

![2022060505](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060505.png)



> **温馨提示**：
>
> 地域选择【上海】
>
> 计费方式选择【包年包月】
>
> 环境名称自由填写
>
> 套餐版本选择【特惠基础版1】



**5、**按照上面的步骤操作之后，我们会拥有一个云开发环境：

![2022060506](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060506-20220605154108387.png)

> **注意**：记录一下这个环境ID，我们后面会用。

## 登录授权

环境 - 登录授权 - 开启【匿名登录】

![2022060507](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060507.png)

## 安全配置

环境 - 安全配置 - 添加域名：将自己的域名添加进去

![2022060508](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060508.png)

> **温馨提示**：
>
> 如果更改了域名发现评论加载不出来的情况，请记得回来更改为最新域名，尤其是那些刚开始使用 github.io来作为自己博客域名的童鞋，哪天购买了自己的域名，记得换，记得换，记得换（重要的事情说三遍）。

## 云函数

**1、**环境 - 云函数 - 新建云函数

> **温馨提示**：
>
> 函数名称填写：`twikoo`
>
> 创建方式选择：空白函数
>
> 运行环境选择：Nodejs10.15
>
> 函数内存选择：128M
>
> 必须按照上面的方式选择，不要瞎选瞎写好吧。

![2022060509](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060509.png)

![2022060510](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060510.png)

**2、**清空上图中「函数代码」框里的内容，复制`exports.main = require('twikoo-func').main`到里面，点击确定，如下：

![2022060511](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060511.png)

**3、**点击「**twikoo**」函数名进入云函数详情页 - **函数代码** - **文件** - **新建文件**，输入`package.json`确定，将`{ "dependencies": { "twikoo-func": "1.5.11" } }`内容复制到新建的文件`package.json`里面。

![2022060512](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060512.png)

![2022060513](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060513.png)

## 配置butterfly主题文件

打开`主题butterfly`下的配置文件

```yaml
comments:
  # Up to two comments system, the first will be shown as default
  # Choose: Disqus/Disqusjs/Livere/Gitalk/Valine/Waline/Utterances/Facebook Comments/Twikoo/Giscus/Remark42
  use: Twikoo # Valine,Disqus
  text: true # Display the comment name next to the button
  # lazyload: The comment system will be load when comment element enters the browser's viewport.
  # If you set it to true, the comment count will be invalid
  lazyload: true
  count: true # 文章top_image上是否显示评论数量
  card_post_count: true # 首页文章是否显示评论数量
  
# Twikoo
# https://github.com/imaegoo/twikoo
twikoo:
  envId: xxxxxxxxxxxxx # 环境ID，即是上面创建的云环境的ID
  region:
  visitor: true
  option:
```

显示效果如下：

![2022060514](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220605/2022060514.png)

## 最后

关于其他的评论系统的配置请参考：[butterfly主题官方文档](https://butterfly.js.org/posts/ceeb73f/)

关于Twikoo评论系统详细文档请参考：[Twikoo官方文档](https://twikoo.js.org/quick-start.html)

