---
title: 【Hexo】如何拥有一个自定义域名的Hexo博客
date: 2022-05-11 15:00:50
tags: 
- Hexo
categories:
- Hexo
cover: https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220511_02_01.png
---

## 如何拥有自己的域名

在[这篇文章](https://happycodersunny.github.io/2022/05/09/%E3%80%90Hexo%E3%80%91Mac%20OS%E4%B8%8A%E4%BD%BF%E7%94%A8Hexo%20+%20Github%E6%90%AD%E5%BB%BA%E5%8D%9A%E5%AE%A2%E6%95%99%E7%A8%8B/)中我们利用Hexo和Github搭建了自己的博客，搭建出来的博客地址格式都是：`https://+Github博客仓库名.github.io `

比如我的博客地址就是：`https://happycodersunny.github.io`



是不是觉得不好看，大家的网址都长一样，好像是流水线上生产出来的一样，那么怎么替换成自己的域名显得更个性化呢？

## 购买域名

首先一个普通的域名也不贵，你可以上XX云买一个自己喜欢的域名，我这里以阿里云为例：

<img src="https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220511_02_01.png" alt="20220511_02_01"  />

在购买的时候需要你实名，就按照要求填写相关信息即可，填写之后需要一会的审核时间，一般还是很快的。

如果你实在是不想花钱买域名也可以[在这里]([http://freenom.com](https://link.zhihu.com/?target=http%3A//freenom.com/))免费注册一个域名，具体注册和解析步骤可以参考[知乎文章](https://www.zhihu.com/question/31377141/answer/2266363145)。

## 域名解析

购买域名之后我们还需要对域名进行解析之后才能使用。

![20220511_02_02](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220511_02_02.png)

在这里面添加两条记录如上所示。

记录值`192.30.252.154`和`192.30.252.153`是Github pages官网说的IP地址，写死就行。

## 添加CNAME文件

在`Github`上博客项目里添加`CNAME`文件，这个文件里面指定自己购买的域名，`Github`会根据这个文件里面的域名去自动处理。

![20220511_02_03](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220511_02_03.png)

![20220511_02_04](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220511_02_04.png)



文件名：CNAME

文件内容：购买的域名

这个时候检查博客根目录下的source文件夹下是否有一个CNAME文件，如果还是没有请自行在/source目录下新添加一个CNAME文件，内容跟上面一样还是填写自己购买的域名，保存。

## 修改博客配置文件

打开我们本地博客目录下的`_config.yml`文件：

![20220511_02_05](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220511_02_05.png)

将里面的url替换成我们自己的即可。

执行如下命令：

```bash
hexo clean
hexo g
hexo d
```

再次运行博客：

![20220511_02_06](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202205/20220511_02_06.png)

会发现我们的博客地址就是我们自己购买的地址了。

## 最后

嘻嘻嘻，都看到这里了，不要吝啬你的小星星嘛，为博主点个赞呐～





















