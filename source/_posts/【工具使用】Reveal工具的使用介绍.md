---
title: 【工具使用】Reveal工具的使用介绍
author: Sunny
tags:
  - iOS
  - 逆向
  - 工具使用
categories:
  - 工具使用
cover: https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover72.jpg
abbrlink: 745be31f
date: 2022-12-26 20:02:46
---

## 写在前面

有时候我们可能想要分析其他APP的一些整体View结构，就像在Xcode分析我们自己的APP一样能够清楚看到个层级结构，Reveal这个APP主要就是这个功能：用来分析APP的层级结构。

## Reveal

Reveal APP 官网：https://revealapp.com/

Reveal APP下载地址：https://revealapp.com/download/

这个是官网正版，可以免费试用14天。

## Reveal的基本使用

+ 打开Reveal，菜单栏Help - Show Reveal Framework in Finder

  ![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1226/1.png)

### 真机下的配置

+ 找到RevealServer.framework - ios-arm64 - RevealServer.framework

  ![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1226/2.png)

+ 打开iFunBox - 将RevealServer.framework复制到iFunBox中 Library/Frameworks中

  ![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1226/3.png)

+ 在手机Cydia中搜索Reveal2Loader进行安装

  ![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1226/4.png)

+ 手机设置 - Reveal - Enabled Applications - 选择允许Reveal访问的APP

  ![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1226/5.png)

+ 在手机终端执行 - killall SpringBoard

  ![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1226/6.png)

### 模拟器下的配置

+ 找到RevealServer.framework - ios-arm64_x86_64-simulator - RevealServer.framework

  ![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1226/7.png)

+ 在Xcode配置中导入RevealServer.framework

  ![8](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1226/8.png)

### Reveal的使用

通过上面的介绍配置完成之后，我们就可以正式使用Reveal了。

打开手机上的某个APP - 打开Reveal - 会在Reveal看到我们刚打开的APP 如下：

![9](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1226/9.png)

上面一个是通过网络连接、一个是通过USB连接，我们选择更快的USB连接即可使用Reveal。

## 写在最后

关于Reveal使用前的配置就简单介绍到这里啦，如有错误请多多指教。

























