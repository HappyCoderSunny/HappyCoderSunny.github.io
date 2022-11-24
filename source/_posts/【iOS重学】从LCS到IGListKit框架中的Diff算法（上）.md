---
title: 【iOS重学】从LCS到IGListKit框架中的Diff算法（上）
author: Sunny
tags:
  - LCS
  - IGListKit
  - Diff
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover13.jpg
katex: true
abbrlink: da46549b
date: 2022-06-09 10:24:46
---

## 什么是LCS

### 子序列

假设有两个序列 *X, Z*：

$X = <x_1,x_2,x_3,......x_m>$

$Y = <y_1,y_2,y_3,......y_n>$

若 *Z* 序列中的每个元素都能在 *X* 中找到，并且是**严格递增**的，那么就称 *Z* 是 *X* 的子序列。

### 公共子序列

*Z* 既是 *X* 的子序列， 也是 *Y* 的子序列，则称 *X，Y* 的**公共子序列**是 *Z*，公共子序列长度为元素的个数。

### 最长公共子序列

最长公共子序列（*Longest Common SubSequence*），简称 *LCS*，指的是两个序列中元素个数**最多**的公共子序列。

## $LCS$的广泛应用

*LCS* 是一个经典的计算机科学问题，也是数据比较程序，LCS主要应用在：

+ Git等版本控制中文件的对比
+ 一些做图片、文件、文本等对比的软件
+ IGListKit框架中的Diff算法来做UICollectionView的刷新

## 如何求两个序列的$LCS$

给定两个序列：

$X = <x_1,x_2,x_3,......x_m>$

$Y = <y_1,y_2,y_3,......y_n>$

求 *X，Y* 的最长公共子序列。



### 蛮力算法

依次检查 *X* 中的每个子序列在 *Y* 中是否出现。

时间复杂度：$O(n2^m)$

> **分析**：这个时间复杂度是一个指数级，很明显这个算法是不合适的。



### 动态规划算法

**一**、子问题界定

假设 *X* 序列终止位置为 $i$ ，*Y* 序列终止位置为 $j$ ：

$X = <x_1,x_2,x_3,......x_i>$

$Y = <y_1,y_2,y_3,......y_j>$

如图所示：

![2022060901](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220609/2022060901.png)

**二**、子问题之间的依赖关系

设$X = <x_1,x_2,x_3,......x_m>$，$Y = <y_1,y_2,y_3,......y_n>$

$Z = <z_1,z_2,z_3,......z_k>$ 为 *X* 和 *Y* 的 *LCS*，那么：

（一）如果$x_m = y_n$ => $z_k = x_m = y_n$，则$Z_{k-1}$是$X_{m-1}$和$Y_{n-1}$的 *LCS*，如下图所示：

![2022060902](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220609/2022060902.png)

（二）如果$x_m \neq y_n$，$z_k \neq x_m$ => $Z$ 是 $X_{m-1}$ 和 $Y_n$ 的 $LCS$，如下图所示：

![2022060903](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220609/2022060903.png)

（三）如果$x_m \neq y_n$，$z_k \neq y_n$ => $Z$ 是 $X_m$ 和 $Y_{n-1}$的 $LCS$，如下图所示：

![2022060904](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220609/2022060904.png)

**三**、递推方程

$X$ 与 $Y$ 的子序列：

$X_i = <x_1,x_2,x_3,......x_i>$

$Y_j = <y_1,y_2,y_3,......y_j>$

$DP[i,j]$是$X_i$ 和 $Y_j$ 的 $LCS$ 的长度，由此我们可以得到递推方程为：
$$
DP[i,j] =
\begin{cases}
0,&若i = 0 或 j = 0\\
DP[i-1,j-1]+1, &若i,j > 0,x_i = y_j\\
max\{DP[i,j-1],Dp[i-1,j]\}, &若 x,j = 0, x_i \ne y_j
\end{cases}
$$


## 求解$LCS$的具体实例

**例1**：两个序列

$X = <A,D,F,G,T>$

$Y = <A,F,O,X,T>$

求 $X$ 和 $Y$ 的$LCS$

![2022060905](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220609/2022060905.png)

可以得到$X$ 和 $Y$ 的 $LCS$ 为：$<A,F,T>$， 长度为3。

具体求解算法如下：

```java
class Solution {
    public int longestCommonSubsequence(String text1, String text2) {
        int m = text1.length(), n = text2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                }
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j]);
                dp[i][j] = Math.max(dp[i][j - 1], dp[i][j]);
            }
        }
        return dp[m][n];
    }
}
```

时间复杂度：$O(n^2)$

大家要有兴趣，也可以上[LeetCode](https://leetcode.cn/)上找到这个求解 $LCS$ 的算法题练习大家的算法。

## 从$LCS$ 到Diff

如果我们仔细观察会从上图中得到一个特别有意思的地方，现在我们假设 $X = <A,D,F,G,T>$ 为旧数据，$Y = <A,F,O,X,T>$ 为新数据，再结合上图用**蓝色箭头**标记出来的路线图从**右下角**开始观察会发现：

+ 从<label style="color:green">左上角</label>走的单元里的元素是$X$ 和 $Y$ 都存在的元素，那么旧数据里的这个元素会通过Move或Reload变成新数据的元素。
+ 从<label style="color:green">左边</label>走的单元里的元素表示$X$ 里面没有，$Y$里面有的元素，那么就会通过Insert操作将元素插入新数据里面。
+ 从<label style="color:green">上边</label>走的单元里的元素表示$X$里面有，$Y$里面没有的元素，那么就会通过Delete操作将元素从旧数据里面删除。

最后，我们就可以得到旧数据$X$ 变成新数据 $Y$ 的所有元素的操作如下：

+ **Reload**：A、T
+ **Insert**：O、X
+ **Delete**：D、G
+ **Move**：F

## $LCS$ 存在的问题

我们接下来再来简单的看一个例子：

$X = <A,D,F,G,T>$

$Y = <A,T,O,X,F>$

求 $X$ 和 $Y$ 的 $LCS$

![2022060906](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220609/2022060906.png)

可以得到 $X$ 和 $Y$ 的 $LCS$ 为：$<A,F>$ 或 $<A,T>$ ，长度为2。 

通过上面的分析，我们发现元素的操作如下：

+ **Reload**：A
+ **Insert**：T、O、X
+ **Delete**：D、G、T
+ **Move**：F

我们会发现**元素T**既进行了Delete操作也进行了Insert操作，但是却没有Move操作，我们会发现：当两个序列存在多个$LCS$ 的时候，只会取其中的一组，其他的只能进行Delete或Insert操作。

**$LCS$ 存在的问题：**

+ 虽然通过动态规划的算法将时间复杂度降低到了$O(n^2)$ ，但是当$n$特别大的时候，这个时间复杂度依然比较可怕。
+ 希望对新、旧数据都存在的元素的Move进行一些优化，而不是简单的Delete、Insert操作。

## 最后

问题我们已经抛出来了，我们如何解决上面的两个问题，在降低时间复杂度的同时对Move操作进行一些优化，下一篇我们将谈到iOS中IGListKit框架中的Diff是如何巧妙解决这两个问题的。







































