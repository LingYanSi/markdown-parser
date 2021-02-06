// 获取节点上的所有文本信息
export function getText(node, str = '') {
    if (node.type === 'text') {
        str += node.value || '';
    }
    node.children &&
        node.children.forEach((child) => {
            str += getText(child);
        });
    return str;
}

/**
 * 获取指定字符串的匹配结果，支持循环嵌套
 * @param {string} [str='']
 * @param {string} [startTag='[']
 * @param {string} [endTag=']']
 * @returns
 */
export function getMatchResult(str = '', startTag = '[', endTag = ']') {
    let index = 0;
    let startIndex = -1;
    let openMatch = 0;

    const isEqual = (match) => str.slice(index, index + match.length) === match;

    while (index < str.length) {
        const current = str[index];
        if (!openMatch) {
            if (!current.trim()) {
                index += 1;
                continue;
            } else if (isEqual(startTag)) {
                startIndex = index;
                openMatch += 1;
                index += startTag.length;
                continue;
            } else {
                return [undefined, str];
            }
        }

        if (isEqual(endTag)) {
            openMatch -= 1;
            index += endTag.length;
        } else if (isEqual(startTag)) {
            openMatch += 1;
            index += startTag.length;
        } else {
            index += 1;
        }

        if (!openMatch) {
            return [
                str.slice(startIndex + startTag.length, index - endTag.length),
                str.slice(index),
            ];
        }
    }

    return [undefined, str];
}

/**
 * 遍历节点获取Node内的图片、文本信息
 * @param  {Node} node [markdown AST]
 */
export function getParserNodeInfo(node) {
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
