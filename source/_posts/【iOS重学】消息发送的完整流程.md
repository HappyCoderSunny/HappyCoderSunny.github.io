---
title: 【iOS重学】消息发送的完整流程
author: Sunny
tags: iOS
categories: iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover7.jpg
abbrlink: 4a47f2ea
date: 2022-06-04 17:50:29
---

## 写在前面

​	在OC里面，调用对象的某个方法其实就是给这个对象发送一个消息，这个过程我们把它分为三大阶段，分别为：消息发送阶段、动态解析阶段、消息转发阶段，本文将细细剖析这三个阶段，但是在剖析这三大阶段之前我们需要先回顾一下Class的结构。

## Class结构

苹果源码最新下载地址请点击：[苹果源码](https://opensource.apple.com/tarballs/objc4/)
在`objc-runtime-new.h`中可以看到`objc_class`结构如下： 

```objc
struct objc_object {
    Class isa;
};

struct objc_class : objc_object {
      Class superclass; 
      cache_t cache;  // 方法缓存
      class_data_bits_t bits; // 获取具体类信息
    ...... 
};
```

从上面的结构我们可以看到有一个类`cache_t`，这个类就是专门拿来做方法缓存相关的类，结构如下：

```objc
struct cache_t {
    struct bucket_t *buckets();
    uint16_t _occupied();
    mask_t _maybeMask;
};

struct bucket_t {
    SEL _sel;
    IMP _imp;
};
```

`class_data_bits_t`用于获取具体的类信息，结构如下：

```c++
#define FAST_DATA_MASK          0x00007ffffffffff8UL
struct class_data_bits_t {
    uintptr_t bits;
public:
    class_rw_t* data() {
        return (class_rw_t *)(bits & FAST_DATA_MASK);
    }
};

// readWrite：可读可写
struct class_rw_t {
    uint32_t flags;
    uint32_t witness;
  	Class firstSubclass;
    Class nextSiblingClass;
    class_rw_ext_t *ext;
    const class_ro_t *ro;
};

struct class_rw_ext_t {
  class_ro_t *ro;
  method_array_t methods;// 方法列表
  property_array_t properties; // 属性列表
  protocol_array_t protocols; // 协议列表
  char *demangledName;
   uint32_t version;
}

// readOnly:只读
struct class_ro_t {
    uint32_t flags;
    uint32_t instanceStart;
    uint32_t instanceSize; 
#ifdef __LP64__
    uint32_t reserved;
#endif
    const uint8_t * ivarLayout;
    const char * name;  // 类名
    method_list_t * baseMethodList;
    protocol_list_t * baseProtocols;
    const ivar_list_t * ivars;  // 成员变量列表
    const uint8_t * weakIvarLayout;
    property_list_t *baseProperties;
};
```

分析到这里，Class结构我们已了解清楚，接下来就是调用对象的方法来研究一下消息发送的完整流程。

## 消息发送阶段

在OC里面，调用对象的某个方法就是给这个对象发送一条消息，这里我们新建一个Person类，以[person personRun]为例来看看消息发送阶段的流程。

在[【iOS重学】方法缓存cache_t的分析](https://codersunny.com/posts/39324100/)这篇文章中我们主要分析了方法缓存，建议大家先看一下缓存可以帮助我们理解接下来的流程。

我们知道OC中的方法调用其实就是转成`objc_msgSend()`函数的调用（load方法除外），如下：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220604/1.png)

```c++
// 消息发送阶段源码跟读顺序
1. objc-msg-arm64 汇编文件
	ENTRY _objc_msgSend
	b.le LNilOrTagged
	CacheLookup NORMAL, _objc_msgSend, __objc_msgSend_uncached
	.macro CacheLookup
	CacheHit // 命中缓存
	MissLabelDynamic // 其实就是__objc_msgSend_uncached
	STATIC_ENTRY __objc_msgSend_uncached
	MethodTableLookup
	.macro MethodTableLookup
	bl _lookupImpOrForward

2. objc-runtime-new.mm 文件
	lookupImpOrForward
	getMethodNoSuper_nolock(curClass, sel)
	curClass = curClass->getSuperclass()
	cache_getImp(curClass, sel) // 从父类缓存里面查找
	log_and_fill_cache // 缓存方法到消息接收者这个类
```

消息发送的流程图如下：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220604/2.png)

> **我们来验证一下是否真的缓存了调用的方法：**
>
> 未调用personRun时，我们查一下在Person类的cache里面是否能找到personRun方法缓存：
>
> ```objc
>   Person *person = [[Person alloc] init];
>   mj_objc_class *personClass = (__bridge  mj_objc_class *)[Person class];
>   NSLog(@"%@ %p",NSStringFromSelector(@selector(personRun)), personClass->cache.imp(@selector(personRun)));
> ```
>
> 打印结果如下：
>
> ```objc
> 2022-04-10 13:11:30.367394+0800 RuntimeDemo[88049:12459843] personRun 0x0
> ```
>
> **结果分析**：在cache并没有找到personRun的IMP。
>
>  
>
> 调用personRun之后，我们查一下Person类的cache里面是否能找到personRun方法缓存：
>
> ```objc
>  Person *person = [[Person alloc] init];
>  [person personRun];
>  mj_objc_class *personClass = (__bridge  mj_objc_class *)[Person class];
>  NSLog(@"%@ %p",NSStringFromSelector(@selector(personRun)), personClass->cache.imp(@selector(personRun)));
> ```
> 打印结果如下：
> ```objc
> 2022-04-10 13:13:30.294687+0800 RuntimeDemo[88074:12461806] personRun 0x78cc0
> ```
> **结果分析**：调用personRun之后，会把personRun缓存到方法缓存里面

## 动态方法解析阶段

当第一阶段【消息发送阶段】没有找到方法实现就会进入第二阶段【动态方法解析阶段】。

```c++
// 动态方法解析阶段源码跟读顺序
1. objc-runtime-new.mm 文件
  resolveMethod_locked
  resolveInstanceMethod 或 resolveClassMethod
  lookupImpOrNilTryCache
  _lookupImpTryCache
  lookupImpOrForward
```

动态方法解析的流程图如下：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220604/3.png)

### 动态方法解析流程

根据```+ (BOOL)resolveInstanceMethod:(SEL)sel （实例方法调用这个）``` 或```+ (BOOL)resolveClassMethod:(SEL)sel(类方法调用这个)```来做动态方法解析，然后重新走一遍消息发送的流程（从消息接受者的方法缓存里面开始继续往下执行）。

### 动态方法解析代码

```objc
- (void)otherRun {
  NSLog(@"%s",__func__);
}

+ (BOOL)resolveInstanceMethod:(SEL)sel {
    if (sel == @selector(personRun)) {
        Method otherMethod = class_getInstanceMethod(self, @selector(otherRun));
        IMP imp = class_getMethodImplementation(self, @selector(otherRun));
        class_addMethod(self, sel, method_getImplementation(otherMethod), method_getTypeEncoding(otherMethod));
        return  YES;
    }
    return [super resolveInstanceMethod:sel];
}
```

## 消息转发阶段

如果前面的两个阶段都没有实现，就会继续进入【消息转发】的流程。

```c++
// 消息转发阶段的源码跟读顺序
1. objc-msg-arm64 汇编文件
  forward_imp = _objc_msgForward_impcache
  STATIC_ENTRY __objc_msgForward_impcache
  b __objc_msgForward
  ENTRY __objc_msgForward
  ENTRY __objc_msgForward_stret
  __objc_forward_stret_handler
2. objc-runtime-new.mm 文件
  void *_objc_forward_stret_handler = (void *)objc_defaultForwardStretHandler;
3. CoreFoundation 框架
  __forwarding__ // 不开源
```

消息转发的流程图如下：

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220604/4.png)

### 消息转发流程

消息转发流程也分为了两步:

第一步：```forwardingTargetForSelector：```方法是指把响应这个方法的对象转发给其他的对象，那么消息接受者就发生了变化，会重新调用一遍```objc_MsgSend(消息接受者，SEL)```流程。
第二步：```forwardingTargetForSelector:``` 方法返回为```nil```，继续检查```methodSignatureForSelector：```是否返回了一个方法签名，然后去执行```forwardInvocation:```方法。

### 消息转发流程相关代码实现

#### 1. 实例方法流程

```objc
//第一步
- (id)forwardingTargetForSelector:(SEL)aSelector {
    if (aSelector == @selector(personRun)) {
        return [[Student alloc] init]; // 这里返回的是你想把这个消息转发给哪个对象
    }
    return [super forwardingTargetForSelector:aSelector];
}

// 第二步
- (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector {
    if (aSelector == @selector(personRun)) {
        // ⚠️：这里的方法签名的types不能随便写 因为这里的方法签名决定了下一步的NSInvocation的返回值、参数类型等
        return [NSMethodSignature signatureWithObjCTypes:"i@:i"];
    }
    return [super methodSignatureForSelector:aSelector];
}
- (void)forwardInvocation:(NSInvocation *)anInvocation {
     [anInvocation invokeWithTarget:[Student new]];
  // 在这个方法里可以做任何我们想做的事情
}

- (void)doesNotRecognizeSelector:(SEL)aSelector {
    NSLog(@"%s",__func__);
}
```

#### 2. 类方法流程

```objc
// 第一步
+ (id)forwardingTargetForSelector:(SEL)aSelector {
    if (aSelector == @selector(personTest)) {
        return [Student class];
    }
    return [super forwardingTargetForSelector:aSelector];
}

// 第二步
+ (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector {
    if (aSelector == @selector(personTest)) {
        return [Student methodSignatureForSelector:aSelector];
    }
    return [super methodSignatureForSelector:aSelector];
}
+ (void)forwardInvocation:(NSInvocation *)anInvocation {
    [anInvocation invokeWithTarget:[Student class]];
}

+ (void)doesNotRecognizeSelector:(SEL)aSelector {
    NSLog(@"%s",__func__);
}
```

### 关于```NSInvocation```类

```objc
@interface NSInvocation : NSObject

+ (NSInvocation *)invocationWithMethodSignature:(NSMethodSignature *)sig;
// 方法签名
@property (readonly, retain) NSMethodSignature *methodSignature;

// retain所有参数 防止参数被dealloc
- (void)retainArguments;
// 参数是否都被retained
@property (readonly) BOOL argumentsRetained;
// 消息接收者
@property (nullable, assign) id target;
// 方法名
@property SEL selector;

// 获取返回值
- (void)getReturnValue:(void *)retLoc;
// 设置返回值
- (void)setReturnValue:(void *)retLoc;
// 获取idx的参数
- (void)getArgument:(void *)argumentLocation atIndex:(NSInteger)idx;
// 设置idx的参数
- (void)setArgument:(void *)argumentLocation atIndex:(NSInteger)idx;
// 调用
- (void)invoke;
- (void)invokeWithTarget:(id)target;

@end
```

大家有兴趣的话可以去试试NSInvacation的使用。

## 最后

如果按照上面的三大流程都走完之后依然没有找到相应的方法实现，那这个调用最后就会调用```doesNotRecognizeSelecto:```抛出异常。

