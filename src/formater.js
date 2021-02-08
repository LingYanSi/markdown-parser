import nodeType from './nodeType.js';
import { parser } from './parser.js';

/** @typedef {import("./../@type/index").ASTNode} ASTNode */

// 把AST转换成纯文本，进行格式化操作
/**
 * 格式化
 * @param {ASTNode} node
 * @param {String} str
 * @returns
 */
export default function formater(str) {
    const result = parser(str);

    const format = (/** @type {ASTNode} */ pnode) => {
        return pnode.children
            .map((node) => {
                // 不可分割
                switch (node.type) {
                    case nodeType.text:
                        return node.value;
                    case nodeType.table: {
                        // 对于table的格式化
                        // 寻找每一列中最宽的那一个，按照这种逻辑进行格式化
                        // 根据index快速对元素进行左右行交换
                        const [thead, tbody] = node.children;
                        const allRows = [
                            ...thead.children, // tr list
                            ...tbody.children,
                        ];
                        const maxLen = Math.max(
                            ...allRows.map((i) => i.children.length)
                        );
                        const charLen = [];
                        for (let index = 0; index < maxLen; index++) {
                            const maxChar = Math.max(
                                ...allRows.map((item) => {
                                    return (
                                        item.children[0]?.raw.text.length || 0
                                    );
                                })
                            );
                            charLen.push(maxChar);
                        }

                        const allList = [
                            thead.children[0].children
                                .map((item, index) => {
                                    return format(item).padEnd(
                                        charLen[index],
                                        ' '
                                    );
                                })
                                .join('|'),
                            charLen.map((i) => '-'.repeat(i)).join('|'),
                            ...tbody.children.map((item) => {
                                return item.children
                                    .map((it, index) => {
                                        return format(it).padEnd(
                                            charLen[index],
                                            ' '
                                        );
                                    })
                                    .join('|');
                            }),
                        ];

                        return allList.join('\n');
                    }

                    case nodeType.ul:
                    case nodeType.queto:
                    default:
                        return node.raw.text;
                }
            })
            .join('');
    };

    return format(result);

    // url: 'a',
    // img: 'img',
    // video: 'video',
    // audio: 'audio',
    // inlineCode: 'inlineCode',
    // br: 'br',
    // hr: 'hr',
    // root: 'root',

    // blod: 'b',
    // italic: 'i',
    // linethrough: 'lineThrough',

    // head: 'head',
    // queto: 'queto',
    // code: 'code',
    // table: 'table',
    // thead: 'thead',
    // tbody: 'tbody',
    // tr: 'tr',
    // th: 'th',
    // td: 'td',

    // ul: 'ul',
    // li: 'li',
    // li_done: 'li-done',
    // li_todo: 'li-todo',
}
