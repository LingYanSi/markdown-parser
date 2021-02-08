export default {
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
