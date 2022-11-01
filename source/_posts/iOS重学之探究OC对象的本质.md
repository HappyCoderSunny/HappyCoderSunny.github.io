---
title: iOS重学之探究OC对象的本质
author: Sunny
tags: iOS
categories: iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover33.jpg
abbrlink: 431bd9b3
date: 2022-08-10 13:50:34
---

## 写在前面

苹果官方源码下载：opensource.apple.com/tarballs -> 搜索objc/4 -> 下载最新源码

## Objective-C的本质

在iOS开发中如果我们使用OC编写的代码，其底层都是C/C++代码。

![2022081001](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202208/0810/2022081001.png)

所以我们可以理解为：Objective-C中面向对象都是基于C/C++的数据结构【**结构体**】实现的。

在面试的时候有的面试官会问到我们OC对象的本质是什么？我们可以说是【**结构体**】。

{% note green no-icon %}

生成C++文件的一些命令：

`clang -rewrite-objc main.m -o main.cpp`：无法区分平台 不建议使用

`xcrun -sdk iphonesimulator clang -rewrite-objc main.m  -o main.cpp`：模拟器

`xcrun -sdk iphoneos clang -rewrite-objc main.m -o main.cpp`：真机

`xcrun -sdk iphoneos clang -arch arm64 -rewrite-objc 源文件名 -o 输出的cpp文件名`：arm64架构 这个命令我用得最多

{% endnote %}

## OC对象的本质

### NSObject对象的底层实现

先从一个最简单的例子说起：

在main函数里面创建一个`NSObject`的对象：` NSObject *objc = [[NSObject alloc] init];`

使用上面的命令生成相应的C++代码如下：

![2022081002](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202208/0810/2022081002.png)



分析C++文件：

```c++
// NSObject Implementation(NSObject 底层实现)
struct NSObject_IMPL {
	Class isa;
};

// 结构体
typedef struct objc_class *Class;
```

```objc
NSObject *objc = [[NSObject alloc] init];
```

这句代码的意思：创建完对象之后，给这个对象分配完存储空间，把这个对象的内存地址赋值给objc这个指针 这样我们才能通过objc这个指针找到这个对象。

![2022081003](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202208/0810/2022081003.png)

{% note green no-icon %}

如何让项目中的某个文件不参与编译？

项目设置 - Build Phases - Compile Sources - 删除不需要参与编译的文件

{% endnote %}

### class_getInstanceSize 和 malloc_size

创建一个实例对象 至少需要多少内存？

```objc
#import <objc/runtime.h>
NSObject *objc = [[NSObject alloc] init];
// 输出值：8
NSLog(@"class_getInstanceSize : %zu",class_getInstanceSize(objc.class)); 

// 源码
size_t class_getInstanceSize(Class cls)
{
    if (!cls) return 0;
    return cls->alignedInstanceSize();
}
```

创建一个实例对象 实际分配了多少内存？

```objc
#import <malloc/malloc.h>
// 输出值：16
malloc_size((__bridge const void *)obj); 
```

源码：

![2022081004](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202208/0810/2022081004.png)

![2022081005](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202208/0810/2022081005.png)

![2022081006](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202208/0810/2022081006.png)

按照上面的源码可以看到：存在【内存对齐】的概念 当size<16时 会赋值为16。

### 窥探NSObject的内存

拿到`NSObject`对象的内存地址：`0x6000021ac070`

通过Debug - Debug Workflow - View Memory(shift + command + M) 查看内存情况：

![image-20220810161623329](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202208/0810/image-20220810161623329.png)

{% note green no-icon %}

**内存分析**：

上图是16进制的内存分布。

一个16进制位对应4个二进制位 比如二进制的1001 等于 16进制的9

上图中的【10】对应的就是8个二进制位 也就是一个字节

从80开始就是新的对象的内存 这样我们可以看到NSObject确实是分配了<label style="color:red">16个字节</label>。

{% endnote %}

<label style="color:red">memory read（x）</label>：读取内存

<label style="color:red">memory write</label>：改写内存

![2022081008](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202208/0810/2022081008.png)

### 更复杂的对象的底层探究

🌰 现创建一个**Person**对象继承自**NSObject**，代码如下：

```objc
@interface Person : NSObject

@property (nonatomic, copy) NSString *name;
@property (nonatomic, assign) int age;

@end

@implementation Person

@end
 
int main(int argc, char * argv[]) {
    NSString * appDelegateClassName;
    @autoreleasepool {
        Person *person = [[Person alloc] init];
        person.name = @"Sunny";
        person.age = 12;
      	// 输出值：24
        NSLog(@"class_getInstanceSize: %zu",class_getInstanceSize(person.class));
      	// 输出值：32
        NSLog(@"malloc_size: %zu",malloc_size((__bridge const void *)(person)));
      
        appDelegateClassName = NSStringFromClass([AppDelegate class]);
    }
    return UIApplicationMain(argc, argv, nil, appDelegateClassName);
}
```

转化为C++底层代码如下：

```
struct NSObject_IMPL {
	Class isa;
};

struct Person_IMPL {
	struct NSObject_IMPL NSObject_IVARS;
	NSString *_name;
	int _age;
};

```

查看`person`对象的内存分布如下：

![2022081009](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202208/0810/2022081009.png)

<label style="color:red">**分析**：</label>

`f8 d5 e1 07 01 00 00 00`段存储的是`person`对象的内存地址。

`0c 00 00 00 00 00 00 00`段存储的是age的值12。

`a0 80 e1 07 01 00 00 00`段存储的是name的值Sunny。

计算机里面分大端模式、小端模式，不同的端读取数据的方式不一样，在iOS里面 是按照【小端模式】的方式读取数据，【小端模式】即是从<label style="color:red">**地址较大的位置**</label>开始读取 比如`0c 00 00 00 00 00 00 00`段读取就是：0x0000000c = 12。

<label style="color:red">**注意**：</label>结构体的大小必须是最大成员大小的【倍数】，比如上面的例子中class_getInstanceSize的值为24而不是20。

{% note green no-icon %}

class_getInstanceSize：至少需要的内存大小 值大于等于16 并且是8的倍数

malloc_size：实际分配的内存大小  必须是16的倍数

{% endnote %}

{% note pink no-icon %}

一些基本数据类型占用的字节数：

BOOL：1位

int：4位

float：4位

double：8位

NSInteger：8位

NSUIteger：8位

CGFloat：8位

{% endnote %}

`sizeof`可以得出某种数据类型所占的字节数:

```objc
size_t BOOL_ByteCount = sizeof(BOOL);
size_t NSInteger_ByteCount = sizeof(NSInteger);
```

### 其他总结

{% note green no-icon %}

1、一个实例对象的内存里面为什么不存储方法二是只存储了成员变量？

方法是相同的 只需要存储一份即可，存储在【类对象】的方法列表里面，成员变量可以有不同的值所以需要存储在实例对象的内存里面。

2、`sizeof`是在编译阶段就需要确认的 是个运算符。

3、内存对齐是为了提高CPU的访问速度。

{% endnote %}





























































