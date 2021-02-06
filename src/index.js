import { diffNode } from './diff.js';
import { parser } from './parser.js';
import patch from './patch.js';
import trans from './trans.js';
import { getParserNodeInfo } from './helper.js'

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

export {
    Markdown,
    parser,
    trans,
    codeHighlight,
    getParseResult,
    markdown,
    markdownInfo, // 获取markdown info 【imgs, text】
};
