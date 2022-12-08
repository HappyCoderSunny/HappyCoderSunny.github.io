---
title: 【iOS重学】Block底层原理（二）
author: Sunny
tags:
  - iOS
  - 底层原理
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover70.jpg
abbrlink: 57c4c4a9
date: 2022-12-08 13:46:59
---

## 写在前面

在上一篇文章[【iOS重学】Block底层原理（一）](https://codersunny.com/posts/67d22871/)中我们主要讲了Block的基本使用、底层原理、对变量的捕获机制以及Block的几种类型，本文是第二篇，主要内容包含：

+ `__block`修饰符的基本使用
+ `__block`修饰的变量在Block内部的底层结构
+ `__block`的内存管理
+ 循环引用

## __Block的基本使用

如果想在Block内部修改auto变量的值，我们一般是无法直接修改的，会报如下错误：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/1.png)

`__block`修饰符就是用来解决Block内部无法修改auto变量值的问题。

{% note green no-icon %}

`__block`不能用来修饰全局变量、static变量。

{% endnote %}

## __block修饰的变量底层结构探究

```objc
__block int age = 10;
void(^Block)(void) = ^{
    NSLog(@"age is %d",age);
};
Block();
```

如上，使用`__block`修饰的变量在Block内部之后的底层结构是什么样的呢？跟之前对比有什么不一样。

不使用`__block`修饰符，Block底层结构如下：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/2.png)

使用`__block`修饰符，Block底层结构如下：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/3.png)

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/4.png)

我们发现底层结构确实发生了变化：被`__block`修饰的变量会被包装成一个`__Block_byref_age_0`的对象，这个对象的结构里面有个`int age`，具体如下：

```c++
struct __Block_byref_age_0 {
  void *__isa;
  __Block_byref_age_0 *__forwarding; // 是指向自己的一个指针
  int __flags;
  int __size;
  int age;
};
```

{% note orange no-icon %}

**问题**：

```objc
NSMutableArray *tempArr = [NSMutableArray array];
void(^Block)(void) =  ^(){
  [tempArr addObject:@"1"];
};
Block();
```

以上代码结果是否会报错？

不会，`[tempArr addObject:@"1"]`只是在使用`tempArr`指针并没有修改`tempArr`。

{% endnote %}

```objc
__block int age = 10;
NSLog(@"1---%p",&age);
void(^Block)(void) = ^{
    NSLog(@"age is %d",age);
    NSLog(@"2---%p",&age);
};
Block();
NSLog(@"3---%p",&age);
```

我们打印`age`的地址看一下:

```objc
2022-12-08 14:34:52.006645+0800 BlockDemo[8781:6613854] 1---0x7ff7bfeff2d8
2022-12-08 14:34:52.007272+0800 BlockDemo[8781:6613854] age is 10
2022-12-08 14:34:52.007357+0800 BlockDemo[8781:6613854] 2---0x100b478a8
2022-12-08 14:34:52.007395+0800 BlockDemo[8781:6613854] 3---0x100b478a8
```

从打印结果我们看到1和2、3的age的地址值不一样，我们可以根据上面的底层结构探索来解释一下为什么？

```c++
struct __Block_byref_age_0 {
 void *__isa;
 struct __Block_byref_age_0 *__forwarding;
 int __flags;
 int __size;
 int age;
};

struct __block_impl {
  void *isa;
  int Flags;
  int Reserved;
  void *FuncPtr;
};

struct __main_block_desc_0 {
  size_t reserved;
  size_t Block_size;
};

struct __main_block_impl_0 {
  struct __block_impl impl;
  struct __main_block_desc_0* Desc;
  struct __Block_byref_age_0 *age;
};

__block int age = 10;
NSLog(@"1---%p",&age);
void(^Block)(void) = ^{
    NSLog(@"age is %d",age);
    NSLog(@"2---%p",&age);
};

struct __main_block_impl_0 *implBlock = (__bridge struct __main_block_impl_0  *)Block;
```

我们把Block转为`__main_block_impl_0`的结构体来分析一下：

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/5.png)

Block内部的`__Block_byref_age_0`结构体地址值是：`0x100e1c7e0`，而我们打印age的地址值是：`0x100e1c7f8`，两个不一样，说明打印的age的地址值不是`__Block_byref_age_0`结构体age的值，接着往下分析：

```c++
// 地址值：0x100e1c7e0
struct __Block_byref_age_0 {
 void *__isa; // 8byte __isa地址值：0x100e1c7e0
 struct __Block_byref_age_0 *__forwarding; // 8byte __forwarding地址值：0x100e1c7e8
 int __flags;// 4byte __flags地址值：0x100e1c7d2
 int __size; // 4byte __size地址值：0x100e1c7d6
 int age;// 4byte age地址值：0x100e1c7d8
};
```

通过上面的分析我们看到：我们打印的age的地址值其实是`__Block_byref_age_0`结构体中age的地址值。

## __block的内存管理

在上面我们分析的是基本数据类型用`__block`来修饰，我们接下来看一下更复杂的情况：`__block`用来修饰对象类型。

```objc
__block NSObject *object = [[NSObject alloc] init];
void(^Block)(void) = ^{
    NSLog(@"object is %@",object);
};
Block();
```

底层结构如下：

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/6.png)

这里有两点值得我们注意一下：

1的位置多了两个函数`copy`和`dispose`，这点我们在上一篇文章讲到过因为Block捕获的变量是对象类型，所以会有这两个函数，这里我们就不赘述了，除此之外我们发现`__Block_byref_object_0`这个结构体里面也多了两个函数：`__Block_byref_id_object_copy`和`__Block_byref_id_object_dispose`，里面具体实现如下：

```c++
static void __Block_byref_id_object_copy_131(void *dst, void *src) {
 _Block_object_assign((char*)dst + 40, *(void * *) ((char*)src + 40), 131);
}
static void __Block_byref_id_object_dispose_131(void *src) {
 _Block_object_dispose(*(void * *) ((char*)src + 40), 131);
}
```

内部也是调用的`_Block_object_assign`和`_Block_object_dispose`，和我们之前讲的是一样的。

并且我们看到`__Block_byref_object_0`结构体里面会对`object`这个对象有一个强引用。

下面我们来总结一下：

1、当Block在栈上时，并不会对`__block`修饰的变量产生强引用。

2、当Block被copy到堆上时，会调用Block内部的`copy`函数，`copy`函数内部会调用`__Block_object_assign`函数，`__Block_object_assign`函数会对`__block`修饰的变量形成强引用。

![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/7.png)

![8](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/8.png)

3、当Block从堆中移除时，会调用Block内部的`dispose`函数，`dispose`函数内部会调用`__Block_object_dispose`函数，`__Block_object_dispose`会对`__block`修饰的变量进行一次release操作。

![9](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/9.png)



![10](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/10.png)

## Block的循环引用

```objc
// Person 类
@interface Person : NSObject

@property (nonatomic, assign) int age;
@property (nonatomic, copy) void(^PersonBlock)(void);

@end

@implementation Person

- (void)dealloc {
    NSLog(@"%s",__func__);
}

@end

// main函数
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        Person *person = [[Person alloc] init];
        person.age = 10;
        person.PersonBlock = ^{
            NSLog(@"person's age is %d",person.age);
        };
        person.PersonBlock();
    }
    NSLog(@"--------");
    return 0;
}
```

打印结果：

```objc
2022-12-08 16:07:45.878556+0800 BlockDemo[9541:6681377] person's age is 10
2022-12-08 16:07:45.879146+0800 BlockDemo[9541:6681377] --------
```

发现`person`对象并没有被释放还存在内存里面，这就是我们常说的循环引用（内存泄漏）。

下图表示了上面对象之间的持有关系：

![11](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/11.png)

如何解决循环引用？

其实就是把2和3其中一个变成弱引用即可，那么到底2和3谁变成弱引用更合适呢，3是`Person`对象有一个`PersonBlock`这个属性，我们希望当这个`Person`对象还在的时候随时能访问到`PersonBlock`，所以3应该是个强引用，我们把2换成弱引用即可。

+ 使用`__weak`，`__unsafe_unretain`
+ 使用`_block`，但是必须调用block

```objc
// 方式一
Person *person = [[Person alloc] init];
__weak typeof(person) weakPerson = person;
person.age = 10;
person.PersonBlock = ^{
    NSLog(@"person's age is %d",weakPerson.age);
};
person.PersonBlock();

// 方式二
Person *person = [[Person alloc] init];
__unsafe_unretained typeof(person) weakPerson = person;
person.age = 10;
person.PersonBlock = ^{
    NSLog(@"person's age is %d",weakPerson.age);
};
person.PersonBlock();

// 方式三
__block Person *person = [[Person alloc] init];
person.age = 10;
person.PersonBlock = ^{
    NSLog(@"person's age is %d",person.age);
    person = nil;
};
person.PersonBlock();
```

我们来分析一下`__block`修饰的变量的内存问题：

```objc
__block Person *person = [[Person alloc] init];
person.age = 10;
person.PersonBlock = ^{
    NSLog(@"person's age is %d",person.age);
};
person.PersonBlock();
```

用一张图来表示他们之间的引用关系：

![12](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/12.png)

如何解决循环引用？

```objc
Person *person = [[Person alloc] init];
__block __weak typeof(person) weakPerson = person;
person.age = 10;
person.PersonBlock = ^{
    NSLog(@"person's age is %d",weakPerson.age);
};
person.PersonBlock();
```

底层结构如下：

![13](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1208/13.png)

这样我们就可以解决Block带来的一些循环引用的问题啦。

## 写在最后

关于Block的底层原理在这里就全部结束了，如有错误请多多指教。











