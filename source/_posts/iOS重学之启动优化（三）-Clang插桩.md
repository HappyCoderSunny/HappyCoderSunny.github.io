---
title: iOS重学之启动优化（三）- Clang插桩
author: Sunny
tags:
  - iOS
  - 启动优化
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover1.jpg
abbrlink: 37cd28e5
date: 2022-06-26 16:46:03
---

## 写在前面

在 上一篇文章[iOS重学之启动优化（二）- 二进制重排](https://codersunny.com/posts/23c5d0e7/) 最后我们提出了一个问题：如何精确获取应用启动时刻的符号调用顺序，本篇文章我们就来详细介绍如何通过Clang插桩来对所有的符号进行100%的Hook。

## Clang插桩

LLVM内置了一个简单的代码覆盖率检测(SanitizerCoverage)。它在函数级、基本块级和边缘级插入对用户定义函数的调用，并提供了这些回调的默认实现。在认为启动结束的位置添加代码，就能够拿到启动到指定位置调用到的所有函数符号。

[LLVM官方文档](https://clang.llvm.org/docs/SanitizerCoverage.html) 也具体介绍了如何使用`Tracing PCs with guards`来做到Hook所有的函数符号。

{% note pink no-icon %}

**Tracing PCs with guards:**

可以理解为跟踪代码执行逻辑的一个工具，Clang编译器就可以通过插桩来获取调用的符号顺序。

{% endnote %}

### Xcode配置

在项目Buiding Setting中`Other C Flags`里面添加 `-fsanitize-coverage=trace-pc-guard`标识，如下：

![2022061601](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220626/2022061601.png)

### 添加Hook代码

在项目里面添加如下两个函数：

首先导入头文件：

```c
#include <stdio.h>
#include <sanitizer/coverage_interface.h>

void __sanitizer_cov_trace_pc_guard_init(uint32_t *start, uint32_t *stop) {
      static uint64_t N;
      if (start == stop || *start) return;
      printf("INIT: %p %p\n", start, stop);
      for (uint32_t *x = start; x < stop; x++)
        *x = ++N;
}

void __sanitizer_cov_trace_pc_guard(uint32_t *guard) {
  if (!*guard) return;
  void *PC = __builtin_return_address(0);
  char PcDescr[1024];
  printf("guard: %p %x PC %s\n", guard, *guard, PcDescr);
}
```

### 函数分析

**一、** void __sanitizer_cov_trace_pc_guard_init(uint32_t *start, uint32_t *stop)

运行项目，打印结果如下：

![2022062602](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220626/2022062602.png)

> 可以看到目前stop存放的是14

如果我们在项目里面添加一个方法比如：`- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event`，运行项目之后再看打印结果如下：

![2022062603](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220626/2022062603.png)

> 可以看到目前stop存放的是15

大家如果有兴趣，可以在项目里面再添加几个函数看看stop存放的数字的变化，变化规律是：每添加一个函数、方法、block等，stop存放的数值就会+1。

{% note pink no-icon %}

**结论:**

`__sanitizer_cov_trace_pc_guard_init` 函数作用是：获取整个项目中符号的个数。

{% endnote %}

**二、** void __sanitizer_cov_trace_pc_guard(uint32_t *guard)

我们的需求是：能够获取所有方法、函数、block的调用顺序并且知道符号的名称，这样我们就能排列order文件。

**1**、在项目添加一个OC方法：`- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event`

在合适位置下断点，运行项目，查看函数调用栈：

![2022062604](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220626/2022062604.png)

通过查看汇编也可以看到：

![2022062605](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220626/2022062605.png)

<label style="color:green">会发现：调用一个OC方法时，会调用到`__sanitizer_cov_trace_pc_guard(uint32_t *guard)` 方法。</label>

**2**、在项目里面添加一个C函数：`void test()`

在合适位置下断点，运行项目，查看函数调用栈：

![2022062606](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220626/2022062606.png)

通过查看汇编也可以看到：

![2022062607](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220626/2022062607.png)

<label style="color:green">会发现：调用一个C函数时，会调用到`__sanitizer_cov_trace_pc_guard(uint32_t *guard)` 方法。</label>

同理，你也可以添加一个block然后去看函数调用栈和汇编可以得出相同的结论：

{% note pink no-icon %}

**结论:**

`__sanitizer_cov_trace_pc_guard` 函数作用是：Hook了项目所有的方法、函数、block。

{% endnote %}

```
#import <dlfcn.h>
void __sanitizer_cov_trace_pc_guard(uint32_t *guard) {
   if (!*guard) return; // 把这个注释掉 +load方法也会hook到
    Dl_info info;
    void *PC = __builtin_return_address(0);
    dladdr(PC, &info);
    NSLog(@"name:%s\n",info.dli_sname);
}
```

> PC的值是指返回到上一个函数里面，比如是test()函数调用到该方法里面，那么PC的值就是test()函数的值。

我们通过汇编可以看到PC返回的就是上一个符号的函数地址：

![2022062608](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220626/2022062608.png)

![2022062609](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220626/2022062609.png)

通过控制台打印：

![2022062610](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220626/2022062610.png)

{% note green no-icon %}

**分析:**

这个空项目启动时刻调用的方法有上面打印的这些，一共是14个，也和我们前面讲`void __sanitizer_cov_trace_pc_guard_init(uint32_t *start, uint32_t *stop)`这个函数的作用时的打印是一致的。

我们已经通过上面的函数解决了我们的问题：拿到调用顺序和函数的名称，二进制重排最大的问题我们已经解决。

{% endnote %}

### Order文件

现在我们就可以创建一个.order文件，在文件里面对符号进行排序，把应用启动时刻调用的方法排到前面，这样就可以减少PageFault次数从而减少启动时长，具体如何创建Order文件可以参考上一篇文章：[iOS重学之启动优化（二）- 二进制重排](https://codersunny.com/posts/23c5d0e7/) 。

## 总结

关于用Clang插桩的方法去解决二进制重排如何排序的问题到这里就基本结束了，当然也遗留了一些问题：比如如果项目里面有Swift、循环等，这个时候我们的Clang应该如何去做进一步的优化，大家有兴趣的可以自己去研究一下。









