---
title: 【iOS重学】离屏渲染
author: Sunny
tags: 
 - iOS
 - 离屏渲染
categories: iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover35.jpg
abbrlink: 62e3ee95
date: 2022-08-08 10:56:31
---

## 屏幕显示完整流程

![2022080801](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080801.jpg)

![2022080802](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080802.jpg)

整体渲染流程可以分为三个阶段：

<label style="color:red">1、CPU阶段</label>

CPU的计算主要是通过CoreAnimation来处理，通过OpenGL ES/Metal将数据传递给GPU。

<label style="color:red">2、GPU阶段</label>

GPU渲染主要是将接收到的渲染数据进行一系列渲染之后将帧数据存储在帧缓存（Frame Buffer）里面，供视频控制器调用。

<label style="color:red">3、屏幕显示</label>

视频控制器从帧缓存中获取到帧数据显示在屏幕上。

## 屏幕显示图像原理

### CRT显示器原理

![2022080803](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080803.jpg)

![2022080804](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080804.jpg)

CRT显示器原理主要是通过【电子束】激发屏幕内表面的荧光粉来显示图像，由于荧光粉点亮后很快就会熄灭，所以【电子枪】需要不断的【从上到下】进行扫描，扫描完成后显示器就呈现一帧画面，电子枪回到【初始位置】开始下一次的扫描。

{% note green no-icon %}

**水平同步信号**：当电子枪换行扫描时会发出一个水平同步信号。

**垂直同步信号**：当一帧完成绘制后，电子枪恢复到原来的位置准备扫描下一帧时显示器会发出一个垂直同步信号。

{% endnote %}

GPU渲染完成后将渲染结果存入帧缓存区，视频控制器根据【垂直同步信号】逐帧读取帧缓冲区的数据，经过数据转换之后由显示器进行显示。

### 帧缓存（Frame Buffer）

<label style="color:red">1、屏幕刷新频率</label>

Refresh Rate，单位hz，指的是设备刷新屏幕的频率，这个频率一般是60hz，所以每隔16.67ms屏幕会刷新一次。

<label style="color:red">2、帧率</label>

Frame Rate，单位fps，指的是GPU生成帧的速率。

<label style="color:red">3、帧缓存</label>

也叫显存，它是屏幕所显示画面的一个直接映像，也叫做位映射图（bitmap）或光栅，帧缓存的每一存储单元对应屏幕上一个像素，整个帧缓存对应一帧图像。

{% note green no-icon %}

理想情况下，屏幕刷新频率和帧率完全一致，也就是说当屏幕显示完一帧的时候刚好下一帧画面也生成直接显示在屏幕上，但实际上这两个频率并不完全一致，为了解决这个问题，引入的【帧缓存】的概念。

{% endnote %}

### 图像撕裂

<label style="color:red">**图像撕裂现象：**</label>

![2022080805](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080805.jpg)

<label style="color:red">**原因分析：**</label>

当【帧率】大于【屏幕刷新频率】时，当视频控制器刚读完一帧的上半部分时，GPU已经把下一帧准备好并提交到帧缓存，这样视频控制器就会读到下一帧的下半部分在屏幕显示。

<label style="color:red">**解决方案：**</label>

苹果使用的是【双缓存】和【垂直同步信号】。

{% note green no-icon %}

**垂直同步信号**保证GPU的渲染只有等到显示器发出【垂直同步信号】之后才会进行下一帧的渲染。

**双缓存**保证显示器会交叉读取两个缓存区的内容，相当于是拿空间换时间的一种策略。

好处在于：

1. 不浪费CPU、GPU资源，保证提前渲染好的位图有一个缓存区来保存，这样GPU可以就可以进行下一帧的处理。

2.  减少掉帧的出现。

![2022080806](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080806.jpg)

{% endnote %}

### 卡顿

当显示器的【垂直同步信号】发出的时候，GPU没有完成相应的渲染就会出现【卡顿】的现象，这也是为了解决画面撕裂的问题带来的副作用，如下图所示：

![2022080807](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080807.jpg)

{% note green no-icon %}

**补充**：

1. 掉帧指的是重复渲染同一帧数据而不是指某一帧丢掉了不渲染。
2. 为了减少【掉帧】的情况，有的会引入【三缓存】+【垂直同步信号】，比如安卓设备。

{% endnote %}

## 离屏渲染

### 什么是离屏渲染？

当GPU无法直接把渲染结果存放到帧缓存中，而是先是暂时把中间的一个临时状态存放在另外的区域。之后再存放到帧缓存，这个过程叫离屏渲染。

即是说：GPU需要再当前屏幕缓存区以外开辟一个新的缓冲区进行操作。

{% note green no-icon %}

**原因**：

GPU渲染采用的是【画家算法】，只能一层一层的输出，所以当一层不能直接生成图片的话就需要额外开辟新的缓冲区来存放这些临时图层直到最后生成了一张完整的图片之后再写入帧缓存里面。

如下：

![2022080808](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080808.jpg)

![2022080809](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080809.jpg)

{% endnote %}

### 当前屏幕渲染和离屏渲染

![2022080810](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080810.jpg)



### 离屏渲染的性能损耗

离屏渲染在当前屏幕缓冲区外新开辟一个缓冲区进行渲染操作，造成其性能损耗的主要原因在于：创建离屏渲染和上下文切换。

切换上下文主要是当发生离屏渲染时，渲染上下文需从当前屏幕缓冲区切换到屏幕外缓冲区然后再完成渲染。

如果一屏元素都发生离屏渲染，这个从当前屏幕缓冲区切换到屏幕外的缓冲区就会发生多次，自然就会有一定的性能损耗。

### 常见的离屏渲染场景

#### 设置圆角

![2022080811](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080811.jpg)

<label style="color:red">**结论**：</label>

满足以下条件的就会发生离屏渲染：

1. clipsToBounds开启，圆角 > 0，contents上有内容
2. 同时修改了contents+backgroundColor 或 contents+border（iOS9之后）

<label style="color:red">**优化**：</label>

1. 直接让UI提供带圆角的图片
2. 利用UIBezierPath和CAShapeLayer
3. 利用UIBezierPath和CoreGraphics

#### 设置遮罩

![2022080812](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080812-20220808141811098.jpg)

<label style="color:red">**设置遮罩的流程如下**：</label>

1. 渲染layer的mask纹理
2. 渲染layer的content纹理
3. 合并操作：合并mask 和 content纹理

<label style="color:red">**结论**：</label>

满足以下条件的都会触发离屏渲染：

1. 设置了mask + 任意contents（比如设置UILabel文字、背景颜色、图片等）

#### 设置阴影（shadow）

![2022080813](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080813.jpg)

<label style="color:red">**结论**：</label>

阴影的本质和layer类似，都是在layer下一层多添加一层，根据前面提到的【画家算法】无法一次性生成，所以会发生离屏渲染。

<label style="color:red">**优化**：</label>

1.利用UIBezierPath给视图添加一个阴影路径，相当于提前告诉GPU这个阴影的几何形状，这样阴影就可以独立渲染。

#### 光栅化（shouldRasterize）

![2022080814](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080814.jpg)

<label style="color:red">**光栅化**：</label>

光栅化是一种缓存机制，开启后会缓存这个图片的bitmap，如果对应的layer和sublayers没有发生变化，就可以直接使用缓存而不用GPU再进行渲染，从而提高性能。

**注意：**

光栅化只能缓存100ms，而且只能存储屏幕大小2.5倍的数据，缓存空间十分有限。

#### 组不透明（allowsGroupOpacity）

![2022080815](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220808/2022080815.jpg)

<label style="color:red">**allowsGroupOpacity**：</label>

alpha并不是分别应用到每一层上，而是整个layer图层树完成之后，再统一加上alpha，然后和底下其他像素进行融合。

**注意：**

iOS7之后allowsGroupOpacity默认为YES，这样做的原因是为了保持子视图和父视图保持同样的透明度

<label style="color:red">**allowsGroupOpacity触发离屏渲染的条件**：</label>

1. 当视图上有其他子视图
2. 视图View的alpha值在0 ～ 1之间
3. 视图view.layer.allowsGroupOpacity = YES

## 总结

离屏渲染的处理仅仅是我们日常所关注的性能中的其中一个点，在处理的时候也要根据具体场景具体分析，要注意并不是所有的离屏渲染都是必须要去避免的，开辟额外的帧缓存虽然有一定的性能损耗，但是保存渲染结果并进行最终的视图显示也是为了保持视图的流畅性。