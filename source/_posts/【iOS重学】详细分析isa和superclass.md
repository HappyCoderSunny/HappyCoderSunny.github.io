---
title: 【 iOS重学】详细分析isa和superclass
author: Sunny
tags: iOS
categories: iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover29.jpg
abbrlink: 9efafc5a
date: 2022-11-11 17:42:52
---

## 写在前面

本文将从源码上来详细剖析OC对象的分类、isa、superclass，带大家重新认识iOS。

苹果源码下载：

1.https://opensource.apple.com/releases/  搜索objc4找到最新资源进行下载

2.https://opensource.apple.com/source/objc4/

3.https://opensource.apple.com/tarballs/objc4/  （这个是其他博文提到的下载路径 但是在博主这里会提示404了）

## OC对象的分类

OC对象可以分为三种：instance对象（实例对象）、class对象（类对象）、meta-class对象（元类对象），我们现在来一一分析这三种对象。

### 实例对象

instance对象是调用`alloc`的对象，每次调用`alloc`都会产生新的instance对象。

```objc
NSObject *object1 = [[NSObject alloc] init];
NSObject *object2 = [[NSObject alloc] init];
NSLog(@"object1:%p,object2:%p",object1, object2);

// 打印结果：object1:0x6000029982d0,object2:0x600002998220
```

如上：`object1`和`object2`就是instance对象，分别占据不同的内存，它们的内存地址也不一样。

`NSObject`的源码结构如下：

```objc
@interface NSObject <NSObject> {
    Class isa;
}
```

{% note green no-icon %}

instance对象在内存中存储的信息包含：

1.isa指针

2.其他成员变量

{% endnote %}

```objc
@interface Person : NSObject

@property (nonatomic, assign) int age;
@property (nonatomic, assign) CGFloat weight;

@end

@implementation Person

@end

Person *person1 = [[Person alloc] init];
person1.age = 18;
person1.weight = 45.f;

Person *person2 = [[Person alloc] init];
person2.age = 20;
person2.weight = 50.f;
NSLog(@"person1:%p, person2:%p",person1, person2);

// 打印结果：person1:0x600000374520, person2:0x6000003745e0
```

上面`person1`和`person2`的内存存储信息如下：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1111/1.png)

### 类对象

```objc
NSObject *object = [[NSObject alloc] init];
Class objectClass1 = object_getClass(object);
Class objectClass2 = [object class];
Class objectClass3 = [NSObject class];
NSLog(@"objectClass1：%p, objectClass2：%p, objectClass3:%p",objectClass1, objectClass2, objectClass3);
          
// 打印结果：objectClass1：0x7fff865a7710, objectClass2：0x7fff865a7710, objectClass3:0x7fff865a7710
```

如上：`objectClass1`、`objectClass2`、`objectClass3`是同一个对象，它们的内存地址相同，这种叫做class对象。

**每个类在内存里面有且仅有一个class对象。**

{% note green no-icon %}

class对象在内存中存储的信息包含：

1.isa指针

2.superclass指针

3.类的**属性信息**（@property）

4.类的**对象方法信息**（instance method）

5.类的**协议信息**（protocol）

6.类的**成员变量信息**（ivar）

......

**注意**：这里的**成员变量信息**要区别于instance对象里面的**成员变量**，class对象里面存的是只需要存储一份的东西，比如名称等，instance对象里面存的是具体的值，因为不同的实例对象成员变量的值是不一样的，这里大家要注意去区分。

{% endnote %}

class对象内存中存储的信息包含：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1111/2.png)



### 元类对象

```objc
Class metaClass = object_getClass([NSObject class]);
NSLog(@"metaClass：%p",metaClass);

// 打印结果：metaClass：0x7fff865a76c0
```

如上：`metaClass`就是meta-class对象。

class对象和meta-class对象都是`Class`类，所以meta-class对象里面存储的信息我们可以理解为跟class对象存储的是同样的，但是它们的**用途**不一样。

**每个类在内存里面有且仅有一个meta-class对象。**

{% note green no-icon %}

这里大家可能会有一个疑问：为什么`object_getClass`传instance对象和class对象得到的是不同的对象？

```objc
Class gdb_object_getClass(id obj)
{
    if (!obj) return nil;
    // 1.如果是instance对象 返回的是class对象
    // 2.如果是class对象 返回的是meta-class对象
    // 3.如果是meta-class对象 返回的是基类的meta-class对象
    return gdb_class_getClass(obj->getIsa());
}
```

从上面可以看到：是因为`isa`指针，这个我们在后面会再详细解释。

{% endnote %}

### object_getClass和objc_getClass

`object_getClass`和`objc_getClass`都是`runtime`下的两个函数，区别如下：

{% note green no-icon %}

`object_getClass`传的是**对象**，`objc_getClass`传的是**字符串**。

```objc
Class personCalss1 = object_getClass(person); 

Class personCalss2 = objc_getClass("Person"); 

NSLog(@"class:%p %p",personCalss1, personCalss2);        
```

{% endnote %}

### +class和-class

```objc
+ (Class)class {
    return self;
}

- (Class)class {
    return object_getClass(self);
}

```

## isa和superclass

### isa和superclass的总结

这里借用网友的一张图片来做总结：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1111/3.png)

### isa指针

在前面我们说到instance对象的方法是存放在class对象的内存里面，那么它们之间是如何保持这种关联的，就是通过`isa`指针来保持关联的。

{% note green no-icon %}

1.instance对象的`isa`指向class对象。

2.class对象的`isa`指向meta-class对象。

3.meta-class对象的`isa`指向**基类**的meta-class对象。

{% endnote %}

如何证明instance对象的`isa`指向class对象?

```objc
struct ww_objc_class {
    Class isa;
}; // 这个结构体是自己实现的 因为OC的类对象的isa没有暴露出来使用

- (void)viewDidLoad {
  [super viewDidLoad];

  Person *person = [[Person alloc] init];
  struct ww_objc_class *wwPerson =  (__bridge struct ww_objc_class *)(person);
  Class personClass = [person class];
  NSLog(@"---%p, %p",wwPerson->isa, personClass);
}

// 打印结果：p/x (long)person->isa（直接在控制器查看isa值）
2022-11-13 17:35:42.687432+0800 OC对象的本质[50885:15128534] ---0x10a69a540, 0x10a69a540
```

 {% note red no-icon %}

**结论**：Person类对象的`isa`值 = Person类对象的地址值（这是一个APP项目） 

**注意**：如果创建一个命令行项目来对比两个地址值，会发现是不相等的需要进行一次位运算才会相等。

命令`uname -a`可以查看当前环境是64bit还是32bit。    

{% endnote %}

### superclass指针

{% note pink no-icon %}

1.instance对象没有`superclass`指针。

2.class对象的`superclass`指向**父类** 的class对象。

3.meta-class对象的`superclass`指向**父类**的meta-class对象。

4.如果没有**父类**， `superclass`指向nil。

5.基类meta-class对象的`superclass`指向基类的**class对象**。

{% endnote %}

如何验证class对象的`superclass`指向父类的class对象？

```objc
struct ww_objc_class {
    Class isa;
    Class superclass;
};

- (void)viewDidLoad {
  [super viewDidLoad];

  Person *person = [[Person alloc] init];

  Class PersonClass = [person class];
  struct ww_objc_class *wwPersonClass =  (__bridge struct ww_objc_class *)(PersonClass);

  Class NSObjectClass = [NSObject class];
  NSLog(@"---%p, %p",wwPersonClass->superclass, NSObjectClass);
}

// 打印结果：
2022-11-13 17:42:05.345430+0800 OC对象的本质[50983:15133846] ---0x7fff865a7710, 0x7fff865a7710
```

 {% note red no-icon %}

**结论**：Person类对象的`superclass`值 = NSObject类对象的地址值              

{% endnote %}

### 场景一

```objc
// Person类
@interface Person : NSObject

@property (nonatomic, assign) int age;
@property (nonatomic, assign) CGFloat weight;

- (void)run;

@end

@implementation Person

- (void)run {
    NSLog(@"---%s ---%@",__func__, self);
}

@end

// Student类
@interface Student : Person

@end

@implementation Student

@end
  
- (void)viewDidLoad {
  [super viewDidLoad];

  Student *student = [[Student alloc] init];
  NSLog(@"---Student:%@",student);
  [student run];
}

// 打印结果：
2022-11-13 16:46:19.413744+0800 OC对象的本质[50121:15084736] ---Student:<Student: 0x600002127fc0>
2022-11-13 16:46:19.413912+0800 OC对象的本质[50121:15084736] ----[Person run] ---<Student: 0x600002127fc0>
```

`student`调用`run`方法的调用流程如下：

1. 通过`student`的`isa`指针找到`Student`对象。
2. 查找`Student`对象里面是否有`run`方法。
3. 通过`Student`对象的`superclass`指针找到`Person`对象。
4. 查找`Person`对象的`run`方法。

### 场景二

```objc
// 1.为NSObject写一个分类
@interface NSObject (fly)

- (void)fly;

@end
  
@implementation NSObject (fly)

- (void)fly {
    NSLog(@"-[NSObject fly] ---%p",self);
}

@end
  
// Person类
@interface Person : NSObject

+ (void)fly;

@end

@implementation Person

@end
  
// 调用
- (void)viewDidLoad {
  NSLog(@"Person:%p",[Person class]);
  NSLog(@"NSObject:%p",[NSObject class]);
  [Person fly];  
}

// 打印结果
2022-11-13 17:17:07.265249+0800 OC对象的本质[50673:15113962] Person:0x10197f568
2022-11-13 17:17:07.265404+0800 OC对象的本质[50673:15113962] NSObject:0x7fff865a7710
2022-11-13 17:17:07.265539+0800 OC对象的本质[50673:15113962] -[NSObject fly] ---0x10197f568
```

如上：`Person`调用`fly`这个方法，但是`Person`里面并没有实现`fly`这个方法，在`NSObject`的分类方法里面有一个`fly`的实例方法。

调用`[Person fly]`并没有发生崩溃，原因如下：

1. 通过`Person`class对象的`isa`指针找到`Person`的meta-class对象。
2. 查看`Person`的meta-class对象的内存里面是否有`+fly`方法。(NO)
3. 通过`Person`meta-class对象的`superclass`指针找到父类`NSObject`的meta-class对象。
4. 查看`NSObject`的meta-class对象的内存里面是否有`+fly`方法。(NO)
5. 通过`NSObject`meta-class对象的`superclass`指针找到`NSObject`class对象。
6. 在`NSObject`class对象中找到`-fly`方法得以调用。

















































