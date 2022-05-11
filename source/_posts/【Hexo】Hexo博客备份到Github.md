---
title: 【Hexo】Hexo博客备份到Github
date: 2022-05-11 10:24:07
tags:
- Hexo
categories:
- Hexo
---

## 为什么要备份

在[这篇文章](https://happycodersunny.github.io/2022/05/09/%E3%80%90Hexo%E3%80%91Mac%20OS%E4%B8%8A%E4%BD%BF%E7%94%A8Hexo%20+%20Github%E6%90%AD%E5%BB%BA%E5%8D%9A%E5%AE%A2%E6%95%99%E7%A8%8B/)中我们把`Hexo` 和 `Github`结合起来搭建了自己的个人博客，`hexo d`部署到`Github`的其实`Hexo`编译后的文件，这些文件是用来生成网页的，并不包含我们的源文件：

![0511_01](https://sunny-blog.oss-cn-beijing.aliyuncs.com/0511_01.png)

它其实上传到`Github` 的是在我们本地目录里的`.deploy_git`里面的内容：

![20220511_02](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220511_02.png)

我们的源文件比如相关`source `文件、配置文件等都是没有上传到`Github`上的，所以我们要利用`git`来做分支管理，对我们的源文件进行备份，这样我们就可以在另一台电脑上把源文件`clone`到本地安装相应的环境就可以继续写我们的博客了。



好了，废话少说，我们直接来说如何进行博客源文件的备份。

## Hexo 博客备份

### 创建新分支

在`Github`上博客仓库下创建一个新的分支`hexo`，并且将这个分支设置为默认分支，具体操作如下：

![20220511_03](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220511_03.png)

![20220511_04](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220511_04.png)

![20220511_05](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220511_05.png)

### 克隆Hexo分支

在本地把我们刚建的分支`hexo`克隆到本地：

![20220511_06](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220511_06.png)



把克隆下来的项目里面的`.git`文件复制到我们的Hexo博客目录下:

![20220511_07](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220511_07.png)

##### 注意：如果之前搭建博客的时候自己更换过主题文件的，请把主题文件里面的`.git`文件删除。

### 开始备份

进入到Blogs根目录下，执行如下命令：

```bash
git add .
git commit -m "Blog源文件备份"
git push origin hexo
```

这时候我们会看到`Github`上的`hexo` 分支就有我们的源文件了。

![20220511_08](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220511_08.png)



如果你想要每次更改东西都希望备份到`hexo` 分支上，可以执行如下步骤：

```bash
hexo clean
git add .
git commit -m "备份"
git push
hexo g & hexo d
```

## 如何恢复博客

假如我们现在更换了电脑，希望在新的电脑上继续写博客，把`Github`上`hexo`分支上的项目克隆到本地（注意：是我们备份的那个分支）

进入到克隆下来的文件夹，执行如下命令：

```bash
npm install hexo-cli
npm install hexo-deployer-git
```

然后再去安装主题相关的插件即可，当然如果你电脑上还没有 `Node.js`等环境的话可能还需要去安装相关的环境。



现在我们就基本上可以在另一台电脑上继续我们的博客之旅啦～

## 最后

到这里，如何备份Hexo博客以及如何恢复Hexo博客就基本结束啦。



嘻嘻嘻，都看到这里了，不要吝啬你的小星星嘛，为博主点个赞呐～