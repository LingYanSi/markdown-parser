# Markdown Parser

## demo
[click here](https://lingyansi.github.io/markdown-parser/test/)

## use
```
npm i lys-markdown-parser
yarn add lys-markdown-parser
```

support [highlight](https://github.com/isagalaev/highlight.js)

```js
import { markdown, Markdown } from 'lys-markdown-parser'
// import markdown from 'lys-markdown-parser/asset' // 可选择直接引用highlight静态资源

markdown(dom, str, {
    asset: ['/ddd/ddd/highlight.min.js', '/ddd/ddd/highlight.theme.css'], // 可以传入highlight的相关js/css资源
})

// 启用dom复用，可用在markdown编辑器
const mk = new Markdown(dom, {
    asset: [],
})

mk.update(mkStr)
```

## support rules
支持audio/video/iframe
```
!![语音](src/audio)
!!![视频](src/video)
!![支持iframe](<iframe></iframe>)
```

## issue
[移步 github issue](https://github.com/LingYanSi/markdown-parser/issues)

## 补充说明
- highlight.js 目前不支持显示代码行数[解释在这里](https://highlightjs.readthedocs.io/en/latest/line-numbers.html)
