import {
    parseTable,
    parseBlockCode,
    parseUL,
    parseQuote,
} from './tokenizer.js';
import nodeType, { Reg } from './nodeType.js';

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
export function parser(str = '', defaultNode = null) {
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

        // 简单链接
        if (Reg.simpleUrl.test(textStr)) {
            handleText(
                textStr.replace(Reg.simpleUrl, (m, $href) => {
                    const child = addRaw(
                        {
                            type: nodeType.url,
                            href: $href,
                            alt: $href,
                            children: [],
                        },
                        m
                    );
                    changeCurrentNode(child, () => {
                        handleText($href);
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
