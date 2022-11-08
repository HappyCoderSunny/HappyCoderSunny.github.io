---
title: On-Demand Resource的简单介绍和使用
author: Sunny
tags:
  - iOS
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover12.jpg
abbrlink: 132ad7d9
date: 2022-11-08 15:26:46
---

## 关于On-Demand Resource

在之前的文章[浅谈iOS的包体积优化（一）](https://codersunny.com/posts/94e6df10/)中我们提到过On-Demand Resource，本文主要来详细介绍一下On-Demand Resource。

iOS9引入了一个新的功能 - On-Demand Resource（ODR），它是App Thinning的一部分，这个功能简单的说就是：在APP下载的时候，APP中包含的不重要的资源可以先不下载，等真正需要用到的时候再去下载，再由系统向苹果的server发送请求，下载这些资源包。

具体见[苹果官方文档](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/On_Demand_Resources_Guide/index.html#//apple_ref/doc/uid/TP40015083-CH2-SW1)

{% note green no-icon%}

**注意**：

1、 ODR中的资源是在APP打包的时候确定的，不进行版本更新就无法更新这些资源。

2、ODR的资源是存放在苹果Server的，我们不需要再用自己的服务器。

{% endnote %}

## On-Demand Resource使用前后安装包变化

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1108/1-20221108155143590.png)



![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1108/2-20221108155154183.png)



## 使用ODR的优点

1、可以减小应用的大小，使得下载更快，提升用户体验。

2、一些固定的应用资源懒加载

3、操作系统会在磁盘不够的时候清理ODR

## 按需加载的资源类型

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1108/3-20221108155505428.png)

## ODR的使用

### ODR的三种类型

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1108/6-20221108155632935.png)

`initial install Tags`：此种类型的资源会随着APP从App Store的下载而下载，会影响ipa的大小，也就是说资源会包含在ipa包内。

`Prefetched Tag Order`：此种类型的资源会在APP下载后开始下载下载相应的资源，下载会有先后顺序，这种不会影响ipa包的大小，也就是说资源不在ipa包内。

`Download Only On Demand`：此种类型的资源会在必须的时候主动触发下载，这是开发者自己控制下载时机的。

### 如何设置ODR

### Build Settings - Enable On Demand Resources - 设置为YES（默认）

![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1108/7.png)

### 为资源添加标签

![8](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1108/8-20221108161813811.png)



{% note green no-icon%}

**说明**：

1、标签名是可以任意取的

2、一个资源可以打多个标签：比如level1、level2等

{% endnote %}

![9](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1108/9-20221108162123366.png)

如上图所示：打完标签后 在`Resource Tags`中会看到所有我们刚打的标签，比如：level1、level2。

![10](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1108/10-20221108162341127.png)

{% note green no-icon %}

**说明**：

默认都是在`Download Only On Demand`类型下，可以自己手动移到想要的类型下面。

{% endnote %}

### ODR的具体使用

#### 相关API使用

```basic
// 1.检查资源是否被下载
conditionallyBeginAccessingResourceWithCompletionHandler

// 2.从APP Server开始下载资源
beginAccessingResourceWithCompletionHandler
```

#### 具体代码片段

```basic
- (instancetype)init {
    if (self = [super init]) {
        NSSet *tags = [NSSet setWithObjects:@"level1", nil];
        self.resourceRequest = [[NSBundleResourceRequest alloc] initWithTags:tags bundle:[NSBundle mainBundle]];
    }
    return self;
}

// 检查图片资源“home_function_broadcast”是否被下载 如果已经下载就可以直接使用
__weak typeof(self) weakSelf = self;
[self.resourceRequest conditionallyBeginAccessingResourcesWithCompletionHandler:^(BOOL resourcesAvailable) {
  if (resourcesAvailable) {
      weakSelf.resourcesAvailable = resourcesAvailable;
      dispatch_async(dispatch_get_main_queue(), ^{
          weakSelf.imageView.image = [UIImage imageNamed:@"home_function_broadcast"];
      });
  }
}];

// 开始下载图片资源
[self.resourceRequest beginAccessingResourcesWithCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [self showAlertViewVcWithTitle:@"图片资源下载失败..."];
        });
    } else {
        dispatch_async(dispatch_get_main_queue(), ^{
            [self showAlertViewVcWithTitle:@"图片资源下载成功..."];
            self.imageView.image = [UIImage imageNamed:@"home_function_broadcast"];
        });
    }
}];
```

## 写在最后

关于On-Demand Resource的简单介绍就到这里了，希望本文能对打开有所帮助。























