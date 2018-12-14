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

    return update;
}

// 判断数组是否一致
// v1版本不对数组diff的性能做优化
// 需要添加replace功能
/**
 * prevArr nextArr
 * 从prevArr中取出nextArr中所含有的type，为filterArr
 * 然后对filterArr中的元素进行move update add
 * 然后做 patch
 * @export
 * @param {*} prevNode
 * @param {*} nextNode
 * @returns
 */
export function diffArr(prevNode, nextNode) {
    const { children: prevArr = [] } = prevNode
    const { children: nextArr = [] } = nextNode

    const delArr = []
    const addArr = []
    const moveArr = []
    const updateArr = []

    // 如果不存在这个type类型，需要删除
    let filterPrevArr = prevArr.filter((item, index) => {
        if (!nextArr.some(i => i.type === item.type)) {
            delArr.push(diffNode(item, null))
            return false
        }
        return true
    })

    // 取有效元素
    nextArr.forEach((item, moveTo) => {
        filterPrevArr.some((ele, index) => {
            if (ele.type === item.type) {
                filterPrevArr[index] = { isDel: true, ele }
                return true
            }
            return false
        })
    })

    // 删除剩余元素
    filterPrevArr.filter(i => !i.isDel).forEach(item => delArr.push(diffNode(item, null)))

    // 去除有用的元素
    const ff = filterPrevArr.filter(i => i.isDel).map(i => i.ele)

    // 最后的move/update add
    nextArr.forEach((item, moveTo) => {
        const isMatch = ff.some((ele, index) => {
            if (ele.type === item.type) {
                // 注释元素，表示其已经使用过了
                ff.splice(index, 1)
                // 需要把ff的元素位置进行实时更新，否则将会出现位置错乱
                ff.splice(moveTo > index ? moveTo - 1 : moveTo, 0, { used: true, ele })

                if (index !== moveTo) {
                    moveArr.push({
                        type: 'move',
                        prevNode: ele,
                        nextNode: item,
                        current: index,
                        // 如果目标位置大于当前位置，则需要移动的目标元素下一个元素的前面
                        moveTo: moveTo > index ? moveTo + 1 : moveTo,
                    })
                }
                const result = diffNode(ele, item)
                moveArr.push(result) // 元素需要先移动
                return true
            }
            return false
        })

        if (!isMatch) {
            // 使用占用元素，以矫正index
            ff.splice(moveTo, 0, { add: true, item })
            const result = diffNode(null, item)
            moveArr.push({
                ...result,
                moveTo,
            })
        }
    })

    return [
        ...delArr,
        ...moveArr,
        ...updateArr,
        ...addArr,
    ]

    // 首先来讲filterPrevArr的所有type, nextArr内都是存在的，但可能数量是不一致的
    // [ 1 2 3 ] [ 1 4 3 5 2 ]
    // 4 在 [ 2 3 ] 中不存在，insert after 1
    // 3 在 [ 2 3 ] 中存在，但是3前面还有2，因此需要move，move到4后面
    // 5 在 [ 2 ] 中不存在, insert after 3
    // 2 早 [ 2 ] 中存在，保持不变
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
