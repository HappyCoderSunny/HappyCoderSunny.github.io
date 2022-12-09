---
title: 【iOS逆向】Cycript的基本使用
author: Sunny
tags:
  - iOS
  - 逆向
categories:
  - 逆向
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover57.jpg
abbrlink: 7495500c
date: 2022-12-10 18:20:54
---

## 写在前面

本文主要是介绍一下逆向中Cycript的基本用法。

## 简单介绍

Cycript是OC、C++、JS、Java等多种语法的一个混合物，它是用来探索、修改、调试当前正在运行的APP，这个在我们以后逆向的过程中会经常使用到，关于Cycript的更多介绍大家可以参考[Cycript官网](!http://www.cycript.org/)。

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/1.png)

## 安装Cycript

在Cydia里面搜索Cycript进行下载，如下：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/2.png)

## Cycript的开启和关闭

1、开启

+ 保持Mac和iPhone的安全连接
+ 使用命令`cycript -p 进程ID`或`cycript -p 进程名称`

{% note green no-icon %}

如果不太了解Mac和iPhone怎么保持连接的，可以参考博主的另一篇文章：[【iOS逆向】如何让Mac和iPhone建立安全连接](!https://codersunny.com/posts/7df93f3b/)。

{% endnote %}

如下：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/3.png)

这样我们就处于一个Cycript的语法环境。

2、关闭

快捷键：`control + D`

3、清屏

快捷键：`command + R`

## 查看进程的ID和名称

在以后逆向中，我们需要使用`cycript -p 进程ID`或`cycript -p 进程名称`来探究某个APP，那么这个进程ID和进程名称我们应该从哪里获取呢。

1、在Cydia中搜索`adv_cmds`并安装

2、使用`ps`相关命令查看

{% note pink no-icon %}

列出所有进程：`ps -A`

根据关键词显示某些进程：`ps -A|grep 关键词`

{% endnote %}

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/4.png)

我们这里以【喜马拉雅】APP为例：7091就是进程ID，ting就是进程名称，由于进程ID可能随时会发生变化，建议以后使用进程名称。

{% note pink no-icon %}

**注意**：要想或者某个APP的进程名称、ID，必须要打开这个APP。

{% endnote %}

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/5.png)

这样我们就可以监听这个进程了。

## Cycript中常用的语法

+ 获取当前进程的Application

```objc
[UIApplication sharedApplication] 或 UIApp
```

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/6.png)

+ 定义变量

```objc
var 变量名 = 变量值
```

![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/7.png)

这样在当前内存环境下，只要我们输入`app`就可以获取window。

+ 获取当前APP的RootViewController

```objc
UIApp.keyWindow.rootViewController
```

![8](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/8.png)

































