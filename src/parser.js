import { parseTable, parseBlockCode, parseUL, parseQuote } from './tokenizer.js'

/*
 * 1. 关键字 \n# \n- \n+ \n ```language ```
 * queto: \n> \n\n结束
 * markdown 没有嵌套
 * 逐字匹配，除了img/url/code/text/外需要对数据进行循环解析，直到解析到这四种基础格式位置
 * 行内关键字包括 *** ** ![]() []()
 * 对于table的支持
 * \n|--|--|--|
 * 如果不以 #{1,6} - > ``` 开头表明就是字符串
 * 简单的东西，当然可以正则搞定
 * 但目前来看markdown还是需要做一点语法分析的
 */

/** @typedef {import("./../@type/index").AST} AST */

export const Reg = {
    // > 引用
    get queto() {
        return /^>(((?!\n\n)[\s\S])*)\n\n/
    },
    // # 标题
    get head() {
        return /^\s*(#{1,6})([^\n]*)\n?/
    },
    // `行内code`
    get inlineCode() {
        return /^`([^`]*)`/
    },
    get br() {
        return /^\n/
    },
    get text() {
        return /^[^\n]*\n?/
    },
    // --- 分割线
    get hr() {
        return /(^-{3,}\n)/
    },
    // ~~中划线~~
    get lineThrough() {
        return /^~{2}(((?!~{2}).)*)~{2}/
    },
    // *倾斜*
    get italic() {
        return /^\*(((?!\*).)*)\*/
    },
    // **加粗**
    get blod() {
        // 正则意义 以某几个字符开始【中间不存在连续的字符】几个字符结束
        return /^\*{2}(((?!\*{2}).)*)\*{2}/
    },
    // !!![视频](url)
    get video() {
        return /^!{3}\[([^\]]*)\]\(([^)]+)\)/
    },
    // !![音频](url)
    get audio() {
        return /^!{2}\[([^\]]*)\]\(([^)]+)\)/
    },
    // ![图片](url)
    get img() {
        return /^!\[([^\]]*)\]\(([^)]+)\)/
    },
    // [连接描述](url地址)
    get url() {
        return /^\[([^\]]+)\]\(([^)]+)\)/
    },
}

/**
 * 获取指定字符串的匹配结果，支持循环嵌套
 * @param {string} [str='']
 * @param {string} [startTag='[']
 * @param {string} [endTag=']']
 * @returns
 */
function getMatchResult(str = '', startTag = '[', endTag = ']') {
    let index = 0
    let startIndex = -1
    let openMatch = 0

    const isEqual = (match) => str.slice(index, index + match.length) === match

    while(index < str.length) {
        const current = str[index]
        if (!openMatch) {
            if (!current.trim()) {
                index += 1
                continue
            } else if (isEqual(startTag)) {
                startIndex = index
                openMatch += 1
                index += startTag.length
                continue
            } else {
                return [undefined, str]
            }
        }

        if (isEqual(endTag)) {
            openMatch -= 1
            index += endTag.length
        } else if (isEqual(startTag)) {
            openMatch += 1
            index += startTag.length
        } else {
            index += 1
        }

        if (!openMatch) {
            return [str.slice(startIndex + startTag.length, index - endTag.length), str.slice(index)]
        }
    }

    return [undefined, str]
}

/**
 * [parser 获取AST]
 * @method parser
 * @param  {String} [str=''] [description]
 * @return {AST}          [ast tree]
 */
export function parser(str = '', defaultNode = null ) {
    let node = defaultNode || {
        children: [],
        type: 'root',
    }

    /**
     * 更改切换上下文，方便快速添加children
     * @method changeCurrentNode
     * @param  {Object}          child    [需要切换到的node]
     * @param  {Function}        callback [切换后需要执行的callback]
     */
    function changeCurrentNode(child, callback, options = {}) {
        const { isPush = true } = options
        child.__parent = node
        node = child
        callback && callback()
        node = child.__parent
        isPush && node.children.push(child)
        return node
    }

    function slice(all = '') {
        str = str.slice(all.length)
    }

    /**
     * [handleText 处理文本]
     * @method handleText
     * @param  {string}   [textStr=''] [description]
     */
    function handleText(textStr = '') {
        if (!textStr || typeof textStr !== 'string') {
            return
        }

        // 链接
        if (Reg.url.test(textStr)) {
            handleText(textStr.replace(Reg.url, (m, $text, $href) => {
                const child = {
                    type: 'a',
                    href: $href,
                    value: $text,
                    children: [],
                }
                changeCurrentNode(child, () => {
                    handleText($text)
                })
                return ''
            }))
            return
        }


        // 加粗
        if (Reg.blod.test(textStr)) {
            handleText(textStr.replace(Reg.blod, (m, $0) => {
                const child = {
                    type: 'b',
                    children: [],
                }
                changeCurrentNode(child, () => {
                    handleText($0)
                })
                return ''
            }))
            return
        }

        // 中划线
        if (Reg.lineThrough.test(textStr)) {
            handleText(textStr.replace(Reg.lineThrough, (m, $0) => {
                const child = {
                    type: 'lineThrough',
                    children: [],
                }
                changeCurrentNode(child, () => {
                    handleText($0)
                })
                return ''
            }))
            return
        }

        // 倾斜
        if (Reg.italic.test(textStr)) {
            handleText(textStr.replace(Reg.italic, (m, $0) => {
                const child = {
                    type: 'i',
                    children: [],
                }
                changeCurrentNode(child, () => {
                    handleText($0)
                })
                return ''
            }))
            return
        }
        // 行内code
        if (Reg.inlineCode.test(textStr)) {
            handleText(textStr.replace(Reg.inlineCode, (m, $0) => {
                if ($0) {
                    const child = {
                        type: 'inlineCode',
                        children: [],
                    }
                    changeCurrentNode(child, () => {
                        handleText($0)
                    })
                }
                return ''
            }))
            return
        }
        // 视频
        if (Reg.video.test(textStr)) {
            handleText(textStr.replace(Reg.video, (m, $alt, $src) => {
                changeCurrentNode({
                    type: 'video',
                    src: $src,
                    alt: $alt,
                })
                return ''
            }))
            return
        }

        // 音频
        if (Reg.audio.test(textStr)) {
            textStr = textStr.replace(Reg.audio, (m, $alt, $src) => {
                changeCurrentNode({
                    type: 'audio',
                    src: $src,
                    alt: $alt,
                })
                return ''
            })
            handleText(textStr)
            return
        }

        // 图片
        if (Reg.img.test(textStr)) {
            handleText(textStr.replace(Reg.img, (m, $alt, $src) => {
                changeCurrentNode({
                    type: 'img',
                    src: $src,
                    alt: $alt,
                })
                return ''
            }))
            return
        }

        // 换行
        if (textStr[0] == '\n') {
            changeCurrentNode({ type: 'br' })
            handleText(textStr.slice(1))
            return
        }

        // 文本,如果前一个元素是文本元素，就追加上去，反则新增文本元素
        const lastChild = node.children[node.children.length - 1]
        if (lastChild && lastChild.type === 'text') {
            lastChild.value += textStr[0]
        } else {
            changeCurrentNode({
                type: 'text',
                value: handleTranslationCode(textStr[0]),
            })
        }
        handleText(textStr.slice(1))
    }

    // 处理需转译字符
    function handleTranslationCode(STR) {
        return STR.replace(/>/g, '>')
            .replace(/\\#/g, '#')
            .replace(/\\`/g, '`')
            .replace(/\\-/g, '-')
            .replace(/\\\*/g, '*')
    }

    // 迭代器
    function next() {
        if (/^\n{1,2}$/.test(str)) {
            return
        }
        // 解析完毕
        if (!str) {
            return
        }

        // 换行符
        if (Reg.br.test(str)) {
            const [all] = str.match(Reg.br)
            changeCurrentNode({ type: 'br' })
            slice(all)
            next()
            return
        }

        // 标题
        if (Reg.head.test(str)) {
            const [all, head, content] = str.match(Reg.head) || []
            const child = {
                type: `h${head.length}`,
                children: [],
            }
            changeCurrentNode(child, () => {
                handleText(content)
            })
            slice(all)
            next()
            return
        }

        if (parseQuote(str, ({ raw, content }) => {
            const h = {
                type: 'queto',
                children: [],
            }
            changeCurrentNode(h)
            h.children= parser(content, h).children
            slice(raw)
        })) {
            next()
            return
        }

        // code
        if (parseBlockCode(str, ({ language, content, raw }) => {
            changeCurrentNode({
                type: 'code',
                language,
                value: content,
            })
            slice(raw)
        })) {
            next()
            return
        }

        if (parseUL(str, ({ raw, list }) => {
            const LIST_STYLES = [
                'disc', // 实心圆
                'circle', // 空心圆
                'square', // 方块
            ]
            const DECIMAL = 'decimal'

            const handleList = (ul) => {
                const { children, deep } = ul

                const child = {
                    type: 'ul',
                    listStyleType: children[0].char === '+' ? DECIMAL : LIST_STYLES[deep % (LIST_STYLES.length)],
                    children: [],
                }

                changeCurrentNode(child, () => {
                    children.forEach(item => {
                        changeCurrentNode({ type: item.type, children: [], }, () => {
                            item.children.forEach((line) => {
                                handleText(line)
                            })
                            item.ul.children.length && handleList(item.ul)
                        })
                    })
                })
            }

            handleList(list)

            slice(raw)
        })) {
            next()
            return
        }

        // tbale
        if (parseTable(str, (result) => {
            changeCurrentNode({ type: 'table', children: [], }, () => {
                // table头
                changeCurrentNode({ type: 'thead', children: [], }, () => {
                    changeCurrentNode({ type: 'tr', children: [], }, () => {
                        result.table.head.forEach(item => {
                            changeCurrentNode({ type: 'th', children: [], }, () => {
                                handleText(item)
                            })
                        })
                    })
                })

                changeCurrentNode({ type: 'tbody', children: [], }, () => {
                    result.table.body.forEach(item => {
                        changeCurrentNode({ type: 'tr', children: [], }, () => {
                            item.forEach(item => {
                                changeCurrentNode({ type: 'th', children: [], }, () => {
                                    handleText(item)
                                })
                            })
                        })
                    })
                })
            })

            changeCurrentNode({
                type: 'br',
            })

            slice(result.raw)
        })) {
            next()
            return
        }

        // hr
        if (Reg.hr.test(str)) {
            const [all] = str.match(Reg.hr) || []
            if (all !== undefined) {
                changeCurrentNode({
                    type: 'hr',
                    children: [],
                })
            }
            slice(all)
            next()
            return
        }

        // 单行text
        if (Reg.text.test(str)) {
            const [ all ] = str.match(Reg.text) || ['']
            handleText(all)
            slice(all)

            next()
            return
        }

        throw new Error(`cannot handle str:${str}`)
    }

    next()

    return node
}
