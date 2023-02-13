---
title: 【iOS重学】一篇文章讲清楚super
author: Sunny
tags:
  - iOS
  - 底层原理
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover82.jpg
abbrlink: d1a1e187
date: 2023-01-30 16:42:21
---

## 写在前面

经常在网上看到`[super xxx]`这种输出什么内容等类似的面试题，本文就主要来详细剖析一下这种`[super xxx]`中`super`调用的底层原理。

## 场景

博主这里用一个常看到的面试题来引出本文的主题：

```objc
// Person类
@interface Person : NSObject

@end
  
@implementation Person

@end

// Student类
@interface Student : Person

@end

@implementation Student

- (instancetype)init {
    if (self = [super init]) {
        [super class];
        NSLog(@"1 - %@",[self class]);
        NSLog(@"2 - %@",[super class]);
        NSLog(@"3 - %@",[self superclass]);
        NSLog(@"4 - %@",[super superclass]);
    }
    return self;
}

@end
```

打印结果如下：

```objc
2023-01-30 16:10:51.753257+0800 SuperDemo[27224:16387952] 1 - Student
2023-01-30 16:10:51.754489+0800 SuperDemo[27224:16387952] 2 - Student
2023-01-30 16:10:51.754682+0800 SuperDemo[27224:16387952] 3 - Person
2023-01-30 16:10:51.754821+0800 SuperDemo[27224:16387952] 4 - Person
```

结果分析：

{% note green no-icon %}

`[super class]` 和 `[self superclass]`打印结果分别为`Student` 和 `Person`毫无疑问。

可能大家比较好奇为什么`[super class]` 和 `[super superclass]` 的打印结果依然是`Student` 和 `Person`。

{% endnote %}

我们这里以`[super class]`为例来看其底层结构：

用命令` xcrun -sdk iphoneos clang -arch arm64 -rewrite-objc -fobjc-arc -fobjc-runtime=ios-10.0.0 Student.m`将Student.m文件转化为c++文件，`[super class]`底层如下：

```c++
((Class (*)(__rw_objc_super *, SEL))(void *)objc_msgSendSuper)((__rw_objc_super){(id)self, (id)class_getSuperclass(objc_getClass("Student"))}, sel_registerName("class"));
```

简化之后为：

```c++
objc_msgSendSuper(__rw_objc_super{
			self,
			class_getSuperclass(objc_getClass("Student"))
},sel_registerName("class"));
```

为了让大家更方便理解，最终结构如下：

```c++
struct __rw_objc_super arg = {
			self,
			class_getSuperclass(objc_getClass("Student"))
};
objc_msgSendSuper(arg,sel_registerName("class"));
```

在源码中我们搜索一下`objc_super`结构体：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/2023/01/30/1.png)

从上面的分析，我们可以看到：`[super class]`中消息接收者还是`self`也就是说还是`Student`，同理`[super superclas]`打印结果还是`Person`。

## 写在最后

关于`super`调用本质的原理我们在这片文章就分析清楚了，如有错误请多多指教。



















































