---
title: iOS重学之启动优化（一）
date: 2022-05-25 17:13:49
tags:
 - iOS
 - 启动优化
categories: iOS
cover: https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover6.jpg
---

## APP是如何启动的

### APP启动

热启动：系统里面存在APP的进程缓存信息，比如杀掉APP后短时间内重启APP。

冷启动：系统里面没有APP的进程缓存信息，例如重启手机打开应用、APP长时间不用系统替换掉已有的进程缓存。

APP的启动流程图如下：

![20220525_01](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_01.png)

#### main函数之前

main函数之前所干的事大概可以总结为：

`dyld`：动态链接器，把所有的可执行文件所依赖的动态库递归加载到内存中。

`rebase/bindging`：`rebase` 是指调整镜像内部的指针，`binding`是指绑定外部函数的指针。

`objc setup`：Runtime的初始化，对class和category注册，对selector的唯一性判断。

`load & initialize & constructor`：调用所有类的+load方法，初始化C&C++静态常量，调用`__attribute__((constructor))`修饰的函数。

总结为如下图：

![20220525_02](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_02.png)

其他的都很好理解，我这里重点解释一下`rebase`和`binding`到底在干什么？

**rebase & binding**

**虚拟内存 & 物理内存**

物理内存：指的是通过物理内存条获取的内存空间。

虚拟内存：指的是将硬盘的一块区域划分出来作为内存。

在long long ago，没有虚拟内存的概念，那时候每个进程运行的时候是整个应用全部丢进物理内存，概述图如下：

![20220525_03](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_03.png)

物理内存存在的问题：

1. 内存问题 - 每次直接把一个进程全部丢进物理内存，很可能出现内存不够用的情况。
2. 进程安全问题 - 很容易拿到其他应用的内存地址，就会出现进程不安全的问题。

操作系统出现虚拟内存的技术之后，进程运行时并不是整个被装载进物理内存，而是通过内存分页的技术来装载进物理内存的，概述图如下：

![20220525_04](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_04.png)

虚拟内存的技术出现以后，就出现一个ASLR（地址空间布局随机），比如一个应用每次运行的地址是变化的，比如下图：

![20220525_05](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_05.png)

![20220525_06](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_06.png)

**修正偏移（rebase）**

那么问题来了：既然我们每次启动应用地址都是随机的，那我们怎么找到真正存储某个函数的地址呢？

Link Map File：链接映射文件，里面记录了每个类所生成的可执行文件的路径、CPU架构、目标文件、符号等信息。

请现在Xcode - Build Settings - 设置Write Link Map File为YES，将Link Map File（链接映射文件）写入到本地。

![20220525_07](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_07.png)

按照上图的Path找到我们的Link Map File文件，打开如下图：

![20220525_08](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_08.png)

根据我们前面的ASLR 和 Link Map File中某个方法的偏移量来修复成这个函数的真实内存地址，这个过程就是rebase。

比如：ASLR为`0x000000010260f000`，偏移量为`0x1E80`

rebase结果如下图：

![20220525_09](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_09.png)

从上面的打印可以看到：通过rebase之后的地址就是存放`-[ViewController viewDidload]`的真实地址。

**绑定符号（binding）**

binding（符号绑定）主要是针对外部函数的绑定，指的是在运行时通过外部符号去找到真正的存放这个外部函数的地址。

举例：我们如何绑定`Foundation`框架中的`NSLog`函数？

![20220525_10](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_10.png)

上图是通过汇编看到的`NSLog`的地址存放内容：会发现打印的`NSLog` 其实还是项目本身的，并不是我们要找的`Foundation`的`NSLog`。

![20220525_11](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_11.png)

![20220525_12](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_12.png)

ASLR为`0x00000001017ab000`，通过烂苹果工具可以看到`NSLog`的符号为`0x4020`，我们看一下内存分布：

![20220525_13](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_13.png)

通过上图可以清晰的发现：原来我们`Foundation`框架的`NSLog`地址为：`0x7fff25762dfa`。

**注意**：因为`binding`的都是针对外部函数的绑定，所以我们可以肯定符号和这个外部函数的真实地址针对一个函数是相同的。

#### main函数

在经过了`main`函数之前的过程之后，这个时候就会调用一个项目的`main`函数，在这里面一般我们什么都不会干。

```objective-c
int main(int argc, char * argv[]) {
    NSString * appDelegateClassName;
    @autoreleasepool {
        NSLog(@"%s",__func__);
        appDelegateClassName = NSStringFromClass([AppDelegate class]);
    }
    return UIApplicationMain(argc, argv, nil, appDelegateClassName);
}
```

#### main函数之后

`main`函数之后，接着调用的是`didFinishLaunchingWithOptions`方法，一般我们在这里面做一些SDK的初始化，初始化RootVc等操作，因为这里面的代码都是我们开发者自己写的，所以可操作性也是最强的。

```objective-c
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    NSLog(@"%s",__func__);
    return YES;
}
```

## 衡量APP的启动时长

### main函数之前的时长统计

首先在`Edit Scheme` - `Run` - `Arguments` - `DYLD_PRINT_STATISTICS`设置为1:

![20220525_14](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_14.png)

![20220525_15](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220525/20220525_15.png)

### main函数之后的时长统计

`main`函数之后的时长统计我们可以从`didFinishLaunchingWithOptions`调用开始计时到第一个页面渲染出来结束的时长，我们可以直接在这两个地方打点估算这个时间：

```objective-c
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    CFAbsoluteTime startTime = CFAbsoluteTimeGetCurrent();
    sleep(2.0);//假装我是didFinishLaunchingWithOptions里的耗时方法
    CFAbsoluteTime endTime = CFAbsoluteTimeGetCurrent() - startTime;
    NSLog(@"main函数之后的时长统计1：%f ms",endTime * 1000);
    return YES;
}
```

## 启动优化的方案

### Main函数之前的优化

#### dyld加载

+ 严格控制动态库的引入，Apple官方建议一个项目使用的动态库不要超过6个，如果大于6个就需要考虑合并动态库。

#### rebase & binding

+ 减少类、分类、方法的数量，定期检查项目中不用的类或方法及时清理等。

+ 减少C++虚函数数量（创建虚函数表也是有开销）

#### objc setup

+ 如果前面两步做了处理，这一步就没有什么可以优化的空间了。

#### load & initialize & Constructor

+ load方法尽量不要使用
+ `__attribute__((constructor))` 修饰的函数尽量不要使用

### Main函数之后的优化

+ 使用纯代码的方式而不是Storyboard加载首页UI。

+ 对于didFinishLaunchingWithOptions：里的方法挖掘是否有可能延迟加载。

+ 跟各个业务方PM和RD共同check一些已经下线的业务，删除冗余的代码

  ............

## 一些检测工具推荐

+ https://github.com/HSFGitHub/XcodeProjectArrangementTool
+ https://github.com/dblock/fui
+ https://github.com/nst/objc_cover
+ https://www.jetbrains.com/objc
+ https://github.com/yan998/SelectorsUnrefs 

## 最后

下一篇预告：iOS重学之启动优化（二）- 二进制重排

