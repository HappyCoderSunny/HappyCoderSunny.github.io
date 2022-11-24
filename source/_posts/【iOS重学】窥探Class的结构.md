---
title: 【iOS重学】窥探Class的结构
author: Sunny
tags:
  - iOS
  - 底层原理
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover53.jpg
abbrlink: b55a18a8
date: 2022-11-23 16:04:33
---

## 写在前面

本文主要探究`Class`的内部结构，博主这里使用的objc4的源码版本是`objc4-838`，建议大家在看的时候可以下载最新源码。

## Class的结构

在前面关于[isa和superclass](https://codersunny.com/posts/9efafc5a/)文章中，我们提到了类对象和元类对象的类型都是`Class`，内存里面保存的是：

. isa指针

. superclass指针

. 属性信息

. 对象方法信息

. 协议信息

. 成员变量信息

今天我们就来剖析一下`Class`的内部结构，验证一下是不是存放的这些信息，废话不多说了，我们现在就开始吧。

`Class`是个`objc_class`类型的结构体，如下：

```objc
typedef struct objc_class *Class;
```

在`objc4`源码`objc-runtime-new.h`文件中，对`objc_class`定义如下：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1123/1.png)

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1123/2.png)

因为`objc_class`结构体中数据太多，我这里提炼出来对我们分析结构有用的数据，如下：

```objc
struct objc_class : objc_object {
  Class isa; // isa
  Class superclass; // superclass
  cache_t cache; // 方法缓存
  class_data_bits_t bits; // 具体的类信息
}
```

`class_data_bits_t`结构如下：

```objc
struct class_data_bits_t {
  class_rw_t *data() const {
        return (class_rw_t *)(bits & FAST_DATA_MASK);
    }
}
```

`class_rw_t`结构中，`rw`一般表示readwrite（可读可写），`t`一般表示table,结构信息如下：

```objc
struct class_rw_t {
  uint32_t flags;
  uint16_t witness;
  Class firstSubclass;
  Class nextSiblingClass;
}
//  所有的类会链接成一个树状结构 利用firstSubclass 和 nextSiblingClass来实现的。
```

`class_rw_ext_t`结构信息如下：

```objc
struct class_rw_ext_t {
  class_ro_t_authed_ptr<const class_ro_t> ro;
  method_array_t methods; // 方法列表
  property_array_t properties; // 属性列表
  protocol_array_t protocols; // 协议列表
  char *demangledName;
  uint32_t version;
};
```

{% note red no-icon %}

**提醒**：

在WWDC2020中，苹果修改了一些底层的类，其中一个就是我们上面介绍的`class_rw_ext_t`，至于这个类主要作用是什么大家有兴趣的可以去详细了解一下，博主这里就不展开来讲这个了，大概的意思就是：它利用了懒加载的机制，在类的`methods`、`properties`等发生变化的时候，才会初始化`class_rw_ext_t`来存储这些列表，这样就可以减少90%以前Runtime中的类在`rw`中直接复制`ro`中数据浪费的内存。

{% endnote %}

`class_ro_t`结构中，`ro`一般表示readonly（只读），`t`一般表示table，结构信息如下：

```objc
struct class_ro_t {
  uint32_t flags;
  uint32_t instanceStart;
  uint32_t instanceSize; // instance对象占用的内存空间大小
  
  explicit_atomic<const char *> name; // 类名
  // 方法列表（不包括分类的方法列表）
  WrappedPtr<method_list_t, method_list_t::Ptrauth> baseMethods;
  protocol_list_t * baseProtocols; // 协议信息列表
  const ivar_list_t * ivars; // 成员变量列表
  property_list_t *baseProperties; // 属性信息列表
}
```

用一张图来表示Class结构：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1123/3.png)

从上面的结构分析我们可以看到：class对象或meta-class对象里面确实保存了**方法列表、属性列表、协议列表、成员变量列表**等信息。

## 写在最后

关于`Class`结构信息我们就分析到这里了，如果有什么不对的地方望指教。































