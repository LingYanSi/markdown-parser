import {
    helper,
    matchUsefulTokens,
    TKS,
    watchAfter,
    watchAfterUtil,
} from './util.js';

/** @typedef {(matchTokens: Token[], info: Object) => any } MatchHanlder  */

/**
 * 解析标题
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
export function parseHead(index, tokens, handler) {
    if (!helper.isLineStart(tokens, index)) {
        return false;
    }

    // 实现一个简单的向前向后看的正则
    const queue = [
        helper.getIdentMatcher(),
        {
            content: [],
            name: 'headLevel',
            stop: false,
            test(type, index, tokens) {
                const { matchTokens } = watchAfterUtil(
                    index,
                    tokens,
                    (item) => {
                        return helper.isType(item, TKS.HEAD_TITLE);
                    }
                );

                if (matchTokens.length > 6 || matchTokens.length === 0) {
                    this.stop = true;
                    return false;
                }

                this.content = matchTokens;

                // 通过向前看，向后看以解析判断，是否命中Node节点
                return { offset: matchTokens.length };
            },
        },
        {
            content: [],
            name: 'children',
            repeatable: true,
            ignore: true,
            test(type, index, tokens) {
                // 通过向前看，向后看以解析判断，是否命中Node节点
                if (helper.isLineEnd(tokens[index])) {
                    return { offset: 1 }; // 忽略尾部\n
                }

                return helper.goOn;
            },
        },
    ];

    return matchUsefulTokens(index, tokens, queue, handler);
}

function checkBlockCodeTag(tokens, index, isEnd = false) {
    let offset = 0;
    let start = index - 1;
    // 允许行开始为 WHITE_SPACE?
    if (helper.isType(tokens[index], TKS.WHITE_SPACE)) {
        offset += 1;
        start += 1;
    }

    const isMatch = watchAfter(tokens, start, 3).every((item) => {
        offset += 1;
        return helper.isType(item, TKS.CODE_BLOCK);
    });

    // 闭合标签需要以此为结束 WHITE_SPACE? + isLineEnd
    if (isMatch && isEnd) {
        if (helper.isType(tokens[index + offset], TKS.WHITE_SPACE)) {
            offset += 1;
        }
        if (helper.isLineEnd(tokens[index + offset])) {
            offset += 1;
        } else {
            return false;
        }
    }

    if (isMatch) {
        return { offset };
    }
    return false;
}

/**
 * 解析代码块
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
export function parseBlockCode(index, tokens, handler) {
    if (!helper.isLineStart(tokens, index)) {
        return false;
    }

    // const offset = checkBlockCodeStart(tokens, index)
    // if (offset < 0) {
    //     return false
    // }

    // 实现一个简单的向前向后看的正则
    const queue = [
        // TKS.CODE_BLOCK,
        // TKS.CODE_BLOCK,
        // TKS.CODE_BLOCK,
        {
            content: [],
            name: 'block_code',
            test(type, index, tokens) {
                const res = checkBlockCodeTag(tokens, index);
                if (res?.offset) {
                    this.content = tokens.slice(index, index + res.offset)
                }
                return res
            },
        },
        {
            content: [],
            name: 'language',
            test(type, index, tokens) {
                // 保留换行符
                if (helper.isLineEnd(tokens[index])) {
                    this.content.push(tokens[index]);
                    return {
                        offset: 1,
                    };
                } else if (helper.nextIsLineEnd(tokens, index)) {
                    this.content.push(tokens[index], tokens[index + 1]);
                    // debugger
                    return {
                        offset: 2,
                    };
                }

                return helper.goOn;
            },
        },
        {
            content: [],
            name: 'code',
            test(type, index, tokens) {
                // 通过向前看，向后看以解析判断，是否命中Node节点
                return (
                    (helper.isLineStart(tokens, index) &&
                        checkBlockCodeTag(tokens, index, true)) ||
                    helper.goOn
                );
            },
        },
    ];

    return matchUsefulTokens(index, tokens, queue, handler);
}

/**
 * 解析分割线
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
export function parseHr(index, tokens, handler) {
    // 实现一个简单的向前向后看的正则
    const queue = [
        {
            content: [],
            name: 'hr',
            test(type, index, tokens) {
                // 通过向前看，向后看以解析判断，是否命中Node节点
                if (helper.isType(tokens[index], TKS.NO_ORDER_LIST)) {
                    const { matchTokens, nextToken } = watchAfterUtil(
                        index,
                        tokens,
                        (item) => {
                            return helper.isType(item, TKS.NO_ORDER_LIST);
                        }
                    );
                    let offset = matchTokens.length;
                    // 多读取一个换行符
                    if (helper.isType(nextToken, TKS.LINE_END)) {
                        offset += 1;
                    }
                    return matchTokens.length >= 3 && { offset };
                }

                return false;
            },
        },
    ];

    return matchUsefulTokens(index, tokens, queue, handler);
}

/**
 * 解析块级引用
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
export function parseBlockQuote(index, tokens, handler) {
    if (!helper.isLineStart(tokens, index)) {
        return false;
    }
    // 实现一个简单的向前向后看的正则
    const queue = [
        TKS.SIMPLE_URL_END,
        {
            content: [],
            name: 'children',
            repeatable: true,
            ignore: true,
            test(type, index, tokens) {
                // 这里暗含的意思是，这个if判断已经满足了是当前是end条件
                if (
                    watchAfter(tokens, index, 2).every((i) =>
                        helper.isLineEnd(i)
                    )
                ) {
                    this.content.push(tokens[index]);
                    return {
                        offset: 2,
                    };
                }

                return helper.goOn;
            },
        },
    ];

    // 需要一个描述符号 \n{0,2}$

    return matchUsefulTokens(index, tokens, queue, handler);
}
