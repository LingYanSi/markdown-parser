
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


/**
 * type: String,
    children: ASTNode[],
    value?: String,
    src?: String,
    alt?: String,
    language?: String,
    listStyleType?: String,
    raw: {
        start: Number,
        end: Number,
        text: String,
    }
 * */

class MNode {
    constructor(type, tokens = []) {
        this.type = type
        this.tokens = tokens
        this.children = []
    }
}

function astNode(type, tokens = [], properties = {}) {
    return {
        type,
        tokens,
        children: [],
        // 方便元素快速访问其父元素
        push(...args) {
            args.forEach(i => i.__parent = this)
            this.children.push(...args)
        },
        get value() {
            if (this.type !== nodeType.text) return ''
            return this.tokens.map(i => i.raw).join('')
        },
        get raw() {
            return this.children.map(i => i.tokens.map(i => i.raw).join('')).join('') || this.tokens.map(i => i.raw).join('')
        },
        ...properties,
    }
}

function token(input = '') {
    /** @type {Token[]} */
    const tokens = [];
    let index = 0
    while (index < input.length) {
        const char = input[index]

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
                if (lastToken && lastToken.type === 'WHITE_SPACE') {
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
                const lastToken = tokens[tokens.length - 1]
                if (lastToken && lastToken.type === TKS.STRING) {
                    lastToken.raw += char
                    lastToken.end += 1
                } else {
                    tokens.push(new Token(TKS.STRING, char, index, index+1))
                }
            }
        }

        index++
    }

    return tokens
}

function watchAfterUtil(index, tokens, fn) {
    const matchTokens = []
    let offset = index
    const moveIndex = (offsetNum) => {
        offset += offsetNum
        return tokens[offset]
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

function watchAfter(tokens, offset, length = 1) {
    return tokens.slice(offset + 1, offset + length + 1)
}

const helper = {
    // 判断当前token是不是行尾，或者文本结束
    isLineEnd(token) {
        return !token || token.type === TKS.LINE_END
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
    isSomeType(token, type) {
        return token && token.type === type
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
            }
        })
        return info
    }
}

/**
 * 解析行内元素
 * @param {*} index
 * @param {*} tokens
 * @param {*} parentNode
 * @returns
 */
function toInlineNode(index, tokens, parentNode) {
    const token = tokens[index]
    if (isImg(index, tokens, (matchTokens, info) => {
        const node = astNode(nodeType.img, matchTokens)
        node.src = helper.tokensToString(info.src)
        node.alt = helper.tokensToString(info.alt)
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (isUrl(index, tokens, (matchTokens, info) => {
        const node = astNode(nodeType.url, matchTokens, {
            href: helper.tokensToString(info.src),
        })
        node.push(astNode(nodeType.text, info.alt))
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (isInlineCode(index, tokens, (matchTokens, info) => {
        const node = astNode(nodeType.inlineCode, matchTokens)
        node.push(astNode(nodeType.text, info.code))
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (isSimpleUrl(index, tokens, (matchTokens, info) => {
        const node = astNode(nodeType.url, matchTokens, {
            href: helper.tokensToString(info.src),
        })
        node.push(astNode(nodeType.text, info.src))
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (isLineThrough(index, tokens, (matchTokens, info) => {
        const node = astNode(nodeType.linethrough, matchTokens)
        parseInlineNodeLoop(info.content, node)
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (isBlob(index, tokens, (matchTokens, info) => {
        const node = astNode(nodeType.blod, matchTokens)
        parseInlineNodeLoop(info.content, node)
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    if (isItalic(index, tokens, (matchTokens, info) => {
        const node = astNode(nodeType.italic, matchTokens)
        parseInlineNodeLoop(info.content, node)
        parentNode.push(node)
        index += matchTokens.length
    })) {
        return index
    }

    const lastMnode = parentNode[parentNode.length - 1]
    if (lastMnode && lastMnode.type === nodeType.text) {
        lastMnode.tokens.push(token)
    } else {
        parentNode.push(astNode(nodeType.text, [token]))
    }

    index += 1

    return index
}

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
    const root = defaultRoot || astNode(nodeType.root, tokens)
    let index = 0

    while (index < tokens.length) {
        const token = tokens[index]
        // 是不是行首
        // parse head
        if(token.type === TKS.LINE_END) {
            root.push(astNode(nodeType.br, [token]))
            index += 1
            continue
        }

        if (isHead(index, tokens, (matchTokens, info) => {
            const node = astNode(nodeType['h' + info.headLevel.length], matchTokens)
            parseInlineNodeLoop(info.children, node)
            root.push(node)
            index += matchTokens.length
        })) {
            continue
        }

        if (isBlockCode(index, tokens, (matchTokens, info) => {
            console.log(info)
            const node = astNode(nodeType.code, matchTokens, {
                value: helper.tokensToString(info.code),
                language: helper.tokensToString(info.language).trim(),
            })
            root.push(node)
            index += matchTokens.length
        })) {
            continue
        }

        if (isBlockQuote(index, tokens, (matchTokens, info) => {
            const node = astNode(nodeType.queto, matchTokens)
            toAST(info.children, node)
            root.push(node)
            index += matchTokens.length
        })) {
            continue
        }

        if (isNoOrderList(index, tokens, (matchTokens, info) => {
            const node = astNode(nodeType.li, matchTokens)
            parseInlineNodeLoop(info.children, node)
            root.push(node)
            index += matchTokens.length
        })) {
            continue
        }

        index = toInlineNode(index, tokens, root)
    }

    return root
}


/**
 * 匹配
 * @param {number} index
 * @param {Array} tokens
 * @param {Array} queue
 * @param {Function} handler
 * @returns {boolean}
 */
function matchUsefulTokens(index, tokens, queue, handler) {
    const matchTokens = []
    let queueTypeIndex = 0
    watchAfterUtil(index, tokens, (item, currentIndex, moveIndex) => {
        while (true) {
            if (typeof queue[queueTypeIndex] === 'object') {
                const testResult = queue[queueTypeIndex].test(item.type, currentIndex, tokens)
                if (helper.isCanGoOn(testResult)) {
                    queue[queueTypeIndex].content.push(item)
                    matchTokens.push(item)
                    return true
                }

                // 终止向下解析
                if (queue[queueTypeIndex].stop) {
                    return false
                }

                // 移动index
                if (testResult.offset > 0) {
                    matchTokens.push(...tokens.slice(currentIndex, currentIndex + testResult.offset))
                    item = moveIndex(testResult.offset)
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

function isImg(index, tokens, handler) {
    if (tokens[index].type !== TKS.IMG_START) {
        return false
    }

    const matchTokens = [tokens[index]]

    if (isUrl(index+1, tokens, (urlMatchTokens, info) => {
        handler(matchTokens.concat(urlMatchTokens), info)
    })) {
        return true
    }

    return false
}

function isUrl(index, tokens, handler) {
    // 如何完美结合起来
    const queue = [
        TKS.URL_DESC_START,
        {
            content: [],
            name: 'alt',
            test: (type) => [TKS.URL_DESC_START, TKS.URL_DESC_END].includes(type) ? { offset: 0 } : helper.goOn,
        },
        TKS.URL_DESC_END,
        TKS.URL_START,
        {
            content: [],
            name: 'src',
            test: (type) => [TKS.URL_START, TKS.URL_END].includes(type) ? { offset: 0 } : helper.goOn,
        },
        TKS.URL_END,
    ]
    // 在这里存储匹配到的结果，然后对，某些可递归元素继续解析 比如 [can parse content]()

    return matchUsefulTokens(index, tokens, queue, handler)
}

function isSimpleUrl(index, tokens, handler) {
    const queue = [
        TKS.SIMPLE_URL_START,
        {
            content: [],
            name: 'src',
            test: (type) => {
                if ([TKS.SIMPLE_URL_START, TKS.SIMPLE_URL_END, TKS.LINE_END, TKS.WHITE_SPACE].includes(type)) {
                    return { offset: 0 }
                }

                return helper.goOn
            }
        },
        TKS.SIMPLE_URL_END
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
}

function isInlineCode(index, tokens, handler) {
    // 不能是连续的``
    if (
        tokens[index].type !== TKS.CODE_BLOCK
        || helper.isSomeType(tokens[index + 1], TKS.CODE_BLOCK)
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
                if (type === TKS.CODE_BLOCK) {
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

function isLineThrough(index, tokens, handler) {
    const queue = [
        TKS.LINE_THROUGH,
        TKS.LINE_THROUGH,
        {
            content: [],
            name: 'content',
            test(type, index, tokens) {
                if ([tokens[index + 1], tokens[index + 2]].every(i => i && (i.type == TKS.LINE_THROUGH))) {
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

function isItalic(index, tokens, handler) {
    const queue = [
        TKS.BLOB,
        {
            content: [],
            name: 'content',
            test(type, index, tokens) {
                if ([tokens[index + 1]].every(i => i && (i.type == TKS.BLOB))) {
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

function isBlob(index, tokens, handler) {
    const queue = [
        TKS.BLOB,
        TKS.BLOB,
        {
            content: [],
            name: 'content',
            test(type, index, tokens) {
                if ([tokens[index + 1], tokens[index + 2]].every(i => i && (i.type == TKS.BLOB))) {
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

function isHead(index, tokens, handler) {
    if (!helper.isLineStart(tokens, index)) {
        return false
    }

    // 实现一个简单的向前向后看的正则
    const queue = [
        {
            content: [],
            name: 'headLevel',
            stop: false,
            test(type, index, tokens) {
                const { matchTokens } = watchAfterUtil(index, tokens, (item) => {
                    return item.type === TKS.HEAD_TITLE
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
                    return { offset: 0 }
                }

                return helper.goOn
            },
        }
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
}

function isBlockCode(index, tokens, handler) {
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
                            return item.type === TKS.CODE_BLOCK
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

function isBlockQuote(index, tokens, handler) {
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
                if (tokens.slice(index, index + 3).every(i => helper.isLineEnd(i))) {
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

function isNoOrderList(index, tokens, handler) {
    if (!helper.isLineStart(tokens, index)) {
        return false
    }
    // 实现一个简单的向前向后看的正则
    const queue = [
        TKS.NO_ORDER_LIST,
        {
            content: [],
            name: 'children',
            test(type, index, tokens) {
                if (helper.isLineEnd(tokens[index])) {
                    return {
                        offset: 0,
                    }
                } else if (helper.isLineEnd(tokens[index + 1])) {
                    // 需要解决立马遇到行尾的问题
                    this.content.push(tokens[index])
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

function time(fn) {
    console.time('性能')
    fn()
    console.timeEnd('性能')
}

export function parser(str = '') {
    return toAST(token(str))
}


// let result
// time(() => {
// result = toAST(token(`
// ### sdffffgggggg
// - 111-11111 ![11]( 111)[d
//     sds](dg
//         sfd)

// \`111\`
// \`\`\`
// \`\`
// 123344444
// \`\`\`
// <hfffffffff>

// > 你好吗
// ## sddd
// - 很霸道是非得失


// -fffffffff`.repeat(1)))
// })
// console.log(result)

