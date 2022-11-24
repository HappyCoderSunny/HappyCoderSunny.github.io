---
title: iOS重学之KVC详解
author: Sunny
tags:
  - iOS
  - 底层原理
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover42.jpg
abbrlink: 8583d944
date: 2022-11-21 18:04:23
---

## KCV的基本使用

```objc
// 设值
- (void)setValue:(id)value forKey:(NSString *)key;
- (void)setValue:(id)value forKeyPath:(NSString *)keyPath;

// 取值
- (id)valueForKey:(NSString *)key;
- (id)valueForKeyPath:(NSString *)keyPath;
```

```objc
// Student类
@interface Student : NSObject

@property (nonatomic, copy) NSString *name;

@end

// Person类
@interface Person : NSObject

@property (nonatomic, assign) int age;
@property (nonatomic, strong) Student *student;

@end

// 具体使用
Person *person = [[Person alloc] init];
person.student = [[Student alloc] init];
[person setValue:@(10) forKey:@"age"];
[person setValue:@"Sunny" forKeyPath:@"student.name"];

NSLog(@"age:%@ name:%@", [person valueForKey:@"age"], [person valueForKeyPath:@"student.name"]);
```

## KVC的设值原理

```objc
// Person类
@interface Person : NSObject {
  @public
  int _age;
  int _isAge;
  int age;
  int isAge;
}

@end
  
@implementation Person

+ (BOOL)accessInstanceVariablesDirectly {
  return NO;
}

- (void)setAge:(int)age {
  NSLog(@"%s",__func__);
}

- (void)_setAge:(int)age {
  NSLog(@"%s",__func__);
}

- (void)setValue:(id)value forUndefinedKey:(NSString *)key {
  NSLog(@"%s",__func__);
}

@end

// ViewController类
@implementation ViewController

- (void)viewDidLoad {
  [super viewDidLoad];

  Person *person = [[Person alloc] init];
  [person setValue:@(10) forKey:@"age"];
}

@end
```

{% note green no-icon %}

**解释**：

1、当存在`setKey`方法时，调用`setKey`。

2、当`setKey`方法不存在，存在`_setKey`方法时，调用`_setKey`。

3、当`setKey`和`_setKey`都不存在时，检查`+(BOOL)accessInstanceVariablesDirectly`返回值。

4、如果`+(BOOL)accessInstanceVariablesDirectly`返回NO，调用`-(void)setValue:(id)value forUndefinedKey:(NSString *)key`，程序结束。

5、如果`+(BOOL)accessInstanceVariablesDirectly`返回YES，按照`_key`、`_isKey`、`key`、`isKey`的顺序查找成员变量赋值。

6、如果按照上面的流程都没找到，调用`-(void)setValue:(id)value forUndefinedKey:(NSString *)key`，程序结束。

{% endnote %}

用一张图来总结KVC设值的查找顺序：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1121/1.png)

**总结**：

按照上面流程都没有查找到对应的方法或成员变量可以赋值就是调用我们常见的一个方法:`- (void)setValue:(id)value forUndefinedKey:(NSString *)key`抛出异常。

**注意**：

针对KVC赋值，即使没有找到`setKey`或`_setKey`，只要找到一个成员变量也是会触发KVO的，KVC本身自己在内部会去通知相应的observer观察者某个属性发生了变化。

其实就是在内部调用了:

```objc
- (void)willChangeValueForKey:(NSString *)key;
- (void)didChangeValueForKey:(NSString *)key;
```

## KVC的取值原理

```objc
// Person类
@interface Person : NSObject {
  @public
  int _age;
  int _isAge;
  int age;
  int isAge;
}

@end

@implementation Person

+ (BOOL)accessInstanceVariablesDirectly {
  return NO;
}
- (void)getAge {
  NSLog(@"%s",__func__);
}

- (void)age {
  NSLog(@"%s",__func__);
}

- (void)isAge {
  NSLog(@"%s",__func__);
}

- (void)_age {
  NSLog(@"%s",__func__);
}

- (id)valueForUndefinedKey:(NSString *)key {
  NSLog(@"%s",__func__);
}

@end
  
// ViewController 类
@implementation ViewController

- (void)viewDidLoad {
  [super viewDidLoad];

  Person *person = [[Person alloc] init];
  [person valueForKey:@"age"];
}

@end
```

{% note green no-icon %}

**解释**：

1、当存在`getKey`方法时，调用`getKey`。

2、当`getKey`方法不存在，存在`key`方法时，调用`key`。

3、当`getKey`、`key`方法不存在，存在`isKey`方法时，调用`isKey`。

4、当`getKey`、`key`、`isKey` 方法不存在，存在`_key`方法时，调用`_key`。

5、当`getKey`、`key`、`isKey` 、`_key`都不存在时，检查`+(BOOL)accessInstanceVariablesDirectly`返回值。

6、如果`+(BOOL)accessInstanceVariablesDirectly`返回NO，调用`- (id)valueForUndefinedKey:(NSString *)key`，程序结束。

7、如果`+(BOOL)accessInstanceVariablesDirectly`返回YES，按照`_key`、`_isKey`、`key`、`isKey`的顺序查找成员变量赋值。

8、如果按照上面的流程都没找到对应的方法或成员变量，调用`- (id)valueForUndefinedKey:(NSString *)key`，程序结束。

{% endnote %}

用一张图来总结KVC取值的查找顺序：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1121/2.png)

**总结**：

按照上面流程都没有查找到对应的方法或成员变量可以赋值就是调用我们常见的一个方法:`- (id)valueForUndefinedKey:(NSString *)key`抛出异常。

## 写在最后

关于iOS里面的KVC设值、取值的相关顺序就写到这里了，如有错误请指教。









































