// @ts-check
// TODO:
// 递归迭代
// 支持多字符串匹配，支持向前看，向后看
// 性能优化，在解析content的时候，顺带解析节点信息，避免算法复杂度提升🤔
// 如果当前节点信息类型不确认，是否存影响其后续token的解析规则呢？
/**
export const Reg = {
    // > 引用
    get queto() {
        return /^>(((?!\n\n)[\s\S])*)\n\n/;
    },
    // # 标题
    get head() {
        return /^\s*(#{1,6})([^\n]*)\n?/;
    },
    // `行内code`
    get inlineCode() {
        return /^`([^`]*)`/;
    },
    get br() {
        return /^\n/;
    },
    get text() {
        return /^[^\n]*\n?/;
    },
    // --- 分割线
    get hr() {
        return /(^-{3,}\n|^-{3,}$)/;
    },
    // ~~中划线~~
    get lineThrough() {
        return /^~{2}(((?!~{2}).)*)~{2}/;
    },
    // *倾斜*
    get italic() {
        return /^\*(((?!\*).)*)\/;
    },
    // **加粗**
    get blod() {
        // 正则意义 以某几个字符开始【中间不存在连续的字符】几个字符结束
        return /^\*{2}(((?!\*{2}).)*)\*{2}/;
    },
    // !!![视频](url)
    get video() {
        return /^!{3}\[([^\]]*)\]\(([^)]+)\)/;
    },
    // !![音频](url)
    get audio() {
        return /^!{2}\[([^\]]*)\]\(([^)]+)\)/;
    },
    // ![图片](url)
    get img() {
        return /^!\[([^\]]*)\]\(([^)]+)\)/;
    },
    // [连接描述](url地址)
    get url() {
        return /^\[([^\]]+)\]\(([^)]+)\)/;
    },

    // 获取简单的url <https://xxx.ccc>
    get simpleUrl() {
        return /^<(https?:\/{2}[^<]+)>/;
    },
};
 */

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
    QUOTE: 'quote',
}

class MNode {
    constructor(type, tokens = []) {
        this.type = type
        this.tokens = tokens
        this.children = []
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
    isLineEnd(token) {
        return !token || token.type === TKS.LINE_END
    },
    nextIsLienEnd(tokens, index) {
        const token = tokens[index + 1]
        return token && token.type === TKS.LINE_END
    },
    isLineStart(tokens, index) {
        const token = tokens[index - 1]
        return !token || token.type === TKS.LINE_END
    },
    isSomeType(token, type) {
        return token && token.type === type
    },
    goOn: {
        matchEnd: false,
    },
    isCanGoOn(r) {
        return this.goOn === r
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
 * 如果想递归分析，那就需要把start/end携带上，这样就不用不停的分配新数组了
 * 把token转换为Node
 * @param {Token[]} tokens
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
        // parse head
        if(token.type === TKS.LINE_END) {
            mnodes.push(new MNode(NODE_TYPE.NEW_LINE, [token]))
            index += 1

            continue
        }

        if (checkIsHead(index, tokens, (matchTokens, info) => {
            mnodes.push(new MNode(NODE_TYPE.HEAD, matchTokens))
            console.log('headinfo', info)
            index += matchTokens.length
        })) {
            continue
        }

        if (checkIsBlockCode(index, tokens, (matchTokens) => {
            mnodes.push(new MNode(NODE_TYPE.CODE, matchTokens))
            index += matchTokens.length
        })) {
            continue
        }

        if (checkIsBlockQuote(index, tokens, (matchTokens) => {
            mnodes.push(new MNode(NODE_TYPE.QUOTE, matchTokens))
            index += matchTokens.length
        })) {
            continue
        }

        index = toInlineNode(index, tokens, mnodes)
    }

    return mnodes
}


function getQueueContent(queue = []) {
    const info = {}
    queue.forEach(i => {
        if (i.content) {
            info[i.name] = i.content
        }
    })
    return info
}

function matchUsefulTokens(index, tokens, queue, handler, matchTokens = []) {
    let queueTypeIndex = 0
    watchAfterUtil(index, tokens, (item, currentIndex, moveIndex) => {
        while(true) {
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
        handler(matchTokens, getQueueContent(queue))
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
    // 如何完美结合起来
    const queue = [
        TKS.URL_DESC_START,
        {
            content: [],
            name: 'url_description',
            repeatable: true,
            ignore: true,
            test: (type) => [TKS.URL_DESC_START, TKS.URL_DESC_END].includes(type) ? { offset: 0 } : helper.goOn,
        },
        TKS.URL_DESC_END,
        TKS.URL_START,
        {
            content: [],
            name: 'url_address',
            repeatable: true,
            ignore: false, // 需要记录重复次数，如果记录一次，才能够继续向下一个进行
            test: (type) => [TKS.URL_START, TKS.URL_END].includes(type) ? { offset: 0 } : helper.goOn,
        },
        TKS.URL_END,
    ]
    // 在这里存储匹配到的结果，然后对，某些可递归元素继续解析 比如 [can parse content]()

    return matchUsefulTokens(index, tokens, queue, handler)
}

function checkIsSimpleUrl(index, tokens, handler) {
    const queue = [
        TKS.SIMPLE_URL_START,
        {
            content: [],
            name: 'url_address',
            repeatable: true,
            ignore: true,
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

function checkIsInlineCode(index, tokens, handler) {
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
            name: 'inline-code',
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

function checkIsHead(index, tokens, handler) {
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

function checkIsBlockCode(index, tokens, handler) {
    if (!(helper.isLineStart(tokens, index) && tokens[index].type === TKS.CODE_BLOCK)) {
        return false
    }

    // 实现一个简单的向前向后看的正则
    const queue = [
        TKS.CODE_BLOCK,
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

function checkIsBlockQuote(index, tokens, handler) {
    if (!(helper.isLineStart(tokens, index) && tokens[index].type === TKS.SIMPLE_URL_END)) {
        return false
    }
    // 实现一个简单的向前向后看的正则
    const queue = [
        TKS.SIMPLE_URL_END,
        {
            content: [],
            name: 'code',
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

> 你好吗
sddd

很霸道是非得失


fffffffff
`.repeat(1)))
})
console.log(result)

