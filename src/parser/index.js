import { createAstNode } from './createAstNode.js';
import { nodeType, TKS, helper } from './util.js';

import { parseInlineNodeLoop, toInlineNode } from './nodeInline.js';

import {
    parseBlockCode,
    parseBlockQuote,
    parseHr,
    parseHead,
} from './nodeBlock.js';
import { parseTable } from './nodeTable.js';
import { parseList } from './nodeUL.js';
import { INLINE_TYPE } from '../nodeType.js';

// @ts-check
// TODO:
// 递归迭代
// 支持多字符串匹配，支持向前看，向后看
// 性能优化，在解析content的时候，顺带解析节点信息，避免算法复杂度提升🤔
// 如果当前节点信息类型不确认，是否存影响其后续token的解析规则呢？
class Token {
    constructor(type, raw, start, end) {
        this.type = type;
        this.start = start;
        this.end = end;
        this.raw = raw;
    }
}

function token(input = '') {
    /** @type {Token[]} */
    const tokens = [];
    let index = 0;
    while (index < input.length) {
        const char = input[index];
        let offset = 1;
        const nextChar = input[index + 1];
        if (nextChar == ' ') {
            if (['*', '-'].includes(char)) {
                tokens.push(
                    new Token(TKS.NO_ORDER_LIST, char, index, index + offset)
                );
                index += offset;
                continue;
            } else if (char == '+') {
                tokens.push(
                    new Token(TKS.ORDER_LIST, char, index, index + offset)
                );
                index += offset;
                continue;
            }
        } else if (input.slice(index, index + 3) === '-->') {
            offset = 3;
            tokens.push(
                new Token(TKS.COMMENT_END, char, index, index + offset)
            );
            break;
        }
        // <!--  -->
        switch (char) {
            case '-': {
                tokens.push(
                    new Token(TKS.NO_ORDER_LIST, char, index, index + offset)
                );
                break;
            }
            case '<': {
                if (input.slice(index, index + 4) === '<!--') {
                    offset = 4;
                    tokens.push(
                        new Token(
                            TKS.COMMENT_START,
                            char,
                            index,
                            index + offset
                        )
                    );
                    break;
                }
                tokens.push(
                    new Token(TKS.SIMPLE_URL_START, char, index, index + offset)
                );
                break;
            }
            case '>': {
                tokens.push(
                    new Token(TKS.SIMPLE_URL_END, char, index, index + offset)
                );
                break;
            }
            case '(': {
                tokens.push(
                    new Token(TKS.URL_START, char, index, index + offset)
                );
                break;
            }
            case ')': {
                tokens.push(
                    new Token(TKS.URL_END, char, index, index + offset)
                );
                break;
            }
            case '[': {
                tokens.push(
                    new Token(TKS.URL_DESC_START, char, index, index + offset)
                );
                break;
            }
            case ']': {
                tokens.push(
                    new Token(TKS.URL_DESC_END, char, index, index + offset)
                );
                break;
            }
            case '#': {
                tokens.push(
                    new Token(TKS.HEAD_TITLE, char, index, index + offset)
                );
                break;
            }
            case '!': {
                tokens.push(
                    new Token(TKS.IMG_START, char, index, index + offset)
                );
                break;
            }
            case '|': {
                tokens.push(
                    new Token(TKS.TABLE_SPLIT, char, index, index + offset)
                );
                break;
            }
            case '`': {
                tokens.push(
                    new Token(TKS.CODE_BLOCK, char, index, index + offset)
                );
                break;
            }
            case '~': {
                tokens.push(
                    new Token(TKS.LINE_THROUGH, char, index, index + offset)
                );
                break;
            }
            case '*': {
                tokens.push(new Token(TKS.BLOB, char, index, index + offset));
                break;
            }
            case ' ': {
                const lastToken = tokens[tokens.length - 1];
                if (lastToken && lastToken.type === TKS.WHITE_SPACE) {
                    lastToken.raw += char;
                    lastToken.end += 1;
                } else {
                    tokens.push(
                        new Token(TKS.WHITE_SPACE, char, index, index + offset)
                    );
                }

                break;
            }
            case '\n': {
                tokens.push(
                    new Token(TKS.LINE_END, char, index, index + offset)
                );
                break;
            }
            default: {
                // 向后看一位
                const nextChar = input[index + 1];
                let str = '';
                // 处理转译字符\，避免关键char不能够正常显示
                [str, offset] =
                    char === '\\' && nextChar
                        ? [char + nextChar, 2]
                        : [char, 1];
                const lastToken = tokens[tokens.length - 1];
                if (lastToken && lastToken.type === TKS.STRING) {
                    lastToken.raw += str;
                    lastToken.end += offset;
                } else {
                    tokens.push(
                        new Token(TKS.STRING, str, index, index + offset)
                    );
                }
            }
        }

        index += offset;
    }

    return tokens;
}

/**
 * 如果想递归分析，那就需要把start/end携带上，这样就不用不停的分配新数组了
 * 把token转换为Node
 * @param {Token[]} tokens
 * * @param {import('../trans.js').ASTNode} defaultRoot
 */
function toAST(tokens, defaultRoot) {
    const root = defaultRoot || createAstNode(nodeType.root, tokens);
    let index = 0;

    let brBuffer = [];
    while (index < tokens.length) {
        const token = tokens[index];
        if (!token) {
            break;
        }
        if (
            parseHead(index, tokens, (matchTokens, info) => {
                const node = createAstNode(
                    nodeType['h' + info.headLevel.length],
                    matchTokens
                );
                parseInlineNodeLoop(info.children, node);
                root.push(node);
                index += matchTokens.length;
            })
        ) {
            //
        } else if (
            parseBlockCode(index, tokens, (matchTokens, info) => {
                let code = helper.tokensToString(info.code);
                if (helper.isType(info.block_code[0], TKS.WHITE_SPACE)) {
                    const identLen = info.block_code[0].raw.length;
                    code = code
                        .split(/\n/)
                        .map((i) => i.replace(/^\s+/, (s) => s.slice(identLen)))
                        .join('\n');
                }
                const node = createAstNode(nodeType.code, matchTokens, {
                    code,
                    language: helper.tokensToString(info.language).trim(),
                });
                root.push(node);
                index += matchTokens.length;
            })
        ) {
            //
        } else if (
            parseBlockQuote(index, tokens, (matchTokens, info) => {
                const node = createAstNode(nodeType.queto, matchTokens);
                // 需要去除掉\n white_space > white_space
                toAST(removeQuetoSymbol(info.children), node);
                root.push(node);
                index += matchTokens.length + 1; // 不渲染尾部空白行
            })
        ) {
            //
        } else if (
            parseTable(index, tokens, (matchTokens, info) => {
                const node = createAstNode(nodeType.table, matchTokens);
                const thead = createAstNode(nodeType.thead, info.thead);

                const theadTr = createAstNode(nodeType.tr, info.thead);
                thead.push(theadTr);
                info.thead_raw.children.forEach((item) => {
                    const th = createAstNode(nodeType.th, item);
                    parseInlineNodeLoop(item, th);
                    theadTr.push(th);
                });

                node.push(thead);

                const tbody = createAstNode(nodeType.tbody, info.tbody);
                info.tbody_raw.children.forEach((item) => {
                    const tbodyTr = createAstNode(nodeType.tr, info.tbody);
                    tbody.push(tbodyTr);

                    info.thead_raw.children.forEach((_, index) => {
                        const ele = item[index] || [];
                        const td = createAstNode(nodeType.td, ele);
                        parseInlineNodeLoop(ele, td);
                        tbodyTr.push(td);
                    });
                    // item.forEach(ele => {
                    //     const td = createAstNode(nodeType.td, item)
                    //     parseInlineNodeLoop(ele, td)
                    //     tbodyTr.push(td)
                    // })
                });

                node.push(tbody);

                root.push(node);

                index += matchTokens.length + 2; // 不渲染table结束空白行
            })
        ) {
            //
        } else if (
            parseHr(index, tokens, (matchTokens) => {
                const node = createAstNode(nodeType.hr, matchTokens);

                root.push(node);
                index += matchTokens.length;
            })
        ) {
            //
        } else if (
            parseList(index, tokens, (matchTokens, info) => {
                const handleInfo = (info, root) => {
                    const node = createAstNode(nodeType.ul, matchTokens);
                    node.listStyleType = info[0].listStyleType;

                    info.forEach((item) => {
                        const liNode = createAstNode(
                            item.nodeType || nodeType.li
                        );
                        const tks = [...item.head];
                        item.children.forEach((ele) => {
                            tks.push(...ele.content);
                        });
                        toAST(tks, liNode);
                        node.push(liNode);
                        item.ul.length && handleInfo(item.ul, liNode);
                    });

                    root.push(node);
                };
                handleInfo(info, root);
                index += matchTokens.length + 1; // list结束空白行只渲染一行
            })
        ) {
            //
        } else if (token.type === TKS.LINE_END) {
            // 是不是行首
            const lastMnode = root.children[root.children.length - 1];
            if (INLINE_TYPE.includes(lastMnode?.type)) {
                root.push(createAstNode(nodeType.br, [token]));
            }

            index += 1;
        } else {
            index = toInlineNode(index, tokens, {
                push(node) {
                    root.push(node);
                },
                getLastChild() {
                    return root.children[root.children.length - 1];
                },
            });
        }
    }

    return root;
}

export function parser(str = '') {
    return toAST(token(str));
}

/**
 * 如果匹配到是queto block，就移除其引用内容每行行首的>
 * @param {} arr
 * @returns
 */
function removeQuetoSymbol(arr = []) {
    let index = 0;
    let res = [];
    while (index < arr.length) {
        const item = arr[index];
        if (item.type == TKS.LINE_END) {
            let offset = 1;
            // \s*>\* 会被移除掉
            if (
                helper.isType(arr[index + 1], TKS.WHITE_SPACE) &&
                helper.isType(arr[index + 2], TKS.SIMPLE_URL_END)
            ) {
                offset += 2;
            } else if (helper.isType(arr[index + 1], TKS.SIMPLE_URL_END)) {
                offset += 1;
            }

            if (offset !== 1) {
                if (helper.isType(arr[offset], TKS.WHITE_SPACE)) {
                    offset += 1;
                }
                res.push(arr[index]);
                index += offset;
                continue;
            }
        }
        res.push(arr[index]);
        index += 1;
    }
    return res;
}
