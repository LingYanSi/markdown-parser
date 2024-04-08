import nodeType, { TOKEN_TYPE as TKS } from '../nodeType.js';

export { TKS, nodeType };

/**
 * 向后看，知道满足某一个条件
 * @param {number} index
 * @param {Token[]} tokens
 * @param {(t: Token, offset: number, move: Function) => bool} fn
 * @returns
 */
export function watchAfterUtil(index, tokens, fn) {
    const matchTokens = [];
    let offset = index;
    const moveIndex = (offsetNum) => {
        offset += offsetNum;
        return [tokens[offset], offset];
    };
    while (offset <= tokens.length) {
        const item = tokens[offset];
        // 因为moveIndex可能会更改offset，因此在这里做一个校验
        if (item === undefined) {
            break
        }
        // 如果匹配成功，会向后加+1
        if (!fn(item, offset, moveIndex)) {
            break;
        } else {
            matchTokens.push(item);
        }
        offset += 1;
    }

    return {
        matchTokens,
        nextToken: tokens[offset],
    };
}

/**
 * 向后看几个token，以判断是否符合预期
 * @param {Token[]} tokens
 * @param {number} offset 当前index
 * @param {number} [length=1] 需要后续几个token
 * @returns
 */
export function watchAfter(tokens, offset, length = 1) {
    // 使用for循环替代slice，因为slice不会严格返回指定长度的数组
    const sliceTK = [];
    for (let index = offset + 1; index < offset + length + 1; index++) {
        sliceTK.push(tokens[index]);
    }
    return sliceTK;
}

export const helper = {
    // 判断当前token是不是行尾，或者文本结束
    isLineEnd(token) {
        return !token || token.type === TKS.LINE_END;
    },
    checkIsEnd(tokens, index) {
        const [currentToken, nextToken] = [tokens[index], tokens[index + 1]];

        if (!currentToken) {
            return {
                match: [],
            };
        } else if (currentToken.type === TKS.LINE_END) {
            return {
                match: [currentToken],
            };
        }

        if (!nextToken) {
            return {
                match: [currentToken],
            };
        }

        return {};
    },
    // 判断下一个字符是不是行尾
    nextIsLineEnd(tokens, index) {
        const token = tokens[index + 1];
        return token && token.type === TKS.LINE_END;
    },
    // 判断index的前一个字符是不是行首
    isLineStart(tokens, index) {
        const token = tokens[index - 1];
        return !token || token.type === TKS.LINE_END;
    },
    isType(token, ...types) {
        if (typeof token === 'string') {
            return types.includes(token);
        }
        return token && types.includes(token.type);
    },
    // 继续向后匹配表示
    goOn: {
        matchEnd: false,
    },
    // 判断是否可以继续向后匹配
    isCanGoOn(r) {
        return this.goOn === r;
    },
    // tokens转字符串
    tokensToString(tokens) {
        return tokens.map((i) => i.raw).join('');
    },
    getQueueContent(queue = []) {
        const info = {};
        queue.forEach((i) => {
            if (i.content) {
                info[i.name] = i.content;
                info[i.name + '_raw'] = i;
            }
        });
        return info;
    },
    getIdentMatcher() {
        return {
            content: [],
            name: 'ident',
            test(type) {
                if (type !== TKS.WHITE_SPACE) {
                    return {
                        offset: 0,
                    };
                }

                return helper.goOn;
            },
        };
    },
};

/** @typedef {(matchTokens: Token[], info: Object) => any } MatchHanlder  */
/**
 * 匹配
 * @param {number} index
 * @param {Array} tokens
 * @param {Array} queue
 * @param {MatchHanlder} handler
 * @returns {boolean}
 */
export function matchUsefulTokens(index, tokens, queue, handler) {
    const matchTokens = [];
    let queueTypeIndex = 0;
    watchAfterUtil(index, tokens, (item, currentIndex, moveIndex) => {
        while (true) {
            if (typeof queue[queueTypeIndex] === 'object') {
                // offset的偏移 + index大于tokens长度时，item不存在了
                if (!item) {
                    queueTypeIndex += 1;
                    break;
                }

                const testResult = queue[queueTypeIndex].test(
                    item.type,
                    currentIndex,
                    tokens
                );
                if (helper.isCanGoOn(testResult)) {
                    queue[queueTypeIndex].content.push(item);
                    matchTokens.push(item);
                    return true;
                }

                // 终止向下解析
                if (!testResult || queue[queueTypeIndex].stop) {
                    return false;
                }

                // 移动index
                if (testResult.offset > 0) {
                    matchTokens.push(
                        ...tokens.slice(
                            currentIndex,
                            currentIndex + testResult.offset
                        )
                    );
                    // 根据offset去矫正偏移量
                    [item, currentIndex] = moveIndex(testResult.offset);
                }

                // TODO: 当offset大于0的时候需要记录指定的节点比如 结束标签```
                queueTypeIndex += 1;

                // 继续从头循环
                continue;
            }

            // 这里在假设下一个type一定不是一个Object
            if (queue[queueTypeIndex] && item.type === queue[queueTypeIndex]) {
                queueTypeIndex += 1;
                matchTokens.push(item);
                // 直到所有的都匹配到
                return queueTypeIndex !== queue.length;
            }

            return false;
        }
    });

    // 没有停止解析的
    if (queueTypeIndex === queue.length && queue.every((i) => !i.stop)) {
        handler(matchTokens, helper.getQueueContent(queue));
        return true;
    }

    return false;
}
