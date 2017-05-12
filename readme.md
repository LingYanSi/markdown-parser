# Markdown Parser

## 使用
```
npm i markdown-parser
```

代码高亮使用[highlight](https://github.com/isagalaev/highlight.js)

```js
import markdown from 'markdown-parser'
markdown.config({
    highlightSource: ['/ddd/ddd/highlight.min.js', '/ddd/ddd/highlight.theme.css'] // 配置代码高亮库
})
markdown(dom, str)
```
