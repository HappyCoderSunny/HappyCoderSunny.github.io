---
title: 【iOS重学】Block底层原理（一）
author: Sunny
tags:
  - iOS
  - 底层原理
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover68.jpg
abbrlink: 67d22871
date: 2022-12-06 19:09:24
---

## 写在前面

关于`Block`的底层原理相关东西，需要了解的东西比较多，所以博主这里打算用两篇文章来详细分析一下OC里面的`Block`，这是第一篇，内容主要包含：

+ Block的基本使用
+ Block的底层数据结构
+ Block对变量的捕获
+ Block的类型

好了，废话少说，现在跟着博主开始从头了解Block吧。

## Block的基本使用

```objc
// 定义一个Block
void(^WWBlock)(void) = ^{
    NSLog(@"This is a block...");
};
        
// 调用Block
WWBlock();
```

以上是最简单的一个Block，调用`Block()`会打印：`This is a block...`。

```objc
// Person 类
@interface Person : NSObject

- (void)fetchDataWithSuccess:(void(^)(NSString *message))successBlock;

@end

@implementation Person

- (void)fetchDataWithSuccess:(void(^)(NSString *message))successBlock {
    if (successBlock) {
        successBlock(@"这是一个成功的回调...");
    }
}

@end

// 使用
Person *person = [[Person alloc] init];
[person fetchDataWithSuccess:^(NSString *message) {
    NSLog(@"---- %@", message);
}];

// 打印结果：
2022-12-06 19:30:08.775142+0800 BlockDemo[53402:5642770] ---- 这是一个成功的回调...
```

相信这种类似的Block大家在日常项目中会看到很多很多，我们这里就不再一一列举了。

## Block的底层数据结构

```objc
// 定义一个Block
void(^WWBlock)(void) = ^{
    NSLog(@"This is a block...");
};
        
// 调用Block
WWBlock();
```

我们来看一下上面最简单的Block的底层C++结构是什么样的，使用命令`xcrun -sdk iphoneos clang -arch arm64 -rewrite-objc main.m -o main.cpp`转为C++代码如下：

```c++
int main(int argc, const char * argv[]) {
    /* @autoreleasepool */ { __AtAutoreleasePool __autoreleasepool; 
        // 定义Block
        void(*WWBlock)(void) = ((void (*)())&__main_block_impl_0((void *)__main_block_func_0, &__main_block_desc_0_DATA));
                            
        // 调用Block               
        ((void (*)(__block_impl *))((__block_impl *)WWBlock)->FuncPtr)((__block_impl *)WWBlock);
    }
    return 0;
}
```

把相应的强制转换给去掉能够帮助我们更清晰的理解Block的结构，去掉一些强制转换之后如下：

```c++
// 定义Block
void(*WWBlock)(void) = &__main_block_impl_0(__main_block_func_0, &__main_block_desc_0_DATA));
// 调用Block      
WWBlock->FuncPtr(WWBlock);
```

可以看到跟Block相关的有：`__main_block_impl_0`、`__main_block_func_0`、`__main_block_dec_0_DATA`这几个类，在生成的C++文件里面找到相关的结构如下：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/1.png)

从上面的图里面我们可以看到，Block的结构里面也有一个`isa`指针，所以Block的本质其实也是一个【**OC对象**】，是一个封装了函数调用及其调用环境的OC对象。

对应关系如下图所示：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/2.png)

在调用的时候`WWBlock->FuncPtr(WWBlock)`，相当于是拿到`WWBlock`结构里面的函数指针`FuncPtr`去调用对应的方法，这个函数指针里面其实存放的就是Block代码块的地址。

## Block对变量的捕获

为什么Block会对变量进行捕获？

因为在Block里面可能需要访问Block外部变量的值，所以需要捕获（capture）变量保证我们能正确访问到变量。

我们现在分别来分析【auto变量】、【static变量】、【全局变量】三种不同的变量，Block对其捕获是不是也不一样呢？

### auto变量

auto变量：离开当前作用域就会销毁的变量。

#### 1、非对象类型的auto变量

```objc
// 定义一个Block
int age = 10;
void(^WWBlock)(void) = ^{
    NSLog(@"对auoto变量的捕获 - %d",age);
};
age = 20;

// 调用Block
WWBlock();

// 打印结果：
2022-12-06 20:18:28.957166+0800 BlockDemo[54326:5689813] 对auoto变量的捕获 - 10
```

底层C++代码如下：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/3.png)

跟前面我们没有捕获变量相比，会把`age`传递到Block里面：

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/4.png)

从底层结构我们也看到了：Block会对auto变量进行捕获，访问的方式是【值传递】。

#### 2、对象类型的auto变量

```objc
int main(int argc, const char * argv[]) {
    @autoreleasepool {
        void(^WWBlock)(void);
        {
            Person *person = [[Person alloc] init];
            person.age = 10;
            WWBlock = ^{
                NSLog(@"person's age is %d",person.age);
            };
        }
        NSLog(@"-----");
        WWBlock();
    }
    return 0;
}

// 打印结果：
2022-12-07 15:45:31.593895+0800 BlockDemo[2248:6132111] -----
2022-12-07 15:45:31.594542+0800 BlockDemo[2248:6132111] person's age is 10
2022-12-07 15:45:31.594693+0800 BlockDemo[2248:6132111] -[Person dealloc]
```

底层结构代码如下：

![11](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/11.png)

![12](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/12.png)

对照上面的底层数据结构发现：多了两个函数`__main_block_copy_0`和`__main_block_dispose_0`。

当Block被拷贝到堆上时，会调用Block内部的copy函数`__main_block_copy_0`，函数里面调用`_Block_object_assign`，在`_Block_object_assign`里面根据auto变量的修饰符做出相应的操作：强引用或弱引用。

当Block从对上移除时，会调用Block内部的dispose函数`__main_block_dispose_0`，函数里面调用`_Block_object_dispose`，`_Block_object_dispose`去对引用的auto变量进行一次release操作。

{% note pink no-icon %}

在使用clang转换OC为C++代码时，如果有`__weak`可能会出现下面报错：

![13](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/13.png)

让其支持ARC、指定运行时系统版本即可，比如：

xcrun -sdk iphoneos clang -arch arm64 -rewrite-objc -fobjc-arc -fobjc-runtime=ios-14.0.0 main.m

{% endnote %}

### static变量

static变量：离开当前作用域不会销毁的变量。

```objc
// 定义一个Block
static int age = 10;
void(^WWBlock)(void) = ^{
    NSLog(@"对static变量的捕获 - %d",age);
};
age = 20;

// 调用Block
WWBlock();

// 打印结果：
2022-12-06 20:27:55.716204+0800 BlockDemo[54594:5700817] 对static变量的捕获 - 20
```

底层C++代码如下：

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/5.png)

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/6.png)

从底层结构我们也看到了：Block会对static变量进行捕获，访问的方式是【指针传递】。

### 全局变量

```objc
int age;
int main(int argc, const char * argv[]) {
  @autoreleasepool {
      // 定义一个Block
      age = 10;
      void(^WWBlock)(void) = ^{
          NSLog(@"age is %d",age);
      };
      age = 20;
      // 调用Block
      WWBlock();

  }
  return 0;
}

// 打印结果：
2022-12-07 13:39:45.012065+0800 BlockDemo[197:6032120] age is 20
```

底层C++代码如下：

![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/7.png)

从底层结构我们发现：Block不会对全局变量进行捕获，直接访问全局变量即可。

{% note green no-icon %}

**思考**：

1、为什么Block不会捕获全局变量，但是局部变量需要捕获？

全局变量在任何时候任何地方都是可以访问到的，因此不需要捕获可以直接访问。

局部变量因为作用域的问题需要被捕获，保证Block内部能够正确访问到该变量。

2、Block会对捕获self吗？

会，说明self是个局部变量。

```objc
- (void)test {
    self.age = 10;
    void(^WWBlock)(void) = ^{
        NSLog(@"age is %d", self.age);
    };
    WWBlock();
}
```

底层C++代码如下：

![9](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/9.png)

`self`和`_cmd`其实是两个隐式参数，所以我们能在里面正常访问`self`、`_cmd`。

{% endnote %}

### Block捕获变量总结

![8](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/8.png)

## Block的类型

```objc
void(^block1)(void) = ^{
   NSLog(@"This is block...");
};

int age = 10;
void(^block2)(void) = ^{
   NSLog(@"age is %d",age);
};

NSLog(@"%@ %@ %@",[block1 class],[block2 class],[^{NSLog(@"age is %d", age);} class]);
NSLog(@"%@ %@ %@",[[block1 class] superclass], [[block2 class] superclass], [[^{NSLog(@"age is %d", age);} class] superclass]);

// 打印结果：
2022-12-07 15:40:29.626370+0800 BlockDemo[2188:6126897] __NSGlobalBlock__ __NSMallocBlock__ __NSStackBlock__
2022-12-07 15:40:29.627050+0800 BlockDemo[2188:6126897] NSBlock NSBlock NSBlock
```

Block有三种类型：`__NSGlobalBlock__`、`__NSMallocBlock__`、`__NSStackBlock__`，都继承自`NSBlock`。

{% note blue no-icon %}

**注意**：编译完的Block类型和运行时的Block类型会有一些区别。

{% endnote %}

### 应用程序的内存分配

![10](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1206/10.png)

程序区域（代码段）：存放的就是我们写的一些代码。

数据区域：一般是存放一些全局变量。

堆：动态分配内存，自己管理内存。

栈：系统自动分配内存，不需要自己管理内存。

### Block类型总结

{% note blue no-icon %}

1、只要没有访问auto变量的Block都是`__NSGlobalBlock__`类型的。

2、访问了auto变量的Block是`__NSStackBlock__`类型的，因为我们是在ARC环境下，会自动进行copy操作，所以是`__NSMallocBlock__`类型的。

3、`__NSGlobalBlock__`类型的Block调用了copy还是`__NSGlobalBlock__`类型。

{% endnote %}

### Block的copy操作

在ARC环境下，编译器会根据情况自动将栈上的Block复制到堆上，比如以下情况：

+ block作为函数返回值
+ 将block赋值给`__strong`指针时
+ block作为Cocoa API中方法名含有usingBlock的方法参数时
+ block作为GCD API的方法参数时

{% note orange no-icon %}

**注意**：MRC下Block使用copy关键字修饰，ARC下Block使用strong或copy都可以，建议使用copy，与MRC下保持一致。

{% endnote %}

## 写在最后

关于Block底层原理的第一篇我们就分享到这里，如有错误请多多指教。

























