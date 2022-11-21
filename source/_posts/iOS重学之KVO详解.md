---
title: iOS重学之KVO详解
author: Sunny
tags:
  - iOS
  - 底层原理
categories: iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover22.jpg
abbrlink: 4223b330
date: 2022-11-15 19:55:30
---

## KVO的基本使用

### 基本使用

KVO：Key Value Observing（键值监听），用来监听某个对象属性值的改变。

```objc
// Person类
@interface Person : NSObject

@property (nonatomic, assign) int age;

@end

@implementation Person

@end

// KVOViewController
@interface KVOViewController ()

@property (nonatomic, strong) Person *person1;
@property (nonatomic, strong) Person *person2;

@end

@implementation KVOViewController

- (void)viewDidLoad {
    [super viewDidLoad];
  
    self.person1 = [[Person alloc] init];
    self.person1.age = 10;
  
  	self.person2 = [[Person alloc] init];
    self.person2.age = 20;
    
    NSKeyValueObservingOptions options = NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld;
    [self.person1 addObserver:self forKeyPath:@"age" options:options context:NULL];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
    self.person1.age = 11;
  	self.person2.age = 21;
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context {
    NSLog(@"%@对象的%@属性发生了改变：\n%@",object, keyPath,change);
}

// 打印结果：
2022-11-15 20:08:33.563589+0800 OC对象的本质[81675:15955895] <Person: 0x6000007519c0>对象的age属性发生了改变：
{
    kind = 1;
    new = 11;
    old = 10;
}
```

**注意**：在不需要监听的时候需要移除。

```objc
- (void)dealloc {
    [self.person1 removeObserver:self forKeyPath:@"age"];
}
```

{% note green no-icon %}

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1115/3.png)

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1115/4.png)

**解释**：

1、KVO是建立在KVC的基础之上的，即是说给成员变量赋值KVO是无法监听其变化的。

2、context意为上下文信息，我们平时用的时候一般传的`NULL`，但是苹果官方建议的是把这个参数用起来会更安全、扩展性更强。

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1115/5.png)

{% endnote %}

### KVO其他细节

#### 1、是否打开自动观察的开关

```
+ (BOOL) automaticallyNotifiesObserversForKey:(NSString *)key {
    return YES; // 默认是YES
}
```

#### 2、返回可能影响监听值的NSSet

```
// 当writtenData发生改变的时候，downloadProgress就会发生改变
+ (NSSet<NSString *> *)keyPathsForValuesAffectingValueForKey:(NSString *)key {
    NSSet *keyPaths = [super keyPathsForValuesAffectingValueForKey:key];
    if ([key isEqualToString:@"downloadProgress"]) {
        NSArray *affectingKeys = @[@"writtenData"];  // 只要affectingKeys数组里面的属性发生变化 都会触发downloadProgress的KVO
        keyPaths = [keyPaths setByAddingObjectsFromArray:affectingKeys];
    }
    return keyPaths;
}
```

#### 3、对可变数组的监听

```
self.person1.booksArr = [NSMutableArray array];
[self.person1 addObserver:self forKeyPath:@"booksArr" options:NSKeyValueObservingOptionNew context:NULL];
[[self.person1 mutableArrayValueForKey:@"booksArr"] addObjectsFromArray:@[@"Hello", @"World"]];
```

// 打印结果：

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1115/6.png)

## KVO的本质分析

从上面的例子咱们发现：两个不同的对象`person1`和`person2`，为什么`person1`添加了KVO可以监听到属性值的改变？

看起来`self.person1.age = 11` 和 `self.person2.age = 21`都是调用的`setAge:`方法，为什么`person1`就可以监听到属性值的改变了呢？我们可以大胆猜测一下`person1` 和`person2`的`setAge:`的具体实现肯定不一样了，也就是说`person1`的`isa`和`person2`的`isa`指向发生了变化，下面我们来验证一下我们的猜想。

{% note green no-icon %}

**验证一**：

在`person1`添加KVO前后分别打印`person1`和`person2`的**class对象**：

```objc
NSLog(@"person1添加监听之前：person1:%@ person2:%@",object_getClass(self.person1),object_getClass(self.person2));

NSKeyValueObservingOptions options = NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld;
[self.person1 addObserver:self forKeyPath:@"age" options:options context:nil];

NSLog(@"person1添加监听之后：person1:%@ person2:%@",object_getClass(self.person1),object_getClass(self.person2));
```

打印结果：

```objc
2022-11-15 20:21:21.161924+0800 OC对象的本质[81836:15966659] person1添加监听之前：person1:Person person2:Person
2022-11-15 20:21:21.162217+0800 OC对象的本质[81836:15966659] person1添加监听之后：person1:NSKVONotifying_Person person2:Person
```

如上：我们发现在`person1`添加了KVO之后，`person1`的`isa`指向的是`NSKVONotifying_Person`类，`person2`的`isa`指向的还是`Person`类。

{% endnote %}

{% note orange no-icon %}

**验证二**：

在`person1`添加KVO前后分别打印`person1`和`person2`的`setAge:`方法的函数地址（IMP）：

```objc
NSLog(@"person1添加监听之前：person1:%p person1:%p",[self.person1 methodForSelector:@selector(setAge:)], [self.person2 methodForSelector:@selector(setAge:)]);

NSKeyValueObservingOptions options = NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld;
[self.person1 addObserver:self forKeyPath:@"age" options:options context:nil];

NSLog(@"person1添加监听之后：person1:%p person1:%p",[self.person1 methodForSelector:@selector(setAge:)], [self.person2 methodForSelector:@selector(setAge:)]);
```

打印结果：

```objc
2022-11-15 20:32:28.980113+0800 OC对象的本质[81977:15975768] person1添加监听之前：person1:0x102539e70 person1:0x102539e70
2022-11-15 20:32:28.980454+0800 OC对象的本质[81977:15975768] person1添加监听之后：person1:0x7fff207b1cfb person1:0x102539e70
```

如上：我们发现在`person1`添加了KVO之后，`person1`的`IMP`跟`person2`的`IMP`不一样。

通过LLDB指令：

```objc
// person1
p (IMP) 0x7fff207b1cfb
(IMP) $0 = 0x00007fff207b1cfb (Foundation`_NSSetIntValueAndNotify)

// person2
p (IMP) 0x102539e70
(IMP) $1 = 0x0000000102539e70 (OC对象的本质`-[Person setAge:] at Person.h:12)
```

如上：我们发现`person1`的`setAge:`方法其实是调用到了一个C函数：`_NSSetIntValueAndNotify`。

{% endnote %}

通过上面的分析：

1、我们看到`person1`添加了KVO之后，其`isa` 指针指向的是一个派生类`NSKVONotifying_Person`，这个类是Runtime在程序运行的过程中动态创建的一个类，这个类继承自`Person`。

2、在这个派生类里面调用了C函数：`_NSSetIntValueAndNotify`。

3、在`_NSSetIntValueAndNotify`里面实现如下代码：

```objc
// 伪代码
[self willChangeValueForKey:@"age"];
[super setAge:age];
[self didChangeValueForKey:@"age"];
```

4、在`didChangeValueForKey`方法里面去通知监听器某个属性值发生了改变。

**用一张图来做一个总结**：

未添加KVO监听的对象：



![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1115/1.png)

使用KVO添加监听的对象：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1115/2.png)

{% note green no-icon %}

**注意**：

通过`Runtime`中的`object_class`拿到的class对象才是真正的class对象，通过`class`拿到的不一定是真正的class对象，比如使用了KVO监听的对象。

{% endnote %}

如何验证派生类`NSKVONotifing_Person`重写了哪些方法？

```objc
NSKeyValueObservingOptions options = NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld;
[self.person1 addObserver:self forKeyPath:@"age" options:options context:nil];

Class cls = object_getClass(self.person1);
[self printMethodNameOfClass:cls];

- (void)printMethodNameOfClass:(Class)cls {
    unsigned int count;
    Method *methodList = class_copyMethodList(cls, &count);
    for (int i = 0; i < count; i++) {
        Method method = methodList[i];
        NSLog(@"%@",NSStringFromSelector(method_getName(method)));
    }
    free(methodList);
}
```

打印结果：

```objc
2022-11-16 13:36:32.484809+0800 OC对象的本质[26389:16561796] setAge:
2022-11-16 13:36:32.484965+0800 OC对象的本质[26389:16561796] class
2022-11-16 13:36:32.485084+0800 OC对象的本质[26389:16561796] dealloc
2022-11-16 13:36:32.485195+0800 OC对象的本质[26389:16561796] _isKVOA
```

从上面打印可以看到：`NSKVONotifinh_Person`类重写了`setAge:`、`class`、`dealloc`、`_isKVOA`方法。

## KVO的触发场景

从上面KVO的本质分析可以看到：只要有`setter`方法就可以通过KVO来监听值的改变，比如：属性值发生改变、通过KVC赋值。

请看下面场景：

```objc
// Person类
@interface Person : NSObject
{
    @public
    int age;
}
@end

@implementation Person

@end
  
// KVOController
@interface KVOViewController ()

@property (nonatomic, strong) Person *person;

@end
  
@implementation KVOViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  self.person = [[Person alloc] init];
  self.person->age = 10;

  NSKeyValueObservingOptions options = NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld;
  [self.person addObserver:self forKeyPath:@"age" options:options context:nil];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  // 不会触发KVO
  // [self.person willChangeValueForKey:@"age"];
  self.person->age = 11;
  // [self.person didChangeValueForKey:@"age"];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context {
  NSLog(@"%@对象的%@属性发生了改变：\n%@",object, keyPath,change);
}

- (void)dealloc {
  [self.person removeObserver:self forKeyPath:@"age"];
}

@end

```

如上：

通过`self.person->age = 11`不会触发KVO，原因相信大家都很清楚了，没有调用`setter`，可以在`self.person->age = 11`前后分别添加`[self.person willChangeValueForKey:@"age"]`和`[self.person didChangeValueForKey:@"age"]`来手动触发KVO。

也可以通过KVC赋值`[self.person setValue:@11 forKey:@"age"]`，这样就可以自动触发KVO。

## 其他补充

如何查看某个方法的函数地址（IMP）？

```objc
- (IMP)methodForSelector:(SEL)aSelector;
+ (IMP)instanceMethodForSelector:(SEL)aSelector;
```