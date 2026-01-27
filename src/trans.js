/**
 * AST转HTMLNode
 * 转换结束后AST上需要有HTMLNode的引用，方便下次patch，对HTMLNode做增删改
 * AST也应该提供props update方法，用来处理props更新
 */
import { nodeType } from './nodeType.js';
import { getParserNodeInfo } from './helper.js';
import { copyToClipboard } from './copy.js';

/**@typedef {import("../@type").ASTNode} ASTNode */

// 支持ssr
// 抽象的操作 移动/删除/update
// 为什么呢？因为比如有些type video，我们想使用一个组件来实现，而非一个html标签来实现
// 所谓的渲染到多端

function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * 解码链接，解决链接中的中文编码显示问题
 * @param {string} v
 * @returns
 */
function decodeUrl(v) {
    try {
        return decodeURIComponent(v);
    } catch (_) {
        return v;
    }
}

/**
 * AST 转 dom
 * @param {ASTNode} node
 * @param {HTMLElement} $parent
 */
export default function trans(node, $parent, option = {}) {
    let ele; // 接受子节点的元素
    let realRoot; // 真正的根节点，因为对于某些node，他的渲染逻辑不是一个简单的html标签，而是多个标签
    let $getNode = () => ele;

    switch (node.type) {
        case nodeType.audio:
        case nodeType.video: {
            // 处理iframe
            // 我们允许添加iframe，但是限制iframe的大小
            if (/^<iframe(\s*.+)*><\/iframe>$/.test(node.src.trim())) {
                ele = document.createElement('div');
                ele.className = 'audio';

                // https 不允许加载http的iframe
                ele.innerHTML = node.src.replace('http://', '//');

                const iframe = ele.querySelector('iframe');
                iframe.style.cssText +=
                    ';max-width: 100%; max-height: 60vw; overflow: hidden;';
            } else {
                ele = document.createElement(node.type);
                ele.src = node.src;
                ele.alt = node.alt;
                ele.controls = 'true';
            }
            break;
        }
        case nodeType.img: {
            const result = node.src.match(/\.(\d+)x(\d+)\./);
            if (result) {
                // 图片宽高占位
                const [width, height] = result.slice(1, 3);
                ele = document.createElement('div');
                ele.className = 'markdown-img-wrap';
                ele.style.cssText = `;position: relative; max-width: ${width}px; overflow: hidden; background: rgb(219, 221, 215);`;
                ele.innerHTML = `<div style="padding-top: ${
                    (height / width) * 100
                }%;">
                    <img
                        class="lazy-load-img img-loading"
                        data-lazy-img="${node.src}"
                        data-src="${node.src}"
                        referrerpolicy="no-referrer"
                        style="position: absolute; width: 100%; height: 100%; top: 0;" />
                </div>`;
                break;
            } else {
                ele = document.createElement(node.type);
                ele.src = node.src;
                ele.alt = node.alt;
                ele.referrerPolicy = 'no-referrer';
                break;
            }
        }
        case nodeType.url: {
            ele = document.createElement(node.type);
            ele.href = node.href;
            ele.referrerPolicy = 'no-referrer'; // 禁止外联追踪原始地址
            ele.target = '_blank';
            break;
        }
        case nodeType.comment: {
            ele = document.createComment('');
            node.__update = (key, newNode) => {
                if (key === 'data') {
                    ele.data = newNode[key];
                }
            };
            node.__update('data', node);
            break;
        }
        case nodeType.text: {
            // const text = node.value;
            // ele = document.createTextNode(text);
            ele = document.createElement('span');
            ele.setAttribute('md-type', 'text-node');
            node.__update = (key, newNode) => {
                removeAllChildren(ele);
                // 对纯文本节点做链接提取，提升用户体验
                newNode[key].split(/([A-z]+:\/{2}\S+)/g).forEach((i, index) => {
                    if (index % 2 === 1) {
                        const a = document.createElement('a');
                        a.href = i;
                        a.textContent = decodeUrl(i);
                        a.referrerPolicy = 'no-referrer'; // 禁止外联追踪原始地址
                        a.target = '_blank';
                        ele.appendChild(a);
                    } else {
                        ele.appendChild(document.createTextNode(i));
                    }
                });
            };
            node.__update('value', node);
            break;
        }
        case nodeType.br: {
            ele = document.createElement(node.type);
            break;
        }
        case nodeType.linethrough: {
            ele = document.createElement('span');
            ele.style.cssText += '; text-decoration: line-through;';
            break;
        }
        case nodeType.code: {
            ele = document.createElement('pre');
            ele.className = 'blockCode';
            const code = document.createElement('code');
            // 需要在node上添加__update方法，方便更新属性
            let codeContent = '';
            node.__update = (key, newNode) => {
                switch (key) {
                    case 'language': {
                        code.className = ['highlight', newNode[key] || ''].join(
                            ' '
                        );
                        break;
                    }
                    case 'code': {
                        codeContent = newNode[key];
                        code.textContent = codeContent; // 不能使用innerHTML
                        break;
                    }
                    default:
                        break;
                }
            };
            node.__update('language', node);
            node.__update('code', node);

            const tools = document.createElement('div');
            tools.className = 'blockCodeTools';
            const copyBtn = document.createElement('div');
            copyBtn.textContent = 'copy';
            copyBtn.className = 'blockCodeCopyBtn';

            copyBtn.addEventListener('click', () => {
                copyToClipboard(codeContent);
            });

            ['red', 'yellow', 'green'].forEach((i) => {
                const n = document.createElement('span');
                n.className = 'code-' + i;
                tools.appendChild(n);
            });
            tools.appendChild(copyBtn);

            ele.appendChild(tools);
            ele.appendChild(code);
            break;
        }
        case nodeType.inlineCode: {
            ele = document.createElement('code');
            ele.className = 'inlineCode';
            break;
        }
        case nodeType.head: {
            ele = document.createElement(`h${node.level}`);
            // 添加一个
            // const a = document.createElement('a')
            // const id = getText(node)
            // a.href = `#${id}`
            // a.id = id
            // ele.appendChild(a)
            break;
        }
        case nodeType.ul: {
            ele = document.createElement(node.type);
            node.__update = (key, nodeNode) => {
                ele.style.cssText += `;list-style-type:${nodeNode[key]};`;
            };
            node.__update('listStyleType', node);
            break;
        }
        // 需要完成一个事情，就是添加和dom没有关系，我们可以包两层，包几层的结果是，删除和替换的时候需要特殊处理一下
        // 以避免dom没有删除或者替换干净
        // add / remove / replace / move
        /**
         * node.getRoot = () => [返回真实的根节点]，可以是一个数组
         */
        case nodeType.li_done:
        case nodeType.li_todo: {
            realRoot = document.createElement('li');

            const tag = document.createElement('span');
            tag.className = 'list-todo-tag';
            tag.textContent = node.type === nodeType.li_done ? '✅' : '🚧';
            realRoot.appendChild(tag);

            ele = document.createElement('span');
            realRoot.appendChild(ele);

            realRoot.style.cssText += `;list-style: none;`;

            $getNode = (type) => (type === 'add' ? ele : realRoot);
            break;
        }
        case nodeType.h3:
        case nodeType.h2:
        case nodeType.h1: {
            ele = document.createElement(node.type);
            // 为标题添加id，以支持锚点
            node.__update = (key, newNode) => {
                if (key === 'id') {
                    ele.id = getParserNodeInfo(newNode).text.trim();
                }
            };
            node.__update('id', node);
            break;
        }
        // 根元素
        case nodeType.root: {
            ele = document.createElement('div');
            break;
        }
        case nodeType.hr: {
            ele = document.createElement('div');
            ele.className = 'hr';
            break;
        }
        default: {
            ele = document.createElement(node.type);
            node.indent && (ele.style.cssText += ';padding-left: 2em;');
            // table表格需要设置边框
            if (node.type == nodeType.table) {
                ele.setAttribute('border', '0');
            }
        }
    }

    realRoot = realRoot || ele;
    node.$getNode = $getNode;

    node.tag && ele.setAttribute('tag', node.tag);
    node.children && node.children.forEach((child) => trans(child, ele));

    if (!(option.beforeAppend && option.beforeAppend(realRoot))) {
        $parent.appendChild(realRoot);
    }

    return ele;
}
