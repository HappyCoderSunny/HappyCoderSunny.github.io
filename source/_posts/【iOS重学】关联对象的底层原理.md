---
title: 【iOS重学】关联对象的底层原理
author: Sunny
tags:
  - iOS
  - 底层原理
  - Runtime
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover65.jpg
abbrlink: baafbb5e
date: 2022-11-30 14:19:30
---

## 写在前面

本文主要探究一下iOS中如何给分类添加属性以及关联对象的底层原理是什么，建议大家看本篇文章的时候参考objc4源码一起看会更好。

## 如何给分类添加属性

```objc
// Person + Test 类
@interface Person (Test)

@property (nonatomic, copy) NSString *name;

@end

@implementation Person (Test)

- (void)setName:(NSString *)name {
    objc_setAssociatedObject(self, @selector(name), name, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

- (NSString *)name {
    return objc_getAssociatedObject(self, @selector(name));
}

@end
```

{% note red no-icon %}

**解释**：

`objc_setAssociatedObject(id object, const void *key, id value, objc_AssociationPolicy policy)`参数解释：

1、`object`：需要关联的对象

2、`key`：关联key

3、`value`：关联值

4、`policy`：关联策略

```objc
typedef OBJC_ENUM(uintptr_t, objc_AssociationPolicy) {
    OBJC_ASSOCIATION_ASSIGN = 0, // 对应 assign       
    OBJC_ASSOCIATION_RETAIN_NONATOMIC = 1, //  对应 strong，nonatomic
    OBJC_ASSOCIATION_COPY_NONATOMIC = 3, // 对应 copy，nonatomic 
    OBJC_ASSOCIATION_RETAIN = 01401, // 对应 strong，atomic                                     
    OBJC_ASSOCIATION_COPY = 01403 // 对应 copy，atomic
};
```

{% endnote %}

## 关联对象的底层原理

{% note red no-icon %}

博主这里的源码是 objc4 - 838 版本，不同的版本有的方法实现可能会有一些差异但是原理都是基本不变的，建议大家下载最新版本的源码阅读。

{% endnote %}

### 设值原理

设值调用的是`objc_setAssociatedObject`，里面调用的是`_objc_set_associative_reference`，设值的核心方法就在`_objc_set_associative_reference`里面，如下：

![1](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1130/1.png)

![2](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1130/2.png)

```objc
_object_set_associative_reference(id object, const void *key, id value, uintptr_t policy)
{
    // This code used to work when nil was passed for object and key. Some code
    // probably relies on that to not crash. Check and handle it explicitly.
    // rdar://problem/44094390
    if (!object && !value) return;

    if (object->getIsa()->forbidsAssociatedObjects())
        _objc_fatal("objc_setAssociatedObject called on instance (%p) of class %s which does not allow associated objects", object, object_getClassName(object));
    // 把关联对象object包装成一个DisguisedPtr类型的数据结构
    DisguisedPtr<objc_object> disguised{(objc_object *)object};
    // 把关联策略policy和具体关联的值value包装成一个ObjcAssociation的数据结构
    ObjcAssociation association{policy, value};

    // retain the new value (if any) outside the lock.
    // 根据不同的策略类型做相应的处理
    association.acquireValue();

    bool isFirstAssociation = false;
    {
        // AssociationsManager 是关联对象管理类，里面有一个静态变量_mapStorage，要注意的是manager并不是唯一的。
        AssociationsManager manager;
        // 通过 manager.get()来获取所有的关联表associations 类型是 AssociationsHashMap
        AssociationsHashMap &associations(manager.get());

        if (value) {
            // 根据关联的对象disguised去关联表associations中查找对应的ObjectAssociationMap类型的value，如果没有就创建一个插入到associations里面
            auto refs_result = associations.try_emplace(disguised, ObjectAssociationMap{});
            if (refs_result.second) {
                /* it's the first association we make */
                isFirstAssociation = true; // 设置为true
            }

            /* establish or replace the association */
            auto &refs = refs_result.first->second;
            auto result = refs.try_emplace(key, std::move(association)); // 根据传入的key找到对应的bucket，替换掉原来的或者插入新的association，并且设置关联策略。
            if (!result.second) {
                association.swap(result.first->second);
            }
        } else {
            // 如果value值为nil 通过传入的关联对象disguised找到相应的AssociationsHashMap
            auto refs_it = associations.find(disguised);
            if (refs_it != associations.end()) {
                auto &refs = refs_it->second;
                auto it = refs.find(key); // 通过传入的key去找到ObjectAssociation
                if (it != refs.end()) {
                    association.swap(it->second); // 进行擦除操作
                    refs.erase(it);
                    if (refs.size() == 0) {
                        associations.erase(refs_it);

                    }
                }
            }
        }
    }

    // Call setHasAssociatedObjects outside the lock, since this
    // will call the object's _noteAssociatedObjects method if it
    // has one, and this may trigger +initialize which might do
    // arbitrary stuff, including setting more associated objects.
    if (isFirstAssociation)
        // 如果有关联对象
        object->setHasAssociatedObjects();

    // release the old value (outside of the lock).
    // 对association进行一次release操作
    association.releaseHeldValue();
}
```

从上面我们可以看到设置关联的四个主要对象：

`AssociationsManager`

`AssociationsHashMap`

`ObjectAssociationMap`

`ObjcAssociation`

其中，`AssociationsManager`的结构为：

```objc
class AssociationsManager {
  using Storage = ExplicitInitDenseMap<DisguisedPtr<objc_object>, ObjectAssociationMap>;
  static Storage _mapStorage;
  
   AssociationsHashMap &get() {
      return _mapStorage.get();
   }

  static void init() {
      _mapStorage.init();
  }
};
```

`AssociationsHashMap`的结构为：

```objc
DenseMap<DisguisedPtr<objc_object>, ObjectAssociationMap> 
```

`ObjectAssociationMap`的结构为：

```objc
typedef DenseMap<const void *, ObjcAssociation> ObjectAssociationMap;
```

`ObjcAssociation`的结构为：

```objc
class ObjcAssociation {
  uintptr_t _policy; // 关联策略
  id _value; // 关联值value
}
```

这四个对象之间的关系如下图所示：

![3](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1130/3.png)

对照`objc_setAssociatedObject(id object, cons void *key, id value, objc_AssociationPolicy policy)`方法：

1. 通过`AssociationsManager`的`manager.get()`获得`AssociationsHashMap`。
2. `AssociationsHashMap`中的`key`是关联对象`object`，`value`是`ObjectAssociationMap`。
3. `ObjectAssociationMap`中的`key`是方法中的`key`，`value`是`ObjectAssociation`。
4. `ObjectAssociation`中存放的就是方法中的`value`和关联策略`policy`。

通过上面的分析，设置关联对象的底层原理现在就很清晰了。

### 取值原理

取得调用的是`objc_getAssociatedObject`，里面调用的是`_object_get_associative_reference`，取值的核心方法就在`_object_get_associative_reference`里面，如下：

![4](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1130/4.png)

![5](https://sunny-blog.oss-cn-beijing.aliyuncs.com/202211/1130/5.png)

```objc
id
_object_get_associative_reference(id object, const void *key)
{
    ObjcAssociation association{};

    {
        AssociationsManager manager;
        AssociationsHashMap &associations(manager.get());
        AssociationsHashMap::iterator i = associations.find((objc_object *)object); // 通过object可以获取ObjectAssociationMap
        if (i != associations.end()) {
            // 遍历AssociationsHashMap
            ObjectAssociationMap &refs = i->second;
            ObjectAssociationMap::iterator j = refs.find(key); // 通过key可以获得ObjcAssociation
            if (j != refs.end()) {
                // 遍历ObjectAssociationMap
                association = j->second;
                association.retainReturnedValue();
            }
        }
    }

    return association.autoreleaseReturnedValue(); // 返回取到的值
}
```

### 总结

通过上面分析，我们需要知道：

1. 关联对象并不是存储在被关联对象本身的内存里面，而是存储在一个全局的`AssociationsHashMap`里面。
2. 设置关联对象为`nil`就相当于是移除关联对象。
3. 移除所有的关联对象：`objc_removeAssoociatedObjects`。
4. 关联对象的策略里面没有 `weak`属性。
5. 关联对象被移除的时候，相应的关联属性也会被移除。

## 写在最后

关于关联对象的底层原理我们就简单分析到这里，如有错误请多多指教。





