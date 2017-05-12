import {loadScript} from './loadScript'

/**
 * [cache 缓存]
 * @type {Object}
 */
let cache = {}
let _options = {
    highlightSource: ['/lib/js/highlight.min.js', '/lib/js/highlight.theme.sublime.min.css'], // 代码高亮库加载
    useHL: true, // 是否使用高亮
    cache: true, // 是否使用缓存
}

/**
 * [markdown description]
 * @param  {DOM} dom      [根元素]
 * @param  {String} [str=''] [需要被解析的字符串]
 * @return {[type]}          [description]
 */
function markdown(dom, str = '') {
    dom.innerHTML = ''
    let item = markdown.info(str)
    trans(item.root.children, dom)
    _options.useHL && codeHighlight(dom)
}

/**
 * [info 获取解析后的信息]
 * @param  {String} [str=''] [description]
 * @return {[type]}          [description]
 */
function info(str = ''){
    /**
     * [item {root: markdownParse result, imgs: 所有图片, text: 所有文本}]
     * @type {[type]}
     */
    let item = cache[str]
    if (!item) {
        let root = parser(str)
        item = Object.assign({root}, getParserNodeInfo(root))
        if (_options.cache) {
            cache[str] = item
        }
    }
    return item
}

/**
 * [codeHighlight 代码高亮]
 * @method codeHighlight
 * @param  {DOM}      dom [代码高亮]
 * @return {[type]}          [description]
 */
function codeHighlight(dom){
    loadScript(..._options.highlightSource).then(success => {
        // hljs.initHighlightingOnLoad();
        window.hljs.configure({
            // useBR: true, // 是否使用br
            tabReplace: 4
        });

        ;[...dom.querySelectorAll('code')].forEach(code => {
            window.hljs.highlightBlock(code)
        })
    })
}

/**
 * [getParserNodeInfo 获取]
 * @param  {Node} node [markdown AST]
 * @return {[type]}      [description]
 */
function getParserNodeInfo(node){
    let text = ''
    let imgs = []
    function next(node){
        if (node.name == 'text') {
            text += node.value || ''
        }
        if (node.name == 'img') {
            imgs.push(node.src)
        }
        node.children && node.children.forEach(next)
    }
    next(node)
    return {
        text,
        imgs,
    }
}

function config (options = {}) {
    _options = Object.assign({}, _options, options)
}

markdown.parser = parser
markdown.trans = trans
markdown.info = info
markdown.codeHighlight = codeHighlight
markdown.config = config

export default markdown

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

/**
 * [parser 获取AST]
 * @method parser
 * @param  {String} [str=''] [description]
 * @return {AST}          [ast tree]
 */
function parser(str = '') {
    str = str + '\n\n'
    const cacheStr = str
    let index = 0
    let node = {
        children: [],
        name: 'root'
    }

    /**
     * [changeCurrentNode 更改当前node]
     * @method changeCurrentNode
     * @param  {Object}          child    [需要切换到的node]
     * @param  {Function}        callback [切换后需要执行的callback]
     * @return {[type]}                   [description]
     */
    function changeCurrentNode(child, callback, options = {}) {
        const {isPush = true} = options
        let cacheNode = node
        node = child
        callback()
        node = cacheNode
        isPush && node.children.push(child)
    }

    // 迭代器
    function next() {
        if (/^\n{1,2}$/.test(str)){
            return
        }
        // 解析完毕
        if (!str) {
            return
        }

        // 换行符
        if (/^\n/.test(str)) {
            str = str.replace(/\n/, m => {
                node.children.push({name: 'br'})
                return ''
            })
            return next()
        }

        // 标题
        if (/^#{1,6}\s/.test(str.replace(/\s*/, ''))) {
            str = str.replace(/\s*(#{1,6})\s(.*)\n?/, (m, $0, $1) => {
                let child = {
                    name: `h${$0.length}`,
                    children: []
                }
                changeCurrentNode(child, () => {
                    handleText($1)
                })
                return ''
            })
            return next()
        }

        // 引用
        if (/^>(((?!\n\n)[\s\S])*)\n\n/.test(str.replace(/\s*/, ''))) {
            str = str.replace(/\s*>(((?!\n\n)[\s\S])*)\n\n/, (m, $0) => {
                let h = {
                    name: `queto`,
                    children: []
                }

                let child = parser($0)
                h.children = child.children
                node.children.push(h)
                return ''
            })
            return next()
        }

        // code
        if (/^`{3}(((?!```)[\s\S])*)`{3}/.test(str.trim())) {
            str = str.replace(/\s*`{3}(((?!```)[\s\S])*)`{3}/, (m, $0) => {
                let language = $0.split('\n')[0]
                node.children.push({
                    name: 'code',
                    language: language.trim(),
                    value: $0.slice(language.length)
                })
                return ''
            })

            return next()
        }

        // ul
        if (/^[-+](((?!\n\n)[\s\S])*)\n\n/.test(str.replace(/\s*/, ''))) {
            str = str.replace(/\s*([-+]((?!\n\n)[\s\S])*)\n\n/, (m, $0) => {
                // debugger
                // let child = {
                //     name: `ul`,
                //     children: []
                // }
                changeCurrentNode(node, () => {
                    handleUl($0)
                }, {isPush: false})
                return '\n'
            })

            return next()
        }

        // tbale
        if (str.match(/.+\n/) && /\|.+\|/.test(str.match(/.+\n/)[0].trim()) && parseTable(str)) {
            return next()
        }

        // 单行text
        if (/^.+/.test(str)) {
            str = str.replace(/.+\n?/, m => {
                let child = {
                    name: 'div',
                    indent: /^ {2,}/.test(m), // 是否需要缩进
                    children: []
                }
                changeCurrentNode(child, () => {
                    handleText(m)
                })
                return ''
            })

            return next()
        }

        throw new Error('cannot handle str:' + str)
    }

    // 判断是否匹配到 h ul code queto
    function testTableIsEnd(str) {
        return [
            /^((?!\n)\s)*#{1,6}\s/, // 标题 H
            /^((?!\n)\s)*-(((?!\n\n)[\s\S])*)\n\n/,  // list
            /^((?!\n)\s)*`{3}(((?!```)[\s\S])*)`{3}/, // code
            /^((?!\n)\s)*>(((?!\n\n)[\s\S])*)\n\n/, // 引用
        ].some(regexp => regexp.test(str))
    }

    // 解析table
    function parseTable() {
        let chacheStr = str
        /**
         * [getLineContent 获取指定字符串的指定行]
         * @method getLineContent
         * @param  {String}       [str='']    [description]
         * @param  {Number}       [lineNum=0] [description]
         * @return {Array}                   [description]
         */
        function getLineContent(str = '', lineNum = 0) {
            let line = str.split('\n')[lineNum].trim()
            // 判断是否符合以 |开头 |结尾
            if (/^\|.+\|$/.test(line)) {
                return line.split('|').slice(1, -1)
            }
            return []
        }
        let head = getLineContent(str, 0)
        let split = getLineContent(str, 1)

        const LEN = head.length
        // 判断是否相等，split需要符合/^-+$/规则
        if (LEN == 0 || head.length != split.length || !split.every(item => /^-+$/.test(item.replace(/\s/g, '')))) {
            return
        }

        let table = {
            name: 'table',
            children: []
        }

        changeCurrentNode(table, () => {
            // thead
            str = str.replace(/(.+)\n?/, (m, $0) => {
                let thead = {
                    name: 'thead',
                    children: []
                }
                changeCurrentNode(thead, () => {
                    let tr = {
                        name: 'tr',
                        children: []
                    }
                    changeCurrentNode(tr, () => {
                        $0.trim().split('|').slice(1, -1).map(item => {
                            let th = {
                                name: 'th',
                                children: []
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
            let tbody = {
                name: 'tbody',
                children: []
            }

            changeCurrentNode(tbody, () => {

                let isNotEnd = true

                while (isNotEnd) {
                    let line = (str.match(/^.+\n?/) || [])[0]
                    // 没有匹配到
                    if (!line) {
                        break
                    }
                    // 匹配到其他块级元素
                    if (testTableIsEnd(line)) {
                        break
                    } else {
                        str = str.replace(line, '')
                        let child = {
                            name: 'tr',
                            children: []
                        }
                        changeCurrentNode(child, () => {
                            let arr = line.trim().split('|')
                            arr = arr[0]
                                ? arr.slice(0, LEN)
                                : arr.slice(1).slice(0, LEN)
                            // 补全数组
                            arr.push(...Array(LEN - arr.length).fill(''))
                            arr.map(item => {
                                let child = {
                                    name: 'td',
                                    children: []
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
     * @param  {String}   [str=''] [description]
     * @return {[type]}            [description]
     */
    function handleText(str = '') {
        if (!str) {
            return
        }

        // img url bold itatic code
        // itatic: \*{2}((?!\*{2}).)+\*{2}
        // bold: \*{3}((?!\*{3}).)+\*{3}
        // img: !\[[^\]]+\]\([^\)]+\)
        // url: \[[^\]]+\]\([^\)]+\)
        // code: `{3}((?!`{3}).)+`{3}

        // 加粗
        if (/^\*{3}((?!\*{3}).)+\*{3}/.test(str)) {
            str = str.replace(/\*{3}(((?!\*{3}).)+)\*{3}/, (m, $0) => {
                let child = {
                    name: 'b',
                    children: []
                }
                changeCurrentNode(child, () => {
                    handleText($0)
                })
                return ''
            })
            return handleText(str)
        }

        // 倾斜
        if (/^\*{2}((?!\*{2}).)+\*{2}/.test(str)) {
            str = str.replace(/\*{2}(((?!\*{2}).)+)\*{2}/, (m, $0) => {
                let child = {
                    name: 'i',
                    children: []
                }
                changeCurrentNode(child, () => {
                    handleText($0)
                })
                return ''
            })
            return handleText(str)
        }

        // 视频
        if (/^!{3}\[[^\]]*\]\([^\)]+\)/.test(str)) {
            str = str.replace(/!{3}\[([^\]]*)\]\(([^\)]+)\)/, (m, $alt, $src) => {
                let child = {
                    name: 'video',
                    src: $src,
                    alt: $alt
                }
                node.children.push(child)
                return ''
            })
            return handleText(str)
        }

        // 音频
        if (/^!{2}\[[^\]]*\]\([^\)]+\)/.test(str)) {
            str = str.replace(/!{2}\[([^\]]*)\]\(([^\)]+)\)/, (m, $alt, $src) => {
                let child = {
                    name: 'audio',
                    src: $src,
                    alt: $alt
                }
                node.children.push(child)
                return ''
            })
            return handleText(str)
        }

        // 图片
        if (/^!{1}\[[^\]]*\]\([^\)]+\)/.test(str)) {
            str = str.replace(/!\[([^\]]*)\]\(([^\)]+)\)/, (m, $alt, $src) => {
                let child = {
                    name: 'img',
                    src: $src,
                    alt: $alt
                }
                node.children.push(child)
                return ''
            })
            return handleText(str)
        }

        // 链接
        if (/^\[[^\]]+\]\([^\)]+\)/.test(str)) {
            str = str.replace(/\[([^\]]+)\]\(([^\)]+)\)/, (m, $text, $href) => {
                let child = {
                    name: 'a',
                    href: $href,
                    value: $text
                }
                node.children.push(child)
                return ''
            })
            return handleText(str)
        }

        // 换行
        if (str[0] == '\n') {
            node.children.push({name: 'br'})
            return handleText(str.slice(1))
        }

        // 文本,如果前一个元素是文本元素，就追加上去，反则新增文本元素
        let lastChild = node.children[node.children.length - 1]
        if (lastChild && lastChild.name == 'text') {
            lastChild.value += str[0]
        } else {
            node.children.push({
                name: 'text',
                value: handleTranslationCode(str[0])
            })
        }
        handleText(str.slice(1))
    }

    // 处理需转译字符
    function handleTranslationCode(str) {
        return str.replace(/\>/g, '>')
                .replace(/\\#/g, '#')
                .replace(/\\`/g, '`')
                .replace(/\\-/g, '-')
                .replace(/\\\*/g, '*')
    }

    /**
     * [handleUl 处理list字符串]
     * @method handleUl
     * @param  {String} [str=''] [description]
     * @return {[type]}          [description]
     */
    function handleUl(str = '') {
        str = `${str}\n`
        // 根据$space去识别嵌套
        // 按行处理
        let prevSpaceCache = []

        const SPACE_PER = 5 // SPACE_PER 表示一个层级
        const LIST_STYLES = [
            'disc', // 实心圆
            'circle', // 空心圆
            'square' // 方块
        ]
        const DECIMAL = 'decimal'

        function next(currentDeep = -1) {
            if (!str) return
            let line = (str.match(/.+\n?/) || [])[0]
            let space = line.match(/\s*/)[0]
            let DEEP = Math.floor(space.length / SPACE_PER)

            if ( /^[-+]\s+/.test(line.trim()) ) {
                // 如果是加号，表示是一个有序列表
                const IS_PLUS = line.match(/\s*[-+]/)[0].trim() == '+'
                if (DEEP == currentDeep + 1) {
                    // 如果当前行属于新行，就如下一个ul
                    let child = {
                        name: 'ul',
                        type: IS_PLUS ? DECIMAL : LIST_STYLES[DEEP%(LIST_STYLES.length)],
                        children: []
                    }
                    changeCurrentNode(child, () => {
                        next(currentDeep + 1)
                    })
                    return next(currentDeep)
                } else if (DEEP == currentDeep) {
                    // if (node.children.length == 0 && IS_PLUS) {
                    //     node.type = DECIMAL
                    // }
                    let child = {
                        name: 'li',
                        children: []
                    }
                    // 添加子li
                    changeCurrentNode(child, () => {
                        handleText(line.replace(/\s*[-+]\s*/, ''))
                    })
                    str = str.slice(line.length)
                    return next(currentDeep)
                } else if (DEEP < currentDeep) {
                    // 返回到父节点
                    return
                }
            }

            let child = node.children[node.children.length - 1]
            changeCurrentNode(child, () => {
                handleText(line)
            }, {isPush: false})
            str = str.slice(line.length)
            return next(currentDeep)
        }

        next()
    }

    next()

    return node
}

/**
 * [trans AST->node]
 * @method trans
 * @param  {AST} nodes   [description]
 * @param  {DOM} $parent [description]
 */
function trans(nodes, $parent) {
    nodes.forEach(node => {
        switch (node.name) {
            case 'audio':
            case 'video': {
                // 处理iframe
                // 我们允许添加iframe，但是限制iframe的大小
                if (/^<iframe(\s*.+)*><\/iframe>$/.test(node.src.trim())) {
                    let ele = document.createElement('div')
                    // https 不允许加载http的iframe
                    ele.innerHTML = node.src.replace('http://', '//')
                    let iframe = ele.querySelector('iframe')
                    iframe.style.cssText += `;max-width: 100%; max-height: 60vw; overflow: hidden;`
                    $parent.appendChild(iframe)
                    break
                }
                let ele = document.createElement(node.name)
                ele.src = node.src
                ele.alt = node.alt
                ele.controls = 'true'
                $parent.appendChild(ele)
                break
            }
            case 'img':
                {
                    let width, height
                    node.src.replace(/\.([0-9]+)x([0-9]+)\./g, (str, w, h)=>{
                        width = +w
                        height = +h
                    })
                    if (width && height) {
                        // 图片宽高占位
                        let div = document.createElement('div')
                        div.style.cssText = `;position: relative;  max-width: ${width}px; overflow: hidden; background: rgb(219, 221, 215);`
                        div.innerHTML = `<div style="padding-top: ${height/width*100}%;">
                            <img src="${node.src}" alt="${node.alt}" style="position: absolute; width: 100%; height: auto; top: 0;" />
                        </div>`
                        $parent.appendChild(div)
                        break
                    } else {
                        let ele = document.createElement(node.name)
                        ele.src = node.src
                        ele.alt = node.alt
                        $parent.appendChild(ele)
                        break
                    }
                }
            case 'text':
                {
                    let text = node.value
                    let ele = document.createTextNode(text)
                    $parent.appendChild(ele)
                    break
                }
            case 'br':
                {
                    let ele = document.createElement(node.name)
                    $parent.appendChild(ele)
                    break
                }
            case 'a':
                {
                    let ele = document.createElement(node.name)
                    ele.href = node.href
                    ele.target = '_blank'
                    ele.textContent = node.value
                    $parent.appendChild(ele)
                    break
                }
            case 'code':
                {
                    let ele = document.createElement('pre')
                    ele.innerHTML = `<code class='${node.language || ''}'>${node.value}</code>`
                    $parent.appendChild(ele)
                    break
                }
            case 'ul':
                {
                    let ele = document.createElement(node.name)
                    ele.style.cssText += `;list-style-type:${node.type};`
                    trans(node.children, ele)
                    $parent.appendChild(ele)
                    break
                }
            default:
                {
                    let ele = document.createElement(node.name)
                    node.indent && (ele.style.cssText += `;padding-left: 2em;`)
                    trans(node.children, ele)
                    $parent.appendChild(ele)
                }
        }
    })
}
