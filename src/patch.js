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
                const { __htmlNode } = item.prevNode
                if (!__htmlNode.parentElement) {
                    console.log('delete error::', item)
                }
                __htmlNode.parentElement.removeChild(__htmlNode)
                break
            }

            case 'add': {
                const $realContainer = (nextNode.__parent && nextNode.__parent.__htmlNode) || $container
                console.log('addd', $realContainer, nextNode)

                trans(nextNode, $realContainer, {
                    beforeAppend(ele) {
                        console.log(ele)
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
                const { __htmlNode } = item.prevNode
                const $parent = document.createDocumentFragment()
                trans(nextNode, $parent)
                __htmlNode.parentElement.replaceChild($parent, __htmlNode)
                break
            }

            case 'move': {
                let { moveTo } = item
                const { prevNode } = item
                const parent = prevNode.__htmlNode.parentElement

                // 如果目标元素和当前元素相同，则不用移动
                if (parent.childNodes[moveTo] !== prevNode.__htmlNode) {
                    if (parent.childNodes[moveTo]) {
                        insertBefore(prevNode.__htmlNode, parent.childNodes[moveTo])
                    } else {
                        parent.appendChild(prevNode.__htmlNode)
                    }
                }
                break
            }

            case 'update': {
                const { propsChange, prevNode, nextNode } = item
                const { __htmlNode } = prevNode
                // 继承htmlNode
                nextNode.__htmlNode = __htmlNode

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
                            if (__htmlNode instanceof Text) {
                                __htmlNode.data = newValue
                                break
                            }

                            // 更新其他属性
                            __htmlNode.setAttribute(key, newValue)
                            break
                        }
                        case 'del': {
                            __htmlNode.removeAttribute(key)
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
