---
title: 【iOS重学】从LCS到IGListKit框架中的Diff算法（下）
author: Sunny
tags:
  - iOS
  - IGListKit
  - Diff
categories:
  - iOS
cover: >-
  https://sunny-blog.oss-cn-beijing.aliyuncs.com/%E5%8D%9A%E5%AE%A2%E5%B0%81%E9%9D%A2%E5%9B%BE%E6%96%87%E4%BB%B6/cover17.jpg
katex: true
abbrlink: 62fa33fe
date: 2022-06-10 12:08:09
---

## 写在前面

在上一篇文章[从LCS到IGListKit框架中的Diff算法（上）](https://codersunny.com/%E4%BB%8ELCS%E5%88%B0IGListKit%E6%A1%86%E6%9E%B6%E4%B8%AD%E7%9A%84Diff%E7%AE%97%E6%B3%95%EF%BC%88%E4%B8%8A%EF%BC%89/)中我们详细讲了 $LCS$ 是什么、怎么使用动态规划来求解 $LCS$ ，最后我们也抛出了 $LCS$ 还存在的两个问题，本篇文章我们就主要来分析IGListKit框架中的Diff是如何来解决这两个问题的。

> **温馨提示**：本文主要剖析IGListKit框架中的Diff算法，不会讲IGListKit框架的具体使用。

## $LCS$ 存在的问题带来的思考

上一篇文章我们提出了 $LCS$ 存在的两个问题：

+ 但是当n特别大的时候，$O(n^2)$ 这个时间复杂度依然比较可怕。
+ 希望对新、旧数据都存在的元素的Move进行一些优化，而不是简单的Delete、Insert操作。

Instagram团队的IGListKit框架结合Paul Heckel’s Diff（1978年）的[一篇论文](https://dl.acm.org/doi/10.1145/359460.359467)做了进一步的优化，使用一些额外的内存空间，把时间复杂度降低到了$O(n)$ ，并且能够准确获取数据元素的Move/Insert等操作。

这里，我们还以上一篇文章的两个序列为例：

$X = <A,D,F,G,T>$

$Y = <A,T,O,X,F>$

求 $X$ 和 $Y$ 的 $LCS$

![2022060906](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20221102/2022060906.png)

我们首先需要处理的是避免使用二维数组，我们结合上图会发现重要的只是我们标记的这条线路，其他位置我们并没有用到，那么需要走一遍的距离就是：$m + n - LCS的长度$

所以，肯定要走过所有去重之后的元素，仔细思考一下，对于每个元素，我们需要的是什么？

<label style="color:green">我们需要的是元素在新数据和旧数据里面的位置。</label>

## IGListKit框架的刷新流程

![2022061001](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220610/2022061001.png)

![2022061002](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220610/2022061002.png)

![2022061003](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220610/2022061003.png)

![2022061004](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220610/2022061004.png)

![2022061005](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220610/2022061005.png)

![2022061006](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220610/2022061006.png)

![2022061007](https://sunny-blog.oss-cn-beijing.aliyuncs.com/20220610/2022061007.png)

到这里，我们已经跟踪到IGListKit框架刷新机制的核心部分：**IGListDiff类中的IGListDiffing函数**，接下来就是本文的重点了：IGListDiff是如何实现的？

## IGListDiff算法详解

在理解Diff算法之前我们先来熟悉几个数据结构、函数体：`IGListIndexSetResult`、`IGListEntry`、`IGListRecord`、`IGListDiffable`、`IGListMoveIndex`。

### IGListMoveIndex

`IGListMoveIndex` 封装的是一个移动的操作，`from`是旧数组的索引，`to`是新数组的索引：

```objc
@interface IGListMoveIndex : NSObject
  
// 旧数组的索引
@property (nonatomic, assign, readonly) NSInteger from;
// 新数组的索引
@property (nonatomic, assign, readonly) NSInteger to;

@end
```

### IGListIndexSetResult

`IGListIndexSetResult`封装的是一个关于插入、删除等操作的集合：

```objc
@interface IGListIndexSetResult : NSObject
  
// 插入索引的集合（新数组的索引）
@property (nonatomic, strong, readonly) NSIndexSet *inserts;
// 删除索引的集合（旧数组的索引）
@property (nonatomic, strong, readonly) NSIndexSet *deletes;
// 更新索引的集合（旧数组的索引）
@property (nonatomic, strong, readonly) NSIndexSet *updates;
// 移动索引的集合
@property (nonatomic, copy, readonly) NSArray<IGListMoveIndex *> *moves;
// 是否发生改变
@property (nonatomic, assign, readonly) BOOL hasChanges;

@end
```

### IGListDiffable

`IGListDiffable`是一个协议，要求数组里的对象都需要遵循这个协议才能有效地使用`diff`函数：

```objc
@protocol IGListDiffable
 
// 返回对象唯一id，在diff算法中以它作为元素存入哈希表的key
- (nonnull id<NSObject>)diffIdentifier;
// 判断两个对象是否相等，在diff算法用这个方法判断两个对象是否是同一个对象
- (BOOL)isEqualToDiffableObject:(nullable id<IGListDiffable>)object;

@end
```

### IGListEntry

`IGListEntry`是用于标记元素状态的结构体：

```objc
struct IGListEntry {
    // 该元素在旧数组中出现的次数
    NSInteger oldCounter = 0;
    // 该元素在新数组中出现的次数
    NSInteger newCounter = 0;
    // 存放元素在旧数组中的索引，在算法中，可以保证栈顶是较小的索引
    stack<NSInteger> oldIndexes;
    // 这个元素是否需要更新
    BOOL updated = NO;
};
```

### IGListRecord

`ICListRecord`是封装`entry`结构体和它所在的索引，主要用于插入和删除（如果`index`有值，则代表该元素需要插入或者更新，否则为`NSNotFound`，则是需要删除）

```objc
struct IGListRecord {
    IGListEntry *entry;
    mutable NSInteger index;
    IGListRecord() {
        entry = NULL;
        index = NSNotFound;
    }
};
```

### IGListDiffing函数的算法流程

**变量的声明**：

```objc
const NSInteger newCount = newArray.count;
const NSInteger oldCount = oldArray.count;

NSMapTable *oldMap = [NSMapTable strongToStrongObjectsMapTable];
NSMapTable *newMap = [NSMapTable strongToStrongObjectsMapTable];
```

**处理特殊情况**:

如果`newcount == 0` 或 `oldcount == 0`，即是删除所有旧元素或新增所有新元素，直接返回`IGListIndexSetResult`集合，不需要走下面的`diff`算法流程。

```objc
if (newCount == 0) {
  return [[IGListIndexSetResult alloc] initWithInserts:[NSIndexSet new]
                                               deletes:[NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, oldCount)]
                                               updates:[NSIndexSet new]
                                                           moves:[NSArray new]
                                           oldIndexMap:oldMap
                                           newIndexMap:newMap];
}

if (oldCount == 0) {
  [newArray enumerateObjectsUsingBlock:^(id<IGListDiffable> obj, NSUInteger idx, BOOL *stop) {
        addIndexToMap(returnIndexPaths, toSection, idx, obj, newMap);
  }];
  return [[IGListIndexSetResult alloc] initWithInserts:[NSIndexSet indexSetWithIndexesInRange:NSMakeRange(0, newCount)]
                                               deletes:[NSIndexSet new]
                                               updates:[NSIndexSet new]
                                                 moves:[NSArray new]
                                           oldIndexMap:oldMap
                                           newIndexMap:newMap];
}
```

**Diff算法第一步**：

先定义一个无序去重`unordered_map`的`table`，以`diffIdentifier`为Key，`entry`为Value，其查找复杂度为$O(1)$。

```objc
unordered_map<id<NSObject>, IGListEntry, IGListHashID, IGListEqualID> table;
```

正序遍历新数组：

```objc
vector<IGListRecord> newResultsArray(newCount);
for (NSInteger i = 0; i < newCount; i++) {
  // 1.取每个元素的identifier
  id<NSObject> key = IGListTableKey(newArray[i]);
  // 2.为每个元素创建一个entry,如果table里面不含这个key就创建
  IGListEntry &entry = table[key];
  // 3.entry的newCounter值 +1
  entry.newCounter++;
  // 4.NSNotFound入栈：目的是防止oldIndexes为空，NSNotFound相当于栈底的标志位
  entry.oldIndexes.push(NSNotFound);
  newResultsArray[i].entry = &entry;
}
```

**Diff算法第二步**：

倒序遍历旧数组：

```objc
vector<IGListRecord> oldResultsArray(oldCount);
for (NSInteger i = oldCount - 1; i >= 0; i--) {
  // 1.取每个元素的identifier
  id<NSObject> key = IGListTableKey(oldArray[i]);
  IGListEntry &entry = table[key];
  // 2.entry的olderCounter值 + 1
  entry.oldCounter++;
  // 4.将索引i入栈
  entry.oldIndexes.push(i);
  oldResultsArray[i].entry = &entry;
}
```

> **温馨提示**：这里采用倒序遍历是为了保证，当存在多个key相同的时候，oldIndexes会有一系列的索引入栈，保证栈顶的索引是最小的。

> **分析**：
>
> 在上面两部之后，会建立一个用于存放`IGListRecord`的`oldResultsArray`，此时每个`IGListRecord`仍为`NSNotFound`，对于`oldResultsArray`和 `newResultsArray`中的`entry`，会有三种情况：
>
> + 该元素只有新数组有，则`entry`的`newCounter`>0，`oldCounter`=0,`oldIndexes`栈顶为`NSNotFound`。
> + 该元素只有旧数组有，则`entry`的`newCounter`=0，`oldCounter`>0,`oldIndexes`栈顶不为`NSNotFound`，而是元素在旧数组中的最小索引。
> + 该元素新旧数组都有，则`entry`的`newCounter`>0，`oldCounter`>0,`oldIndexes`栈顶不为`NSNotFound`，而是元素在旧数组中的最小索引,而`oldResultsArray`和`newResultsArray`都指向同一个`entry`。

**Diff算法第三步**：

处理同时出现在新、旧数组里面的都存在的元素(**注意**：这里所说的存在的元素不是指两个元素的值相，而是我们指定的identifier相等，这一点大家要注意一下)，其IGListRecord的index会赋上新、旧数据的索引：

```objc
for (NSInteger i = 0; i < newCount; i++) {
    // 1. 取出新数组中元素对应的entry
    IGListEntry *entry = newResultsArray[i].entry;
    NSCAssert(!entry->oldIndexes.empty(), @"Old indexes is empty while iterating new item %li. Should have NSNotFound", (long)i);
  
    // 2.拿到oldIndexes的栈顶，也就是拿到该元素在oldArray的第一个索引，然后pop出来
    const NSInteger originalIndex = entry->oldIndexes.top();
    entry->oldIndexes.pop();
    if (originalIndex < oldCount) {
        const id<IGListDiffable> n = newArray[i];
        const id<IGListDiffable> o = oldArray[originalIndex];
        switch (option) {
            case IGListDiffPointerPersonality:
            if (n != o) {
                entry->updated = YES;
            }
            break;
            case IGListDiffEquality:
            if (n != o && ![n isEqualToDiffableObject:o]) {
                // 3.标记需要更新
                entry->updated = YES;
            }
            break;
        }
    }
    if (originalIndex != NSNotFound && entry->newCounter > 0 && entry->oldCounter > 0) {
        // 4.如果用identifier标记的元素在新旧数据中都存在 那么新数组对应元素的index会指向这个元素在老数据中的索引
        newResultsArray[i].index = originalIndex;
        oldResultsArray[originalIndex].index = i;
    }
}
    
```

**Diff算法第四步**：

遍历老数据，处理需要删除的元素：

```objc
id mInserts, mMoves, mUpdates, mDeletes;
if (returnIndexPaths) {
    mInserts = [NSMutableArray<NSIndexPath *> new];
    mMoves = [NSMutableArray<IGListMoveIndexPath *> new];
    mUpdates = [NSMutableArray<NSIndexPath *> new];
    mDeletes = [NSMutableArray<NSIndexPath *> new];
} else {
    mInserts = [NSMutableIndexSet new];
    mMoves = [NSMutableArray<IGListMoveIndex *> new];
    mUpdates = [NSMutableIndexSet new];
    mDeletes = [NSMutableIndexSet new];
}

vector<NSInteger> deleteOffsets(oldCount), insertOffsets(newCount);
NSInteger runningOffset = 0;

for (NSInteger i = 0; i < oldCount; i++) {
      deleteOffsets[i] = runningOffset;
      const IGListRecord record = oldResultsArray[i];
  		// 1.如果记录每个元素的entey记录record里面index的值不存在，则把该元素标记为删除
      if (record.index == NSNotFound) {
          addIndexToCollection(returnIndexPaths, mDeletes, fromSection, i);
          runningOffset++;
      }
      addIndexToMap(returnIndexPaths, fromSection, i, oldArray[i], oldMap);
  }
```

**Diff算法第五步**：

```objc
runningOffset = 0;
for (NSInteger i = 0; i < newCount; i++) {
  insertOffsets[i] = runningOffset;
  const IGListRecord record = newResultsArray[i];
  const NSInteger oldIndex = record.index;
  // 1.如果记录每个元素的entey记录record里面index的值不存在，则把该元素标记为插入
  if (record.index == NSNotFound) {
      addIndexToCollection(returnIndexPaths, mInserts, toSection, i);
      runningOffset++;
  } else {
      // 2.如果记录每个元素的entey里面updated标记为YES，则标记该元素为更新
      if (record.entry->updated) {
          addIndexToCollection(returnIndexPaths, mUpdates, fromSection, oldIndex);
      }
    // 3.标记该元素为移动
      const NSInteger insertOffset = insertOffsets[i];
      const NSInteger deleteOffset = deleteOffsets[oldIndex];
      if ((oldIndex - deleteOffset + insertOffset) != i) {
          id move;
          if (returnIndexPaths) {
              NSIndexPath *from = [NSIndexPath indexPathForItem:oldIndex inSection:fromSection];
              NSIndexPath *to = [NSIndexPath indexPathForItem:i inSection:toSection];
              move = [[IGListMoveIndexPath alloc] initWithFrom:from to:to];
          } else {
              move = [[IGListMoveIndex alloc] initWithFrom:oldIndex to:i];
          }
          [mMoves addObject:move];
      }
}
```

**Diff算法第六步**：

处理完`插入`、`删除`、`更新`、`移动`之后，返回`IGListIndexSetResult`类型的值，到这里，IGListKit框架中整个`Diff` 核心部分就结束了，只讲原理肯定很空洞，我们这里举一个实际的例子来走一遍这个`Diff`的流程，加深印象和理解。

## 实际刷新举例说明

**一**、现在比如一个UICollectionView列表中的初始数据为`oldDatasource`，数据如下：

```objc
BasicModel *model0 = [[BasicModel alloc] init];
model0.modelId = @"123";
model0.title = @"A";
BasicModel *model1 = [[BasicModel alloc] init];
model1.modelId = @"234";
model1.title = @"B";
BasicModel *model2 = [[BasicModel alloc] init];
model2.modelId = @"345";
model2.title = @"C";
[self.oldDatasource addObjectsFromArray:@[model0,model1,model2]];
```

**二**、刷新后的数据为`freshDatasource`，数据如下：

```objc
BasicModel *model3 = [[BasicModel alloc] init];
model3.modelId = @"123";
model3.title = @"D";
BasicModel *model4 = [[BasicModel alloc] init];
model4.modelId = @"345";
model4.title = @"C";
BasicModel *model5 = [[BasicModel alloc] init];
model5.modelId = @"456";
model5.title = @"E";
[self.freshDatasource addObjectsFromArray:@[model3,model4,model5]];
```

**三**、在`BasicModel`中遵守`<IGListDiffable>`协议，实现下面两个方法：

```objc
@implementation BasicModel

// 返回对象唯一id，在diff算法中以它作为元素存入哈希表的key
- (id<NSObject>)diffIdentifier {
    if (self.modelId) {
        return self.modelId;
    }
    return self;
}

// 判断两个对象是否相等，在diff算法用这个方法判断两个对象是否是同一个对象
- (BOOL)isEqualToDiffableObject:(BasicModel <IGListDiffable>*)object {
    return [self isEqual:object];
}

@end
```

**四**、经过`Diff核心算法第一步`之后的结构如下：

```objc
newResultsArray里面有三个 IGListRecord 类型的元素，元素里面的entry情况如下：
  
entry[D].newCounter = 1;
entry[D].oldIndexes.pop() = NSNotFound;
entry[D].updated = NO;

entry[C].newCounter = 1;
entry[C].oldIndexes.pop() = NSNotFound;
entry[C].updated = NO;

entry[E].newCounter = 1;
entry[E].oldIndexes.pop() = NSNotFound;
entry[E].updated = NO;
```

**五**、经过`Diff核心算法第二步`之后的结构如下：

```objc
oldResultsArray里面有三个 IGListRecord 类型的元素，元素里面的entry情况如下：

entry[C].oldCounter = 1;
entry[C].oldIndexes.pop() = 2;
entry[C].updated = NO;

entry[B].oldCounter = 1;
entry[B].oldIndexes.pop() = 1;
entry[B].updated = NO;

entry[A].oldCounter = 1;
entry[A].oldIndexes.pop() = 0;
entry[A].updated = NO;
```

**六**、经过`Diff核心算法第三步`之后的结构如下：

```objc
entry[D].updated = YES; // 因为A元素 和 D元素的 modelID一样 标记为刷新
entry[C].updated = YES; // 新老数据里面都有C元素 并且modelID一样 标记为刷新

// A 和 D 的record
newResultsArray[0].index = 0;
oldResultsArray[0].index = 0;

// C 在新老数据中的record
newResultsArray[1].index = 2;
oldResultsArray[2].index = 1;
```

**七**、经过`Diff核心算法第四步`之后的结构如下：

```objc
因为 oldResultsArray[1].index = NSNotFound，所以老数据中这个位置元素需要被删除，即是数据B。
```

**八**、经过`Diff核心算法第五步`之后的结构如下：

```objc
因为 newResultsArray[2].index = NSNotFound，所以新数据中这个位置元素需要插入，即是数据E。

D元素是更新，C元素是移动。
```

**九**、最后的结论：

```objc
Insert: E
Update: D(A -> D)
Move: C
Delete: B
```

## 总结

看到这里，相信大家对IGListKit框架中Diff算法实现原理有了一个更加清晰的了解，这个算法的时间复杂度就变成了$O(n)$，ICListKit框架就是通过这种刷新机制来提升了APP的整体性能。





























