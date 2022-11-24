---
title: 【 iOS重学】class_rw_ext_t结构详解
author: Sunny
tags:
  - iOS
  - 底层原理
  - Runtime
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover43.jpg
abbrlink: 8948fead
date: 2022-11-24 11:04:41
---

## 写在前面

在[iOS重学之窥探Class的结构](https://codersunny.com/posts/b55a18a8/)这篇文章中，我们分析Class的结构时提到了一个结构`class_rw_ext_t`，本文主要就这个结构来展开做个详细的分析，以及苹果为什么要这么做。

## class_rw_ext_t结构

### 简单介绍

在WWDC2020中苹果介绍对类的修改时出现了一个新的结构：`class_rw_ext_t`，这个结构主要是Runtime在内存上做的一些优化而出现的，在苹果源码objc4_781版本开始出现`class_rw_ext_t`，大家也可以对照源码来阅读本文。

### clean memory 和 dirty memory

clean memory：加载后不会再发生变化的内存。

dirty memory：指的是在进程运行时会发生更改的内存。

{% note red no-icon %}

**提示**：

dirty memory会比clean memory更加消耗性能和内存，dirty memory是只要进程在运行，它就必须一直存在，而clean memory可以在内存吃紧的时候移除来节省更多的内存空间，在需要的时候再次从磁盘中进行加载。

{% endnote %}

### class_rw_t 和 class_ro_t

在`class_rw_ext_t`结构之前，整体Class 结构是：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1124/1.png)

从上面的结构我们可以看到Class结构被拆分为两部分：`class_rw_t` 和 `class_ro_t`，这么拆分的原因就是为了保持更多的clean memory，从而节省内存空间，其中`class_rw_t`是dirty memory，而`class_ro_t`就是clean memory。

{% note red no-icon %}

**解释**：

在没有`class_rw_ext_t`结构之前，当一个类被装载到内存中时就会初始化一个`class_rw_t`结构，并将`class_ro_t`结构中`Methods`、`Properties`、`Protocols`数据复制到`class_rw_t`中，我们上面提到过`class_rw_t`属于dirty memory，在程序运行的时候这块内存就必须一直存在，但是大概90%的类并不需要对其中的`Methods`进行修改，所以这部分的内存其实就是属于浪费，于是苹果拆分出来一个新的数据结构：`class_rw_ext_t`。

{% endnote %}

在`class_rw_ext_t`结构之后，整体Class结构是：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1124/2.png)

从上面的结构图看到：苹果尽可能的减少dirty memory的大小来降低内存开销。他把`Methods`、`Properties`、`Protocols`、`Demangled Name`拆分到新的结构`class_rw_ext_t`中，这里的`ext`可以理解为extension（扩展）。

{% note red no-icon %}

**解释**：

在有了`class_rw_ext_t`结构之后，当一个类被装载到内存中时就会初始化一个`class_rw_t`结构，但是并不会把`class_ro_t`中的相关数据完全复制到其中，这样就减少了`class_rw_t`的大小，利用懒加载的机制在确实需要额外的类的信息的时候再去初始化`class_rw_ext_t`结构来存放这些信息。

{% endnote %}

### 验证内存变化

使用命令`heap xxx | egrep 'class_rw|COUNT'`来查看一些进程中`class_rw`类的内存情况，博主这里以微信和Xcode为例来看看：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1124/3.png)

从上图看到：

WeChat中一共有6418个`class_rw_t`类，但是真的需要额外扩展`class_rw_ext_t`的只有474个，这个比例大概是7%，我们大概计算一下节省的内存：(6418 - 474) * 48 = 285312(B)。

Xcode中一共有15674个`class_rw_t`类，但是真的需要额外扩展`class_rw_ext_t`的只有2375个,这个比例大概是15%，节省的内存：（15674 - 2375） * 48 = 638352(B)。

对dirty memory而言，这是真正节省的内存，所以这个优化还是很可观的。

### 查找方法的变化

在`class_rw_ext_t`结构之前，runtime是直接遍历`class_rw_t`中的方法列表来查找方法，具体如下图：

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1124/4.png)

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1124/5.png)

在`class_rw_ext_t`结构之后，runtime查找方法的方式如下图：

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1124/6.png)

![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1124/7.png)

## 写在最后

关于`class_rw_ext_t`结构的分析和好处我们就分析到这里了，如果有什么不对的地方望指教。











































