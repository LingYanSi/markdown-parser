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

const TKS = {
    NO_ORDER_LIST: 'no_order_list',
    ORDER_LIST: 'order_list',
    SIMPLE_URL_START: 'simple_url_start',
    SIMPLE_URL_END: 'simple_url_end',
    URL_START: 'url_start',
    URL_END: 'url_end',
    URL_DESC_START: 'url_desc_start',
    URL_DESC_END: 'url_desc_end',
    HEAD_TITLE: 'head_title',
    IMG_START: 'img_start',
    TABLE_SPLIT: 'table_split',
    CODE_BLOCK: 'code_block',
    WHITE_SPACE: 'white_space',
    LINE_END: 'line_end',
    STRING: 'string',
}

const NODE_TYPE = {
    HEAD: 'head',
    TEXT: 'text',
    NEW_LINE: 'br',
    IMAGE: 'img',
    LINK: 'link',
    CODE: 'code',
    INLINE_CODE: 'inline_code',
}

class MNode {
    constructor(type, tokens = []) {
        this.type = type
        this.tokens = tokens
        this.children = []
    }
}

function token(input = '') {
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

function watchAfterUtil(offset, tokens, fn) {
    const matchTokens = []
    while (offset < tokens.length) {
        const item = tokens[offset]
        if (!fn(item, offset)) {
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
    isLineEnd(token) {
        return !token || token.type === TKS.LINE_END
    },
    isLineStart(tokens, index) {
        const token = tokens[index - 1]
        return !token || token.type === TKS.LINE_END
    },
    isSomeType(token, type) {
        return token && token.type === type
    }
}


/**
 * 解析行内元素
 * @param {*} index
 * @param {*} tokens
 * @param {*} mnodes
 * @returns
 */
function toInlineNode(index, tokens, mnodes) {
    const token = tokens[index]
    if (checkIsImg(index, tokens, (matchTokens) => {
        mnodes.push(new MNode(NODE_TYPE.IMAGE, matchTokens))
        index += matchTokens.length
    })) {
        return index
    }

    if (checkIsUrl(index, tokens, (matchTokens) => {
        mnodes.push(new MNode(NODE_TYPE.LINK, matchTokens))
        index += matchTokens.length
    })) {
        return index
    }

    if (checkIsInlineCode(index, tokens, (matchTokens) => {
        mnodes.push(new MNode(NODE_TYPE.INLINE_CODE, matchTokens))
        index += matchTokens.length
    })) {
        return index
    }

    if (checkIsSimpleUrl(index, tokens, (matchTokens) => {
        mnodes.push(new MNode(NODE_TYPE.LINK, matchTokens))
        index += matchTokens.length
    })) {
        return index
    }

    const lastMnode = mnodes[mnodes.length - 1]
    if (lastMnode && lastMnode.type === NODE_TYPE.TEXT) {
        lastMnode.tokens.push(token)
    } else {
        mnodes.push(new MNode(NODE_TYPE.TEXT, [token]))
    }

    index += 1

    return index
}

/**
 * 把token转换为Node
 * @param {[Token]} tokens
 */
function toNode(tokens) {
    // 解析规则
    // IMAGE URL BOLD ITATIC
    // IMG_START URL_DESC_START WHITE SPACE  URL_DESC_END
    // URL_START SPACE/ENTER/STRING URL_END
    const mnodes = []
    let index = 0

    while (index < tokens.length) {
        const token = tokens[index]
        // 是不是行首
        const isLineStart = helper.isLineStart(tokens, index)

        // parse head
        if (isLineStart && token.type === TKS.HEAD_TITLE) {
            const { matchTokens, nextToken } = watchAfterUtil(index+1, tokens, (item) => {
                return item.type === TKS.HEAD_TITLE
            })
            matchTokens.unshift(token)
            index += matchTokens.length

            // 小于6个，并且下一个元素是空白 或者
            if (
                matchTokens.length <= 6
                && ([TKS.WHITE_SPACE, TKS.LINE_END].includes(nextToken.type) || !nextToken)
            ) {
                const headNode = new MNode(NODE_TYPE.HEAD, matchTokens)
                mnodes.push(headNode)

                let lineEndIndex = index
                while (lineEndIndex < tokens.length) {
                    if (helper.isLineEnd(tokens[lineEndIndex])) {
                        break
                    }
                    lineEndIndex += 1
                }

                const lineNodes = tokens.slice(index, lineEndIndex)
                let startLineIndex = 0
                while (startLineIndex < lineNodes.length) {
                    startLineIndex = toInlineNode(startLineIndex, lineNodes, headNode.children)
                }
                // 去解析当前行的内容
            } else {
                mnodes.push(new MNode(NODE_TYPE.TEXT, matchTokens))
            }
            continue
        } else if (token.type === TKS.LINE_END) {
            mnodes.push(new MNode(NODE_TYPE.NEW_LINE, [token]))
            index += 1

            continue
        }

        if (checkIsBlockCode(index, tokens, (matchTokens) => {
            mnodes.push(new MNode(NODE_TYPE.CODE, matchTokens))
            index += matchTokens.length
        })) {
            continue
        }

        index = toInlineNode(index, tokens, mnodes)
    }

    return mnodes
}

function matchUsefulTokens(index, tokens, queue, handler) {
    let queueTypeIndex = 0
    const matchTokens = [tokens[index]]
    watchAfterUtil(index + 1, tokens, (item, currentIndex) => {
        if (typeof queue[queueTypeIndex] === 'object') {
            const testResult = queue[queueTypeIndex].test(item.type, currentIndex, tokens)
            if (testResult) {
                queue[queueTypeIndex].content.push(item)
                matchTokens.push(item)
                return true
            }
            console.log('收尾了')
            queueTypeIndex += 1
        }

        if (item.type === queue[queueTypeIndex]) {
            queueTypeIndex += 1
            matchTokens.push(item)
            // 直到所有的都匹配到
            return queueTypeIndex !== queue.length
        }

        return false
    })

    if (queueTypeIndex === queue.length) {
        handler(matchTokens)
        return true
    }

    return false
}

function checkIsImg(index, tokens, handler) {
    if (tokens[index].type !== TKS.IMG_START) {
        return false
    }

    const matchTokens = [tokens[index]]

    if (checkIsUrl(index+1, tokens, (urlMatchTokens) => {
        matchTokens.push(...urlMatchTokens)
    })) {
        handler(matchTokens)
        return true
    }

    return false
}

function checkIsUrl(index, tokens, handler) {
    if (tokens[index].type !== TKS.URL_DESC_START) {
        return false
    }

    // 如何完美结合起来
    const queue = [
        {
            content: [],
            name: 'url_description',
            repeatable: true,
            ignore: true,
            test: (type) => ![TKS.URL_DESC_START, TKS.URL_DESC_END].includes(type),
        },
        TKS.URL_DESC_END,
        TKS.URL_START,
        {
            content: [],
            name: 'url_address',
            repeatable: true,
            ignore: false, // 需要记录重复次数，如果记录一次，才能够继续向下一个进行
            test: (type) => ![TKS.URL_START, TKS.URL_END].includes(type),
        },
        TKS.URL_END,
    ]
    // 在这里存储匹配到的结果，然后对，某些可递归元素继续解析 比如 [can parse content]()

    return matchUsefulTokens(index, tokens, queue, handler)
}

function checkIsSimpleUrl(index, tokens, handler) {
    if (tokens[index].type !== TKS.SIMPLE_URL_START) {
        return false
    }

    const queue = [
        {
            content: [],
            name: 'url_address',
            repeatable: true,
            ignore: true,
            test: (type) => ![TKS.SIMPLE_URL_START, TKS.SIMPLE_URL_END, TKS.LINE_END, TKS.WHITE_SPACE].includes(type),
        },
        { test: TKS.SIMPLE_URL_END }
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
}

function checkIsBlockCode(index, tokens, handler) {
    const isLineStart = helper.isLineStart(tokens, index)

    // tokens.slice(index, index + 3).every(i => i.type === TKS.CODE_BLOCK)
    if (isLineStart && tokens[index].type !== TKS.CODE_BLOCK) {
        return false
    }

    // 实现一个简单的向前向后看的正则
    const queue = [
        TKS.CODE_BLOCK,
        TKS.CODE_BLOCK,
        {
            content: [],
            name: 'code',
            repeatable: true,
            ignore: true,
            test(type, index, tokens) {
                // 通过向前看，向后看以解析判断，是否命中Node节点
                if (type === TKS.CODE_BLOCK) {
                    return !(
                        helper.isLineStart(tokens, index)
                        && watchAfter(tokens, index, 3).every((item, at) => {
                            if (at === 2) {
                                return helper.isLineEnd(item)
                            }
                            return item.type === TKS.CODE_BLOCK
                        })
                    )
                }

                return true
            },
        },
        TKS.CODE_BLOCK,
        TKS.CODE_BLOCK,
        TKS.CODE_BLOCK,
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
}

function checkIsInlineCode(index, tokens, handler) {
    // 不能是连续的``
    if (
        tokens[index].type !== TKS.CODE_BLOCK
        || helper.isSomeType(tokens[index + 1], TKS.CODE_BLOCK)
    ) {
        return false
    }

    const queue = [
        {
            content: [],
            name: 'inline-code',
            repeatable: true,
            ignore: true,
            test: (type) => ![TKS.CODE_BLOCK].includes(type),
        },
        TKS.CODE_BLOCK,
    ]

    return matchUsefulTokens(index, tokens, queue, handler)
}

function time(fn) {
    console.time('性能')
    fn()
    console.timeEnd('性能')
}

let result
time(() => {
result = toNode(token(`
### sdffffgggggg
- 111-11111 ![11]( 111)[d
    sds](dg
        sfd)
\`111\`
\`\`\`
\`\`
123344444
\`\`\`
<hfffffffff>
`.repeat(1)))
})
console.log(result)

