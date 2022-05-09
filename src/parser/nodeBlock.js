import { helper, matchUsefulTokens, TKS, watchAfter, watchAfterUtil } from './util.js'

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

    // 实现一个简单的向前向后看的正则
    const queue = [
        TKS.CODE_BLOCK,
        TKS.CODE_BLOCK,
        TKS.CODE_BLOCK,
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
                } else if (helper.nextIsLienEnd(tokens, index)) {
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
                if (type === TKS.CODE_BLOCK) {
                    return helper.isLineStart(tokens, index) &&
                        watchAfter(tokens, index, 3).every((item, at) => {
                            if (at === 2) {
                                return helper.isLineEnd(item);
                            }
                            return helper.isType(item, TKS.CODE_BLOCK);
                        })
                        ? {
                              offset: 3,
                          }
                        : helper.goOn;
                }

                return helper.goOn;
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
                    const isMatch =
                        helper.isLineStart(tokens, index) &&
                        watchAfter(tokens, index, 3).every((item, at) => {
                            if (at === 2) {
                                return helper.isLineEnd(item);
                            }
                            return helper.isType(item, TKS.NO_ORDER_LIST);
                        });
                    return isMatch ? { offset: 3 } : false;
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
