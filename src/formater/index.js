import nodeType from './../nodeType.js';
import { parser } from './../parser/index.js';

/** @typedef {import("./../../@type/index").ASTNode} ASTNode */
// 一种table格式化对的方案，通过canvas计算字符宽度，进而对字符串进行补齐
// why? 因为不同字体对字符的渲染宽度很不一样，从而导致一般意义的判断（区分字符是英文、中文进行补齐）的操作满足不了需求
// 从这个角度来讲，可以理解为什么有些人更喜欢等宽字体，等宽字体的渲染宽度符合一般人的直觉预期
// 使用canvas计算字体宽度，从根本上解决了对齐的计算问题，
// 需要注意不用网站编辑的字体不一致，会导致在A站上对齐，在B站上不行的问题。（此问题无解）
// chrome devtool 的字体是 12px monospace
/**
 * table文本格式化，自动对齐
 * @param {string} str [table文本]
 * @param {string} font [展示table文本的元素css font]
 * @returns {string}
 */
export function formatTable(str, font = '12px monospace') {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.font = font;
    function getWidth(str) {
        return ctx.measureText(str).width;
    }

    // 以行首为缩进基准
    const ident = str.match(/^\s*/)[0];
    // table第二行使用【-】进行补齐，其他使用空格进行补齐
    const [spaceChar, splitChar] = [' ', '-'];
    const [spaceW, splitW] = [getWidth(spaceChar), getWidth(splitChar)];
    const column = [];

    return str
        .split('\n')
        .map((ele) => {
            return ele
                .trim()
                .replace(/^\||\|$/, '')
                .split('|')
                .map((i) => i.trim())
                .map((i, index) => {
                    if (/^-+$/.test(i)) {
                        i = '--';
                    }
                    const width = getWidth(i);
                    column[index] = Math.max(column[index] || 0, width);
                    return { i, width };
                });
        })
        .map((row) => {
            return (
                ident +
                row
                    .map((ele, index, arr) => {
                        const { i, width } = ele;
                        const paddingW = column[index] - width;
                        const [padchar, num, perWidth] = /^-+$/.test(i.trim())
                            ? [splitChar, Math.round(paddingW / splitW), splitW]
                            : [
                                  spaceChar,
                                  Math.round(paddingW / spaceW),
                                  spaceW,
                              ];

                        // 如果当前宽度没有被补齐，则同一行下一个字符串的宽度需要被缩短
                        if (arr[index + 1]) {
                            arr[index + 1].width -= paddingW - perWidth * num;
                        }
                        return i + padchar.repeat(num);
                    })
                    .join(' | ')
            );
        })
        .join('\n');
}

function fmtList1(str) {
    return str
        .split(/\n/g)
        .map((i) => {
            return i.replace(/^\s+/, ($0) => {
                return ' '.repeat($0.length - ($0.length % 4));
            });
        })
        .join('\n');
}

/**
 * 格式化AST
 * @param {ASTNode} pnode
 * @param {HTMLElement} container
 * @returns {string}
 */
function format(pnode, container) {
    return pnode.children
        .map((node) => {
            // 不可分割
            switch (node.type) {
                case nodeType.text:
                    return node.value;
                case nodeType.table: {
                    const tstr = node.tokens.map((i) => i.raw).join('');
                    return formatTable(tstr, getComputedStyle(container).font);
                }
                case nodeType.ul:
                    return fmtList1(node.tokens.map((i) => i.raw).join(''));
                case nodeType.h1:
                case nodeType.h2:
                case nodeType.h3:
                case nodeType.h4:
                case nodeType.h5:
                case nodeType.h6:
                    return fmtHead(node);
                default:
                    return node.tokens.map((i) => i.raw).join('');
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
        return (
            '#' + ' '.repeat(pnode.__headLen) + format(pnode).trimStart() + '\n'
        );
    }
}

// 把AST转换成纯文本，进行格式化操作
/**
 * 格式化
 * @param {ASTNode} node
 * @param {String} str
 * @returns
 */
export function formater(str, dom) {
    const result = parser(str);
    return format(result, dom);
}
