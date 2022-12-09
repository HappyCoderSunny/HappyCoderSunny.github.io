---
title: 【iOS逆向】最全的SSH通信过程
author: Sunny
tags:
  - iOS
  - 逆向
categories:
  - 逆向
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover58.jpg
abbrlink: beccfc53
date: 2022-12-09 16:36:32
---

## 写在前面

在[【iOS逆向】如何让Mac和iPhone建立安全连接](https://codersunny.com/posts/7df93f3b/)文章中我们主要讲了Mac和iPhone如何建立安全连接，让我们在Mac上可以通过命令来控制iPhone，但是其实我们使用相关登录命令到登录到iPhone中间是有一个过程的，我们本篇文章就是来分析一下这个过程是什么样的，这个过程包括：

+ 建立安全连接
+ 客户端认证

## 建立安全连接

在建立安全连接的过程中，服务器会提供自己的身份证明：公钥信息。

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1209/1.png)

如果客户端并没有保存过服务器的公钥信息，会出现如下提示：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1209/2.png)

这其实是在问我们是否需要保存这个公钥信息，我们选择【yes】之后保存，在客户端的ssh文件中查看相应的内容：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1209/3.png)

如果是首次进行该操作，会提示我们输入密码进行登录。

## 客户端认证

SSH提供了两种认证的方式：

1、密码登录的认证方式

2、基于【密钥】的认证方式

{% note pink no-icon %}

SSH会优先使用密钥的认证方式，如果认证失败才会采用密码登录的方式进行认证。

{% endnote %}

我们这里重点来说一下基于密钥的认证方式是怎么样的。

### 客户端生成公钥和私钥信息

1、通过下面的方式查看客户端是否生成过公钥和密钥：

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1209/4.png)

如果没有生成，通过命令`ssh-keygen`来生成公钥和私钥信息，如果已经生成，直接到第二步。

2、使用命令`ssh-copy-id root@服务器ip地址`将公钥信息追加到授权文件尾部，如下：

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1209/5.png)

我们来验证一下客户端和服务端存储的信息是否一致？

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1209/6.png)

完成上述操作后，下次登录到iPhone就不再需要密码了。

{% note orange no-icon %}

如果按照上面方式配置了还是需要密码登录，需要使用下面操作修改一下权限（在iPhone的root账户下）：

`chmod 755 ~`

`chmod 755 ~/.ssh`

`chmod 644 ~/.ssh/authorized_keys`

{% endnote %}

## 删除客户端保存的服务器的公钥信息

有时候提供服务器的身份信息会发生变化，我们可能需要删掉客户端保存的公钥信息：

第一种方式：

```bash
cd ~./ssh
ls -l
vim known_hosts(找到对应的信息进行删除)
:wq
```

第二种方式：`ssh-keygen -R 服务器ip地址`

## 写在最后

关于SSH如何建立安全连接和客户端认证的文章就写到这里了，如有错误请多多指教。





















