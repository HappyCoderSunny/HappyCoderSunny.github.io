---
title: 【iOS重学】方法缓存cache_t的分析
author: Sunny
tags:
  - iOS
  - 底层原理
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover59.jpg
abbrlink: '39324100'
date: 2022-12-21 15:55:12
---

## 写在前面

本文我们主要来分析一下方法缓存`cache_t`的数据结构是什么样的，苹果是怎么实现方法缓存的。

## Class的结构

在[【iOS重学】窥探Class的结构](!https://codersunny.com/posts/b55a18a8/)文中，我们主要分析了`Class`的结构，结构主要如下：

```objc
struct objc_class : objc_object {
  Class isa; // isa
  Class superclass; // superclass
  cache_t cache; // 方法缓存
  class_data_bits_t bits; // 具体的类信息
}
```

其中`isa`、`superclass`、`bits`我们都已经讲过了，相关的文章可以参考[【iOS重学】详细分析isa和superclass](!https://codersunny.com/posts/9efafc5a/)和[【iOS重学】class_rw_ext_t结构详解](!https://codersunny.com/posts/8948fead/)，现在我们就来主要分析一下方法缓存`cache_t`。

## 方法缓存cache_t

我们都知道查找一个方法的流程大概是：根据`isa`指针找到类对象，在类对象上找是否有对应的方法，如果没有找到就根据`superclass`指针找到其父类查看是否有方法实现，以此往上找：

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1221/2.png)

但是如果每次都这么寻找，效率肯定会很低，所以苹果就有自己的一套方法缓存机制，调用过的方法我们会缓存起来方便下次调用提高效率。

### cache_t结构

方法缓存`cache_t`结构如下：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1221/1.png)

主要结构我们可以看成如下：

```c++
// cache_t
struct cache_t {
	explicit_atomic<mask_t> _maybeMask; // 散列表的长度
#if __LP64__
  uint16_t                _flags;
#endif
  uint16_t                _occupied; // 已缓存的方法数量
  struct bucket_t *buckets() const; // 散列表
}

// bucket_t
struct bucket_t {
#if __arm64__
    explicit_atomic<uintptr_t> _imp;
    explicit_atomic<SEL> _sel;
#else
    explicit_atomic<SEL> _sel;
    explicit_atomic<uintptr_t> _imp;
#endif
}
```

### 苹果如何实现方法缓存

苹果是利用【散列表】来存储曾经调用过的方法，这样可以提高方法的查找速度。

散列表的结构如下：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1221/3.png)

方法缓存的基本步骤为：

+ 通过`SEL & _maybeMask`得到方法在散列表里面对应的索引值`index`。
+ 调用方法的时候通过`index`放在散列表的具体位置。

### 具体场景

我们这里列举一个具体的例子并结合方法缓存的底层代码来详细说明整个过程。

首先我们根据底层源码来仿照写一个方法缓存的结构如下：

```c++
struct ww_bucket_t {// 相当于bucket_t
    SEL _sel;
    IMP _imp;
};

struct ww_cache_t {// 相当于cache_t
    struct ww_bucket_t  *buckets;
    uint32_t            _maybeMask;
    uint16_t            _flags;
    uint16_t            _occupied;
};

struct ww_class_data_bits_t {// 相当于class_data_bits_t
    uintptr_t bits;
};

struct ww_objc_class{// 相当于objc_class
    Class ISA;
    Class superclass;
    ww_cache_t cache;
    ww_class_data_bits_t bits;
};
```

具体的场景代码如下：

```objc
Person *person = [[Person alloc] init];
Class personClass = [Person class];

struct ww_objc_class *ww_class = (__bridge struct ww_objc_class *)(personClass);
uint32_t index1 = ((long long)@selector(init) & ww_class->cache._maybeMask);
for (uint32_t i = 0; i < ww_class->cache._maybeMask; i++) {
    struct ww_bucket_t bucket = ww_class->cache.buckets[i];
    NSLog(@"索引值：%u - SEL：%@ - IMP：%p",i, NSStringFromSelector(bucket._sel),bucket._imp);
}
NSLog(@"已缓存的方法个数：%hu - 散列表实际长度：%u ",ww_class->cache._occupied,ww_class->cache._maybeMask);

NSLog(@"----------------------");

[person personTest];
uint32_t index2 = ((long long)@selector(personTest) & ww_class->cache._maybeMask);

for (uint32_t i = 0; i < ww_class->cache._maybeMask; i++) {
    struct ww_bucket_t bucket = ww_class->cache.buckets[i];
    NSLog(@"索引值：%u - SEL：%@ - IMP：%p",i, NSStringFromSelector(bucket._sel),bucket._imp);
}
NSLog(@"已缓存的方法个数：%hu - 散列表实际长度：%u ",ww_class->cache._occupied,ww_class->cache._maybeMask);
NSLog(@"--------------------------");
```

打印结果：

```objc
2022-12-22 14:09:17.814393+0800 RuntimeDemo[79639:8983291] 索引值：0 - SEL：(null) - IMP：0x0
2022-12-22 14:09:17.815222+0800 RuntimeDemo[79639:8983291] 索引值：1 - SEL：init - IMP：0x7fe150
2022-12-22 14:09:17.815306+0800 RuntimeDemo[79639:8983291] 索引值：2 - SEL：(null) - IMP：0x0
2022-12-22 14:09:17.815359+0800 RuntimeDemo[79639:8983291] 已缓存的方法个数：1 - 散列表实际长度：3 
2022-12-22 14:09:17.815406+0800 RuntimeDemo[79639:8983291] ----------------------
2022-12-22 14:09:17.815450+0800 RuntimeDemo[79639:8983291] -[Person personTest]
2022-12-22 14:09:17.815493+0800 RuntimeDemo[79639:8983291] 索引值：0 - SEL：(null) - IMP：0x0
2022-12-22 14:09:17.815646+0800 RuntimeDemo[79639:8983291] 索引值：1 - SEL：init - IMP：0x7fe150
2022-12-22 14:09:17.815704+0800 RuntimeDemo[79639:8983291] 索引值：2 - SEL：personTest - IMP：0xbbb0
2022-12-22 14:09:17.815753+0800 RuntimeDemo[79639:8983291] 已缓存的方法个数：2 - 散列表实际长度：3 
2022-12-22 14:09:17.815794+0800 RuntimeDemo[79639:8983291] --------------------------
```

对照源码来分析一下这个打印结果：

```c++
void cache_t::insert(SEL sel, IMP imp, id receiver)
{
  ...... // 此处省略了一些无关代码
  mask_t newOccupied = occupied() + 1; // 记录新的缓存方法数量
  unsigned oldCapacity = capacity(), capacity = oldCapacity;
  if (slowpath(isConstantEmptyCache())) { // 第一次进来缓存为空的
      if (!capacity) capacity = INIT_CACHE_SIZE; // 计算申请空间的大小
      reallocate(oldCapacity, capacity, /* freeOld */false); // 申请空间
  }
  else if (fastpath(newOccupied + CACHE_END_MARKER <= cache_fill_ratio(capacity))) { // 已经开辟的空间还没有缓存满 可以继续缓存
      // Cache is less than 3/4 or 7/8 full. Use it as-is.
  }
#if CACHE_ALLOW_FULL_UTILIZATION
  else if (capacity <= FULL_UTILIZATION_CACHE_SIZE && newOccupied + CACHE_END_MARKER <= capacity) {
      // Allow 100% cache utilization for small buckets. Use it as-is.
  }
#endif
  else {
      // 已经开辟的空间已经缓存满了 进行双倍扩容
      capacity = capacity ? capacity * 2 : INIT_CACHE_SIZE;
      if (capacity > MAX_CACHE_SIZE) {
          capacity = MAX_CACHE_SIZE;
      }
      reallocate(oldCapacity, capacity, true); // 开辟新的缓存空间
  }

  bucket_t *b = buckets();// 取出方法缓存列表buckets
  mask_t m = capacity - 1; // 计算散列表实际的长度maybemask
  mask_t begin = cache_hash(sel, m); // 使用散列表计算插入的位置
  mask_t i = begin; // i表示插入的位置

  do {
      if (fastpath(b[i].sel() == 0)) { // 如果插入的位置是空的 表示可以插入 在当前索引值处插入该方法
          incrementOccupied();
          b[i].set<Atomic, Encoded>(b, sel, imp, cls());
          return;
      }
      if (b[i].sel() == sel) { // 判断其他线程是否缓存过该方法
          return;
      }
  } while (fastpath((i = cache_next(i, m)) != begin)); // 如果i位置没有插入成功 通过cache_next找下一个可以插入的位置

  bad_cache(receiver, (SEL)sel);// 如果do/while循环走完了都没有找到可以插入的位置就缓存失败
#endif
}
```

上面的例子分析：

+ 当调用方法`init`的时候，会调用到上面的源码`cache_t::insert`方法，此时新的已缓存的方法数`newOccupied == 1` ，容量`capacity == 0`。

+ 因为是第一次进来所以之前没有缓存会调用到`slowpath(isConstantEmptyCache()`里面。

+ 去计算散列表容量`capacity`的大小：`capacity = INIT_CACHE_SIZE`。

  {% note green no-icon %}

  ![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1221/4.png)

  `INIT_CACHE_SIZE`是1向左移动`INIT_CACHE_SIZE_LOG2`位，那就是4，所以`capacity`的值为4。

  {% endnote %}

+ 调用`reallocate`方法去申请空间。

+ 根据我们上面讲到的散列表的索引值计算方式`cache_hash(sel, m)`去获取`init`方法在散列表里面的索引值`begin`。

+ 如果散列表当前位置是空的可以插入就把`init`方法插入到当前位置。

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1221/5.png)

调用`init`时，我们根据方法缓存散列表索引值的计算方式看到`init`方法的索引值为：1，然后看打印结果:

![6](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1221/6.png)

索引值为1的位置确实缓存的是我们刚调用的`init`方法。

同理当调用`personTest`时，我们根据方法缓存散列表计算索引值的计算方式看到`personTest`方法的索引值为：2，然后对照打印结果索引值为2的位置确实缓存的是`personTest`方法。

现在我们继续调用`personTest1`方法，如下：

```objc
[person personTest1];
uint32_t index3 = ((long long)@selector(personTest1) & ww_class->cache._maybeMask);
//        [person personTest2];
//        [person personTest3];
for (uint32_t i = 0; i < ww_class->cache._maybeMask; i++) {
    struct ww_bucket_t bucket = ww_class->cache.buckets[i];
    NSLog(@"索引值：%u - SEL：%@ - IMP：%p",i, NSStringFromSelector(bucket._sel),bucket._imp);
}
NSLog(@"已缓存的方法个数：%hu - 散列表实际长度：%u ",ww_class->cache._occupied,ww_class->cache._maybeMask);
```

打印结果：

```objc
2022-12-22 14:15:00.509028+0800 RuntimeDemo[79672:8987189] -[Person personTest1]
2022-12-22 14:15:00.515237+0800 RuntimeDemo[79672:8987189] 索引值：0 - SEL：(null) - IMP：0x0
2022-12-22 14:15:00.515293+0800 RuntimeDemo[79672:8987189] 索引值：1 - SEL：(null) - IMP：0x0
2022-12-22 14:15:00.515343+0800 RuntimeDemo[79672:8987189] 索引值：2 - SEL：(null) - IMP：0x0
2022-12-22 14:15:00.515390+0800 RuntimeDemo[79672:8987189] 索引值：3 - SEL：(null) - IMP：0x0
2022-12-22 14:15:00.515440+0800 RuntimeDemo[79672:8987189] 索引值：4 - SEL：personTest1 - IMP：0xba60
2022-12-22 14:15:00.515486+0800 RuntimeDemo[79672:8987189] 索引值：5 - SEL：(null) - IMP：0x0
2022-12-22 14:15:00.515531+0800 RuntimeDemo[79672:8987189] 索引值：6 - SEL：(null) - IMP：0x0
2022-12-22 14:15:00.515577+0800 RuntimeDemo[79672:8987189] 已缓存的方法个数：1 - 散列表实际长度：7 
```

我们发现：已缓存的方法个数为1，散列表实际长度变成了7，我们发现之前缓存的方法被清空了并且扩容了，我们来对照源码来看一下它是不是该去扩容并且清空之前的缓存了。

在这里我们需要重点看一下已经开辟的空间是否缓存满的判断：

```c++
fastpath(newOccupied + CACHE_END_MARKER <= cache_fill_ratio(capacity))
```

![7](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202212/1221/7.png)

当我们调用了`init`时候，`capacity`的值为4。

+ 当调用`personTest1`方法时候，我们要去根据`newOccupied + CACHE_END_MARKER <= cache_fill_ratio(capacity)`来判断之前开辟的缓存空间是否还足够，`newOccupied == 3`，`CACHE_END_MARKER == 1`，显然缓存空间不够，所以我们需要进行扩容，那么`capacity == 8`。

+ 调用`reallocate`去重新分配新的缓存空间，并且清空之前的缓存。

  {% note green no-icon %}

  ```c++
  void cache_t::reallocate(mask_t oldCapacity, mask_t newCapacity, bool freeOld)
  {
      bucket_t *oldBuckets = buckets();
      bucket_t *newBuckets = allocateBuckets(newCapacity);
  
      ASSERT(newCapacity > 0);
      ASSERT((uintptr_t)(mask_t)(newCapacity-1) == newCapacity-1);
  
      setBucketsAndMask(newBuckets, newCapacity - 1);
      
      if (freeOld) {
          collect_free(oldBuckets, oldCapacity); // 释放之前的缓存空间
      }
  }
  ```

  {% endnote %}

+ 调用`personTest1`时，根据方法缓存散列表计算索引值的计算方式看到`personTest1`方法的索引值为：4,对照打印结果看到索引值为4的位置确实存放了`personTest1`方法：

  ```objc
  2022-12-22 15:18:22.334284+0800 RuntimeDemo[80094:9027062] 索引值：0 - SEL：(null) - IMP：0x0
  2022-12-22 15:18:22.335782+0800 RuntimeDemo[80094:9027062] 索引值：1 - SEL：(null) - IMP：0x0
  2022-12-22 15:18:22.335872+0800 RuntimeDemo[80094:9027062] 索引值：2 - SEL：(null) - IMP：0x0
  2022-12-22 15:18:22.335940+0800 RuntimeDemo[80094:9027062] 索引值：3 - SEL：(null) - IMP：0x0
  2022-12-22 15:18:22.336055+0800 RuntimeDemo[80094:9027062] 索引值：4 - SEL：personTest1 - IMP：0xb510
  2022-12-22 15:18:22.336156+0800 RuntimeDemo[80094:9027062] 索引值：5 - SEL：(null) - IMP：0x0
  2022-12-22 15:18:22.336222+0800 RuntimeDemo[80094:9027062] 索引值：6 - SEL：(null) - IMP：0x0
  2022-12-22 15:18:22.336292+0800 RuntimeDemo[80094:9027062] 已缓存的方法个数：1 - 散列表实际长度：7 
  ```

+ 再调用`personTest2`、`personTest3`时，我们计算索引值分别为0、4，但是索引值为4的位置已经有内容了，所以我们会根据`cache_next`去找到合适的索引值：

  ```c++
  #if CACHE_END_MARKER
  static inline mask_t cache_next(mask_t i, mask_t mask) {
      return (i+1) & mask;
  }
  #elif __arm64__
  static inline mask_t cache_next(mask_t i, mask_t mask) {
      return i ? i-1 : mask;
  }
  ```

  根据`(4+1) & mask`得到`personTest3`的索引值为5，对照打印结果：

  ```objc
  2022-12-22 15:24:41.305299+0800 RuntimeDemo[80143:9031426] 索引值：0 - SEL：personTest2 - IMP：0xb540
  2022-12-22 15:24:41.305390+0800 RuntimeDemo[80143:9031426] 索引值：1 - SEL：(null) - IMP：0x0
  2022-12-22 15:24:41.317936+0800 RuntimeDemo[80143:9031426] 索引值：2 - SEL：(null) - IMP：0x0
  2022-12-22 15:24:41.318011+0800 RuntimeDemo[80143:9031426] 索引值：3 - SEL：(null) - IMP：0x0
  2022-12-22 15:24:41.318081+0800 RuntimeDemo[80143:9031426] 索引值：4 - SEL：personTest1 - IMP：0xb5b0
  2022-12-22 15:24:41.318147+0800 RuntimeDemo[80143:9031426] 索引值：5 - SEL：personTest3 - IMP：0xb510
  2022-12-22 15:24:41.318214+0800 RuntimeDemo[80143:9031426] 索引值：6 - SEL：(null) - IMP：0x0
  2022-12-22 15:24:41.318280+0800 RuntimeDemo[80143:9031426] 已缓存的方法个数：3 - 散列表实际长度：7
  ```

  ### cache_t总结

  方法缓存散列表其实就是利用空间来换时间，提高了方法查找的效率。

  ## 写在最后

  关于方法缓存的底层实现我们就写到这里了，希望对大家有所帮助，如有错误请多多指教。

  















































