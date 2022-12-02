---
title: 【iOS逆向】如何让Mac和iPhone建立安全连接
author: Sunny
tags:
  - iOS
  - iPhone
  - 逆向
categories:
	- 逆向
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover66.jpg
abbrlink: 7df93f3b
date: 2022-12-01 14:23:13
---

## 写在前面

本文主要是记录一下在iOS逆向过程中，Mac是如何和iPhone建立安全连接来实现在Mac上可以通过命令行操作iPhone的。

## SSH 和 OpenSSH

SSH：Secure Shell的缩写，意思为“安全外壳协议”，是一种可以为【远程登录】提供安全保障的协议，使用SSH可以把所有的数据加密，防止中间人攻击等欺骗。

OpenSSH：是SSH的免费开源实现。

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1201/1.png)

{% note pink no-icon %}

**拓展**：

SSL：Secure Socket Layer的缩写，是为网络通信提供安全及数据完整性的一种安全协议，在传输层对网络连接进行加密。

OpenSSL：SSL的开源实现。

绝大部分的https请求等价于http + OpenSSL。

OpenSSH是用来保证登录安全性的，而这个安全由OpenSSL来具体实现。

{% endnote %}

## Mac如何远程登录到iPhone

### 方式一：通过网络连接

iOS下有两个常用的账户：root、mobile。

root账户拥有最高权限，mobile是普通权限账户。

现在我们来看如何在Mac上远程登录iPhone：

{% note green no-icon %}

1.首先在Cydia中下载插件`OpenSSH`

2.保证Mac和iPhone在同一个局域网下（连接同一个Wifi）

3.使用命令`ssh 账户名@服务主机地址`登录到iPhone，这里账户名：root，服务主机地址：连接的Wifi设置里面查看

**注意**：首次登录的初始化密码为：alpine

{% endnote %}

效果图如下：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1201/2.png)

此时我们通过命令行在iPhone下创建一个`test.txt`的文本，此时通过`iFunBox`查看，会发现root账户下多了一个刚创建的文本：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1201/3.png)

到这里，说明我们已经成功建立Mac和iPhone的连接。

{% note red no-icon %}

**提示**：

如果在登录的过程中出现如下错误：`ssh: connect to host xxx port 22: Operation timed out`，可以`ping 主机地址`看看网络是否连接上。

{% endnote %}

### 方式二：通过USB连接

默认情况下，SSH走的协议是TCP协议，Mac是通过网络连接的方式登录到iPhone，所以如果网络环境不好可能会造成传输速度比较慢的情况。

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1201/4.png)

为了加快传输的速度可以使用USB的方式进行登录，Mac上有个服务程序`usbmuxd`，`usbmuxd`是开机启动的，它可以将Mac的数据通过USB传输到iPhone上。

使用USB的方式连接的具体步骤如下：

{% note pink no-icon %}

1. 下载`usbmuxd`工具包

2. 使用如下命令将iPhone的22端口（SSH端口）映射到本地的xxxxx端口（这个端口是任意的，只要不是保留端口就可以）

   ```objc
   cd usbmuxd-1.0.8/python-client // 下载usbmuxd工具目录下
   python tcprelay.py -t 22:10010 // 10010只要不是保留端口就行 -t是为了能够支持多个SSH连接
   ```

   端口映射完毕后，以后要想跟iPhone的22端口通信只需要跟Mac本地的10010端口通信即可，`usbmuxd`会将Mac本地10010端口的TCP协议数据通过USB的方式传到iPhone的22端口。

3. 使用如下命令新开一个终端窗口，SSH登录到Mac本地的10010端口

   ```objc
   ssh root@localhost -p 10010
   或
   ssh root@MacIP地址 -p 10010
   ```

{% endnote %}

博主这里的操作如下图：

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1201/5.png)

此时，映射关系已经建立完毕。

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1201/6.png)

登录到Mac本地的10010端口，此时连接已经完成，创建`touch usbLoginTest.txt`的一个文本测试一下，会发现iPhone上多了我们刚刚创建的文本：

![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1201/7.png)

USB登录的整个流程如下图：

![8](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1201/8.png)

## 写在最后

关于【如何让Mac和iPhone建立安全连接的两种方式】的文章就写到这里了，如有错误请多多指教。

























