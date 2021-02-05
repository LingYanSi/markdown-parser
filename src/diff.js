/**
 * diff AST
 * 如果node.type发生变化，那就是replace，反则为update
 * update需要diff props与children
 *  1. props为object，保留key不用参与diff
 *  2. children是数组，需要一定的算法
 *
 * diff array
 * 1. 先删除在nextNode里不存在的type
 * 2. 保留在nextNode里存在的type
 * 3. 删除剩余的元素，最后得到 prevKeepArr
 * 4. nextNode 与 prevKeepArr 最对比，进行move/add操作，
 *      需要注意的是在获取操作的过程，需要丢prevKeepArr进行同步更新
 *      不然会导致操作混乱，数据不一致
 * 5. 返回diff结果
 */

// 为node添加id
/** @typedef {import("./../@type/index").AST} AST */

const NO_NEED_DIFF = [
    '$getNode',
    '__node',
    '__parent',
    '__update',
    'children',
    'type',
    'raw',
];

/**
 * diff对象差异
 * @export
 * @param {AST} [prevNode={}]
 * @param {AST} [nextNode={}]
 * @returns
 */
export function diffObject(prevNode = {}, nextNode = {}) {
    const prevKeys = Object.keys(prevNode);
    const nextKeys = Object.keys(nextNode);

    const change = []; // 删除
    prevKeys.forEach((key) => {
        // 不需要参与diff的key
        if (NO_NEED_DIFF.includes(key)) {
            return;
        }

        if (nextKeys.includes(key)) {
            if (prevNode[key] !== nextNode[key]) {
                change.push({
                    type: 'change',
                    key,
                    prevNode,
                    nextNode,
                });
            }
            return;
        }
        change.push({
            type: 'del',
            key,
            prevNode,
            nextNode,
        });
    });

    nextKeys.forEach((key) => {
        if (!prevKeys.includes(key)) {
            change.push({
                type: 'add',
                key,
                prevNode,
                nextNode,
            });
        }
    });

    return change;
}

/**
 * 添加node diff，提升性能
 * @export
 * @param {AST} prevNode
 * @param {AST} nextNode
 * @returns
 **/
export function diffNode(
    prevNode,
    nextNode,
    diffResultArr = [],
    otherInfo = {}
) {
    if (prevNode === nextNode) return diffResultArr;

    if (!prevNode) {
        diffResultArr.push({
            type: 'add',
            prevNode,
            nextNode,
            ...otherInfo,
        });
    } else if (!nextNode) {
        diffResultArr.push({
            type: 'del',
            prevNode,
            nextNode,
            ...otherInfo,
        });
    } else if (prevNode.type !== nextNode.type) {
        // 如果类型不一样，就重新创建
        diffResultArr.push({
            type: 'replace',
            prevNode,
            nextNode,
            ...otherInfo,
        });
    } else {
        // type一样，比对props与children
        const update = {
            type: 'update',
            prevNode,
            nextNode,
            propsChange: [],
        };

        update.propsChange.push(...diffObject(prevNode, nextNode));

        // 如果前后节点没有发生变化，则继承上一个node上的相关信息
        nextNode.$getNode = prevNode.$getNode;
        nextNode.__update = prevNode.__update;

        if (update.propsChange.length) {
            diffResultArr.push(update);
        }

        // 如果一个节点上的children 没有任何改变可以，忽略这个children
        // 如果一个节点上的，update的props为空
        // 甚至来讲可以把tree拍成一维数组
        diffArr(prevNode, nextNode, diffResultArr);
    }

    return diffResultArr;
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
export function diffArr(prevNode, nextNode, diffResultArr = []) {
    const { children: prevArr = [] } = prevNode;
    const { children: nextArr = [] } = nextNode;

    // 如果不存在这个type类型，需要删除
    let filterPrevArr = prevArr.filter((item) => {
        if (!nextArr.some((i) => i.type === item.type)) {
            diffNode(item, null, diffResultArr);
            return false;
        }
        return true;
    });

    // 取有效元素
    nextArr.forEach((item) => {
        filterPrevArr.some((ele, index) => {
            if (ele.type === item.type) {
                filterPrevArr[index] = { isDel: true, ele };
                return true;
            }
            return false;
        });
    });

    // 删除剩余元素
    filterPrevArr
        .filter((i) => !i.isDel)
        .forEach((item) => diffNode(item, null, diffResultArr));

    // 取出有用的元素
    const ff = filterPrevArr.filter((i) => i.isDel).map((i) => i.ele);

    // 最后的move/update add
    nextArr.forEach((item, moveTo) => {
        const isMatch = ff.some((ele, index) => {
            if (ele.type === item.type) {
                // 注释元素，表示其已经使用过了
                ff.splice(index, 1);
                // 需要把ff的元素位置进行实时更新，否则将会出现位置错乱
                ff.splice(moveTo > index ? moveTo - 1 : moveTo, 0, {
                    used: true,
                    ele,
                });

                if (index !== moveTo) {
                    diffResultArr.push({
                        type: 'move',
                        prevNode: ele,
                        nextNode: item,
                        current: index,
                        // 如果目标位置大于当前位置，则需要移动的目标元素下一个元素的前面
                        moveTo: moveTo > index ? moveTo + 1 : moveTo,
                    });
                }
                // 元素需要先移动
                diffNode(ele, item, diffResultArr);
                return true;
            }
            return false;
        });

        if (!isMatch) {
            // 使用占用元素，以矫正index
            ff.splice(moveTo, 0, { add: true, item });
            diffNode(null, item, diffResultArr, { moveTo });
        }
    });
    // 首先来讲filterPrevArr的所有type, nextArr内都是存在的，但可能数量是不一致的
    // [ 1 2 3 ] [ 1 4 3 5 2 ]
    // 4 在 [ 2 3 ] 中不存在，insert after 1
    // 3 在 [ 2 3 ] 中存在，但是3前面还有2，因此需要move，move到4后面
    // 5 在 [ 2 ] 中不存在, insert after 3
    // 2 早 [ 2 ] 中存在，保持不变
}
