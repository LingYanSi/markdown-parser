import nodeType, { TOKEN_TYPE as TKS } from './nodeType.js'
// @ts-check
// TODO:
// 递归迭代
// 支持多字符串匹配，支持向前看，向后看
// 性能优化，在解析content的时候，顺带解析节点信息，避免算法复杂度提升🤔
// 如果当前节点信息类型不确认，是否存影响其后续token的解析规则呢？

class Token {
    constructor(type, raw, start, end) {
        this.type = type
        this.start = start
        this.end = end
        this.raw = raw
    }
}

class ASTNode {
    constructor(type = '', tokens = []) {
        this.type = type
        this.tokens = tokens
        this.children = []
        this.value = ''
    }
    /**
     * @param {ASTNode} child
     * @returns
     * @memberof ASTNode
     */
    push(child) {
        child.__parent = this
        this.children.push(child)
        return this
    }

    // 可以把连续的text token合并成一个Text Node
    addToken(token) {
        token && this.tokens.push(token)
        // 仅对于text node才有value属性
        this.value = this.tokens.map(i => i.raw).join('')
    }

    get raw() {
        return this.children.map(i => i.tokens.map(i => i.raw).join('')).join('') || this.tokens.map(i => i.raw).join('')
    }
}

function createAstNode(type, tokens = [], properties = {}) {
    const ast = new ASTNode(type, tokens)
    Object.assign(ast, properties)
    if (type === nodeType.text) {
        ast.addToken()
    }
    return ast
}

function token(input = '') {
    /** @type {Token[]} */
    const tokens = [];
    let index = 0
    while (index < input.length) {
        const char = input[index]
        let offset = 1
        switch(char) {
            case '-': {
                tokens.push(new Token(TKS.NO_ORDER_LIST, char, index, index+1))
                break
            }
            case '+': {
                tokens.push(new Token(TKS.ORDER_LIST, char, index, index+1))
                break
            }
            case '<': {
                tokens.push(new Token(TKS.SIMPLE_URL_START, char, index, index+1))
                break
            }
            case '>': {
                tokens.push(new Token(TKS.SIMPLE_URL_END, char, index, index+1))
                break
            }
            case '(': {
                tokens.push(new Token(TKS.URL_START, char, index, index+1))
                break
            }
            case ')': {
                tokens.push(new Token(TKS.URL_END, char, index, index+1))
                break
            }
            case '[': {
                tokens.push(new Token(TKS.URL_DESC_START, char, index, index+1))
                break
            }
            case ']': {
                tokens.push(new Token(TKS.URL_DESC_END, char, index, index+1))
                break
            }
            case '#': {
                tokens.push(new Token(TKS.HEAD_TITLE, char, index, index+1))
                break
            }
            case '!': {
                tokens.push(new Token(TKS.IMG_START, char, index, index+1))
                break
            }
            case '|': {
                tokens.push(new Token(TKS.TABLE_SPLIT, char, index, index+1))
                break
            }
            case '`': {
                tokens.push(new Token(TKS.CODE_BLOCK, char, index, index+1))
                break
            }
            case '~': {
                tokens.push(new Token(TKS.LINE_THROUGH, char, index, index+1))
                break
            }
            case '*': {
                tokens.push(new Token(TKS.BLOB, char, index, index+1))
                break
            }
            case ' ': {
                const lastToken = tokens[tokens.length - 1]
                if (lastToken && lastToken.type === TKS.WHITE_SPACE) {
                    lastToken.raw += char
                    lastToken.end += 1
                } else {
                    tokens.push(new Token(TKS.WHITE_SPACE, char, index, index+1))
                }

                break
            }
            case '\n': {
                tokens.push(new Token(TKS.LINE_END, char, index, index+1))
                break
            }
            default: {
                // 向后看一位
                const nextChar = input[index + 1]
                let str = '';
                // 处理转译字符\，避免关键char不能够正常显示
                [str, offset] = (char === '\\' && nextChar) ? [nextChar, 2] : [char, 1];
                const lastToken = tokens[tokens.length - 1]
                if (lastToken && lastToken.type === TKS.STRING) {
                    lastToken.raw += str
                    lastToken.end += offset
                } else {
                    tokens.push(new Token(TKS.STRING, str, index, index + offset))
                }
            }
        }

        index += offset
    }

    return tokens
}

/**
 * 向后看，知道满足某一个条件
 * @param {number} index
 * @param {Token[]} tokens
 * @param {(t: Token, offset: number, move: Function) => bool} fn
 * @returns
 */
function watchAfterUtil(index, tokens, fn) {
    const matchTokens = []
    let offset = index
    const moveIndex = (offsetNum) => {
        offset += offsetNum
        return [tokens[offset], offset]
    }
    while (offset < tokens.length) {
        const item = tokens[offset]
        // 如果匹配成功，会向后加+1
        if (!fn(item, offset, moveIndex)) {
            break
        } else {
            matchTokens.push(item)
        }
        offset += 1
    }

    return {
        matchTokens,
        nextToken: tokens[offset]
    }
}

/**
 * 向后看几个token，以判断是否符合预期
 * @param {Token[]} tokens
 * @param {number} offset 当前index
 * @param {number} [length=1] 需要后续几个token
 * @returns
 */
function watchAfter(tokens, offset, length = 1) {
    // 使用for循环替代slice，因为slice不会严格返回指定长度的数组
    const sliceTK = []
    for (let index = offset + 1; index < offset + length + 1; index++) {
        sliceTK.push(tokens[index])
    }
    return sliceTK
}

const helper = {
    // 判断当前token是不是行尾，或者文本结束
    isLineEnd(token) {
        return !token || token.type === TKS.LINE_END
    },
    checkIsEnd(tokens, index) {
        const [currentToken, nextToken] = [tokens[index], tokens[index + 1]]

        if (!currentToken) {
            return {
                match: []
            }
        } else if (currentToken.type === TKS.LINE_END) {
            return {
                match: [currentToken]
            }
        }

        if (!nextToken) {
            return {
                match: [currentToken]
            }
        }

        return {}
    },
    // 判断下一个字符是不是行尾
    nextIsLienEnd(tokens, index) {
        const token = tokens[index + 1]
        return token && token.type === TKS.LINE_END
    },
    // 判断index的前一个字符是不是行首
    isLineStart(tokens, index) {
        const token = tokens[index - 1]
        return !token || token.type === TKS.LINE_END
    },
    isType(token, ...types) {
        if (typeof token === 'string') {
            return types.includes(token)
        }
        return token && types.includes(token.type)
    },
    // 继续向后匹配表示
    goOn: {
        matchEnd: false,
    },
    // 判断是否可以继续向后匹配
    isCanGoOn(r) {
        return this.goOn === r
    },
    // tokens转字符串
    tokensToString(tokens) {
        return tokens.map(i => i.raw).join('')
    },
    getQueueContent(queue = []) {
        const info = {}
        queue.forEach(i => {
            if (i.content) {
                info[i.name] = i.content
                info[i.name + '_raw'] = i
            }
        })
        return info
    },
    getIdentMatcher() {
        return {
            content: [],
            name: 'ident',
            test(type) {
                if (type !== TKS.WHITE_SPACE) {
                    return {
                        offset: 0,
                    }
                }

                return helper.goOn
            },
        }
    }
}

/**
 * 解析行内元素
 * @param {number} index
 * @param {Token[]} tokens
 * @param {ASTNode} parentNode
 * @returns
 */
function toInlineNode(index, tokens, parentNode) {
    const token = tokens[index]
    if (parseImg(index, tokens, (matchTokens, info) => {
        const node = createAstNode(nodeType.img, matchTokens)
        node.src = helper.tokensToString(info.src)
        node.alt = helper.tokensToString(info.alt)
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (parseUrl(index, tokens, (matchTokens, info) => {
        const node = createAstNode(nodeType.url, matchTokens, {
            href: helper.tokensToString(info.src),
        })
        node.push(createAstNode(nodeType.text, info.alt))
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (parseInlineCode(index, tokens, (matchTokens, info) => {
        const node = createAstNode(nodeType.inlineCode, matchTokens)
        node.push(createAstNode(nodeType.text, info.code))
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (parseSimpleUrl(index, tokens, (matchTokens, info) => {
        const node = createAstNode(nodeType.url, matchTokens, {
            href: helper.tokensToString(info.src),
        })
        node.push(createAstNode(nodeType.text, info.src))
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (parseLineThrough(index, tokens, (matchTokens, info) => {
        const node = createAstNode(nodeType.linethrough, matchTokens)
        parseInlineNodeLoop(info.content, node)
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (parseBlob(index, tokens, (matchTokens, info) => {
        const node = createAstNode(nodeType.blod, matchTokens)
        parseInlineNodeLoop(info.content, node)
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (parseItalic(index, tokens, (matchTokens, info) => {
        const node = createAstNode(nodeType.italic, matchTokens)
        parseInlineNodeLoop(info.content, node)
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    const lastMnode = parentNode.children[parentNode.children.length - 1]
    if (lastMnode && lastMnode.type === nodeType.text) {
        lastMnode.addToken(token)
    } else {
        parentNode.push(createAstNode(nodeType.text, [token]))
    }

    index += 1

    return index
}

/**
 * 解析行内节点
 * @param {Token[]} tokens
 * @param {ASTNode} parentNode
 */
function parseInlineNodeLoop(tokens, parentNode) {
    let index = 0
    while(index < tokens.length) {
        index = toInlineNode(index, tokens, parentNode)
    }
}

/**
 * 如果想递归分析，那就需要把start/end携带上，这样就不用不停的分配新数组了
 * 把token转换为Node
 * @param {Token[]} tokens
 */
function toAST(tokens, defaultRoot) {
    const root = defaultRoot || createAstNode(nodeType.root, tokens)
    let index = 0

    while (index < tokens.length) {
        const token = tokens[index]
        if (!token) {
            break
        }
        // 是不是行首
        // parse head
        if(token.type === TKS.LINE_END) {
            root.push(createAstNode(nodeType.br, [token]))
            index += 1
            continue
        }

        if (parseHead(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType['h' + info.headLevel.length], matchTokens)
            parseInlineNodeLoop(info.children, node)
            root.push(node)
            index += matchTokens.length
        })) {
            continue
        }

        if (parseBlockCode(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType.code, matchTokens, {
                code: helper.tokensToString(info.code),
                language: helper.tokensToString(info.language).trim(),
            })
            root.push(node)
            index += matchTokens.length
        })) {
            continue
        }

        if (parseBlockQuote(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType.queto, matchTokens)
            toAST(info.children, node)
            root.push(node)
            index += matchTokens.length
        })) {
            continue
        }

        if (parseTable(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType.table, matchTokens)
            const thead = createAstNode(nodeType.thead, info.thead)

            const theadTr = createAstNode(nodeType.tr, info.thead)
            thead.push(theadTr)
            info.thead_raw.children.forEach(item => {
                const th = createAstNode(nodeType.th, item)
                parseInlineNodeLoop(item, th)
                theadTr.push(th)
            })

            node.push(thead)

            const tbody = createAstNode(nodeType.tbody, info.tbody)
            info.tbody_raw.children.forEach(item => {
                const tbodyTr = createAstNode(nodeType.tr, info.tbody)
                tbody.push(tbodyTr)

                info.thead_raw.children.forEach((_, index) => {
                    const ele = item[index] || []
                    const td = createAstNode(nodeType.td, ele)
                    parseInlineNodeLoop(ele, td)
                    tbodyTr.push(td)
                })
                // item.forEach(ele => {
                //     const td = createAstNode(nodeType.td, item)
                //     parseInlineNodeLoop(ele, td)
                //     tbodyTr.push(td)
                // })
            })

            node.push(tbody)

            root.push(node)
            index += matchTokens.length
        })) {
            continue
        }

        if (parseHr(index, tokens, (matchTokens) => {
            const node = createAstNode(nodeType.hr, matchTokens)

            root.push(node)
            index += matchTokens.length
        })) {
            continue
        }

        if (parseList(index, tokens, (matchTokens, info) => {
            const node = createAstNode(nodeType.ul, matchTokens)
            node.listStyleType = info[0].listStyleType

            info.forEach(item => {
                const liNode = createAstNode(item.nodeType || nodeType.li)
                parseInlineNodeLoop(item.head, liNode)
                item.children.forEach(ele => {
                    parseInlineNodeLoop(ele.content, liNode)
                })
                node.push(liNode)
            })

            root.push(node)
            index += matchTokens.length
        })) {
            continue
        }

        index = toInlineNode(index, tokens, root)
    }

    return root
}

/** @typedef {(matchTokens: Token[], info: Object) => any } MatchHanlder  */

/**
 * 匹配
 * @param {number} index
 * @param {Array} tokens
 * @param {Array} queue
 * @param {MatchHanlder} handler
 * @returns {boolean}
 */
function matchUsefulTokens(index, tokens, queue, handler) {
    const matchTokens = []
    let queueTypeIndex = 0
    watchAfterUtil(index, tokens, (item, currentIndex, moveIndex) => {
        while (true) {
            if (typeof queue[queueTypeIndex] === 'object') {
                // offset的偏移 + index大于tokens长度时，item不存在了
                if (!item) {
                    break
                }

                const testResult = queue[queueTypeIndex].test(item.type, currentIndex, tokens)
                if (helper.isCanGoOn(testResult)) {
                    queue[queueTypeIndex].content.push(item)
                    matchTokens.push(item)
                    return true
                }

                // 终止向下解析
                if (!testResult || queue[queueTypeIndex].stop) {
                    return false
                }

                // 移动index
                if (testResult.offset > 0) {
                    matchTokens.push(...tokens.slice(currentIndex, currentIndex + testResult.offset));
                    // 根据offset去矫正偏移量
                    [item, currentIndex] = moveIndex(testResult.offset)
                }

                // TODO: 当offset大于0的时候需要记录指定的节点比如 结束标签```
                queueTypeIndex += 1

                // 继续从头循环
                continue
            }

            // 这里在假设下一个type一定不是一个Object
            if (queue[queueTypeIndex] && item.type === queue[queueTypeIndex]) {
                queueTypeIndex += 1
                matchTokens.push(item)
                // 直到所有的都匹配到
                return queueTypeIndex !== queue.length
            }

            return false
        }
    })

    // 没有停止解析的
    if (queueTypeIndex === queue.length && queue.every(i => !i.stop)) {
        handler(matchTokens, helper.getQueueContent(queue))
        return true
    }

    return false
}

/**
 * 解析图片
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseImg(index, tokens, handler) {
    if (!helper.isType(tokens[index], TKS.IMG_START)) {
        return false
    }

    const matchTokens = [tokens[index]]

    if (parseUrl(index+1, tokens, (urlMatchTokens, info) => {
        handler(matchTokens.concat(urlMatchTokens), info)
    })) {
        return true
    }

    return false
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
            test: (type) => helper.isType(type, TKS.URL_DESC_START, TKS.URL_DESC_END) ? { offset: 0 } : helper.goOn,
        },
        TKS.URL_DESC_END,
        TKS.URL_START,
        {
            content: [],
            name: 'src',
            test: (type) => helper.isType(type, TKS.URL_START, TKS.URL_END) ? { offset: 0 } : helper.goOn,
        },
        TKS.URL_END,
    ]
    // 在这里存储匹配到的结果，然后对，某些可递归元素继续解析 比如 [can parse content]()

    return matchUsefulTokens(index, tokens, queue, handler)
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
                if (helper.isType(type, TKS.SIMPLE_URL_START, TKS.SIMPLE_URL_END, TKS.LINE_END, TKS.WHITE_SPACE)) {
                    return { offset: 0 }
                }

                return helper.goOn
            }
        },
        TKS.SIMPLE_URL_END
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
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
        helper.isType(tokens[index], TKS.CODE_BLOCK)
        || helper.isType(tokens[index + 1], TKS.CODE_BLOCK)
    ) {
        return false
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
                    }
                }
                return helper.goOn
            },
        }
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
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
                if ([tokens[index + 1], tokens[index + 2]].every(i => helper.isType(i, TKS.LINE_THROUGH))) {
                    this.content.push(tokens[index])
                    return {
                        offset: 1,
                    }
                }
                return helper.goOn
            },
        },
        TKS.LINE_THROUGH,
        TKS.LINE_THROUGH,
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
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
                if ([tokens[index + 1]].every(i => helper.isType(i, TKS.BLOB))) {
                    this.content.push(tokens[index])
                    return {
                        offset: 1,
                    }
                }
                return helper.goOn
            },
        },
        TKS.BLOB,
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
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
                if ([tokens[index + 1], tokens[index + 2]].every(i => helper.isType(i, TKS.BLOB))) {
                    this.content.push(tokens[index])
                    return {
                        offset: 1,
                    }
                }
                return helper.goOn
            },
        },
        TKS.BLOB,
        TKS.BLOB,
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
}

/**
 * 解析标题
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseHead(index, tokens, handler) {
    if (!helper.isLineStart(tokens, index)) {
        return false
    }

    // 实现一个简单的向前向后看的正则
    const queue = [
        helper.getIdentMatcher(),
        {
            content: [],
            name: 'headLevel',
            stop: false,
            test(type, index, tokens) {
                const { matchTokens } = watchAfterUtil(index, tokens, (item) => {
                    return helper.isType(item, TKS.HEAD_TITLE)
                })

                if (matchTokens.length > 6 || matchTokens.length === 0) {
                    this.stop = true
                    return false
                }

                this.content = matchTokens

                // 通过向前看，向后看以解析判断，是否命中Node节点
                return { offset: matchTokens.length }
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
                    return { offset: 1 } // 忽略尾部\n
                }

                return helper.goOn
            },
        }
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
}

/**
 * 解析代码块
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseBlockCode(index, tokens, handler) {
    if (!helper.isLineStart(tokens, index)) {
        return false
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
                    this.content.push(tokens[index])
                    return {
                        offset: 1
                    }
                } else if (helper.nextIsLienEnd(tokens, index)) {
                    this.content.push(tokens[index], tokens[index + 1])
                    // debugger
                    return {
                        offset: 2
                    }
                }

                return helper.goOn
            },
        },
        {
            content: [],
            name: 'code',
            test(type, index, tokens) {
                // 通过向前看，向后看以解析判断，是否命中Node节点
                if (type === TKS.CODE_BLOCK) {
                    return (
                        helper.isLineStart(tokens, index)
                        && watchAfter(tokens, index, 3).every((item, at) => {
                            if (at === 2) {
                                return helper.isLineEnd(item)
                            }
                            return helper.isType(item, TKS.CODE_BLOCK)
                        })
                    ) ? {
                        offset: 3,
                    } :  helper.goOn
                }

                return helper.goOn
            },
        }
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
}

/**
 * 解析分割线
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseHr(index, tokens, handler) {
    // 实现一个简单的向前向后看的正则
    const queue = [
        {
            content: [],
            name: 'hr',
            test(type, index, tokens) {
                // 通过向前看，向后看以解析判断，是否命中Node节点
                if (helper.isType(tokens[index], TKS.NO_ORDER_LIST)) {
                    const isMatch = helper.isLineStart(tokens, index)
                        && watchAfter(tokens, index, 3).every((item, at) => {
                            if (at === 2) {
                                return helper.isLineEnd(item)
                            }
                            return helper.isType(item, TKS.NO_ORDER_LIST)
                        })
                    return isMatch ? { offset: 3 } : false
                }

                return false
            },
        }
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
}

/**
 * 解析块级引用
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseBlockQuote(index, tokens, handler) {
    if (!helper.isLineStart(tokens, index)) {
        return false
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
                if (watchAfter(tokens, index, 2).every(i => helper.isLineEnd(i))) {
                    this.content.push(tokens[index])
                    return {
                        offset: 2,
                    }
                }

                return helper.goOn
            },
        },
    ]

    // 需要一个描述符号 \n{0,2}$

    return matchUsefulTokens(index, tokens, queue, handler)
}

/**
 * 解析列表
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseList(index, tokens, handler) {
    if (!helper.isLineStart(tokens, index)) {
        return false
    }

    const mtks = []
    const liList = []

    // 先获取ident，然后判断是不是 - / +
    // 如果不是，就向前一个对象的children push
    // 如果是就新增一个对象
    while (true) {
        // 遇到两个换行结束遍历
        if (tokens.slice(index, index + 2).every(i => helper.isLineEnd(i))) {
            break
        }

        if (
            matchUsefulTokens(index, tokens, [
                helper.getIdentMatcher(),
                {
                    content: [],
                    name: 'listType',
                    nodeType: nodeType.li,
                    listStyleType: '',
                    test(type, index, tokens) {
                        if (helper.isType(type, TKS.NO_ORDER_LIST, TKS.ORDER_LIST)) {
                            this.content.push(tokens[index])
                            // 'disc', // 实心圆
                            // 'circle', // 空心圆
                            // 'square', // 方块
                            this.listStyleType = type === TKS.NO_ORDER_LIST ? 'disc' : 'decimal'

                            let todoType = ''
                            const isMatchTodo = watchAfter(tokens, index, 5).every((i, index) => {
                                switch(index) {
                                    case 0:
                                        return helper.isType(i, TKS.WHITE_SPACE)
                                    case 1:
                                        return helper.isType(i, TKS.URL_DESC_START)
                                    case 2: {
                                        if (helper.isType(i, TKS.WHITE_SPACE)) {
                                            todoType = nodeType.li_todo
                                            return true
                                        }

                                        if (helper.isType(i, TKS.STRING) && i.raw === 'x') {
                                            todoType = nodeType.li_done
                                            return true
                                        }
                                        return false
                                    }
                                    case 3:
                                        return helper.isType(i, TKS.URL_DESC_END)
                                    case 4:
                                        return helper.isType(i, TKS.WHITE_SPACE) || helper.isLineEnd(i)
                                }
                            })

                            if (isMatchTodo) {
                                this.content.push(...watchAfter(tokens, index, 4))
                                this.nodeType = todoType
                                return {
                                    offset: 5,
                                }
                            }


                            return {
                                offset: 1, // TODO:忽略结尾token，但其实应当添加到info上
                            }
                        }

                        return false
                    },
                },
                {
                    content: [],
                    name: 'head',
                    test(type, index, tokens) {
                        // 暗含的意思
                        const result = helper.checkIsEnd(tokens, index)
                        if (result.match) {
                            // 需要解决立马遇到行尾的问题
                            this.content.push(...result.match)
                            return {
                                offset: result.match.length, // TODO:忽略结尾token，但其实应当添加到info上
                            }
                        }

                        return helper.goOn
                    },
                }
            ], (mts, info) => {
                index += mts.length
                mtks.push(...mts)
                liList.push({
                    ident: info.ident,
                    head: info.head,
                    listStyleType: info.listType_raw.listStyleType,
                    nodeType: info.listType_raw.nodeType,
                    children: [],
                    tokens: mts,
                })
            })
        ) {
            continue
        }

        if (liList.length === 0) {
            return
        }

        if (
            matchUsefulTokens(index, tokens, [
                {
                    content: [],
                    name: 'content',
                    test(type, index, tokens) {
                        if (helper.isLineEnd(tokens[index])) {
                            // 需要解决立马遇到行尾的问题
                            this.content.push(tokens[index])
                            return {
                                offset: 1, // TODO:忽略结尾token，但其实应当添加到info上
                            }
                        }
                        return helper.goOn
                    },
                }
            ], (mts, info) => {
                index += mts.length
                mtks.push(...mts)
                liList[liList.length - 1].children.push({
                    type: 'normal',
                    content: info.content,
                    tokens: mts,
                })
            })
        ) {
            continue
        }

        break
    }

    if (liList.length !== 0) {
        handler(mtks, liList)
        return true
    }

    return false
}

/**
 * 解析表格
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */
function parseTable(index, tokens, handler) {
    // 如果下一行的内容是  |----|----| 这种格式，则表示是table表格
    if (!helper.isLineStart(tokens, index)) {
        return false
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
                            return helper.goOn
                        }
                        this.children.push([])
                    }

                    // 需要时连续的 - ， --之间不能有空格
                    this.children[this.children.length - 1].push(tokens[index])
                } else if (type === TKS.TABLE_SPLIT) {
                    // 下一个是有效字符
                    // 第一个是空格 第二个是有效字符
                    if (
                        !helper.isType(tokens[index + 1], TKS.WHITE_SPACE, TKS.LINE_END, TKS.TABLE_SPLIT)
                        || (helper.isType(tokens[index + 1], TKS.WHITE_SPACE) && !helper.isType(tokens[index + 2], TKS.WHITE_SPACE, TKS.LINE_END, TKS.TABLE_SPLIT))
                    ) {
                        this.hasSplit = true
                        this.children.push([])
                    }
                }

                // ----|----|------
                if (helper.isLineEnd(tokens[index])) {
                    if (!this.hasSplit || this.children.length === 0) {
                        return false
                    }

                    this.content.push(tokens[index])
                    // 如果字符串
                    return {
                        offset: 1,
                    }
                }

                return helper.goOn
            },
        },
        {
            content: [],
            name: 'split',
            children: [],
            test(type, index, tokens) {
                // 不会存在连续的空格
                if (!helper.isType(type, TKS.NO_ORDER_LIST, TKS.WHITE_SPACE, TKS.LINE_END, TKS.TABLE_SPLIT)) {
                    this.stop = true
                    return false
                }

                if (type !== TKS.TABLE_SPLIT) {
                    if (this.children.length === 0) {
                        // 忽略行首的空格
                        if (helper.isType(type, TKS.WHITE_SPACE)) {
                            return helper.goOn
                        }
                        this.children.push([])
                    }

                    // 需要时连续的 - ， --之间不能有空格
                    this.children[this.children.length - 1].push(tokens[index])
                } else if (type === TKS.TABLE_SPLIT) {
                    // 第一个是 -
                    // 第一个是空格 第二个是 -
                    if (
                        helper.isType(tokens[index + 1], TKS.NO_ORDER_LIST)
                        || (helper.isType(tokens[index + 1], TKS.WHITE_SPACE) && helper.isType(tokens[index + 2], TKS.NO_ORDER_LIST))
                    ) {
                        this.hasSplit = true
                        this.children.push([])
                    }
                }

                // ----|----|------
                if (helper.isLineEnd(tokens[index])) {
                    if (!this.hasSplit || this.children.length === 0) {
                        return false
                    }

                    this.content.push(tokens[index])
                    // 如果字符串
                    return {
                        offset: 1,
                    }
                }

                return helper.goOn
            },
        },
        {
            content: [],
            children: [], // [[[xxx], [yyyyy]], []]
            name: 'tbody', // 二级嵌套
            test(type, index, tokens) {
                if (helper.isType(type, TKS.LINE_END)) {
                    this.children.push([])
                } else {
                    if (this.children.length === 0) {
                        if (helper.isType(type, TKS.WHITE_SPACE)) {
                            return helper.goOn
                        }
                        this.children.push([])
                    }
                    const lastRow = this.children[this.children.length - 1]

                    // | xcxxx
                    if (helper.isType(type, TKS.TABLE_SPLIT)) {
                        if (
                            !helper.isType(tokens[index + 1], TKS.WHITE_SPACE, TKS.LINE_END, TKS.TABLE_SPLIT)
                            || (
                                helper.isType(tokens[index + 1], TKS.WHITE_SPACE)
                                && !helper.isType(tokens[index + 2], TKS.WHITE_SPACE, TKS.LINE_END, TKS.TABLE_SPLIT)
                            )
                        ) {
                            lastRow.push([])
                        }
                    } else {
                        if (lastRow.length === 0) {
                            lastRow.push([])
                        }
                        lastRow[lastRow.length - 1].push(tokens[index])
                    }
                }

                if (watchAfter(tokens, index, 2).every(i => helper.isLineEnd(i))) {
                    this.content.push(tokens[index])
                    // 如果字符串
                    return {
                        offset: 1,
                    }
                }

                return helper.goOn
            },
        },
    ]

    // 需要一个描述符号 \n{0,2}$
    return matchUsefulTokens(index, tokens, queue, handler)
}

export function parser(str = '') {
    return toAST(token(str))
}
