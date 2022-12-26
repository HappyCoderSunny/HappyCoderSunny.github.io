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

## Cycript的基本使用

### Cycript的开启和关闭

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

### 查看进程的ID和名称

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

### Cycript中常用的语法

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

+ 根据内存地址获取对象

```objc
#内存地址
```

![9](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/9.png)

+ 查看对象的所有成员变量

```objc
*对象
或
*#对象的内存地址
```

![10](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/10.png)

+ 递归打印view的所有子控件

```objc
UIApp.keyWindow.recursiveDescription().toString()
```

![11](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/11.png)

+ 筛选中某种类型的对象

```objc
choose(UIViewController)
```

![12](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/12.png)

{% note green no-icon %}

这里打印的是当前在内存里面的VC，没有被创建的VC是不会被打印出来的。

{% endnote %}

### 封装Cycript文件

一般我们会把一些常用的cycript语法封装在.cy文件中，使用起来会方便很多，具体步骤如下：

+ 封装好.cy文件
+ 复制.cy文件到iFunBox的目录`usr/lib/cycript0.9`里面
+ 关掉当前进程 重新进入：cycript -p 进程名称
+ 导入该文件：@import cy文件

### MJCycript文件

大佬已经把一些常用的、实用的相关函数给封装好了，大家可以去下载[Github](https://github.com/CoderMJLee/mjcript)。

按照我们上面讲的方式导入就可以使用：

![13](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/13.png)

现在我们来看一下例子：如何创建一个View并把它添加到APP上。

![14](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1210/14.png)

## 写在最后

关于Cycript的简单介绍我们就分享到这里了，如有错误请多多指教。