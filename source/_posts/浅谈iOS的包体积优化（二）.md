---
title: 浅谈iOS的包体积优化（二）
author: Sunny
tags:
  - iOS
  - 优化
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover28.jpg
abbrlink: a2dbd15f
date: 2022-11-04 19:30:58
---

## LinkMap分析可执行文件

### LinkMap结构分析

#### 基础信息

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/1.png)

#### 类表

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/2.png)

{% note green no-icon %}

里面保存的是所有用到的类生成的.o文件，也包括用到的dylib库。[num]指的是序号，类是按照顺序保存的，后续可以通过序号查到具体对应的哪个类。

{% endnote %}

#### 段表

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/3.png)

{% note green no-icon %}

段表里面描述了不同功能的数据保存地址，通过这个地址可以查到对应内存里面存储的是什么数据。

第一列：起始地址

第二列：段占用的大小

第三列：段类型

第四列：段名称

每一行初始地址 = 上一行处始地址 + 占用大小

{% endnote %}

__TEXT：代码段

__DATA：数据段

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/4.png)

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/5.png)

#### 后续符号表内容

**代码节**

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/6.png)

{% note green no-icon %}

第一列：起始地址 通过这个地址可以查上面的段表

第二列：方法占用的大小 通过这个可以计算出方法占用的大小

第三列：归属的类

通过这部分我们可以分析出每个类对应的方法的大小。

{% endnote %}

**方法名节**

![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/7.png)

{% note green no-icon %}

这部分保存的是：类中方法的字符串信息

{% endnote %}

**如何分析**

查看第一列初始位置 比如`0x1016FF830` 然后看这个地址在【段表】中的哪个节里面 我们这里看到是在`__objc_methodname`里面。

### 分析LinkMap的工具

[LinkMap分析工具](https://github.com/jayden320/LinkMap)

![8](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/8.png)

## __TEXT代码段迁移方案

### Mach-O文件格式简介

可执行文件中`Data`部分主要是以`Segment（段）`和`Section（节）`的方式来组织内容，使用命令`xcrun size -lm`可执行文件路径 来详细查看`Data`部分的结构和`Segment/Section`的大小信息。

![9](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/9.png)

`Data`有四个`Segment`：`__PAGEZERO`、`__TEXT`、`__DATA`、`__LINKEDIT`，除了`__PAGEZERO`、`__LINKEDIT`，每个段中有多个`Section`。

`__PAGEZERO`：大小是4G，指的是可执行文件装载进内存后，`__PAGEZERO`在内存中的大小，主要是用来捕捉`NULL`指针的引用。`__PAGEZERO`在可执行文件中并不占用`Data`部分的空间。

`__TEXT`、`__DATA`：用于保存程序的代码指令和数据。

`__LINKEDIT`：包含App启动需要的信息，比如代码签名符号表等。

### __TEXT段迁移的原理

程序的过程主要有：预处理 - 编译 - 汇编 - 链接 四个主要阶段，完成之后就可以得到Mach-O可执行文件。

{% note green no-icon %}

苹果要求：

iOS7 之前，二进制文件中所有的__TEXT段总和不得超过80MB

iOS7.x - iOS 8.x，二进制文件中，每个特定架构中的__TEXT段不得超过60MB

iOS9 之后，二进制文件中所有的__TEXT段总和不得超过500MB

{% endnote %}

苹果只会扫描`__TEXT`段，所以我们的想法是迁移`__TEXT`段就可以避免上面的问题，这个方案在国内很大大型APP上其实也是比较常见的。

### 迁移__TEXT会减少下载大小的原理

苹果会对APP中的可执行文件进行DRM加密，然后将APP压缩成ipa文件再发布到App Store，加密对可执行文件大小本身影响比较小，它影响的是可执行文件的压缩效率，导致压缩后的ipa大小增加也就是下载大小增大。

使用命令【otool -l 可执行文件路径】来查看可执行文件是否被加密过：

![10](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/10.png)

苹果只会对可执行文件中的`__TEXT`段加密，而不会对其他段加密。所以我们可以想到如果可以把`__TEXT`段中的节移到其它段，就能减少苹果的加密范围，从而使压缩效率提升减少下载大小。

{% note orange no-icon %}

**一般来说**：

APP中可执行文件占80%的大小，加密内容占可执行文件大小的70%，加密会影响60%的压缩率，因此移走该加密部分可以提升34%的下载大小。

`__TEXT`段迁移方案只适用于iOS13以下的设备，苹果本身已经对iOS13以上的设备做了进一步的优化。

{% endnote %}

### 迁移__TEXT段具体方案

通过命令`man ld`可以查看链接器参数，如下：

![11](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/11.png)

![12](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/12.png)

`-rename _section`：`orgSegment/orgSection`的名称修改为`newSegment/newSection`

`-segprot`：为`Segment`添加读、写、可执行权限等

在 `Xcode - Build Settings - Other Linker Flags`中添加如下参数：

{% note green no-icon %}

`-Wl,-rename_section,__TEXT,__stubs,__TT_TEXT,__stubs`

`-Wl,-rename_section,__TEXT,__text,__TT_TEXT,__text`

`-Wl,-rename_section,__TEXT,__const,__RODATA,__const`

`-Wl,-rename_section,__TEXT,__gcc_except_tab,__RODATA,__gcc_except_tab`

`-Wl,-rename_section,__TEXT,__objc_methtype,__RODATA,__objc_methtype`

`-Wl,-rename_section,__TEXT,__objc_classname,__RODATA,__objc_classname`

`-Wl,-rename_section,__TEXT,__objc_methname,__RODATA,__objc_methname`

`-Wl,-rename_section,__TEXT,__cstring,__RODATA,__cstring`

`-Wl,-segprot,__TT_TEXT,rx,rx`

**注意**：以上添加的参数是博主针对自己的项目做的一些添加 各位一定要根据自己项目的实际情况去做相应的添加。

{% endnote %}

**解释**：

-Wl 是告诉Xcode 后面的参数是添加给链接器ld的，这些参数在链接阶段生效。

第一行参数：创建一个新的`__TT_TEXT`段，并把`__TEXT`,`__text`移动到`__TT_TEXT`,`__text`。

第一行参数：创建一个新的`__TT_TEXT`段，并把`__TEXT`,`__text`移动到`__TT_TEXT`,`__text`。

第二行参数：给`__TT_TEXT`段添加可读和可执行权限。

使用命令`xcrun size -lm 可执行文件路径`可以查看可执行文件的Data内容，如下：

![13](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1104/13.png)

通过上面的截图我们会发现：`Data`里面会多了我们创建的`__TT_TEXT`和`__RODATA`两个`Segment`,原本的`__TEXT`和`__DATA`的大小也会发生变化，至此，关于`__TEXT`段具体如何迁移我们就简单的了解到这里了，本文也只是博主的一个学习笔记，如各位看官发现有任何问题请指正 在此感激不尽。

