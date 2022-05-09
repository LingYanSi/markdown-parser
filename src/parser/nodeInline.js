import { helper, matchUsefulTokens, TKS, nodeType } from './util.js';
import { createAstNode } from './createAstNode.js';

/** @typedef {(matchTokens: Token[], info: Object) => any } MatchHanlder  */

/**
 * 解析图片
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseImg(index, tokens, handler) {
    if (!helper.isType(tokens[index], TKS.IMG_START)) {
        return false;
    }

    const matchTokens = [tokens[index]];

    if (
        parseUrl(index + 1, tokens, (urlMatchTokens, info) => {
            handler(matchTokens.concat(urlMatchTokens), info);
        })
    ) {
        return true;
    }

    return false;
}

/**
 * 解析url
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseUrl(index, tokens, handler) {
    // 如何完美结合起来
    const queue = [
        TKS.URL_DESC_START,
        {
            content: [],
            name: 'alt',
            test: (type) =>
                helper.isType(type, TKS.URL_DESC_START, TKS.URL_DESC_END)
                    ? { offset: 0 }
                    : helper.goOn,
        },
        TKS.URL_DESC_END,
        TKS.URL_START,
        {
            content: [],
            name: 'src',
            test: (type) =>
                helper.isType(type, TKS.URL_START, TKS.URL_END)
                    ? { offset: 0 }
                    : helper.goOn,
        },
        TKS.URL_END,
    ];
    // 在这里存储匹配到的结果，然后对，某些可递归元素继续解析 比如 [can parse content]()

    return matchUsefulTokens(index, tokens, queue, handler);
}

/**
 * 解析简单url <xxxxx>
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseSimpleUrl(index, tokens, handler) {
    const queue = [
        TKS.SIMPLE_URL_START,
        {
            content: [],
            name: 'src',
            test: (type) => {
                if (
                    helper.isType(
                        type,
                        TKS.SIMPLE_URL_START,
                        TKS.SIMPLE_URL_END,
                        TKS.LINE_END,
                        TKS.WHITE_SPACE
                    )
                ) {
                    return { offset: 0 };
                }

                return helper.goOn;
            },
        },
        TKS.SIMPLE_URL_END,
    ];

    return matchUsefulTokens(index, tokens, queue, handler);
}

/**
 * 解析行内code
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseInlineCode(index, tokens, handler) {
    // 不能是连续的``
    if (
        helper.isType(tokens[index], TKS.CODE_BLOCK) &&
        helper.isType(tokens[index + 1], TKS.CODE_BLOCK)
    ) {
        return false;
    }

    const queue = [
        TKS.CODE_BLOCK,
        {
            content: [],
            name: 'code',
            repeatable: true,
            ignore: true,
            test: (type) => {
                if (helper.isType(type, TKS.CODE_BLOCK)) {
                    return {
                        offset: 1,
                    };
                }
                return helper.goOn;
            },
        },
    ];

    return matchUsefulTokens(index, tokens, queue, handler);
}

/**
 * 解析文本中划线
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseLineThrough(index, tokens, handler) {
    const queue = [
        TKS.LINE_THROUGH,
        TKS.LINE_THROUGH,
        {
            content: [],
            name: 'content',
            test(type, index, tokens) {
                if (
                    [tokens[index + 1], tokens[index + 2]].every((i) =>
                        helper.isType(i, TKS.LINE_THROUGH)
                    )
                ) {
                    this.content.push(tokens[index]);
                    return {
                        offset: 1,
                    };
                }
                return helper.goOn;
            },
        },
        TKS.LINE_THROUGH,
        TKS.LINE_THROUGH,
    ];

    return matchUsefulTokens(index, tokens, queue, handler);
}

/**
 * 解析倾斜
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseItalic(index, tokens, handler) {
    const queue = [
        TKS.BLOB,
        {
            content: [],
            name: 'content',
            test(type, index, tokens) {
                if (
                    [tokens[index + 1]].every((i) => helper.isType(i, TKS.BLOB))
                ) {
                    this.content.push(tokens[index]);
                    return {
                        offset: 1,
                    };
                }
                return helper.goOn;
            },
        },
        TKS.BLOB,
    ];

    return matchUsefulTokens(index, tokens, queue, handler);
}

/**
 * 解析加粗
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseBlob(index, tokens, handler) {
    const queue = [
        TKS.BLOB,
        TKS.BLOB,
        {
            content: [],
            name: 'content',
            test(type, index, tokens) {
                if (
                    [tokens[index + 1], tokens[index + 2]].every((i) =>
                        helper.isType(i, TKS.BLOB)
                    )
                ) {
                    this.content.push(tokens[index]);
                    return {
                        offset: 1,
                    };
                }
                return helper.goOn;
            },
        },
        TKS.BLOB,
        TKS.BLOB,
    ];

    return matchUsefulTokens(index, tokens, queue, handler);
}

/**
 * 解析行内元素
 * @param {number} index
 * @param {Token[]} tokens
 * @param {ASTNode} parentNode
 * @returns
 */
export function toInlineNode(index, tokens, parentNode) {
    const token = tokens[index];
    if (
        parseImg(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType.img, matchTokens);
            node.src = helper.tokensToString(info.src);
            node.alt = helper.tokensToString(info.alt);
            parentNode.push(node);
            index += matchTokens.length;
        })
    ) {
        return index;
    }

    if (
        parseUrl(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType.url, matchTokens, {
                href: helper.tokensToString(info.src),
            });
            node.push(createAstNode(nodeType.text, info.alt));
            parentNode.push(node);
            index += matchTokens.length;
        })
    ) {
        return index;
    }

    if (
        parseInlineCode(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType.inlineCode, matchTokens);
            node.push(createAstNode(nodeType.text, info.code));
            parentNode.push(node);
            index += matchTokens.length;
        })
    ) {
        return index;
    }

    if (
        parseSimpleUrl(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType.url, matchTokens, {
                href: helper.tokensToString(info.src),
            });
            node.push(createAstNode(nodeType.text, info.src));
            parentNode.push(node);
            index += matchTokens.length;
        })
    ) {
        return index;
    }

    if (
        parseLineThrough(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType.linethrough, matchTokens);
            parseInlineNodeLoop(info.content, node);
            parentNode.push(node);
            index += matchTokens.length;
        })
    ) {
        return index;
    }

    if (
        parseBlob(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType.blod, matchTokens);
            parseInlineNodeLoop(info.content, node);
            parentNode.push(node);
            index += matchTokens.length;
        })
    ) {
        return index;
    }

    if (
        parseItalic(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType.italic, matchTokens);
            parseInlineNodeLoop(info.content, node);
            parentNode.push(node);
            index += matchTokens.length;
        })
    ) {
        return index;
    }

    const lastMnode = parentNode.children[parentNode.children.length - 1];
    if (lastMnode && lastMnode.type === nodeType.text) {
        lastMnode.addToken(token);
    } else {
        parentNode.push(createAstNode(nodeType.text, [token]));
    }

    index += 1;

    return index;
}

/**
 * 解析行内节点
 * @param {Token[]} tokens
 * @param {ASTNode} parentNode
 */
export function parseInlineNodeLoop(tokens, parentNode) {
    let index = 0;
    while (index < tokens.length) {
        index = toInlineNode(index, tokens, parentNode);
    }
}
