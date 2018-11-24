/**
 * diff AST
 * 如果node.type发生变化，那就是replace，反则为update
 * update需要diff props与children
 *  1. props为object，保留key不用参与diff
 *  2. children是数组，需要一定的算法
 *
 * diff array
 * 1. 先删除，根据type是否在nextNode里存在
 * 2. diff filterPrevChildren与 nextChildren
 * 如果前后两次是node位置发生变化【比较复杂】
 *
 * 后一次插入了新的nodes【相对简单】
 * [1 2 3 4] [1 2 6 3 4]
 *
 * 每种类型的个数是一致的，那么就是移动
 * 每种类型的个数是不一致的，那么就是
 */


/**
 * 添加node diff，提升性能
 *
 * @export
 * @param {*} prevNode
 * @param {*} nextNode
 * @returns
 **/
export function diffNode(prevNode, nextNode) {
    if (!prevNode) {
        return {
            type: 'add',
            prevNode,
            nextNode,
        }
    }

    if (!nextNode) {
        return {
            type: 'del',
            prevNode,
            nextNode,
        }
    }

    if (prevNode.type !== nextNode.type) {
        // 如果类型不一样，就重新创建
        return {
            type: 'replace',
            prevNode,
            nextNode,
        }
    }

    // type一样，比对props与children
    const update = {
        type: 'update',
        prevNode,
        nextNode,
        propsChange: [],
        children: [],
    }

    const propsDiffResult = diffObject(prevNode, nextNode)
    if (propsDiffResult.length) {
        update.propsChange.push(...propsDiffResult)
    }

    update.children = diffArr(prevNode, nextNode).filter(i => i)

    // 如果真的有update
    if (update.propsChange.length + update.children.length > 0) {
        return update
    }

    // 如果前后节点没有发生变化，则继承上一个node上的相关信息
    nextNode.__htmlNode = prevNode.__htmlNode
    nextNode.__update = prevNode.__update

    return null;
}

// 判断数组是否一致
// v1版本不对数组diff的性能做优化
export function diffArr(prevNode, nextNode) {
    const { children: prevArr = [] } = prevNode
    const { children: nextArr = [] } = nextNode

    const nodeDiffResults = []
    // 如果是同type的数组，没有key，把删除第一个元素后，需要整体都在diff一边，如果有key的话，就可以先用key做一遍diff，而不用去diff props与children了
    // [ 1 2 3 4 ] [ 1 1 4 5 ]
    let filterPrevArr = prevArr.filter((item, index) => {
        // 如果nextArr中存在这个元素，就不删除此元素？ 有bug
        // 移除已存在的元素
        if (!nextArr[index] || nextArr[index].type !== item.type) {
            nodeDiffResults.push(diffNode(item, null))
            return false
        }
        return true
    })

    // 首先来讲filterPrevArr的所有type, nextArr内都是存在的，但可能数量是不一致的
    // [ 1 2 3 ] [ 1 4 3 5 2 ]
    // 4 在 [ 2 3 ] 中不存在，insert after 1
    // 3 在 [ 2 3 ] 中存在，但是3前面还有2，因此需要move，move到4后面
    // 5 在 [ 2 ] 中不存在, insert after 3
    // 2 早 [ 2 ] 中存在，保持不变

    // 新增
    nextArr.forEach((item, index) => {
        const nextType = item.type

        // console.log(filterPrevArr[index] && filterPrevArr[index].type, nextType)
        // 不存在或者类型一致
        return nodeDiffResults.push(diffNode(filterPrevArr[index], item))
        if (!filterPrevArr[index] || filterPrevArr[index].type === nextType) {
        }

        // 需要移动
        filterPrevArr = filterPrevArr.filter(prevItem => {
            if (prevItem.type === nextType) {
                const diffResult = diffNode(prevItem, item)
                // move update
                if (diffResult) {
                    nodeDiffResults.push({
                        ...diffResult,
                        moveTo: nextArr[index - 1],
                    })

                    console.log('need move node')
                }

                return false
            }
            return true
        })

        // 如果filterPrevArr中不存在
        return {
            type: 'add',
            nextNode: item,
            moveTo: nextArr[index - 1],
        }
    })

    return nodeDiffResults
}

// object diff
export function diffObject(prevNode = {}, nextNode = {}) {
    const prevKeys = Object.keys(prevNode)
    const nextKeys = Object.keys(nextNode)

    const change = [] // 删除
    prevKeys.forEach(key => {
        // 不需要参与diff的key
        if (['__htmlNode', '__parent', '__update', 'children', 'type'].includes(key)) {
            return
        }

        if (nextKeys.includes(key)) {
            if (prevNode[key] !== nextNode[key]) {
                change.push({
                    type: 'change',
                    key,
                    prevNode,
                    nextNode,
                })
            }
            return
        }
        change.push({
            type: 'del',
            key,
            prevNode,
            nextNode,
        })
    })

    nextKeys.forEach(key => {
        if (!prevKeys.includes(key)) {
            change.push({
                type: 'add',
                key,
                prevNode,
                nextNode,
            })
        }
    })

    return change
}
