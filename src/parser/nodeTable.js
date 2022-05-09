import { helper, matchUsefulTokens, TKS, watchAfter } from './util.js'

/** @typedef {(matchTokens: Token[], info: Object) => any } MatchHanlder  */

/**
 * 解析表格
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
export function parseTable(index, tokens, handler) {
    // 如果下一行的内容是  |----|----| 这种格式，则表示是table表格
    if (!helper.isLineStart(tokens, index)) {
        return false;
    }
    // 实现一个简单的向前向后看的正则
    const queue = [
        {
            content: [],
            children: [],
            name: 'thead',
            test(type, index, tokens) {
                // 期望字符
                if (type !== TKS.TABLE_SPLIT) {
                    if (this.children.length === 0) {
                        // 忽略行首的空格
                        if (helper.isType(type, TKS.WHITE_SPACE)) {
                            return helper.goOn;
                        }
                        this.children.push([]);
                    }

                    // 需要时连续的 - ， --之间不能有空格
                    this.children[this.children.length - 1].push(tokens[index]);
                } else if (type === TKS.TABLE_SPLIT) {
                    // 下一个是有效字符
                    // 第一个是空格 第二个是有效字符
                    if (
                        !helper.isType(
                            tokens[index + 1],
                            TKS.WHITE_SPACE,
                            TKS.LINE_END,
                            TKS.TABLE_SPLIT
                        ) ||
                        (helper.isType(tokens[index + 1], TKS.WHITE_SPACE) &&
                            !helper.isType(
                                tokens[index + 2],
                                TKS.WHITE_SPACE,
                                TKS.LINE_END,
                                TKS.TABLE_SPLIT
                            ))
                    ) {
                        this.hasSplit = true;
                        this.children.push([]);
                    }
                }

                // ----|----|------
                if (helper.isLineEnd(tokens[index])) {
                    if (!this.hasSplit || this.children.length === 0) {
                        return false;
                    }

                    this.content.push(tokens[index]);
                    // 如果字符串
                    return {
                        offset: 1,
                    };
                }

                return helper.goOn;
            },
        },
        {
            content: [],
            name: 'split',
            children: [],
            test(type, index, tokens) {
                // 不会存在连续的空格
                if (
                    !helper.isType(
                        type,
                        TKS.NO_ORDER_LIST,
                        TKS.WHITE_SPACE,
                        TKS.LINE_END,
                        TKS.TABLE_SPLIT
                    )
                ) {
                    this.stop = true;
                    return false;
                }

                if (type !== TKS.TABLE_SPLIT) {
                    if (this.children.length === 0) {
                        // 忽略行首的空格
                        if (helper.isType(type, TKS.WHITE_SPACE)) {
                            return helper.goOn;
                        }
                        this.children.push([]);
                    }

                    // 需要时连续的 - ， --之间不能有空格
                    this.children[this.children.length - 1].push(tokens[index]);
                } else if (type === TKS.TABLE_SPLIT) {
                    // 第一个是 -
                    // 第一个是空格 第二个是 -
                    if (
                        helper.isType(tokens[index + 1], TKS.NO_ORDER_LIST) ||
                        (helper.isType(tokens[index + 1], TKS.WHITE_SPACE) &&
                            helper.isType(tokens[index + 2], TKS.NO_ORDER_LIST))
                    ) {
                        this.hasSplit = true;
                        this.children.push([]);
                    }
                }

                // ----|----|------
                if (helper.isLineEnd(tokens[index])) {
                    if (!this.hasSplit || this.children.length === 0) {
                        return false;
                    }

                    this.content.push(tokens[index]);
                    // 如果字符串
                    return {
                        offset: 1,
                    };
                }

                return helper.goOn;
            },
        },
        {
            content: [],
            children: [], // [[[xxx], [yyyyy]], []]
            name: 'tbody', // 二级嵌套
            test(type, index, tokens) {
                if (helper.isType(type, TKS.LINE_END)) {
                    this.children.push([]);
                } else {
                    if (this.children.length === 0) {
                        if (helper.isType(type, TKS.WHITE_SPACE)) {
                            return helper.goOn;
                        }
                        this.children.push([]);
                    }
                    const lastRow = this.children[this.children.length - 1];

                    // | xcxxx
                    if (helper.isType(type, TKS.TABLE_SPLIT)) {
                        if (
                            !helper.isType(
                                tokens[index + 1],
                                TKS.WHITE_SPACE,
                                TKS.LINE_END,
                                TKS.TABLE_SPLIT
                            ) ||
                            (helper.isType(
                                tokens[index + 1],
                                TKS.WHITE_SPACE
                            ) &&
                                !helper.isType(
                                    tokens[index + 2],
                                    TKS.WHITE_SPACE,
                                    TKS.LINE_END,
                                    TKS.TABLE_SPLIT
                                ))
                        ) {
                            lastRow.push([]);
                        }
                    } else {
                        if (lastRow.length === 0) {
                            lastRow.push([]);
                        }
                        lastRow[lastRow.length - 1].push(tokens[index]);
                    }
                }

                if (
                    watchAfter(tokens, index, 2).every((i) =>
                        helper.isLineEnd(i)
                    )
                ) {
                    this.content.push(tokens[index]);
                    // 如果字符串
                    return {
                        offset: 1,
                    };
                }

                return helper.goOn;
            },
        },
    ];

    // 需要一个描述符号 \n{0,2}$
    return matchUsefulTokens(index, tokens, queue, handler);
}
