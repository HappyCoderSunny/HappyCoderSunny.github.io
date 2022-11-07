---
title: 浅谈iOS的包体积优化（一）
author: Sunny
tags: 
- iOS
- 优化
categories:
- iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover27.jpg
abbrlink: 94e6df10
date: 2022-11-02 11:05:25
---

## 为什么要做包体积优化

随着应用的不断更新迭代，应用安装包的体积会越来越大，用户下载应用消耗流量产生的资费就会进一步增长，会导致用户下载意愿会相对下降。

随着包体积的不断增大，安装应用的时间变长会影响用户的使用感受，对于内存比较小的低端机型来说，应用解压后内存占用更大也会影响用户的使用。

苹果对iOS APP 大小有严格的限制，虽然苹果官方也一直在提高可执行文件的上限，在iOS13 还取消了强制的OTA限制，但是下载大小超过200MB的会默认请求用户下载许可，并且在iOS13以下的设备依然会受到OTA的限制，影响新用户转化和老用户的更新。

苹果对可执行文件大小有明确的限制，超过该限制可能会APP审核被拒。

{% note green no-icon %}

**具体的限制如下：**

1、iOS7 之前，二进制文件中所有的__TEXT段总和不得超过80MB

2、iOS7.x - iOS 8.x，二进制文件中，每个特定架构中的__TEXT段不得超过60MB

3、iOS9 之后，二进制文件中所有的__TEXT段总和不得超过500MB

{% endnote %}

所以，为了更好的用户体验和减少用户等待的时间，包体积优化都是APP优化中非常重要的一环。

## IPA安装包分析

### 相关知识

【APP原始包体积】：上传前ipa解包后，实际App的大小

【下载大小】：App压缩包（.ipa文件）所占用的空间，用户在App Store下载应用时下载的是压缩包，这么做可以节省流量。

【安装大小】：当压缩包下载完成之后就会自动解压（这个解压过程也就是我们看到的安装过程），安装大小就是指压缩包解压之后所占用的空间。

【APP原始包体积】：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202208/0810/1.png)



【下载大小】：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/2.png)

【安装大小】：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/3.png)



### 安装大小和下载大小是如何生成的

App的ipa包上传到苹果后台后，苹果会对上传的ipa包解包后，对二进制进行了DRM加密（这个加密过程会导致包体积增大）和App Thinning，App Thinning会根据不同的机型对原始包的资源和代码进行不同程度的裁剪，从而生成适配具体机型的版本，下图是借用网友整理的一张图来描述iOS APP的包的生成过程：

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/4.png)

### 安装包的构成

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/5.png)

### 松果出行安装包现状分析

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/6.png)

![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/7.png)

## 包体积的优化方案

### Xcode编译设置

一般这一步比较容易被忽略，因为提到优化大家最先想到的就是资源优化，比如：图片压缩、无用代码删除等，对Xcode自身的编译优化提及的反而不多，而且有的设置需要针对与实际项目结合起来才可以，比如：去掉断点调试、异常支持等。

#### Build Settings去掉异常支持

![8](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/8.png)

#### Build Settings -> Architectures设置

Architetures 可以指定工程被编译成可支持哪些指令集类型，支持的指令集越多就会编译出越多个指令集的代码包，也就会导致ipa包变大，默认的standrad architetures（armv7，arm64）参数打的包里面有32位、64位两份指令集，根据是否需要32位来选择是否更改指令集。

![9](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/9.png)

修改设置后，ipa包体积大小变化：**78.1MB -> 55.1MB**

![10](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/10.png)

#### Build Settings不生成调试符号

![11](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/11.png)

#### Build Settings -> Development PostProcessing设置

![12](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/12.png)

#### Build Settings -> Make Strings Read-Only设置为YES（默认）

![13](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/13.png)

#### Build Settings -> Dead Code Stripping设置为YES（默认）

![14](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/14.png)

#### Pod优化

如果项目是OC但是使用了Swift三方库，可以针对单个Swift库使用 use_frameworks！而不是全部第三方库都使用。

在OC项目中使用Swift库 直接使用use_frameworks！会导致Pod中所有的库都会打成动态库，以及Swift和OC库的依赖问题会导致依赖库增加从而造成ipa包体积增大。

#### Asset Catalog Compiler编译设置优化

![15](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/15.png)

Xcode内置的actool使用打压缩算法包括： lzfse、 palette_img、 deepmap2、 deepmap_lzfse、zip，具体使用哪种算法跟iOS系统版本、Asset Catalog Compiler 中Optimization配置有关。

iOS 11.x：对应算法是 lzfse、zip

iOS 12.x - iOS 12.4.x：对应算法是 deepmap_lzfse、palette_img

iOS 13.x：对应算法是 deepmap2

**注意**：CocoaPods管理库中的Assets catalog的编译过程在CocoaPods生成的Copy Pods Resources这个脚本里面，所以上面的设置对Pod库组件无效。

#### Build Settings -> Optimization Level 改为-Oz

Optimization Level默认为-Os，-Oz是Xcode 11之后才出现的编译优化选项，核心原理是对重复的连续机器指令外联成函数进行复用，因此开启Oz，能减少二进制的大小，但同时会带来执行效率的额外消耗。

![16](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/16.png)

#### Build Settings -> Link-Time Optimization设置为Incremental

![17](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/17.png)

苹果在2016年的WWDC What’s new in LLVM 中详细介绍了这个功能，LTO能带来的优化有：

{% note green no-icon %}

将一些函数内联化：不用进行调用函数前的压栈、调用函数后的出栈操作，提高运行效率和栈空间的利用率。

去除一些无用代码

对程序有全局的优化作用：比如if方法下的某个分支永远不会执行，那么在生成的二进制文件里面就不应该包含这部分代码。

{% endnote %}

另外苹果还称LTO对app的运行速度也有正向的帮助，但是会降低LTO的编译链接的速度，因此只建议在打正式包时设置改选项，同时也会导致link map的可读性明显降低。

#### Build Settings -> Enable On Demand Resources设置为YES（默认）

![18](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/18.png)

### Xcode编译设置优化总结

![19](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/19.png)

### 资源文件优化

资源文件的优化是需要持续进行的，在前面咱们提到的Xcode编译优化设置配置好之后后续的开发只要不修改配置不需要过分关注。但是资源文件优化不同，随着项目的不断更新迭代会不断引入新的资源文件，同时也会不断有废弃资源的文件产生，因此资源优化是要持续进行的。

资源文件的优化分为两步：无用资源的删除 和 已用资源的压缩。

#### 无用资源的删除

![20](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/20.png)

#### 图片资源的清理

使用【LSUnusedResources】工具检测没有用到的图片资源，确认后进行删除。

![21](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/21.png)

#### 重复资源的引入

检查项目中是否有功能类似的SDK，建议只保留一个，另外有些三方库引入时可以只引入实际使用的部分不需要全量引入。

使用【fdupes】工具进行重复文件的扫描，仅保留一份即可。

{% note green no-icon %}

fdupes工具的安装和使用：

brew install fdupes

fdupes -Sr /Users/sunny/Desktop/TTPinecone > /Users/sunny/Desktop/fdupesResult.txt

{% endnote %}

#### 未用到的类、方法的清理

### 已用资源的压缩

项目中引入的图片、网页、json、音频等文件的压缩，这里主要了解一下图片的压缩。

**Build Settings -> Compress PNG Files** **设置为** **YES** **（默认）**

表示打包的时候自动对图片进行无损压缩。

**注意**：该选项对Assets中的资源无效 只对零散的资源文件。

**Build Settings -> Remove Text Metadata From PNG Files** **设置为****YES** **（默认）**

表示移除PNG资源的文本字符。

![22](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/22.png)

**resources**

把资源文件都打包直接copy到framework的根目录下。

**注意**：如果Pod里面没有使用use_frameworks!不会生成对应的Framework的，则是直接把资源文件copy到app的根目录下。

![23](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/23.png)

**resource_bundles**

CocoaPods 官方强烈建议使用resource_bundles，这样可以避免相同名称资源的名称冲突，使用resource_bundles会为指定的资源打一个.bundle资源包。

![24](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/24.png)

![25](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/25.png)

#### 单色图标、功能简单的图标可以使用IconFont矢量图标库的方式

#### 普通图片可以使用 [**tinypng**](https://tinypng.com/)来进行压缩

#### 尽量使用xcassets来存放图片资源

放入xcassets的2x和3x图片在上传时会根据具体设备分开对应分辨率的图片，不会同时包含。而放入.bundle中的都会包含，所以建议把图片放在xcassets里面管理。

{% note green no-icon %}

**注意**：

1. Assets.car在编译过程中会选择一些小图片拼凑成一张大图来提高图片的加载效率，被放进这张大图的小图会通过偏移量的引用。建议使用频率高且小的图片放到Assets.car里面，Assets.car能保证加载和渲染速度最优。
2. 大图（大于100KB的图片）就不要放到Assets里面，考虑使用WebP格式，这个格式可以将图片压缩到最小。但是WebP在CPU消耗和解码上是PNG的2倍，所以我们需要在性能和体积上做取舍。

{% endnote %}

#### Xcode中关于图片压缩的设置

有时候压缩了图片发现ipa包并没有改变太多，原因大概是：

{% note green no-icon %}

因为Xcode的Compress PNG Files选项的原因，建议如果自己压缩图片就把该项设置设置为NO。

Xcode 在构建过程中有一个步骤叫compile assets catalog，Xcode会用自己的算法自行对png做图片压缩，并且会压缩成能够快速读取渲染的格式。

{% endnote %}

### 资源文件优化总结

![26](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/26.png)

## 优化总结

是不是项目变大了做包体积优化才有意义？

绝对不是，包体积优化应该是一种习惯而不是等到包体积变得很大了才去思考做优化，应该是只要觉得有优化的空间就去做优化。

如果打出来的ipa包比较小，说明我们的历史负担不严重，俗话说船小好掉头而且编译的速度也快，试错成本也低，恰恰才是该优化的时候，优化总结出来的教训落地到文档形成一种规范，后续开发时也能时刻引起注意，这样对于开发来说是最好的。