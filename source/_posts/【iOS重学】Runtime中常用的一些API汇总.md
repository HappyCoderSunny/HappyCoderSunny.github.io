---
title: 【iOS重学】Runtime中常用的一些API汇总
author: Sunny
tags:
  - iOS
  - 底层原理
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover80.jpg
abbrlink: b38791c9
date: 2023-01-31 15:46:11
---

## 写在前面

本文主要是总结一下在我们日常项目中会用到的一些关于`Runtime`的相关API，便于以后查阅。

## isMemberOfClass 和 isKindOfClass 区别

在正式总结`Runtime`下相关API之前，先看看`isMemberOfClass` 和 `isKindOfClass`的区别：

```objc
- (BOOL)isMemberOfClass:(Class)cls;
+ (BOOL)isMemberOfClass:(Class)cls;

- (BOOL)isKindOfClass:(Class)cls;
+ (BOOL)isKindOfClass:(Class)cls;
```

我们来看一下这几个方法的底层实现：

```objc
- (BOOL)isMemberOfClass:(Class)cls {
    return [self class] == cls;
}

+ (BOOL)isMemberOfClass:(Class)cls {
    return self->ISA() == cls;
}

- (BOOL)isKindOfClass:(Class)cls {
    for (Class tcls = [self class]; tcls; tcls = tcls->getSuperclass()) {
        if (tcls == cls) return YES;
    }
    return NO;
}

+ (BOOL)isKindOfClass:(Class)cls {
    for (Class tcls = self->ISA(); tcls; tcls = tcls->getSuperclass()) {
        if (tcls == cls) return YES;
    }
    return NO;
}
```

例1：

```objc
// Person 类
@interface Person : NSObject

@end

@implementation Person

@end

// Student 类
@interface Student : Person

@end

@implementation Student

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        Student *student = [[Student alloc] init];
        
        NSLog(@"1 - %d",[student isMemberOfClass:[Student class]]);
        NSLog(@"2 - %d",[student isKindOfClass:[Student class]]);
        
        NSLog(@"3 - %d",[student isMemberOfClass:[Person class]]);
        NSLog(@"4 - %d",[student isKindOfClass:[Person class]]);
        
    }
    return 0;
}
```

打印结果：

```objc
2023-01-31 16:21:04.801267+0800 SuperDemo[32839:16964367] 1 - 1
2023-01-31 16:21:04.801310+0800 SuperDemo[32839:16964367] 2 - 1
2023-01-31 16:21:04.801347+0800 SuperDemo[32839:16964367] 3 - 0
2023-01-31 16:21:04.801382+0800 SuperDemo[32839:16964367] 4 - 1
```

例2:

```objc
// Person 类
@interface Person : NSObject

@end

@implementation Person

@end

// Student 类
@interface Student : Person

@end

@implementation Student

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        Student *student = [[Student alloc] init];
        
        NSLog(@"1 - %d",[Student isMemberOfClass:object_getClass([Student class])]);
        NSLog(@"2 - %d",[Student isKindOfClass:object_getClass([Student class])]);
        
        NSLog(@"3 - %d",[Student isMemberOfClass:object_getClass([Person class])]);
        NSLog(@"4 - %d",[Student isKindOfClass:object_getClass([Person class])]);
        
    }
    return 0;
}
```

打印结果：

```objc
2023-01-31 16:54:18.561752+0800 SuperDemo[33188:16979322] 1 - 1
2023-01-31 16:54:18.562298+0800 SuperDemo[33188:16979322] 2 - 1
2023-01-31 16:54:18.562390+0800 SuperDemo[33188:16979322] 3 - 0
2023-01-31 16:54:18.562430+0800 SuperDemo[33188:16979322] 4 - 1
```

{% note green no-icon %}

**注意**：

```objc
[Student isKindOfClass:[NSObject class]];
```

结果返回的是：YES 因为NSObject的isa指向的是自己。

{% endnote %}

## Runtime下的一些常用API

### 类

```objc
// 动态创建一个类（参数：父类，类名，额外的内存空间）
Class objc_allocateClassPair(Class  _Nullable __unsafe_unretained superclass, const char * _Nonnull name, size_t extraBytes)

// 注册一个类（要在类注册之前添加成员变量）
void  objc_registerClassPair(Class  _Nonnull __unsafe_unretained cls)
 
// 销毁一个类
void objc_disposeClassPair(Class  _Nonnull __unsafe_unretained cls)
  
// 获取isa指向的Class
Class object_getClass(id  _Nullable obj)
  
// 设置isa指向的Class
Class object_setClass(id  _Nullable obj, Class  _Nonnull __unsafe_unretained cls)

// 判断一个对象是否为Class
object_isClass(id  _Nullable obj)

// 判断一个类是否为元类
class_isMetaClass(Class  _Nullable __unsafe_unretained cls)

// 获取父类
class_getSuperclass(Class  _Nullable __unsafe_unretained cls)
```

### 成员变量

```objc
// 获取一个实例变量
Ivar class_getInstanceVariable(Class  _Nullable __unsafe_unretained cls, const char * _Nonnull name)
 
// 拷贝实例变量列表（最后需要调用free释放）
Ivar *class_copyIvarList(Class  _Nullable __unsafe_unretained cls, unsigned int * _Nullable outCount)
  
// 设置和获取成员变量的值
void object_setIvar(id  _Nullable obj, Ivar  _Nonnull ivar, id  _Nullable value)
id object_getIvar(id  _Nullable obj, Ivar  _Nonnull ivar)

// 动态添加成员变量（已经注册的类是不能添加成员变量的）
BOOL  class_addIvar(Class  _Nullable __unsafe_unretained cls, const char * _Nonnull name, size_t size, uint8_t alignment, const char * _Nullable types)

// 获取成员变量的相关信息
const char *ivar_getName(Ivar  _Nonnull v)
const char *ivar_getTypeEncoding(Ivar  _Nonnull v)
```

### 方法

```objc
// 获取一个实例方法、类方法
Method class_getInstanceMethod(Class  _Nullable __unsafe_unretained cls, SEL  _Nonnull name)
Method class_getClassMethod(Class  _Nullable __unsafe_unretained cls, SEL  _Nonnull name)
  
// 方法实现相关操作
IMP class_getMethodImplementation(Class  _Nullable __unsafe_unretained cls, SEL  _Nonnull name)
IMP method_setImplementation(Method  _Nonnull m, IMP  _Nonnull imp)
void method_exchangeImplementations(Method  _Nonnull m1, Method  _Nonnull m2)
  
// 拷贝方法列表（最后需要通过free来释放）
Method *class_copyMethodList(Class  _Nullable __unsafe_unretained cls, unsigned int * _Nullable outCount)

// 动态添加方法
BOOL class_addMethod(Class  _Nullable __unsafe_unretained cls, SEL  _Nonnull name, IMP  _Nonnull imp, const char * _Nullable types)

// 动态替换方法
IMP class_replaceMethod(Class  _Nullable __unsafe_unretained cls, SEL  _Nonnull name, IMP  _Nonnull imp, const char * _Nullable types)

// 获取方法的相关信息（带copy的需要调用free去释放）
SEL method_getName(Method  _Nonnull m)
IMP method_getImplementation(Method  _Nonnull m)
const char *method_getTypeEncoding(Method  _Nonnull m)
unsigned int method_getNumberOfArguments(Method  _Nonnull m)
char *method_copyReturnType(Method  _Nonnull m)
char *method_copyArgumentType(Method  _Nonnull m, unsigned int index)

// 选择器相关
const char *sel_getName(SEL  _Nonnull sel)
SEL sel_registerName(const char * _Nonnull str)

// 用block作为方法实现
IMP imp_implementationWithBlock(id  _Nonnull block)
id imp_getBlock(IMP  _Nonnull anImp)
BOOL imp_removeBlock(IMP  _Nonnull anImp)
```

## 如何拦截按钮的点击事件

hook：可以理解为就是方法交换。

按钮的点击事件 会调用到UIControl的`- (void)sendAction:(SEL)action to:(nullable id)target forEvent:(nullable UIEvent *)event`这个方法。

拦截按钮的点击我们只需要拦截`sendAction`即可。

```objc
+ (void)load {
    Method method1 = class_getInstanceMethod(self, @selector(sendAction:to:forEvent:));
    Method method2 = class_getInstanceMethod(self, @selector(ww_sendAction:to:forEvent:));
    method_exchangeImplementations(method1, method2); // 调用这个方法之后会去清空之前的缓存
}

- (void)ww_sendAction:(SEL)action to:(id)target forEvent:(UIEvent *)event {
    if ([self isKindOfClass:UIButton.class]) {
        NSLog(@"我成功hook了按钮...");
    }
    [self ww_sendAction:action to:target forEvent:event]; // 调用原来的sendAction
}
```

## Runtime总结

Runtime在实际开发中可能用到的场景：

+ 利用关联对象给分类添加属性

+ 遍历某个类的所有成员变量（可以访问私有的成员变量 比如修改UITextField的占位label/ 字典转模型/ 归档解档）

+ 交换方法实现（主要是交换系统的方法 利用方法交换做方法找不到导致的崩溃）

  ..........

## 写在最后

关于Runtime中常用的一些常用的API就总结到这里，如有错误请多多指教。









































