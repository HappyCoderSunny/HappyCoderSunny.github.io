---
title: 【iOS重学】Category的底层原理
author: Sunny
tags:
  - iOS
  - 底层原理
  - Runtime
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover63.jpg
abbrlink: dfd029e5
date: 2022-11-24 14:16:34
---

## 写在前面

本文博主将从`Category`的基本使用和底层原理来窥探一下Runtime下的`Category` 是如何实现的。博主这里参考的苹果源码版本是：`objc4_838`版本。

## Category的基本使用

```objc
// Person 类
@interface Person : NSObject

- (void)run;

@end

@implementation Person

- (void)run {
  NSLog(@"%s",__func__);
}

@end

// Person + Test 分类
@interface Person (Test)

- (void)test;

@end

@implementation Person (Test)

- (void)test {
    NSLog(@"%s",__func__);
}

@end
  
```

使用命令：`xcrun -sdk iphoneos clang -arch arm64 -rewrite-objc Person+Test.m -o Person+test.cpp`将`Person+Test.m`文件转化为c++底层代码，分析该c++文件，我们可以看到分类的底层结构为：

```objc
struct _category_t {
	const char *name; // 类名
	struct _class_t *cls;
	const struct _method_list_t *instance_methods; // 实例方法列表
	const struct _method_list_t *class_methods; // 类方法列表
	const struct _protocol_list_t *protocols; // 协议列表
	const struct _prop_list_t *properties; // 属性列表
};
```

`Person+Test.m`底层结构为：

![8](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1124/8.png)

对应上面`_category_t`结构可以看到：

{% note red no-icon %}

1.本类名为`Person`。

2.因为`Person+Test.m`我们只写了一个test的实例方法，所以我这里也很明显看到这里传了一个方法列表。

**注**：这里的`_OBJC_$_CATEGORY_INSTANCE_METHODS_Person_$_Test`其实就是一个结构体名称。

{% endnote %}

## Category底层原理窥探

运行时Runtime入口：`objc-os.mm`文件。

Category源码阅读顺序：

```objc
// objc-os.mm 文件
1. _objc_init 
3. map_images_nolock

// objc_runtime_new.mm 文件
2. map_images
4. loadAllCategories();
5. load_categories_nolock();
6. attachCategories();
7. attachLists();
```

其中 4 - 7 是我们接下来需要重点分析的。

### Category_t 结构体

Runtime下`Category_t`结构体如下：

```objc
struct category_t {
  const char *name;
  classref_t cls;
  WrappedPtr<method_list_t, method_list_t::Ptrauth> instanceMethods;
  WrappedPtr<method_list_t, method_list_t::Ptrauth> classMethods;
  struct protocol_list_t *protocols;
  struct property_list_t *instanceProperties;
  // Fields below this point are not always present on disk.
  struct property_list_t *_classProperties;

  method_list_t *methodsForMeta(bool isMeta) {
      if (isMeta) return classMethods;
      else return instanceMethods;
  }

  property_list_t *propertiesForMeta(bool isMeta, struct header_info *hi);

  protocol_list_t *protocolsForMeta(bool isMeta) {
      if (isMeta) return nullptr;
      else return protocols;
  }
};
```

### map_images_nolock

`map_images_nolock`可以理解为是运行时的开始，内部实现如下：

![9](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1124/9.png)

从上图可以看到：这里因为是倒序遍历也就影响了分类方法之间的优先级顺序，所以后编译的分类方法会放在先编译的前面。

### loadAllCategories

该方法指的是：加载项目中所有分类。

```objc
static void loadAllCategories() {
  mutex_locker_t lock(runtimeLock);
  for (auto *hi = FirstHeader; hi != NULL; hi = hi->getNext()) {
    // 加载每个类所有的分类模块
    load_categories_nolock(hi);
  }
}
```

### load_categories_nolock

该方法指的是：加载一个类所有的分类模块。

```objc
static void load_categories_nolock(header_info *hi) {
  // 是否有类属性
  bool hasClassProperties = hi->info()->hasCategoryClassProperties();

  size_t count;
  auto processCatlist = [&](category_t * const *catlist) {
      // 遍历需要处理的分类列表
      for (unsigned i = 0; i < count; i++) {
          category_t *cat = catlist[i];
          // 获取分类的主类
          Class cls = remapClass(cat->cls);
          locstamped_category_t lc{cat, hi};

          if (!cls) {
              // 获取不到本类 可能是弱链接
              if (PrintConnecting) {
                  _objc_inform("CLASS: IGNORING category \?\?\?(%s) %p with "
                               "missing weak-linked target class",
                               cat->name, cat);
              }
              continue;
          }

          // Process this category.
          if (cls->isStubClass()) {
              // 无法确定元类对象是哪个 所以先附着在stubClass身上
              // Stub classes are never realized. Stub classes
              // don't know their metaclass until they're
              // initialized, so we have to add categories with
              // class methods or properties to the stub itself.
              // methodizeClass() will find them and add them to
              // the metaclass as appropriate.
              if (cat->instanceMethods ||
                  cat->protocols ||
                  cat->instanceProperties ||
                  cat->classMethods ||
                  cat->protocols ||
                  (hasClassProperties && cat->_classProperties))
              {
                  objc::unattachedCategories.addForClass(lc, cls);
              }
          } else {
              // First, register the category with its target class.
              // Then, rebuild the class's method lists (etc) if
              // the class is realized.
              if (cat->instanceMethods ||  cat->protocols
                  ||  cat->instanceProperties)
              {
                  if (cls->isRealized()) { // 类对象已经初始化完毕 进行合并
                      attachCategories(cls, &lc, 1, ATTACH_EXISTING);
                  } else {
                      objc::unattachedCategories.addForClass(lc, cls);
                  }
              }

              if (cat->classMethods  ||  cat->protocols
                  ||  (hasClassProperties && cat->_classProperties))
              {
                  if (cls->ISA()->isRealized()) { // 元类对象已经初始化完毕 进行合并
                      attachCategories(cls->ISA(), &lc, 1, ATTACH_EXISTING | ATTACH_METACLASS);
                  } else {
                      objc::unattachedCategories.addForClass(lc, cls->ISA());
                  }
              }
          }
      }
  };

  processCatlist(hi->catlist(&count));
  processCatlist(hi->catlist2(&count));
}
```

### attachCategories

该方法指的是：合并分类的方法列表、属性列表、协议列表等到本类里面。

```objc
static void
attachCategories(Class cls, const locstamped_category_t *cats_list, uint32_t cats_count,
                 int flags) {
  if (slowpath(PrintReplacedMethods)) {
      printReplacements(cls, cats_list, cats_count);
  }
  if (slowpath(PrintConnecting)) {
      _objc_inform("CLASS: attaching %d categories to%s class '%s'%s",
                   cats_count, (flags & ATTACH_EXISTING) ? " existing" : "",
                   cls->nameForLogging(), (flags & ATTACH_METACLASS) ? " (meta)" : "");
  }

  /*
   * Only a few classes have more than 64 categories during launch.
   * This uses a little stack, and avoids malloc.
   *
   * Categories must be added in the proper order, which is back
   * to front. To do that with the chunking, we iterate cats_list
   * from front to back, build up the local buffers backwards,
   * and call attachLists on the chunks. attachLists prepends the
   * lists, so the final result is in the expected order.
   */
  constexpr uint32_t ATTACH_BUFSIZ = 64;
  method_list_t   *mlists[ATTACH_BUFSIZ];
  property_list_t *proplists[ATTACH_BUFSIZ];
  protocol_list_t *protolists[ATTACH_BUFSIZ];

  uint32_t mcount = 0;
  uint32_t propcount = 0;
  uint32_t protocount = 0;
  bool fromBundle = NO;
  bool isMeta = (flags & ATTACH_METACLASS);
  auto rwe = cls->data()->extAllocIfNeeded();

  // 遍历某个类的分类列表
  for (uint32_t i = 0; i < cats_count; i++) {
      auto& entry = cats_list[i];
      // 取出分类里面的方法列表
      method_list_t *mlist = entry.cat->methodsForMeta(isMeta);
      if (mlist) {
          if (mcount == ATTACH_BUFSIZ) {
              prepareMethodLists(cls, mlists, mcount, NO, fromBundle, __func__);
              rwe->methods.attachLists(mlists, mcount);
              mcount = 0;
          }
          // 将分类的方法列表放在创建好的容器里面
          mlists[ATTACH_BUFSIZ - ++mcount] = mlist;
          fromBundle |= entry.hi->isBundle();
      }

      // 取出分类里面的属性列表
      property_list_t *proplist =
          entry.cat->propertiesForMeta(isMeta, entry.hi);
      if (proplist) {
          if (propcount == ATTACH_BUFSIZ) {
              rwe->properties.attachLists(proplists, propcount);
              propcount = 0;
          }
          proplists[ATTACH_BUFSIZ - ++propcount] = proplist;
      }

      // 取出分类里面的协议列表
      protocol_list_t *protolist = entry.cat->protocolsForMeta(isMeta);
      if (protolist) {
          if (protocount == ATTACH_BUFSIZ) {
              rwe->protocols.attachLists(protolists, protocount);
              protocount = 0;
          }
          protolists[ATTACH_BUFSIZ - ++protocount] = protolist;
      }
  }

  if (mcount > 0) {
      // 如果有剩下的方法列表
      prepareMethodLists(cls, mlists + ATTACH_BUFSIZ - mcount, mcount,
                         NO, fromBundle, __func__);
      // 将剩下的方法列表附着在本类的方法列表
      rwe->methods.attachLists(mlists + ATTACH_BUFSIZ - mcount, mcount);
      if (flags & ATTACH_EXISTING) {
          flushCaches(cls, __func__, [](Class c){
              // constant caches have been dealt with in prepareMethodLists
              // if the class still is constant here, it's fine to keep
              return !c->cache.isConstantOptimizedCache();
          });
      }
  }

  rwe->properties.attachLists(proplists + ATTACH_BUFSIZ - propcount, propcount);

  rwe->protocols.attachLists(protolists + ATTACH_BUFSIZ - protocount, protocount);
}
```

### attachLists

该方法指的是：把分类方法真正合并在主类的方法列表里面。

```objc
void attachLists(List* const * addedLists, uint32_t addedCount) {
  		// 如果添加的方法列表count为0 直接返回
      if (addedCount == 0) return;

      if (hasArray()) {
          // many lists -> many lists
        	// 本类里面有多个方法列表
          uint32_t oldCount = array()->count;
          uint32_t newCount = oldCount + addedCount;
          array_t *newArray = (array_t *)malloc(array_t::byteSize(newCount));
          newArray->count = newCount;
          array()->count = newCount;

          for (int i = oldCount - 1; i >= 0; i--)
              newArray->lists[i + addedCount] = array()->lists[i]; // 这个其实是在把之前的方法列表挪到新数组后面。
          for (unsigned i = 0; i < addedCount; i++)
              newArray->lists[i] = addedLists[i]; // 把分类的方法列表添加到新数组里面。
          free(array());
          setArray(newArray);
          validate();
      }
      else if (!list  &&  addedCount == 1) {
          // 本类原本没有方法列表 分类方法列表Count == 1
          list = addedLists[0];
          validate();
      } 
      else {
          // 本类原本只有一个方法列表 
          Ptr<List> oldList = list;
          uint32_t oldCount = oldList ? 1 : 0;
          uint32_t newCount = oldCount + addedCount;
          setArray((array_t *)malloc(array_t::byteSize(newCount)));
          array()->count = newCount;
          if (oldList) array()->lists[addedCount] = oldList;
          for (unsigned i = 0; i < addedCount; i++)
              array()->lists[i] = addedLists[i];
          validate();
      }
  }

  void tryFree() {
      if (hasArray()) {
          for (uint32_t i = 0; i < array()->count; i++) {
              try_free(array()->lists[i]);
          }
          try_free(array());
      }
      else if (list) {
          try_free(list);
      }
  }

  template<typename Other>
  void duplicateInto(Other &other) {
      if (hasArray()) {
          array_t *a = array();
          other.setArray((array_t *)memdup(a, a->byteSize()));
          for (uint32_t i = 0; i < a->count; i++) {
              other.array()->lists[i] = a->lists[i]->duplicate();
          }
      } else if (list) {
          other.list = list->duplicate();
      } else {
          other.list = nil;
      }
  }
};
```

`attachLists`方法是分类原理实现最核心的方法，我这里用一张图来模拟分类的底层原理如下：

![10](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1124/10.png)

### 模拟场景

模拟场景：`Person`类有两个分类：`Person+Eat.h`和`Person+Run.h`，如下：

```objc
// Person 类
@interface Person : NSObject

- (void)test；
- (void)test1;

@end
  
// Person + Eat 类
@interface Person (Eat)

- (void)eat;
- (void)test;

@end
  
// Person + Run 类
@interface Person (Run)

- (void)run;
- (void)test;

@end
```

按照上图的分析结果，`Person`类中`class_rw_ext_t`中`methods`结构如下：

{% note red no-icon %}

**解释**：

1.把Person的方法列表挪动到数组最后

2.把Person的分类方法列表添加到前

![11](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1124/11.png)

{% endnote %}

{% note orange no-icon %}

**提示**：

1、如果主类和分类都会有`-(void)test`方法，会优先调用分类的方法，原因是分类的方法列表在前面，注意这里不是覆盖了原来的方法。

2、`Person`两个分类都有`-(void)test`方法，调用哪个方法是根据**编译顺序**来决定的，后参与编译的优先级更高，比如上例中调用的是`Person+Eat`中的`test`方法。

{% endnote %}

## 写在最后

啦啦啦，关于`Category`的底层原理窥探就到这里结束了，如有错误的地方还望各位大佬多多指教。