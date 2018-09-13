# Markdown Parser

## demo
[click here](https://lingyansi.github.io/markdown-parser/test/)

## use
```
npm i markdown-parser
yarn add markdown-parser
```

support [highlight](https://github.com/isagalaev/highlight.js)

```js
import markdown from 'markdown-parser'
import 'markdown-parser/src/theme.css'

markdown(dom, str, {
    highlightSource: ['/ddd/ddd/highlight.min.js', '/ddd/ddd/highlight.theme.css'], // 可以传入highlight的相关js/css资源
})
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
