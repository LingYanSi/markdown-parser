import { trans } from './index.js'

class DiffResult {
    constructor() {
        this.type = ''
        this.prevNode = {
            type: '',
            children: [],
            __htmlNode: document.body,
        }
        this.nextNode = {
            type: '',
            children: [],
            propsChange: [],
            __moveTo: {},
        }
        this.children = []
        this.propsChange = []
    }
}

function insertBefore(newDom, refDom) {
    if (refDom && refDom.parentElement) {
        refDom.parentElement.insertBefore(newDom, refDom)
    }
    return newDom
}

function findIndex(ele) {
    console.log(ele)
    const childNodes = ele.parentElement.childNodes
    for (let i = 0, len = childNodes.length; i < len; i++) {
        if (childNodes[i] === ele) {
            return i
        }
    }
}

/**
 *
 * 对diff结果做patch
 * @param {DiffResult} diffResult
 */
export default function patch(diffResult, $container = document.body) {
    if (!diffResult) return

    const { nextNode } = diffResult
    switch (diffResult.type) {
        case 'del': {
            const { __htmlNode } = diffResult.prevNode
            if (!__htmlNode.parentElement) {
                console.log('delete error::', diffResult)
            }
            __htmlNode.parentElement.removeChild(__htmlNode)
            break
        }

        case 'add': {
            trans(nextNode, $container, {
                beforeAppend(ele) {
                    const ref = $container.childNodes[diffResult.moveTo]
                    if (ref) {
                        insertBefore(ele, ref)
                        return true
                    }
                }
            })
            break
        }

        case 'replace': {
            const { __htmlNode } = diffResult.prevNode
            const $parent = document.createDocumentFragment()
            trans(nextNode, $parent)
            __htmlNode.parentElement.replaceChild($parent, __htmlNode)
            break
        }

        case 'move': {
            let { moveTo } = diffResult
            const { prevNode } = diffResult
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
            const { propsChange, children, prevNode, nextNode } = diffResult
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
            children.forEach(diff => patch(diff, __htmlNode))

            break
        }
        default: {
            console.error('canot handle type', diffResult, diffResult.type)
        }
    }
}
