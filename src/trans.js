/**
 * AST转HTMLNode
 * 转换结束后AST上需要有HTMLNode的引用，方便下次patch，对HTMLNode做增删改
 * AST也应该提供props update方法，用来处理props更新
 */

// 获取节点上的所有文本信息
function getText(node, str = '') {
    if (node.type === 'text') {
        str += node.value || ''
    }
    node.children && node.children.forEach((child) => {
        str += getText(child)
    })
    return str
}

class ASTNode {
    constructor() {
        this.type = ''
        this.children = []
        this.src = ''
        this.alt = ''
        this.language = ''
        this.value = ''
    }
}

/**
 * AST 转 dom
 * @param {ASTNode} node
 * @param {HTMLElement} $parent
 */
export default function trans(node, $parent, option = {}) {
    let ele

    switch (node.type) {
        case 'audio':
        case 'video': {
            // 处理iframe
            // 我们允许添加iframe，但是限制iframe的大小
            if (/^<iframe(\s*.+)*><\/iframe>$/.test(node.src.trim())) {
                ele = document.createElement('div')
                ele.className = 'audio'

                // https 不允许加载http的iframe
                ele.innerHTML = node.src.replace('http://', '//')

                const iframe = ele.querySelector('iframe')
                iframe.style.cssText += ';max-width: 100%; max-height: 60vw; overflow: hidden;'
            } else {
                ele = document.createElement(node.type)
                ele.src = node.src
                ele.alt = node.alt
                ele.controls = 'true'
            }
            break
        }
        case 'img':
        {
            const result = node.src.match(/\.(\d+)x(\d+)\./)
            if (result) {
                const [width, height] = result.slice(1, 3)
                // 图片宽高占位
                const { src } = node
                ele = document.createElement('div')
                ele.style.cssText = `;position: relative; max-width: ${width}px; overflow: hidden; background: rgb(219, 221, 215);`
                ele.innerHTML = `<div style="padding-top: ${height / width * 100}%;">
                            <img ${LY.lazyLoad.caches.includes(src) ? `src="${src}" data-img-cache="true"` : ''}
                                class="lazy-load-img img-loading"
                                data-lazy-img="${node.src}"
                                data-src="${node.src}"
                                style="position: absolute; width: 100%; height: 100%; top: 0;" />
                        </div>`
                break
            } else {
                ele = document.createElement(node.type)
                ele.src = node.src
                ele.alt = node.alt
                break
            }
        }
        case 'text':
        {
            const text = node.value
            ele = document.createTextNode(text)
            break
        }
        case 'br':
        {
            ele = document.createElement(node.type)
            break
        }
        case 'a':
        {
            ele = document.createElement(node.type)
            ele.href = node.href
            ele.target = '_blank'
            break
        }
        case 'code':
        {
            ele = document.createElement('pre')
            const code = document.createElement('code')
            // 需要在node上添加__update方法，方便更新属性
            node.__update = (key, newNode) => {
                switch (key) {
                    case 'language': {
                        code.className = ['highlight', newNode[key] || ''].join(' ')
                        break;
                    }
                    case 'value': {
                        code.textContent = newNode[key] // 不能使用innerHTML
                        break
                    }
                    default:
                        break;
                }
            }
            node.__update('language', node)
            node.__update('value', node)
            ele.appendChild(code)
            break
        }
        case 'inlineCode': {
            ele = document.createElement('code')
            ele.className = 'inlineCode'
            break
        }
        case 'h1':
        {
            ele = document.createElement(node.type)
            const a = document.createElement('a')
            const id = getText(node)
            a.href = `#${id}`
            a.id = id
            ele.appendChild(a)
            break
        }
        case 'ul':
        {
            ele = document.createElement(node.type)
            node.__update = (key, nodeNode) => {
                ele.style.cssText += `;list-style-type:${nodeNode[key]};`
            }
            node.__update('listStyleType', node)
            break
        }
        case 'lineThrough': {
            ele = document.createElement('span')
            ele.style.cssText += `;text-decoration: line-through;`
            break
        }
        case 'todoItem': {
            ele = document.createElement('input')
            ele.type = 'checkbox'
            ele.checked = node.checked
            break
        }
        default:
        {
            ele = document.createElement(node.type)
            node.indent && (ele.style.cssText += ';padding-left: 2em;')
            // table表格需要设置边框
            if (node.type == 'table') {
                ele.setAttribute('border', '1')
            }
        }
    }

    node.tag && ele.setAttribute('tag', node.tag)
    node.children && node.children.forEach(child => trans(child, ele))

    const notAppend = option.beforeAppend && option.beforeAppend(ele)
    !notAppend && $parent.appendChild(ele)
    node.__htmlNode = ele

    return ele
}
