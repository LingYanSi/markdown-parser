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
    comment: 'comment', // comment
    htmlRaw: 'htmlRaw', // html原始元素
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

    // 获取简单的url <https://xxx.ccc>
    get simpleUrl() {
        return /^<(https?:\/{2}[^<]+)>/;
    },
};

export const TOKEN_TYPE = {
    NO_ORDER_LIST: 'no_order_list', // -
    ORDER_LIST: 'order_list', // +
    SIMPLE_URL_START: 'simple_url_start', // <
    SIMPLE_URL_END: 'simple_url_end', // >
    URL_START: 'url_start', // [
    URL_END: 'url_end', // ]
    URL_DESC_START: 'url_desc_start', // (
    URL_DESC_END: 'url_desc_end', // )
    HEAD_TITLE: 'head_title', // #
    IMG_START: 'img_start', // !
    TABLE_SPLIT: 'table_split', // |
    CODE_BLOCK: 'code_block', // `
    WHITE_SPACE: 'white_space', //
    LINE_END: 'line_end', // \n
    LINE_THROUGH: 'linethrough', // ~
    BLOB: 'blob', // *
    STRING: 'string', // 非以上关键字符之外的连续字符
    COMMENT_START: 'comment_start',
    COMMENT_END: 'comment_end',
};
