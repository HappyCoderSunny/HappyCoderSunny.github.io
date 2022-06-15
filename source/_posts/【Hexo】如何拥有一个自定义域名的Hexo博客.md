---
title: 【Hexo】如何拥有一个自定义域名的Hexo博客
tags:
  - Hexo
  - 教程
categories:
  - Hexo
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover3.jpg
abbrlink: 9fce234e
date: 2022-05-12 15:00:50
---

## 如何拥有自己的域名

在[这篇文章](https://happycodersunny.github.io/2022/05/09/%E3%80%90Hexo%E3%80%91Mac%20OS%E4%B8%8A%E4%BD%BF%E7%94%A8Hexo%20+%20Github%E6%90%AD%E5%BB%BA%E5%8D%9A%E5%AE%A2%E6%95%99%E7%A8%8B/)中我们利用Hexo和Github搭建了自己的博客，搭建出来的博客地址格式都是：`https://+Github博客仓库名.github.io `

比如我的博客地址就是：`https://happycodersunny.github.io`

是不是觉得不好看，大家的网址都长一样，好像是流水线上生产出来的一样，那么怎么替换成自己的域名显得更个性化呢？

## 购买域名

首先一个普通的域名也不贵，你可以上XX云买一个自己喜欢的域名，我这里以阿里云为例：

![20220512_01](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220512/20220512_01.png)

在购买的时候需要你实名，就按照要求填写相关信息即可，填写之后需要一会的审核时间，一般还是很快的。

如果你实在是不想花钱买域名也可以[在这里]([http://freenom.com](https://link.zhihu.com/?target=http%3A//freenom.com/))免费注册一个域名，具体注册和解析步骤可以参考[知乎文章](https://www.zhihu.com/question/31377141/answer/2266363145)。

## 域名解析

购买域名之后我们还需要对域名进行解析之后才能使用。

![20220512_02](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220512/20220512_02.png)

在这里面添加两条记录如上所示。

记录类型为A的四个记录值是Github page官网说的四个记录值，好多文章写的192开头的两个已经不是最新的了，大家最好还是对照[Github Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)进行设置，也可以使用`ping xxx.github.io`来验证一下。

记录类型为CNAME的记录值必须是`xxx.github.io`。

## 添加CNAME文件

一、在`Github`上博客项目里按照下面步骤配置自定义域名：

![20220512_03](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220512/20220512_03.png)

这里需要注意的是：我们需要勾选`Enforce HTTPS`，这样以后访问我们的博客才安全不会提示网站链接不安全的问题，`Github Pages`官网上说勾选这个之后一般需要等待24h才可以正常使用，不过有时候也快，我这个等了两三分钟就可以了。

二、配置完成之后，博客项目下会多一个`CNAME`文件，里面的内容就是我们上面配置的自定义域名：

![20220512_04](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220512/20220512_04.png)

三、检查博客根目录下的source文件夹下是否有一个CNAME文件，如果还是没有请自行在`/source`目录下新添加一个CNAME文件，内容跟上面一样还是填写自己购买的域名，保存。

## 修改博客配置文件

打开我们本地博客目录下的`_config.yml`文件：

![20220512_05](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220512/20220512_05.png)

将里面的url替换成我们自己的即可。

执行如下命令：

```bash
hexo clean
hexo g
hexo d
```

再次运行博客：

如果不添加`HTTPS`，网站左上角会提示该网站不安全：

![20220512_06](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220512/20220512_06.png)

正常添加`HTTPS`，网站左上角会有一个锁头标志，说明这个网站是安全的：

![20220512_07](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220512/20220512_07.png)

这样我们就把自己购买的域名用上了，也使自己的网站更具个性化一点。



## 最后

嘻嘻嘻，都看到这里了，不要吝啬你的小星星嘛，为博主点个赞呐～





















