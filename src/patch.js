import { trans } from './index.js'

/**@typedef {import("../@type").DiffResult} DiffResult */

function insertBefore(newDom, refDom) {
    if (refDom && refDom.parentElement) {
        refDom.parentElement.insertBefore(newDom, refDom)
    }
    return newDom
}

/**
 *
 * 对diff结果做patch
 * @param {DiffResult} diffResult
 */
export default function patch(diffResult = [], $container = document.body) {
    diffResult.forEach(item => {
        const { nextNode } = item
        switch (item.type) {
            case 'del': {
                const $prevNodeDom = item.prevNode.$getNode(item.type)
                if (!$prevNodeDom.parentElement) {
                    console.log('delete error::', item)
                }
                $prevNodeDom.parentElement.removeChild($prevNodeDom)
                break
            }

            case 'add': {
                const $realContainer = (nextNode.__parent && nextNode.__parent.$getNode(item.type)) || $container
                trans(nextNode, $realContainer, {
                    // 自定义新节点的插入位置，而不是所有的插在末尾处
                    beforeAppend(ele) {
                        const ref = $realContainer.childNodes[item.moveTo]
                        if (ref) {
                            insertBefore(ele, ref)
                            return true
                        }
                    }
                })
                break
            }

            case 'replace': {
                const $prevNodeDom = item.prevNode.$getNode(item.type)
                const $parent = document.createDocumentFragment()
                trans(nextNode, $parent)
                $prevNodeDom.parentElement.replaceChild($parent, $prevNodeDom)
                break
            }

            case 'move': {
                let { moveTo } = item
                const { prevNode } = item
                const $prevNodeDom = prevNode.$getNode(item.type)
                const parent = $prevNodeDom.parentElement

                // 如果目标元素和当前元素相同，则不用移动
                if (parent.childNodes[moveTo] !==  $prevNodeDom) {
                    if (parent.childNodes[moveTo]) {
                        insertBefore($prevNodeDom, parent.childNodes[moveTo])
                    } else {
                        parent.appendChild($prevNodeDom)
                    }
                }
                break
            }

            case 'update': {
                const { propsChange, prevNode, nextNode } = item
                const $prevNodeDom = prevNode.$getNode(item.type)
                // 继承htmlNode
                nextNode.$getNode = prevNode.$getNode
                if (prevNode.__node) {
                    nextNode.__node = prevNode.__node
                }

                // 继承update
                if (prevNode.__update) {
                    nextNode.__update = prevNode.__update
                }

                propsChange.forEach(item => {
                    const { key } = item;

                    switch(item.type) {
                        case 'change':
                        case 'add': {
                            const newValue = nextNode[key]
                            // 如果有自带更新方法
                            if (prevNode.__update) {
                                prevNode.__update(key, nextNode)
                                break
                            }

                            // 更新文本节点
                            if ($prevNodeDom instanceof Text) {
                                $prevNodeDom.data = newValue
                                break
                            }

                            // 更新其他属性
                            $prevNodeDom.setAttribute(key, newValue)
                            break
                        }
                        case 'del': {
                            $prevNodeDom.removeAttribute(key)
                            break
                        }
                    }
                })

                break
            }
            default: {
                console.error('canot handle type', item, item.type)
            }
        }
    })
}
