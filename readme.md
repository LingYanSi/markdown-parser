# Markdown Parser

实现了[github markdown 规范](https://guides.github.com/features/mastering-markdown/)

## demo

[click here](https://lingyansi.github.io/markdown-parser/test/)

## use

```
npm i lys-markdown-parser
yarn add lys-markdown-parser
```

support [highlight](https://github.com/isagalaev/highlight.js)

```js
import { markdown, Markdown } from 'lys-markdown-parser';
// import markdown from 'lys-markdown-parser/asset' // 可选择直接引用highlight静态资源

markdown(dom, str, {
    asset: ['/ddd/ddd/highlight.min.js', '/ddd/ddd/highlight.theme.css'], // 可以传入highlight的相关js/css资源
});

// 启用dom复用，可用在markdown编辑器
const mk = new Markdown(dom, {
    asset: [],
});

mk.update(mkStr);
```

### iief/umd

在浏览器中直接引用`dist/lymd.min.js`使用

```js
lymd.markdown(document.body, `# hello lymd`);
```

## support rules

支持 audio/video/iframe

```
!![语音](src/audio)
!!![视频](src/video)
!![支持iframe](<iframe></iframe>)
```

## todo
- 支持查看AST
- 支持自定义渲染
- 支持格式化
- 支持对AST进行修改，并输出为字
- 支持注释语法
- 支持html标签解析？

## issue

[移步 github issue](https://github.com/LingYanSi/markdown-parser/issues)

## 补充说明

-   highlight.js 目前不支持显示代码行数[解释在这里](https://highlightjs.readthedocs.io/en/latest/line-numbers.html)
