/*
 * 1. 关键字 \n# \n- \n+ \n ```language ```
 * queto: \n> \n\n结束
 * markdown 没有嵌套
 * 逐字匹配，除了img/url/code/text/外需要对数据进行循环解析，直到解析到这四种基础格式位置
 * 行内关键字包括 *** ** ![]() []()
 * 对于table的支持
 * \n|--|--|--|
 * 如果不以 #{1,6} - > ``` 开头表明就是字符串
 */

export const Reg = {
    // > 引用
    get queto() {
        return /^>(((?!\n\n)[\s\S])*)\n\n/
    },
    // # 标题
    get head() {
        return /^\s*(#{1,6})([^\n]*)\n?/
    },
    // - 无序list
    // + 有序list
    get ul() {
        return /^([-+]\s+((?!\n\n)[\s\S])*)\n\n/
    },
    // `行内code`
    get inlineCode() {
        return /^`([^`]*)`/
    },
    // ```代码块```
    get code() {
        return /^`{3}(((?!```)[\s\S])*)`{3}/
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
    // - [] 待完成事项
    // - [x] 完成事情
    get todoItem() {
        return /^-\ \[(x?|\s*)\]\ +/
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

function splitChar(str = '', char = '') {
    const index = str.indexOf(char)
    return [
        str.slice(0, index),
        str.slice(index + char.length)
    ]
}

/**
 * [parser 获取AST]
 * @method parser
 * @param  {String} [str=''] [description]
 * @return {AST}          [ast tree]
 */
export function parser(str = '') {
    str += '\n\n'
    let node = {
        children: [],
        type: 'root',
    }

    /**
     * 更改当前node
     * @method changeCurrentNode
     * @param  {Object}          child    [需要切换到的node]
     * @param  {Function}        callback [切换后需要执行的callback]
     */
    function changeCurrentNode(child, callback, options = {}) {
        const { isPush = true } = options
        const cacheNode = node
        node = child
        child.__parent = node
        callback && callback()
        node = cacheNode
        isPush && node.children.push(child)
    }

    function slice(all = '') {
        str = str.slice(all.length)
    }

    // 判断是否匹配到 h ul code queto
    function testTableIsEnd(STR) {
        return [
            Reg.head, // 标题 H
            Reg.ul, // list
            Reg.code, // code
            Reg.queto, // 引用
        ].some(regexp => regexp.test(STR))
    }

    /*
        格式支持，两端的|可以不写
        |西溪|sss|
        |---|---|
        |sdfsad|sdfasdf|
    */
    // 解析table
    function parseTable() {
        const [headStr = '', splitStr = ''] = str.split('\n')

        if (!headStr || !splitStr) return false

        /**
         * [getLineContent 获取指定字符串的指定行]
         * @method getLineContent
         * @param  {String}       [str='']    [description]
         * @param  {Number}       [lineNum=0] [description]
         * @return {Array}                   [description]
         */
        function getLineContent(line) {
            // 判断是否符合以 |开头 |结尾
            if (/\|/.test(line)) {
                return line.trim()
                    .replace(/^\||\|$/g, '')
                    .split('|')
            }
            return []
        }
        const head = getLineContent(headStr)
        const split = getLineContent(splitStr)

        const LEN = head.length
        // 判断是否相等，split需要符合/^-+$/规则
        if (
            LEN == 0
            || head.length != split.length
             // 每个元素要满足 是【-】的重复存在
            || !split.every(item => /^-+$/.test(item.replace(/\s/g, '')))
        ) {
            return
        }

        const table = {
            type: 'table',
            children: [],
        }

        changeCurrentNode(table, () => {
            // thead
            str = str.replace(/(.+)\n?/, (m, $0) => {
                const thead = {
                    type: 'thead',
                    children: [],
                }
                changeCurrentNode(thead, () => {
                    const tr = {
                        type: 'tr',
                        children: [],
                    }
                    changeCurrentNode(tr, () => {
                        $0.trim().replace(/^\||\|$/g, '')
                            .split('|')
                            .map((item) => {
                                const th = {
                                    type: 'th',
                                    children: [],
                                }
                                changeCurrentNode(th, () => {
                                    handleText(item)
                                })
                            })
                    })
                })
                return ''
            })
            str = str.replace(/.+\n?/, '')

            // tbody
            const tbody = {
                type: 'tbody',
                children: [],
            }

            changeCurrentNode(tbody, () => {
                const isNotEnd = true

                while (isNotEnd) {
                    const line = (str.match(/^.+\n?/) || [])[0]
                    // 没有匹配到
                    if (!line) {
                        break
                    }
                    // 匹配到其他块级元素
                    if (testTableIsEnd(line)) {
                        break
                    } else {
                        str = str.replace(line, '')
                        const child = {
                            type: 'tr',
                            children: [],
                        }
                        changeCurrentNode(child, () => {
                            let arr = line.trim().split('|')
                            arr = arr[0]
                                ? arr.slice(0, LEN)
                                : arr.slice(1).slice(0, LEN)
                            // 补全数组
                            arr.push(...Array(LEN - arr.length).fill(''))
                            arr.forEach((item) => {
                                const child = {
                                    type: 'td',
                                    children: [],
                                }
                                changeCurrentNode(child, () => {
                                    handleText(item)
                                })
                            })
                        })
                    }
                }
            })
        })

        return true
    }

    /**
     * [handleText 处理文本]
     * @method handleText
     * @param  {string}   [textStr=''] [description]
     */
    function handleText(textStr = '') {
        if (!textStr) {
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
                const child = {
                    type: 'video',
                    src: $src,
                    alt: $alt,
                }
                node.children.push(child)
                return ''
            }))
            return
        }

        // 音频
        if (Reg.audio.test(textStr)) {
            textStr = textStr.replace(Reg.audio, (m, $alt, $src) => {
                const child = {
                    type: 'audio',
                    src: $src,
                    alt: $alt,
                }
                node.children.push(child)
                return ''
            })
            handleText(textStr)
            return
        }

        // 图片
        if (Reg.img.test(textStr)) {
            handleText(textStr.replace(Reg.img, (m, $alt, $src) => {
                const child = {
                    type: 'img',
                    src: $src,
                    alt: $alt,
                }
                node.children.push(child)
                return ''
            }))
            return
        }

        // 换行
        if (textStr[0] == '\n') {
            node.children.push({ type: 'br' })
            handleText(textStr.slice(1))
            return
        }

        // 文本,如果前一个元素是文本元素，就追加上去，反则新增文本元素
        const lastChild = node.children[node.children.length - 1]
        if (lastChild && lastChild.type === 'text') {
            lastChild.value += textStr[0]
        } else {
            node.children.push({
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

    /**
     * [handleUl 处理list字符串]
     * @method handleUl
     * @param  {String} [str=''] [description]
     */
    function handleUl(ulStr = '') {
        ulStr = `${ulStr}\n`
        // 根据$space去识别嵌套
        // 按行处理
        const SPACE_PER = 5 // SPACE_PER 表示一个层级
        const LIST_STYLES = [
            'disc', // 实心圆
            'circle', // 空心圆
            'square', // 方块
        ]
        const DECIMAL = 'decimal'

        function next(currentDeep = -1) {
            if (!ulStr) return
            const line = (ulStr.match(/.+\n?/) || [])[0]
            const space = line.match(/\s*/)[0]
            const DEEP = Math.floor(space.length / SPACE_PER)

            if (/^[-+]\s+/.test(line.trim())) {
                // 如果是加号，表示是一个有序列表
                const IS_PLUS = line.match(/\s*[-+]/)[0].trim() == '+'
                if (DEEP == currentDeep + 1) {
                    // 如果当前行属于新行，就如下一个ul
                    const child = {
                        type: 'ul',
                        listStyleType: IS_PLUS ? DECIMAL : LIST_STYLES[DEEP % (LIST_STYLES.length)],
                        children: [],
                    }
                    changeCurrentNode(child, () => {
                        next(currentDeep + 1)
                    })
                    next(currentDeep)
                    return
                } else if (DEEP == currentDeep) {
                    const child = {
                        type: 'li',
                        children: [],
                    }
                    // 添加子li
                    changeCurrentNode(child, () => {
                        handleText(line.replace(/\s*[-+]\s*/, ''))
                    })
                    ulStr = ulStr.slice(line.length)
                    next(currentDeep)
                    return
                } else if (DEEP < currentDeep) {
                    // 返回到父节点
                    return
                }
            }

            const child = node.children[node.children.length - 1]
            changeCurrentNode(child, () => {
                handleText(line)
            }, { isPush: false })
            ulStr = ulStr.slice(line.length)
            next(currentDeep)
        }
        next()
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
        if (/Reg.br/.test(str)) {
            const [all] = str.match(Reg.br)
            node.children.push({ type: 'br' })
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

        // 引用
        if (Reg.queto.test(str)) {
            const [all, match] = str.match(Reg.queto)
            const [tag, leftStr] = getMatchResult(match, '[', ']')

            const h = {
                type: 'queto',
                tag,
                children: [],
            }
            const child = parser(leftStr.replace(/^\s*\n/, ''))
            h.children = child.children
            node.children.push(h)
            node.children.push({
                type: 'br',
            })
            slice(all)
            next()
            return
        }

        // code
        if (Reg.code.test(str)) {
            const [all, match] = str.match(Reg.code)
            const [language, value] = splitChar(match, '\n').map(i => i.trim())

            node.children.push({
                type: 'code',
                language,
                value,
            })

            slice(all)

            next()
            return
        }

        if (Reg.todoItem.test(str)) {
            const [all] = str.match(Reg.todoItem) || []
            console.log(all, str)
            if (all !== undefined) {
                node.children.push({
                    type: 'todoItem',
                    checked: all.includes('x'),
                })
            }
            slice(all)
            next()
            return
        }

        // ul
        if (Reg.ul.test(str)) {
            const [all, match] = str.match(Reg.ul)
            changeCurrentNode(node, () => {
                handleUl(match)
            }, { isPush: false })

            node.children.push({
                type: 'br',
            })

            slice(all)

            next()
            return
        }

        // tbale
        if (parseTable(str)) {
            next()
            return
        }

        // hr
        if (Reg.hr.test(str)) {
            const [all] = str.match(Reg.hr) || []
            if (all !== undefined) {
                node.children.push({
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
