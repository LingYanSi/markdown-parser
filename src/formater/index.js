import nodeType from './../nodeType.js';
import { parser } from './../parser.js';
import { join, getRealLen, padEnd } from './strHelper.js';

/** @typedef {import("./../../@type/index").ASTNode} ASTNode */

function fmtTable(/** @type {ASTNode} */ node) {
    // 对于table的格式化
    // 寻找每一列中最宽的那一个，按照这种逻辑进行格式化
    // 根据index快速对元素进行左右行交换
    const [thead, tbody] = node.children;
    const allRows = [
        ...thead.children, // tr list
        ...tbody.children,
    ];
    const maxLen = Math.max(...allRows.map((i) => i.children.length));
    const charLen = [];
    for (let index = 0; index < maxLen; index++) {
        const maxChar = Math.max(
            ...allRows.map((item) => {
                return getRealLen(item.children[index]?.raw.text);
            })
        );
        charLen.push(maxChar);
    }

    const allList = [
        thead.children[0].children.map((item, index) => {
            return padEnd(format(item), charLen[index], ' ');
        }),
        charLen.map((i) => '-'.repeat(i)),
        ...tbody.children.map((item) => {
            return item.children.map((it, index) => {
                return padEnd(format(it), charLen[index], ' ');
            });
        }),
    ].map((i) => join(i));

    return allList.join('\n');
}

/**
 * 因为js是单线程的，因此可以借助这个特性在这里使用类似全局变量
 * 处理ident的问题
 */
let ident = -1;
function identSpace() {
    return ' '.repeat(ident * 5);
}

/**
 * 格式化列表
 * @param {ASTNode} pnode
 * @returns
 */
function fmtList(pnode) {
    ident += 1;
    const LIST_STYLE_CHAR = pnode.listStyleType === 'decimal' ? '+' : '-';

    // 需要有堆栈的概念，去处理缩进问题
    let result = pnode.children
        .map((item) => {
            const { type } = item;
            switch (type) {
                case 'li': {
                    return (
                        identSpace() +
                        LIST_STYLE_CHAR +
                        ' ' +
                        format(item).trimLeft()
                    );
                }
                case 'li-todo': {
                    return (
                        identSpace() +
                        LIST_STYLE_CHAR +
                        ' [] ' +
                        format(item).trimLeft()
                    );
                }
                case 'li-done': {
                    return (
                        identSpace() +
                        LIST_STYLE_CHAR +
                        ' [x] ' +
                        format(item).trimLeft()
                    );
                }
            }
        })
        .join('');
    ident -= 1;
    if (pnode.__root) {
        result += `\n`;
    }
    return result;
}

/**
 * 格式化AST
 * @param {ASTNode} pnode
 * @returns {string}
 */
function format(pnode) {
    return pnode.children
        .map((node) => {
            // 不可分割
            switch (node.type) {
                case nodeType.text:
                    return node.value;
                case nodeType.table: {
                    return fmtTable(node);
                }
                case nodeType.ul:
                    return fmtList(node);
                case nodeType.h1:
                case nodeType.h2:
                case nodeType.h3:
                case nodeType.h4:
                case nodeType.h5:
                case nodeType.h6:
                    return fmtHead(node);
                default:
                    return node.raw.text;
            }
        })
        .join('');
}

/**
 * 格式化标题
 * @param {ASTNode} pnode
 */
function fmtHead(pnode) {
    if (/^h[1-9]$/.test(pnode.type)) {
        return `#` + ' '.repeat(pnode.__headLen) + format(pnode).trimLeft() + '\n'
    }
}

// 把AST转换成纯文本，进行格式化操作
/**
 * 格式化
 * @param {ASTNode} node
 * @param {String} str
 * @returns
 */
export default function formater(str) {
    const result = parser(str);
    return format(result);
}
