import nodeType from './nodeType.js';

function getNextLine(ss) {
    const index = ss.indexOf('\n');
    if (index > -1) {
        return [ss.slice(0, index + 1), ss.slice(index + 1)];
    }
    return [ss, ''];
}

export function parseBlockCode(str = '', callback) {
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
export function parseTable(str = '', callback) {
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
        const tableRowLen = Math.max(
            head.length,
            ...table.body.map((i) => i.length)
        );
        [head, ...table.body].forEach((item) => {
            // 借助数组引用类型，修改数组长度
            item.push(
                ...Array.from({ length: tableRowLen - item.length }).fill('')
            );
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

export function parseUL(str = '', callback) {
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

export function parseQuote(str, callback) {
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
