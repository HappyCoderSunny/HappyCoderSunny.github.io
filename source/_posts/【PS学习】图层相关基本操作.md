---
title: 【PS学习】图层相关基本操作
author: Sunny
tags: PS
categories: PS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover71.jpg
abbrlink: c0e79a01
date: 2023-01-10 14:27:21
---

## 写在前面

相关文章：

1、[【PS学习】初识PS界面](!https://codersunny.com/posts/70b04f6f/)

2、[【PS学习】文件基本操作](!https://codersunny.com/posts/52ee9edd/)

3、[【PS学习】色彩基础](!https://codersunny.com/posts/b55c64d0/)

本文主要记录一下图层的一些基本操作，PS版本为【PS2020】。

## 初识图层

### 图层的显示与隐藏

【菜单栏】窗口 - 图层（快捷键**F7**）

如下：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/1.png)

### 改变图层缩略图大小

选择图层 - 右击 - 改变缩略图大小

如下：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/2.png)

{% note green no-icon %}

新建的图层默认是透明的，如何想要给当前图层设置颜色，在选择颜色之后填充即可改变图层的颜色。

**如何填充？**

快捷键：Shift + F5 

如下：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/3.png)

{% endnote %}

### 如何选择多个图层进行编辑

Shift + 需要选择的图层（连续性）

command + 需要选择的图层（非连续性）

### 如何复制一个图层

图层 - 右击 - 复制图层

option + 需要复制的图层 - 拖动

### 修改图层的名称和颜色

图层面板 - 选择图层 - 右键选择颜色（可以用来突出图层）

如下：

![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/7.png)

### 复制图层

1. 选择图层 - 右键 - 复制图层
2. command + J

### 锁定图层

锁定透明像素：锁定之后 画笔工具无法在透明区域进行绘制。

锁定图像像素：锁定之后 无法在该图层上使用画笔工具。

锁定位置：锁定之后 图像的位置就不能移动。

锁定全部：包括锁定透明像素、图像像素、位置等。

如下：

![8](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/8.png)

### 查找图层

根据不同类型去过滤图层 方便快速找到我们需要的图层。

如下：

![9](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/9.png)

### 对齐图层

1. 图层面板选择需要对齐的图层 - 【工具栏】移动工具（V） - 【工具选项栏】选择对齐方式
2. 【菜单栏】图层 - 对齐 - 选择对齐方式

如下：

![10](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/10.png)

### 分布图层

![11](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/11.png)

### 图层的复制/粘贴功能

1. command + C 复制 / command + D 粘贴
2. 拖拽需要复制的图层到另一个图层上
3. 【图层面板】- 选择图层 - 右键复制图层

![18](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/18.png)

### 原位粘贴

command + V - 【菜单栏】编辑 - 选择性粘贴 - 原位粘贴

## 背景图层

### 背景图层和普通图层的区别

1. 背景图层是锁定的，图层右边有一个【锁头】的标志。
2. 背景图层不能改变叠加顺序。
3. 背景图层不能改变不透明度等。

如下：

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/4.png)

### 背景图层转化为普通图层

点击背景图层右边的【锁头】标志。

## 选择/取消选择图层

工具栏 - 选择移动工具（V）- 选择图层进行移动。

{% note green no-icon %}

当两个图层重叠时需要移动下面的图层，需要将【工具选项栏】的【自动选择】取消，在图层面板选择需要移动的图层进行移动。

如下：

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/5.png)

{% endnote %}

## 链接图层

链接图层：两个图层形成一个图层组，操作其中一个图层，另一个图层也会跟着移动。

链接：选中需要链接的图层 点击【链接图层】。

取消链接：选中链接的图层 再次点击【链接图层】。

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/6.png)



## 图层组

如何创建图层组？

1. 选中需要的图层 - 点击【图层面板】创建新组
2. 选中需要的图层 - command + G

{% note green no-icon %}

注意：图层组是可以叠加的。

{% endnote %}

## 图层样式

1. 双击图层空白处 - 图层样式
2. 选择图层 - 【图层面板】添加图层样式 - 混合选项

如下：

![12](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/12.png)

{% note red no-icon %}

**如何复制添加的一些图层样式的效果到其他图层？**

option + 图层样式效果 + 拖到到需要的图层下

如下：

![13](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/13.png)

{% endnote %}

### 缩放图层样式大小

【菜单栏】图层 - 图层样式 - 缩放效果

如下：

![14](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/14.png)

### 将图层样式创建为图层

【菜单栏】图层 - 图层样式 - 创建图层（有几种样式就会转化为几种图层）

如下：

![15](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/15.png)

将图层样式转化为图层之后 我们可以单独对某个图层进行调节 比如色相/饱和度（快捷键：command + U）

![16](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/16.png)

### 图层样式的叠加

![17](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/10/17.png)



{% note green no-icon %}

如果图层样式面板显示的不是所有的效果 可以选择左下角的fx - 显示所有效果

option + 复位：取消本次所有图层样式的所有设置。

{% endnote %}

## 写在最后

关于图层的一些基本操作的笔记记录到这里就结束了，如有错误请多多指教。

















