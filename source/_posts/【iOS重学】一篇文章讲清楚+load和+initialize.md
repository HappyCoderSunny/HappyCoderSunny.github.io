---
title: 【iOS重学】一篇文章讲清楚+load和+initialize
author: Sunny
tags:
  - iOS
  - 底层原理
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover54.jpg
abbrlink: 8f7262c3
date: 2022-11-28 09:35:15
---

## 写在前面

本文主要从底层源码上来分析一下`+load`和`+initialize`方法的调用顺序以及它们之间的区别。

## +load

`+load`方法会在`Runtime`加载类、分类的时候调用，每个类、分类的`+load`方法在程序运行过程中只会调用一次。

### +load的基本使用

```objc
// Person 类
@interface Person : NSObject

@end

@implementation Person

+ (void)load {
    NSLog(@"%s", __func__);
}

@end
  
// Person + Test1 类
@interface Person (Test1)

@end 

@implementation Person (Test1)

+ (void)load {
    NSLog(@"%s", __func__);
}

@end

// Person + Test2 类
@interface Person (Test2)

@end
  
@implementation Person (Test2)

+ (void)load {
    NSLog(@"%s", __func__);
}

@end

// Student 类 继承自Person
@interface Student : Person

@end
  
@implementation Student

+ (void)load {
    NSLog(@"%s", __func__);
}

@end

// Student + Test1 类
@interface Student (Test1)

@end
  
@implementation Student (Test1)

+ (void)load {
    NSLog(@"%s", __func__);
}

@end

// Student + Test2 类
@interface Student (Test2)

@end

@implementation Student (Test2)

+ (void)load {
    NSLog(@"%s", __func__);
}

@end
```

上面场景，`+load`方法的打印顺序为：

```objc
2022-11-28 09:50:34.392232+0800 CategoryDemo[88835:2251283] +[Person load]
2022-11-28 09:50:34.392867+0800 CategoryDemo[88835:2251283] +[Student load]
2022-11-28 09:50:34.392964+0800 CategoryDemo[88835:2251283] +[Animal load]
2022-11-28 09:50:34.393013+0800 CategoryDemo[88835:2251283] +[Student(Test1) load]
2022-11-28 09:50:34.393056+0800 CategoryDemo[88835:2251283] +[Person(Test1) load]
2022-11-28 09:50:34.393107+0800 CategoryDemo[88835:2251283] +[Student(Test2) load]
2022-11-28 09:50:34.393151+0800 CategoryDemo[88835:2251283] +[Person(Test2) load]
```

那么，它们之间究竟是什么样的一个加载顺序呢？

### +load的底层源码

`+load`方法的源码查看顺序：

```objc
// objc-os文件
1. _objc_init
2. load_images

// objc-runtime-new文件
3. prepare_load_methods
  3.1 schedule_class_load
  3.2 add_category_to_loadable_list
4. call_load_methods
  4.1 call_class_loads - (*load_method)(cls, @selector(load))
  4.2 call_category_loads
```



在[【iOS重学】Category的底层原理](https://codersunny.com/posts/dfd029e5/)中博主提到`Runtime`入口就是：`objc-os`文件中的`_objc_init`方法，我们就从这里入手分析一下底层源码。

`prepare_load_methods`方法源码如下：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1128/1.png)

{% note green no-icon %}

**解释**：

1、先按照编译顺序将所有的类`add_class_to_loadable_list`装载到`loadable_classes`的数组中。

2、再按照编译顺序将所有的分类`add_class_to_loadable_list`装载到`loadable_classes`的数组中。

{% endnote %}

`schedule_class_load`方法源码如下：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1128/2.png)

{% note green no-icon %}

**解释**：

在装载类到`loadable_classes`数组中时，如果存在父类，先将父类装载到`loadable_classes`中，再将类加载到数组中。

{% endnote %}

`call_load_methods`方法源码如下：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1128/3.png)

{% note green no-icon %}

**解释**：

在调用`+load`方法时，先调用类的`+load`方法再调用分类的`+load`方法。

{% endnote %}

### +load的调用顺序总结

{% note green no-icon %}

1、先调用类的`+load`

​	1.1 按照编译顺序进行调用（先编译 -> 先调用）

​	1.2 调用子类`+load`之前会先调用父类的`+load`

2、再调用分类的`+load`

​	2.1 按照编译顺序进行调用（先编译 -> 先调用）

**注意**：`+load`只会调用一次，比如`Student`在`Person`之前编译，会先调用`Person`的`+load`方法，表示`Person`已经被装载进内存了，所以`+load`不会被调用多次。

{% endnote %}

### +load的调用方式

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1128/4.png)

```objc
struct loadable_class {
    Class cls;  // may be nil
    IMP method; // 这个method 就是+load的IMP 这个loadable_class就是用来加载类的结构体
};
```

如上图`call_class_loads`方法所示，`+load`方法的调用方式是：直接根据`+load`方法的函数地址直接去调用。

## +initialize

`+initialize`方法会在类第一次接收到消息的时候调用。

### +initialize的基本使用

```objc
// Person 类
@interface Person : NSObject

@end

@implementation Person

+ (void)initialize {
    NSLog(@"%s", __func__);
}

@end
  
// Person + Test1 类
@interface Person (Test1)

@end 

@implementation Person (Test1)

+ (void)initialize {
    NSLog(@"%s", __func__);
}

@end

// Person + Test2 类
@interface Person (Test2)

@end
  
@implementation Person (Test2)

+ (void)initialize {
    NSLog(@"%s", __func__);
}

@end

// Student 类 继承自Person
@interface Student : Person

@end
  
@implementation Student

+ (void)initialize {
    NSLog(@"%s", __func__);
}

@end

// Student + Test1 类
@interface Student (Test1)

@end
  
@implementation Student (Test1)

+ (void)initialize {
    NSLog(@"%s", __func__);
}

@end

// Student + Test2 类
@interface Student (Test2)

@end

@implementation Student (Test2)

+ (void)initialize {
    NSLog(@"%s", __func__);
}

@end
```

上面场景，`+initialize`方法的打印顺序为：

```objc
2022-11-28 18:00:10.526685+0800 CategoryDemo[57742:2613672] +[Person(Test2) initialize]
2022-11-28 18:00:10.527249+0800 CategoryDemo[57742:2613672] +[Student(Test2) initialize]
```

### +initialize的底层源码

`+initialize`方法源码的查看顺序：

```objc
// objc-runtime-new.mm文件
1. class_getInstanceMethod
2. lookUpImpOrForward
3. realizeAndInitializeIfNeeded_locked
4. initializeAndLeaveLocked
5. initializeAndMaybeRelock
6. initializeNonMetaClass
7. callInitialize
```

`initializeNonMetaClass`方法源码如下：

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1128/5.png)

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1128/6.png)

{% note green no-icon %}

**解释**：

从上面的源码我们大概可以看到：在调用`callInitialize`方法之前会去检查是否存在父类和父类是否被初始化，会先去调用父类的`+initialize`方法。

{% endnote %}

### +initialize的调用顺序总结

{% note green no-icon %}

先调用父类的`+initialize`，再调用子类的`+initialize`。

**注意**：

1、先初始化父类再初始化子类，每个类只会被初始化一次，但是可能会被调用多次。

比如下面场景：

1.`Student`没有实现`+initialize`方法，调用` [Person alloc]` ` [Student alloc]`会调用两次`Person` 的`+initialize`方法。

打印结果如下：

```objc
2022-11-28 18:01:47.579047+0800 CategoryDemo[57804:2615728] +[Person(Test2) initialize]
2022-11-28 18:01:47.579702+0800 CategoryDemo[57804:2615728] +[Person(Test2) initialize]
```

2.`Student`实现了`+initialize`方法，`Person`调用过了`+initialize`，那么就不会再调用了。

{% endnote %}

### +initialize调用方式

```objc
void callInitialize(Class cls)
{
    ((void(*)(Class, SEL))objc_msgSend)(cls, @selector(initialize));
    asm("");
}
```

如上图`callInitialize`方法所示，`+initialize`方法的调用方式是：`obj_msgSend`。

## +load和+initialize对比

1、调用时机：

`+load`是在`Runtime`加载类、分类的时候调用（只会调用一次），在`main`函数之前。

 `+initialize`是在类第一次接收到消息的时候调用，只会初始化一次（父类的`+initialize`可能会被调用多次），在`main`函数之后。

2、调用方式：

`+load`是根据函数地址直接调用。

`+initialize`是通过`objc_msgSend`调用。































