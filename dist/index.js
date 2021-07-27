'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * diff AST
 * 如果node.type发生变化，那就是replace，反则为update
 * update需要diff props与children
 *  1. props为object，保留key不用参与diff
 *  2. children是数组，需要一定的算法
 *
 * diff array
 * 1. 先删除在nextNode里不存在的type
 * 2. 保留在nextNode里存在的type
 * 3. 删除剩余的元素，最后得到 prevKeepArr
 * 4. nextNode 与 prevKeepArr 最对比，进行move/add操作，
 *      需要注意的是在获取操作的过程，需要丢prevKeepArr进行同步更新
 *      不然会导致操作混乱，数据不一致
 * 5. 返回diff结果
 */

// 为node添加id
/** @typedef {import("./../@type/index").AST} AST */

function checkIsNoNeedDiff(key = '') {
    // __ 开头的未内部私有属性
    return key.startsWith('__') || ['children', '$getNode', 'type', 'raw'].includes(key)
}

/**
 * diff对象差异
 * @export
 * @param {AST} [prevNode={}]
 * @param {AST} [nextNode={}]
 * @returns
 */
function diffObject(prevNode = {}, nextNode = {}) {
    const prevKeys = Object.keys(prevNode);
    const nextKeys = Object.keys(nextNode);

    const change = []; // 删除
    prevKeys.forEach((key) => {
        // 不需要参与diff的key
        if (checkIsNoNeedDiff(key)) {
            return;
        }

        if (nextKeys.includes(key)) {
            if (prevNode[key] !== nextNode[key]) {
                change.push({
                    type: 'change',
                    key,
                    prevNode,
                    nextNode,
                });
            }
            return;
        }
        change.push({
            type: 'del',
            key,
            prevNode,
            nextNode,
        });
    });

    nextKeys.forEach((key) => {
        if (!prevKeys.includes(key)) {
            change.push({
                type: 'add',
                key,
                prevNode,
                nextNode,
            });
        }
    });

    return change;
}

/**
 * 添加node diff，提升性能
 * @export
 * @param {AST} prevNode
 * @param {AST} nextNode
 * @returns
 **/
function diffNode(
    prevNode,
    nextNode,
    diffResultArr = [],
    otherInfo = {}
) {
    if (prevNode === nextNode) return diffResultArr;

    if (!prevNode) {
        diffResultArr.push({
            type: 'add',
            prevNode,
            nextNode,
            ...otherInfo,
        });
    } else if (!nextNode) {
        diffResultArr.push({
            type: 'del',
            prevNode,
            nextNode,
            ...otherInfo,
        });
    } else if (prevNode.type !== nextNode.type) {
        // 如果类型不一样，就重新创建
        diffResultArr.push({
            type: 'replace',
            prevNode,
            nextNode,
            ...otherInfo,
        });
    } else {
        // type一样，比对props与children
        const update = {
            type: 'update',
            prevNode,
            nextNode,
            propsChange: [],
        };

        update.propsChange.push(...diffObject(prevNode, nextNode));

        // 如果前后节点没有发生变化，则继承上一个node上的相关信息
        nextNode.$getNode = prevNode.$getNode;
        nextNode.__update = prevNode.__update;

        if (update.propsChange.length) {
            diffResultArr.push(update);
        }

        // 如果一个节点上的children 没有任何改变可以，忽略这个children
        // 如果一个节点上的，update的props为空
        // 甚至来讲可以把tree拍成一维数组
        diffArr(prevNode, nextNode, diffResultArr);
    }

    return diffResultArr;
}

// 判断数组是否一致
// v1版本不对数组diff的性能做优化
// 需要添加replace功能
/**
 * prevArr nextArr
 * 从prevArr中取出nextArr中所含有的type，为filterArr
 * 然后对filterArr中的元素进行move update add
 * 然后做 patch
 * @export
 * @param {*} prevNode
 * @param {*} nextNode
 * @returns
 */
function diffArr(prevNode, nextNode, diffResultArr = []) {
    const { children: prevArr = [] } = prevNode;
    const { children: nextArr = [] } = nextNode;

    // 如果不存在这个type类型，需要删除
    let filterPrevArr = prevArr.filter((item) => {
        if (!nextArr.some((i) => i.type === item.type)) {
            diffNode(item, null, diffResultArr);
            return false;
        }
        return true;
    });

    // 取有效元素
    nextArr.forEach((item) => {
        filterPrevArr.some((ele, index) => {
            if (ele.type === item.type) {
                filterPrevArr[index] = { isDel: true, ele };
                return true;
            }
            return false;
        });
    });

    // 删除剩余元素
    filterPrevArr
        .filter((i) => !i.isDel)
        .forEach((item) => diffNode(item, null, diffResultArr));

    // 取出有用的元素
    const ff = filterPrevArr.filter((i) => i.isDel).map((i) => i.ele);

    // 最后的move/update add
    nextArr.forEach((item, moveTo) => {
        const isMatch = ff.some((ele, index) => {
            if (ele.type === item.type) {
                // 注释元素，表示其已经使用过了
                ff.splice(index, 1);
                // 需要把ff的元素位置进行实时更新，否则将会出现位置错乱
                ff.splice(moveTo > index ? moveTo - 1 : moveTo, 0, {
                    used: true,
                    ele,
                });

                if (index !== moveTo) {
                    diffResultArr.push({
                        type: 'move',
                        prevNode: ele,
                        nextNode: item,
                        current: index,
                        // 如果目标位置大于当前位置，则需要移动的目标元素下一个元素的前面
                        moveTo: moveTo > index ? moveTo + 1 : moveTo,
                    });
                }
                // 元素需要先移动
                diffNode(ele, item, diffResultArr);
                return true;
            }
            return false;
        });

        if (!isMatch) {
            // 使用占用元素，以矫正index
            ff.splice(moveTo, 0, { add: true, item });
            diffNode(null, item, diffResultArr, { moveTo });
        }
    });
    // 首先来讲filterPrevArr的所有type, nextArr内都是存在的，但可能数量是不一致的
    // [ 1 2 3 ] [ 1 4 3 5 2 ]
    // 4 在 [ 2 3 ] 中不存在，insert after 1
    // 3 在 [ 2 3 ] 中存在，但是3前面还有2，因此需要move，move到4后面
    // 5 在 [ 2 ] 中不存在, insert after 3
    // 2 早 [ 2 ] 中存在，保持不变
}

var nodeType = {
    text: 'text',
    url: 'a',
    img: 'img',
    video: 'video',
    audio: 'audio',
    inlineCode: 'inlineCode',
    br: 'br',
    hr: 'hr',
    root: 'root',

    blod: 'b',
    italic: 'i',
    linethrough: 'lineThrough',
    // 标题
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',

    queto: 'queto',
    code: 'code',

    table: 'table',
    thead: 'thead',
    tbody: 'tbody',
    tr: 'tr',
    th: 'th',
    td: 'td',

    ul: 'ul',
    li: 'li',
    li_done: 'li-done',
    li_todo: 'li-todo',
};

const Reg = {
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
        return /^\*(((?!\*).)*)\*/;
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
};

function getNextLine(ss) {
    const index = ss.indexOf('\n');
    if (index > -1) {
        return [ss.slice(0, index + 1), ss.slice(index + 1)];
    }
    return [ss, ''];
}

function parseBlockCode(str = '', callback) {
    // 开始
    const [startStr, language] = str.match(/^```([^\n]*)?/) || [];

    if (startStr && str[startStr.length] === '\n') {
        let cursor = startStr.length;
        let newStr = str.slice(startStr.length);
        let line = '';

        while (newStr) {
            // 获取下一行
            [line, newStr] = getNextLine(newStr);
            cursor += line.length;

            // 匹配到code ``` 结尾，或者已经到了字符串的行尾
            const isStrEnd = !newStr && !line;

            if (/^\s*```\s*$/.test(line) || isStrEnd) {
                break;
            }
        }

        const result = {
            raw: str.slice(0, cursor),
            language,
            content: str.slice(startStr.length + 1, cursor - line.length),
            endIndex: cursor,
        };

        callback(result);

        return result;
    }
    return null;
}

function treeShake(lineStr = '') {
    return lineStr
        .split('|')
        .filter((i, index, arr) => {
            return index === 0 || index === arr.length - 1 ? i.trim() : i;
        })
        .map((i) => {
            return i.replace(/\s+$/g, '');
        });
}

/**
 * 解析table
 * @export
 * @param {string} [str='']
 * @param {function} callback
 * @returns
 */
function parseTable(str = '', callback) {
    const strCache = str;

    let head = '';
    let splitLine = '';
    let index = 0;

    [head, str] = getNextLine(str);
    [splitLine, str] = getNextLine(str);
    index += splitLine.length + head.length;

    head = treeShake(head);
    splitLine = treeShake(splitLine);

    if (splitLine.length >= 2 && head.length) {
        const table = {
            head,
            body: [],
        };
        let line = '';
        while (str) {
            [line, str] = getNextLine(str);

            if (/^\s+$/.test(line)) {
                index += line.length;
                break;
            } else {
                // 如果遇到其他块级元素则应该结束循环？
                //
                index += line.length;
                table.body.push(treeShake(line));
            }
        }

        // table的head和body长度对齐，避免table渲染出大片空白，或者最后一列没有值的时候不渲染的问题
        const tableRowLen = Math.max(head.length, ...(table.body.map(i => i.length)))
        ;[head, ...table.body].forEach(item => {
            // 借助数组引用类型，修改数组长度
            item.push(...Array.from({ length: tableRowLen - item.length }).fill(''));
        });

        const result = {
            raw: strCache.slice(0, index),
            table,
            endIndex: index,
        };

        callback(result);

        return result;
    }

    return null;
}

// - 一般list
// - [x] todoList，两者都归于list类型
const listReg = /^(\s*)([-+])(\s\[[\sx]?\])?/;

/**
 * 父组件一路向上查询，只关心父节点，不关心兄弟节点
 */
function sortUl(ul) {
    const SPACE_PER = 4;
    const newUl = {
        ...ul,
        ident: -1,
        deep: 0,
        children: [],
    };

    let currentNode = newUl;

    const findParent = (ident) => {
        let node = currentNode;
        while (node) {
            if (node.ident < ident) {
                return node.ul || node;
            }
            node = node._parent;
        }
        return null;
    };

    ul.children.forEach((item) => {
        const [, space] = item.raw.match(listReg);
        const ident = Math.floor(space.length / SPACE_PER);
        // ident 如果<= 当前的ident，那就需要向上切换
        // 如果比当前的ident大的话，就变成当前的子元素，并把current Node更改到
        // 如果是一个li，要添加子li，应当再创建一个ul
        item.ident = ident;
        item.ul = {
            // li可能会嵌套列表
            type: nodeType.ul,
            children: [],
        };
        const parent = findParent(ident);
        if (parent) {
            // deep自增，需要更新到ul
            item.deep = parent.deep + 1;
            item.ul && (item.ul.deep = item.deep);
            item._parent = currentNode;
            currentNode = item;
            parent.children.push(item);
        }
    });

    return newUl;
}

function parseUL(str = '', callback) {
    const strCache = str;

    // 如果遇到了空行则结束，否则都按照
    if (!listReg.test(str)) return;

    let index = 0;
    let line = '';
    const ul = {
        type: nodeType.ul,
        children: [],
    };
    while (str) {
        [line, str] = getNextLine(str);
        index += line.length;

        // 遇到空行则跳出
        if (!line.trim()) {
            break;
        }

        const matchResult = line.match(listReg);
        if (matchResult) {
            // eslint-disable-next-line no-unused-vars
            const [prevStr, space, char, todoStr] = matchResult;
            const child = line.slice(prevStr.length);

            let todoType = nodeType.li;
            if (todoStr) {
                todoType =
                    todoStr.indexOf('x') > -1
                        ? nodeType.li_done
                        : nodeType.li_todo;
            }

            // 判断类型是不是todo
            ul.children.push({
                type: todoType,
                char,
                raw: line,
                children: [child],
            });
        } else {
            ul.children[ul.children.length - 1].children.push(line);
        }
    }

    const result = {
        raw: strCache.slice(0, index),
        list: sortUl(ul),
    };

    callback(result);

    return result;
}

function parseQuote(str, callback) {
    // 判断是不是以 < 开头，以遇到一个换行结束
    if (str[0] !== '>') return;
    const strCache = str;
    let index = 0;

    let line = '';
    while (str) {
        [line, str] = getNextLine(str);
        index += line.length;

        // 使用两个换行作为结束符
        const [nextline] = getNextLine(str);
        if (!line.trim() && !nextline.trim()) {
            break;
        }
    }

    const result = {
        raw: strCache.slice(0, index),
        content: strCache.slice(1, index),
    };

    callback(result);
    return result;
}

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

// 向node节点上添加元数据

/**
 * [parser 获取AST]
 * @method parser
 * @param  {String} [str=''] [description]
 * @return {AST}          [ast tree]
 */
function parser(str = '', defaultNode = null) {
    let IX = 0;
    function addRaw(node, text = '') {
        node.raw = {
            text,
            start: IX,
            end: IX + text.length,
        };
        return node;
    }

    let node =
        defaultNode ||
        addRaw(
            {
                children: [],
                type: nodeType.root,
            },
            str
        );

    /**
     * 更改切换上下文，方便快速添加children
     * @method changeCurrentNode
     * @param  {Object}          child    [需要切换到的node]
     * @param  {Function}        callback [切换后需要执行的callback]
     */
    function changeCurrentNode(child, callback, options = {}) {
        const { isPush = true } = options;
        child.__parent = node;
        node = child;
        callback && callback();
        node = child.__parent;
        isPush && node.children.push(child);
        return node;
    }

    function slice(all = '') {
        str = str.slice(all.length);
        IX += all.length;
    }

    /**
     * [handleText 处理文本]
     * @method handleText
     * @param  {string}   [textStr=''] [description]
     */
    function handleText(textStr = '') {
        if (!textStr || typeof textStr !== 'string') {
            return;
        }

        // 链接
        if (Reg.url.test(textStr)) {
            handleText(
                textStr.replace(Reg.url, (m, $text, $href) => {
                    const child = addRaw(
                        {
                            type: nodeType.url,
                            href: $href,
                            alt: $text,
                            children: [],
                        },
                        m
                    );
                    changeCurrentNode(child, () => {
                        handleText($text);
                    });
                    return '';
                })
            );
            return;
        }

        // 加粗
        if (Reg.blod.test(textStr)) {
            handleText(
                textStr.replace(Reg.blod, (m, $0) => {
                    const child = addRaw(
                        {
                            type: nodeType.blod,
                            children: [],
                        },
                        m
                    );
                    changeCurrentNode(child, () => {
                        handleText($0);
                    });
                    return '';
                })
            );
            return;
        }

        // 中划线
        if (Reg.lineThrough.test(textStr)) {
            handleText(
                textStr.replace(Reg.lineThrough, (m, $0) => {
                    const child = addRaw(
                        {
                            type: nodeType.linethrough,
                            children: [],
                        },
                        m
                    );
                    changeCurrentNode(child, () => {
                        handleText($0);
                    });
                    return '';
                })
            );
            return;
        }

        // 倾斜
        if (Reg.italic.test(textStr)) {
            handleText(
                textStr.replace(Reg.italic, (m, $0) => {
                    const child = addRaw(
                        {
                            type: nodeType.italic,
                            children: [],
                        },
                        m
                    );
                    changeCurrentNode(child, () => {
                        handleText($0);
                    });
                    return '';
                })
            );
            return;
        }
        // 行内code
        if (Reg.inlineCode.test(textStr)) {
            handleText(
                textStr.replace(Reg.inlineCode, (m, $0) => {
                    if ($0) {
                        const child = addRaw(
                            {
                                type: nodeType.inlineCode,
                                children: [],
                            },
                            m
                        );
                        changeCurrentNode(child, () => {
                            handleText($0);
                        });
                    }
                    return '';
                })
            );
            return;
        }
        // 视频
        if (Reg.video.test(textStr)) {
            handleText(
                textStr.replace(Reg.video, (m, $alt, $src) => {
                    changeCurrentNode(
                        addRaw(
                            {
                                type: nodeType.video,
                                src: $src,
                                alt: $alt,
                            },
                            m
                        )
                    );
                    return '';
                })
            );
            return;
        }

        // 音频
        if (Reg.audio.test(textStr)) {
            textStr = textStr.replace(Reg.audio, (m, $alt, $src) => {
                changeCurrentNode(
                    addRaw(
                        {
                            type: nodeType.audio,
                            src: $src,
                            alt: $alt,
                        },
                        m
                    )
                );
                return '';
            });
            handleText(textStr);
            return;
        }

        // 图片
        if (Reg.img.test(textStr)) {
            handleText(
                textStr.replace(Reg.img, (m, $alt, $src) => {
                    changeCurrentNode(
                        addRaw(
                            {
                                type: nodeType.img,
                                src: $src,
                                alt: $alt,
                            },
                            m
                        )
                    );
                    return '';
                })
            );
            return;
        }

        // 换行
        if (textStr[0] == '\n') {
            changeCurrentNode(addRaw({ type: nodeType.br }, textStr[0]));
            handleText(textStr.slice(1));
            return;
        }

        // 文本,如果前一个元素是文本元素，就追加上去，反则新增文本元素
        const lastChild = node.children[node.children.length - 1];
        if (lastChild && lastChild.type === nodeType.text) {
            lastChild.value += textStr[0];
        } else {
            changeCurrentNode(
                addRaw(
                    {
                        type: nodeType.text,
                        value: handleTranslationCode(textStr[0]),
                    },
                    ''
                )
            );
        }
        handleText(textStr.slice(1));
    }

    // 处理需转译字符
    function handleTranslationCode(STR) {
        return STR.replace(/>/g, '>')
            .replace(/\\#/g, '#')
            .replace(/\\`/g, '`')
            .replace(/\\-/g, '-')
            .replace(/\\\*/g, '*');
    }

    // 迭代器
    function next() {
        if (/^\n{1,2}$/.test(str)) {
            return;
        }
        // 解析完毕
        if (!str) {
            return;
        }

        // 换行符
        if (Reg.br.test(str)) {
            const [all] = str.match(Reg.br);
            changeCurrentNode(addRaw({ type: nodeType.br }, all));
            slice(all);
            next();
            return;
        }

        // 标题
        if (Reg.head.test(str)) {
            const [all, head, content] = str.match(Reg.head) || [];
            const child = addRaw(
                {
                    type: nodeType[`h${head.length}`],
                    __headLen: head.length,
                    id: content,
                    children: [],
                },
                all
            );
            changeCurrentNode(child, () => {
                handleText(content);
            });
            slice(all);
            next();
            return;
        }

        // hr
        if (Reg.hr.test(str)) {
            const [all] = str.match(Reg.hr) || [];
            if (all !== undefined) {
                changeCurrentNode(
                    addRaw(
                        {
                            type: nodeType.hr,
                            children: [],
                        },
                        all
                    )
                );
            }
            slice(all);
            next();
            return;
        }

        if (
            parseQuote(str, ({ raw, content }) => {
                const h = addRaw(
                    {
                        type: nodeType.queto,
                        children: [],
                    },
                    raw
                );
                changeCurrentNode(h);
                h.children = parser(content, h).children;
                slice(raw);
            })
        ) {
            next();
            return;
        }

        // code
        if (
            parseBlockCode(str, ({ language, content, raw }) => {
                changeCurrentNode(
                    addRaw(
                        {
                            type: nodeType.code,
                            language,
                            value: content,
                        },
                        raw
                    )
                );
                slice(raw);
            })
        ) {
            next();
            return;
        }

        if (
            parseUL(str, ({ raw, list }) => {
                const LIST_STYLES = [
                    'disc', // 实心圆
                    'circle', // 空心圆
                    'square', // 方块
                ];
                const DECIMAL = 'decimal';

                const handleList = (ul) => {
                    const { children, deep } = ul;

                    const child = {
                        type: nodeType.ul,
                        listStyleType:
                            children[0].char === '+'
                                ? DECIMAL
                                : LIST_STYLES[deep % LIST_STYLES.length],
                        children: [],
                    };

                    changeCurrentNode(child, () => {
                        children.forEach((item) => {
                            changeCurrentNode(
                                { type: item.type, children: [] },
                                () => {
                                    item.children.forEach((line) => {
                                        handleText(line);
                                    });
                                    item.ul.children.length &&
                                        handleList(item.ul);
                                }
                            );
                        });
                    });

                    return child;
                };

                const rootUL = handleList(list);
                rootUL.__root = true; // 根部ul，用以区分嵌套的ul

                slice(raw);
            })
        ) {
            next();
            return;
        }

        // tbale
        if (
            parseTable(str, (result) => {
                changeCurrentNode(
                    addRaw({ type: nodeType.table, children: [] }, result.raw),
                    () => {
                        // table头
                        changeCurrentNode(
                            addRaw({ type: nodeType.thead, children: [] }),
                            () => {
                                changeCurrentNode(
                                    addRaw({ type: nodeType.tr, children: [] }),
                                    () => {
                                        result.table.head.forEach((item) => {
                                            changeCurrentNode(
                                                addRaw(
                                                    {
                                                        type: nodeType.th,
                                                        children: [],
                                                    },
                                                    item
                                                ),
                                                () => {
                                                    handleText(item);
                                                }
                                            );
                                        });
                                    }
                                );
                            }
                        );

                        changeCurrentNode(
                            addRaw({ type: nodeType.tbody, children: [] }),
                            () => {
                                result.table.body.forEach((item) => {
                                    changeCurrentNode(
                                        addRaw({
                                            type: nodeType.tr,
                                            children: [],
                                        }),
                                        () => {
                                            item.forEach((item) => {
                                                changeCurrentNode(
                                                    addRaw(
                                                        {
                                                            type: nodeType.td,
                                                            children: [],
                                                        },
                                                        item
                                                    ),
                                                    () => {
                                                        handleText(item);
                                                    }
                                                );
                                            });
                                        }
                                    );
                                });
                            }
                        );
                    }
                );

                changeCurrentNode(
                    addRaw(
                        {
                            type: nodeType.br,
                        },
                        '\n\n'
                    )
                );

                slice(result.raw);
            })
        ) {
            next();
            return;
        }

        // 单行text
        if (Reg.text.test(str)) {
            const [all] = str.match(Reg.text) || [''];
            handleText(all);
            slice(all);

            next();
            return;
        }

        throw new Error(`cannot handle str:${str}`);
    }

    next();

    return node;
}

/**@typedef {import("../@type").DiffResult} DiffResult */

function insertBefore(newDom, refDom) {
    if (refDom && refDom.parentElement) {
        refDom.parentElement.insertBefore(newDom, refDom);
    }
    return newDom;
}

/**
 *
 * 对diff结果做patch
 * @param {DiffResult} diffResult
 */
function patch(diffResult = [], $container = document.body) {
    diffResult.forEach((item) => {
        const { nextNode } = item;
        switch (item.type) {
            case 'del': {
                const $prevNodeDom = item.prevNode.$getNode(item.type);
                if (!$prevNodeDom.parentElement) {
                    console.log('delete error::', item);
                }
                $prevNodeDom.parentElement.removeChild($prevNodeDom);
                break;
            }

            case 'add': {
                const $realContainer =
                    (nextNode.__parent &&
                        nextNode.__parent.$getNode(item.type)) ||
                    $container;
                trans(nextNode, $realContainer, {
                    // 自定义新节点的插入位置，而不是所有的插在末尾处
                    beforeAppend(ele) {
                        const ref = $realContainer.childNodes[item.moveTo];
                        if (ref) {
                            insertBefore(ele, ref);
                            return true;
                        }
                    },
                });
                break;
            }

            case 'replace': {
                const $prevNodeDom = item.prevNode.$getNode(item.type);
                const $parent = document.createDocumentFragment();
                trans(nextNode, $parent);
                $prevNodeDom.parentElement.replaceChild($parent, $prevNodeDom);
                break;
            }

            case 'move': {
                let { moveTo } = item;
                const { prevNode } = item;
                const $prevNodeDom = prevNode.$getNode(item.type);
                const parent = $prevNodeDom.parentElement;

                // 如果目标元素和当前元素相同，则不用移动
                if (parent.childNodes[moveTo] !== $prevNodeDom) {
                    if (parent.childNodes[moveTo]) {
                        insertBefore($prevNodeDom, parent.childNodes[moveTo]);
                    } else {
                        parent.appendChild($prevNodeDom);
                    }
                }
                break;
            }

            case 'update': {
                const { propsChange, prevNode, nextNode } = item;
                const $prevNodeDom = prevNode.$getNode(item.type);
                // 继承htmlNode
                nextNode.$getNode = prevNode.$getNode;
                if (prevNode.__node) {
                    nextNode.__node = prevNode.__node;
                }

                // 继承update
                if (prevNode.__update) {
                    nextNode.__update = prevNode.__update;
                }

                propsChange.forEach((item) => {
                    const { key } = item;

                    switch (item.type) {
                        case 'change':
                        case 'add': {
                            const newValue = nextNode[key];
                            // 如果有自带更新方法
                            if (prevNode.__update) {
                                prevNode.__update(key, nextNode);
                                break;
                            }

                            // 更新文本节点
                            if ($prevNodeDom instanceof Text) {
                                $prevNodeDom.data = newValue;
                                break;
                            }

                            // 更新其他属性
                            $prevNodeDom.setAttribute(key, newValue);
                            break;
                        }
                        case 'del': {
                            $prevNodeDom.removeAttribute(key);
                            break;
                        }
                    }
                });

                break;
            }
            default: {
                console.error('canot handle type', item, item.type);
            }
        }
    });
}

// 获取节点上的所有文本信息

/**
 * 遍历节点获取Node内的图片、文本信息
 * @param  {Node} node [markdown AST]
 */
function getParserNodeInfo(node) {
    let text = '';
    const imgs = [];
    function next(mNode) {
        if (mNode.type == 'text') {
            text += mNode.value || '';
        }
        if (mNode.type == 'img') {
            imgs.push(mNode.src);
        }
        mNode.children && mNode.children.forEach(next);
    }
    next(node);
    return {
        text,
        imgs,
    };
}

/**
 * AST转HTMLNode
 * 转换结束后AST上需要有HTMLNode的引用，方便下次patch，对HTMLNode做增删改
 * AST也应该提供props update方法，用来处理props更新
 */

/**@typedef {import("../@type").ASTNode} ASTNode */

// 支持ssr
// 抽象的操作 移动/删除/update
// 为什么呢？因为比如有些type video，我们想使用一个组件来实现，而非一个html标签来实现
// 所谓的渲染到多端

/**
 * AST 转 dom
 * @param {ASTNode} node
 * @param {HTMLElement} $parent
 */
function trans(node, $parent, option = {}) {
    let ele; // 接受子节点的元素
    let realRoot; // 真正的根节点，因为对于某些node，他的渲染逻辑不是一个简单的html标签，而是多个标签
    let $getNode = () => ele;

    switch (node.type) {
        case nodeType.audio:
        case nodeType.video: {
            // 处理iframe
            // 我们允许添加iframe，但是限制iframe的大小
            if (/^<iframe(\s*.+)*><\/iframe>$/.test(node.src.trim())) {
                ele = document.createElement('div');
                ele.className = 'audio';

                // https 不允许加载http的iframe
                ele.innerHTML = node.src.replace('http://', '//');

                const iframe = ele.querySelector('iframe');
                iframe.style.cssText +=
                    ';max-width: 100%; max-height: 60vw; overflow: hidden;';
            } else {
                ele = document.createElement(node.type);
                ele.src = node.src;
                ele.alt = node.alt;
                ele.controls = 'true';
            }
            break;
        }
        case nodeType.img: {
            const result = node.src.match(/\.(\d+)x(\d+)\./);
            if (result) {
                const [width, height] = result.slice(1, 3);
                // 图片宽高占位
                const { src } = node;
                ele = document.createElement('div');
                ele.style.cssText = `;position: relative; max-width: ${width}px; overflow: hidden; background: rgb(219, 221, 215);`;
                ele.innerHTML = `<div style="padding-top: ${
                    (height / width) * 100
                }%;">
                    <img ${
                        // eslint-disable-next-line no-undef
                        LY.lazyLoad.caches.includes(src)
                            ? `src="${src}" data-img-cache="true"`
                            : ''
                    }
                        class="lazy-load-img img-loading"
                        data-lazy-img="${node.src}"
                        data-src="${node.src}"
                        style="position: absolute; width: 100%; height: 100%; top: 0;" />
                </div>`;
                break;
            } else {
                ele = document.createElement(node.type);
                ele.src = node.src;
                ele.alt = node.alt;
                break;
            }
        }
        case nodeType.url: {
            ele = document.createElement(node.type);
            ele.href = node.href;
            ele.target = '_blank';
            break;
        }
        case nodeType.text: {
            const text = node.value;
            ele = document.createTextNode(text);
            break;
        }
        case nodeType.br: {
            ele = document.createElement(node.type);
            break;
        }
        case nodeType.code: {
            ele = document.createElement('pre');
            const code = document.createElement('code');
            // 需要在node上添加__update方法，方便更新属性
            node.__update = (key, newNode) => {
                switch (key) {
                    case 'language': {
                        code.className = ['highlight', newNode[key] || ''].join(
                            ' '
                        );
                        break;
                    }
                    case 'value': {
                        code.textContent = newNode[key]; // 不能使用innerHTML
                        break;
                    }
                }
            };
            node.__update('language', node);
            node.__update('value', node);
            ele.appendChild(code);
            break;
        }
        case nodeType.inlineCode: {
            ele = document.createElement('code');
            ele.className = 'inlineCode';
            break;
        }
        case nodeType.head: {
            ele = document.createElement(`h${node.level}`);
            // 添加一个
            // const a = document.createElement('a')
            // const id = getText(node)
            // a.href = `#${id}`
            // a.id = id
            // ele.appendChild(a)
            break;
        }
        case nodeType.ul: {
            ele = document.createElement(node.type);
            node.__update = (key, nodeNode) => {
                ele.style.cssText += `;list-style-type:${nodeNode[key]};`;
            };
            node.__update('listStyleType', node);
            break;
        }
        // 需要完成一个事情，就是添加和dom没有关系，我们可以包两层，包几层的结果是，删除和替换的时候需要特殊处理一下
        // 以避免dom没有删除或者替换干净
        // add / remove / replace / move
        /**
         * node.getRoot = () => [返回真实的根节点]，可以是一个数组
         */
        case 'li-done':
        case 'li-todo': {
            realRoot = document.createElement('li');

            const tag = document.createElement('span');
            tag.className = 'list-todo-tag';
            tag.textContent = node.type === 'li-done' ? '✅' : '🚧';
            realRoot.appendChild(tag);

            ele = document.createElement('span');
            realRoot.appendChild(ele);

            realRoot.style.cssText += `;list-style: none;`;

            $getNode = (type) => (type === 'add' ? ele : realRoot);
            break;
        }
        case nodeType.h3:
        case nodeType.h2:
        case nodeType.h1: {
            ele = document.createElement(node.type);
            // 为标题添加id，以支持锚点
            node.__update = (key, newNode) => {
                if (key === 'id') {
                    ele.id = getParserNodeInfo(newNode).text.trim();
                }
            };
            node.__update('id', node);
            break;
        }
        default: {
            ele = document.createElement(node.type);
            node.indent && (ele.style.cssText += ';padding-left: 2em;');
            // table表格需要设置边框
            if (node.type == nodeType.table) {
                ele.setAttribute('border', '1');
            }
        }
    }

    realRoot = realRoot || ele;
    node.$getNode = $getNode;

    node.tag && ele.setAttribute('tag', node.tag);
    node.children && node.children.forEach((child) => trans(child, ele));

    if (!(option.beforeAppend && option.beforeAppend(realRoot))) {
        $parent.appendChild(realRoot);
    }

    return ele;
}

const cache = {};

// 获取解析结果
function getParseResult(str = '') {
    let parseResult = cache[str];
    if (!parseResult) {
        const root = parser(str);
        parseResult = { root, ...getParserNodeInfo(root) };
        cache[str] = parseResult;
    }
    return parseResult;
}

const loadedAsset = {};
// 加载静态资源
function loadAsset(url) {
    return new Promise((res) => {
        if (loadedAsset[url]) {
            return res();
        }
        const onload = () => {
            loadedAsset[url] = true;
            res();
        };
        if (url.endsWith('.js')) {
            const s = document.createElement('script');
            s.onload = onload;
            s.src = url;
            document.head.appendChild(s);
        } else if (url.endsWith('.css')) {
            const s = document.createElement('link');
            s.onload = onload;
            s.type = 'text/css';
            s.rel = 'stylesheet';
            s.charset = 'utf-8';
            s.href = url;
            document.head.appendChild(s);
        }
    });
}

/**
 * [codeHighlight 代码高亮]
 * @param  {HTMLElement}      dom [代码高亮]
 */
function codeHighlight(dom, config) {
    Promise.all(config.asset.map(loadAsset)).then(() => {
        if (!window.hljs || !dom) return;

        window.hljs.configure({
            // useBR: true, // 是否使用br
            tabReplace: 4,
        });
        [...dom.querySelectorAll('code.highlight')].forEach((code) => {
            window.hljs.highlightBlock(code);
        });
    });
}

function getConfig(initConfig) {
    return {
        asset: [], // 代码高亮库加载
        ...initConfig,
    };
}

class Markdown {
    constructor(dom, config, str) {
        this.dom = dom;
        this.config = config;
        this.prevRoot = null;

        if (str) {
            this.update(str);
        }
    }
    update(str) {
        this.dom.classList.add('markdown');
        const result = getParseResult(str);
        const diffResult = diffNode(this.prevRoot, result.root);
        this.prevRoot = result.root;
        patch(diffResult, this.dom);

        const config = getConfig(this.config);
        codeHighlight(this.dom, config);
    }
}

function markdown($dom, str, config) {
    $dom.innerHTML = '';
    $dom.classList.add('markdown');
    const result = getParseResult(str);
    trans(result.root, $dom);
    config = getConfig(config);
    codeHighlight($dom, config);
}

function markdownInfo(str) {
    // eslint-disable-next-line no-unused-vars
    const { root, ...info } = getParseResult(str);
    return info;
}

exports.Markdown = Markdown;
exports.codeHighlight = codeHighlight;
exports.getParseResult = getParseResult;
exports.markdown = markdown;
exports.markdownInfo = markdownInfo;
exports.parser = parser;
exports.trans = trans;
