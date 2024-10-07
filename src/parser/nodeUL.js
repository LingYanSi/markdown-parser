import {
    helper,
    matchUsefulTokens,
    TKS,
    nodeType,
    watchAfter,
} from './util.js';

/**
 * 将一维数组分析组合为多维
 * @param {Array} liList
 * @returns
 */
function nestList(liList) {
    const root = {
        deep: 0,
        ident: 0,
        children: [],
    };
    const stack = [];
    // 当前
    liList.forEach((item) => {
        const deep = Math.floor(
            item.ident.map((i) => i.raw).join('').length / 4
        );
        while (stack.length) {
            const relative = stack[stack.length - 1];
            if (relative.deep < deep) {
                item.deep = relative.deep + 1;
                relative.ul.push(item);
                stack.push(item);
                break;
            } else {
                stack.pop();
            }
        }

        if (!stack.length) {
            item.deep = 0;
            root.children.push(item);
            stack.push(item);
        }
    });

    return root.children;
}

/** @typedef {} MatchHanlder  */

/**
 * 解析列表
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
export function parseList(index, tokens, handler) {
    if (!helper.isLineStart(tokens, index)) {
        return false;
    }

    const mtks = [];
    const liList = [];

    // 先获取ident，然后判断是不是 - / +
    // 如果不是，就向前一个对象的children push
    // 如果是就新增一个对象
    while (true) {
        // 遇到两个换行结束遍历
        if (tokens.slice(index, index + 1).every((i) => helper.isLineEnd(i))) {
            break;
        }

        if (
            matchUsefulTokens(
                index,
                tokens,
                [
                    helper.getIdentMatcher(),
                    {
                        content: [],
                        name: 'listType',
                        nodeType: nodeType.li,
                        listStyleType: '',
                        test(type, index, tokens) {
                            if (
                                helper.isType(
                                    type,
                                    TKS.NO_ORDER_LIST,
                                    TKS.ORDER_LIST
                                )
                            ) {
                                this.content.push(tokens[index]);
                                // 'disc', // 实心圆
                                // 'circle', // 空心圆
                                // 'square', // 方块
                                this.listStyleType =
                                    type === TKS.NO_ORDER_LIST
                                        ? 'disc'
                                        : 'decimal';

                                let todoType = '';
                                const isMatchTodo = watchAfter(
                                    tokens,
                                    index,
                                    5
                                ).every((i, index) => {
                                    switch (index) {
                                        case 0:
                                            return helper.isType(
                                                i,
                                                TKS.WHITE_SPACE
                                            );
                                        case 1:
                                            return helper.isType(
                                                i,
                                                TKS.URL_DESC_START
                                            );
                                        case 2: {
                                            if (
                                                helper.isType(
                                                    i,
                                                    TKS.WHITE_SPACE
                                                )
                                            ) {
                                                todoType = nodeType.li_todo;
                                                return true;
                                            }

                                            if (
                                                helper.isType(i, TKS.STRING) &&
                                                i.raw === 'x'
                                            ) {
                                                todoType = nodeType.li_done;
                                                return true;
                                            }
                                            return false;
                                        }
                                        case 3:
                                            return helper.isType(
                                                i,
                                                TKS.URL_DESC_END
                                            );
                                        case 4:
                                            return (
                                                helper.isType(
                                                    i,
                                                    TKS.WHITE_SPACE
                                                ) || helper.isLineEnd(i)
                                            );
                                    }
                                });

                                if (isMatchTodo) {
                                    this.content.push(
                                        ...watchAfter(tokens, index, 4)
                                    );
                                    this.nodeType = todoType;
                                    return {
                                        offset: 5,
                                    };
                                }

                                return {
                                    offset: 1, // TODO:忽略结尾token，但其实应当添加到info上
                                };
                            }

                            return false;
                        },
                    },
                    {
                        content: [],
                        name: 'head',
                        test(type, index, tokens) {
                            // 暗含的意思
                            const result = helper.checkIsEnd(tokens, index);
                            if (result.match) {
                                // 需要解决立马遇到行尾的问题
                                this.content.push(...result.match);
                                return {
                                    offset: result.match.length, // TODO:忽略结尾token，但其实应当添加到info上
                                };
                            }

                            return helper.goOn;
                        },
                    },
                ],
                (mts, info) => {
                    index += mts.length;
                    mtks.push(...mts);
                    liList.push({
                        ident: info.ident,
                        head: info.head,
                        listStyleType: info.listType_raw.listStyleType,
                        nodeType: info.listType_raw.nodeType,
                        children: [],
                        ul: [], // 存储子ul
                        tokens: mts,
                    });
                }
            )
        ) {
            continue;
        }

        if (liList.length === 0) {
            return;
        }

        if (
            matchUsefulTokens(
                index,
                tokens,
                [
                    {
                        content: [],
                        name: 'content',
                        test(type, index, tokens) {
                            if (helper.isLineEnd(tokens[index])) {
                                // 需要解决立马遇到行尾的问题
                                this.content.push(tokens[index]);
                                return {
                                    offset: 1, // TODO:忽略结尾token，但其实应当添加到info上
                                };
                            }
                            return helper.goOn;
                        },
                    },
                ],
                (mts, info) => {
                    index += mts.length;
                    mtks.push(...mts);
                    liList[liList.length - 1].children.push({
                        type: 'normal',
                        content: info.content,
                        tokens: mts,
                    });
                }
            )
        ) {
            continue;
        }

        break;
    }

    if (liList.length > 0) {
        handler(mtks, nestList(liList));
        return true;
    }

    return false;
}
