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

const Reg = {
    get hr() {
        return /(^-{3,}[^\n]+\n?)/
    },
    // 行内code
    get inlineCode() {
        return /^`([^`]*)`/
    },
    get code() {
        return /^`{3}(((?!```)[\s\S])*)`{3}/
    },
    get queto() {
        return /^\s*>(((?!\n\n)[\s\S])*)\n\n/
    },
    get head() {
        return /^(#{1,6})([^\n]*)\n?/
    },
    get br() {
        return /^\n/
    },
    get ul() {
        return /^\s*([-+]\s+((?!\n\n)[\s\S])*)\n\n/
    },
    get text() {
        return /^[^\n]*\n?/
    },
    get blod() {
        return /^\*{3}(((?!\*{3}).)*)\*{3}/
    },
    get italic() {
        return /^\*{2}(((?!\*{2}).)*)\*{2}/
    },
    get video() {
        return /^!{3}\[([^\]]*)\]\(([^)]+)\)/
    },
    get audio() {
        return /^!{2}\[([^\]]*)\]\(([^)]+)\)/
    },
    get img() {
        return /^!\[([^\]]*)\]\(([^)]+)\)/
    },
    get url() {
        return /^\[([^\]]+)\]\(([^)]+)\)/
    },
}

function splitChar(str = '', char = '') {
    const fist = ''
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
function parser(str = '') {
    str += '\n\n'
    let node = {
        children: [],
        name: 'root',
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
        callback()
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
        格式
        |西溪|sss|
        |---|---|
        |sdfsad|sdfasdf|
    */
    // 解析table
    function parseTable() {
        /**
         * [getLineContent 获取指定字符串的指定行]
         * @method getLineContent
         * @param  {String}       [str='']    [description]
         * @param  {Number}       [lineNum=0] [description]
         * @return {Array}                   [description]
         */
        function getLineContent(str = '', lineNum = 0) {
            const line = str.split('\n')[lineNum].trim()
            // 判断是否符合以 |开头 |结尾
            if (/^\|.+\|$/.test(line)) {
                return line.split('|').slice(1, -1)
            }
            return []
        }
        const head = getLineContent(str, 0)
        const split = getLineContent(str, 1)

        const LEN = head.length
        // 判断是否相等，split需要符合/^-+$/规则
        if (LEN == 0 || head.length != split.length || !split.every(item => /^-+$/.test(item.replace(/\s/g, '')))) {
            return
        }

        const table = {
            name: 'table',
            children: [],
        }

        changeCurrentNode(table, () => {
            // thead
            str = str.replace(/(.+)\n?/, (m, $0) => {
                const thead = {
                    name: 'thead',
                    children: [],
                }
                changeCurrentNode(thead, () => {
                    const tr = {
                        name: 'tr',
                        children: [],
                    }
                    changeCurrentNode(tr, () => {
                        $0.trim().split('|').slice(1, -1).map((item) => {
                            const th = {
                                name: 'th',
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
                name: 'tbody',
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
                            name: 'tr',
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
                                    name: 'td',
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
                    name: 'a',
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
                    name: 'b',
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
                    name: 'i',
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
                        name: 'inlineCode',
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
                    name: 'video',
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
                    name: 'audio',
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
                    name: 'img',
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
            node.children.push({ name: 'br' })
            handleText(textStr.slice(1))
            return
        }

        // 文本,如果前一个元素是文本元素，就追加上去，反则新增文本元素
        const lastChild = node.children[node.children.length - 1]
        if (lastChild && lastChild.name === 'text') {
            lastChild.value += textStr[0]
        } else {
            node.children.push({
                name: 'text',
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
                        name: 'ul',
                        type: IS_PLUS ? DECIMAL : LIST_STYLES[DEEP % (LIST_STYLES.length)],
                        children: [],
                    }
                    changeCurrentNode(child, () => {
                        next(currentDeep + 1)
                    })
                    next(currentDeep)
                    return
                } else if (DEEP == currentDeep) {
                    const child = {
                        name: 'li',
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
            node.children.push({ name: 'br' })
            slice(all)
            next()
            return
        }

        // 标题
        if (Reg.head.test(str)) {
            const [all, head, content] = str.match(Reg.head) || []
            const child = {
                name: `h${head.length}`,
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
            const h = {
                name: 'queto',
                children: [],
            }
            const child = parser(match)
            h.children = child.children
            node.children.push(h)
            slice(all)
            next()
            return
        }

        // code
        if (Reg.code.test(str)) {
            const [all, match] = str.match(Reg.code)
            const [language, value] = splitChar(match, '\n').map(i => i.trim())

            node.children.push({
                name: 'code',
                language,
                value,
            })

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

            slice(all)

            next()
            return
        }

        // tbale
        if (str.match(/.+\n/) && /\|.+\|/.test(str.match(/.+\n/)[0].trim()) && parseTable(str)) {
            next()
            return
        }

        // hr
        if (Reg.hr.test(str)) {
            const [all] = str.match(Reg.hr) || []
            if (all !== undefined) {
                node.children.push({
                    name: 'hr',
                    children: [],
                })
            }
            slice(all)
            next()
            return
        }

        // 单行text
        if (Reg.text.test(str)) {
            const [all] = str.match(Reg.text) || []
            const child = {
                name: 'div',
                indent: /^ {2,}/.test(all), // 是否需要缩进
                children: [],
            }
            changeCurrentNode(child, () => {
                handleText(all)
            })
            slice(all)

            next()
            return
        }

        throw new Error(`cannot handle str:${str}`)
    }

    next()

    return node
}

function getText(node, str = '') {
    str += node.name === 'text' ? node.value : ''
    node.children && node.children.forEach((child) => {
        str += getText(child)
    })
    return str
}

/**
 * AST 转 dom
 * @param {*} nodes
 * @param {*} $parent
 */
function trans(nodes, $parent) {
    Array.isArray(nodes) && nodes.forEach((node) => {
        switch (node.name) {
        case 'audio':
        case 'video': {
            // 处理iframe
            // 我们允许添加iframe，但是限制iframe的大小
            if (/^<iframe(\s*.+)*><\/iframe>$/.test(node.src.trim())) {
                const ele = document.createElement('div')
                // https 不允许加载http的iframe
                ele.innerHTML = node.src.replace('http://', '//')
                const iframe = ele.querySelector('iframe')
                iframe.style.cssText += ';max-width: 100%; max-height: 60vw; overflow: hidden;'
                $parent.appendChild(iframe)
                break
            }
            const ele = document.createElement(node.name)
            ele.src = node.src
            ele.alt = node.alt
            ele.controls = 'true'
            $parent.appendChild(ele)
            break
        }
        case 'img':
        {
            let width
            let height
            const result = node.src.match(/\.(\d+)x(\d+)\./)
            if (result) {
                [width, height] = result.slice(1, 3)
                // 图片宽高占位
                const { src } = node
                const div = document.createElement('div')
                div.style.cssText = `;position: relative; max-width: ${width}px; overflow: hidden; background: rgb(219, 221, 215);`
                div.innerHTML = `<div style="padding-top: ${height / width * 100}%;">
                            <img ${LY.lazyLoad.caches.includes(src) ? `src="${src}" data-img-cache="true"` : ''}
                                class="lazy-load-img img-loading"
                                data-lazy-img="${node.src}"
                                style="position: absolute; width: 100%; height: 100%; top: 0;" />
                        </div>`
                $parent.appendChild(div)
                break
            } else {
                const ele = document.createElement(node.name)
                ele.src = node.src
                ele.alt = node.alt
                $parent.appendChild(ele)
                break
            }
        }
        case 'text':
        {
            const text = node.value
            const ele = document.createTextNode(text)
            $parent.appendChild(ele)
            break
        }
        case 'br':
        {
            const ele = document.createElement(node.name)
            $parent.appendChild(ele)
            break
        }
        case 'a':
        {
            const ele = document.createElement(node.name)
            ele.href = node.href
            ele.target = '_blank'
            trans(node.children, ele)
            $parent.appendChild(ele)
            break
        }
        case 'code':
        {
            const ele = document.createElement('pre')
            const code = document.createElement('code')
            code.className = ['highlight', node.language || ''].join(' ')
            code.textContent = node.value // 不能使用innerHTML
            ele.appendChild(code)

            $parent.appendChild(ele)
            break
        }
        case 'inlineCode': {
            const ele = document.createElement('code')
            ele.className = 'inlineCode'
            trans(node.children, ele)
            $parent.appendChild(ele)
            break
        }
        case 'h1':
        {
            const ele = document.createElement(node.name)
            const a = document.createElement('a')
            const id = getText(node)
            a.href = `#${id}`
            a.id = id
            ele.appendChild(a)
            trans(node.children, ele)
            $parent.appendChild(ele)
            break
        }
        case 'ul':
        {
            const ele = document.createElement(node.name)
            ele.style.cssText += `;list-style-type:${node.type};`
            trans(node.children, ele)
            $parent.appendChild(ele)
            break
        }
        default:
        {
            const ele = document.createElement(node.name)
            node.indent && (ele.style.cssText += ';padding-left: 2em;')
            // table表格需要设置边框
            if (node.name == 'table') {
                ele.setAttribute('border', '1')
            }
            trans(node.children, ele)
            $parent.appendChild(ele)
        }
        }
    })
}


/**
 * [cache 缓存]
 * @type {Object}
 */
const cache = {}
/**
 * [getParserNodeInfo 获取]
 * @param  {Node} node [markdown AST]
 * @return      [description]
 */
function getParserNodeInfo(node) {
    let text = ''
    const imgs = []
    function next(mNode) {
        if (mNode.name == 'text') {
            text += mNode.value || ''
        }
        if (mNode.name == 'img') {
            imgs.push(mNode.src)
        }
        mNode.children && mNode.children.forEach(next)
    }
    next(node)
    return {
        text,
        imgs,
    }
}


/**
 * [info 获取解析后的信息]
 * @param  {String} [str=''] [description]
 */
function info(str = '') {
    let item = cache[str]
    if (!item) {
        const root = parser(str)
        item = { root, ...getParserNodeInfo(root) }
        cache[str] = item
    }
    return item
}

// 加载静态资源
function loadAsset(url) {
    if (url.endsWith('.js')) {
        return new Promise(res => {
            const s = document.createElement('script')
            s.onload = () => {
                res()
            }
            s.src = url
            document.head.appendChild(s)
        })
    }
    if (url.endsWith('.css')) {
        return new Promise(res => {
            const s = document.createElement('link')
            s.onload = () => {
                res()
            }
            s.type = "text/css"
            s.rel = "stylesheet"
            s.charset = "utf-8"
            s.href = url
            document.head.appendChild(s)
        })
    }
}

/**
 * [codeHighlight 代码高亮]
 * @method codeHighlight
 * @param  {DOM}      dom [代码高亮]
 */
function codeHighlight(dom, config) {
    Promise.all(config.highlightSource.map(loadAsset))
        .then((success) => {
            window.hljs.configure({
            // useBR: true, // 是否使用br
                tabReplace: 4,
            });
            [...dom.querySelectorAll('code.highlight')].forEach((code) => {
                window.hljs.highlightBlock(code)
            })
        })
}


function markdown(dom, str = '', config) {
    dom.innerHTML = ''
    dom.classList.add('markdown')
    const item = markdown.info(str)
    trans(item.root.children, dom)
    config = {
        highlightSource: ['/src/theme.css', '/asset/highlight.min.js', '/asset/highlight.theme.atom-one-dark.css'], // 代码高亮库加载
        useHighlight: true, // 是否使用高亮
        cache: true, // 是否使用缓存
        ...config,
    }
    config.useHighlight && codeHighlight(dom, config)
}

markdown.parser = parser
markdown.trans = trans
markdown.info = info
markdown.codeHighlight = codeHighlight

export default markdown
export {
    markdown,
    parser,
}
