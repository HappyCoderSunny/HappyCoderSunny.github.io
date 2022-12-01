---
title: 【iOS逆向】一键越狱教程
author: Sunny
tags:
- iPhone
- 逆向
- iOS
categories:
- 逆向
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover67.jpg
abbrlink: 1bf7fb0b
date: 2022-11-29 15:54:55
---

## 写在前面

本文主要是记录一下如何越狱，博主这里指的是不完美越狱，博主这里越狱的手机是：iPhone5s  iOS12.5.6。

首先，你需要有：iPhone手机、Mac电脑，保证Mac和手机上都有[爱思助手](https://www.i4.cn/)。

## 越狱的简单介绍

### 什么是越狱？

越狱：iOS jailbreak，利用iOS系统的漏洞获取iOS系统的最高权限，解开之前的各种限制。

{% note red no-icon %}

**越狱的优点**：

1、可以打造个性化、与众不同的iPhone

2、可以修改APP的一些默认行为

3、可以自由安装非App Store来源的App

4、灵活管理文件系统，让iPhone可以像U盘那么灵活

5、给开发者提供了逆向功能的环境

**越狱的缺点**：

1、越狱的手机不予保修

2、比较耗电，越狱之后的手机会常驻一些进程，耗电速度约提升10%

3、不再受iOS系统默认的安全保护，容易被恶意软件攻击，个人隐私有被窃取的风险

4、如果安装了不稳定的插件，容易让系统不稳定、变慢或者出现“白苹果”现象

{% endnote %}

### 完美越狱和不完美越狱

完美越狱：手机在越狱之后可以正常关机和重启。

不完美越狱：手机不能关机或重启，关机之后可能会出现越狱软件`Cydia`等无法打开需要重新越狱，严重甚至出现“白苹果”现象。

### Cydia

Cydia：可以理解为是越狱之后的"App store"，可以在Cydia里面安装一些第三方软件、补丁、插件等。

{% note red no-icon %}

**Cydia安装软件的步骤**：

1、添加软件源（不同的软件软件源可能不一样）（Cydia - 软件源 - 编辑 - 添加 - 输入软件源地址）

2、进入软件源 - 找到对应的软件开始下载

{% endnote %}

有的插件安装完成之后会要求重启SpringBoard，SpringBoard可以理解为iOS的桌面。

## 如何越狱

用数据线连接上手机和电脑，打开【爱思助手】- 工具箱 - 一键越狱：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/1.png)

会显示当前手机系统、型号、是否越狱等信息：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/2.png)

博主这里选择Checkra1n进行越狱，出现如下界面：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/3.png)

点击Start，按照如下操作开始下载越狱软件CheckRa1n：

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/4.png)

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/5.png)

安装完Checkra1n之后，手机上会有一个checkra1n的软件，打开它开始安装Cydia软件：

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/6.png)

安装完Cydia之后，手机桌面会多一个软件如下：

![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/7.png)

此时连接爱思助手，会发现顶部关于手机的信息会发生变化：

![8](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/8.png)

会看到上面提示我们去安装AFC2和AppSync两个插件，这两个插件具体有何用处如下：

{% note red no-icon %}

AFC2：可以保证能够访问整个iOS的文件系统。

AppSync：保证绕过验证随意安装、运行破解的ipa包。

{% endnote %}

点击安装AFC2会提示我们如何安装，大家按照自己手机的系统来安装，Cydia - 搜索Apple File... - 安装：

![9](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/9.png)

![10](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/10.png)

安装完成之后，点击重启SpringBoard即可。

此时连接Mac和手机，爱思助手顶部信息如下：

![11](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/11.png)

这时我们如果直接点击【安装AppSync】可能会报如下错误：

![12](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/12.png)

不用理会，直接在Cydia - 添加软件源：cydia.angelxwind.net，如下图所示：

![13](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/13.png)

选择我们刚添加的源 - 插件 - 搜索AppSync - 安装：

![14](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/14.png)

安装完成之后同样需要重启SpringBoard，在Cydia - 已安装 里面可以看到我们刚安装的两个插件：

![15](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/15.png)

两个都安装成功之后，我们会看到爱思助手顶部信息发生变化，告诉我们该设备已越狱：

![16](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1129/16.png)

## 写在最后

关于如何简单一键越狱的操作，博主就介绍到这里了，如有错误请多多指教。