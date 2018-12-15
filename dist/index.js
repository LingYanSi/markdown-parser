function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { diffNode } from './diff.js';
import { parser } from './parser.js';
import patch from './patch.js';
import trans from './trans.js';
/**
 * 获取Node内的图片、文本信息
 * @param  {Node} node [markdown AST]
 */

function getParserNodeInfo(node) {
  var text = '';
  var imgs = [];

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
    text: text,
    imgs: imgs
  };
}

var cache = {}; // 获取解析结果

function getParseResult() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var parseResult = cache[str];

  if (!parseResult) {
    var root = parser(str);
    parseResult = _objectSpread({
      root: root
    }, getParserNodeInfo(root));
    cache[str] = parseResult;
  }

  return parseResult;
}

var loadedAsset = {}; // 加载静态资源

function loadAsset(url) {
  return new Promise(function (res) {
    if (loadedAsset[url]) {
      return res();
    }

    var onload = function onload() {
      loadedAsset[url] = true;
      res();
    };

    if (url.endsWith('.js')) {
      var s = document.createElement('script');
      s.onload = onload;
      s.src = url;
      document.head.appendChild(s);
    } else if (url.endsWith('.css')) {
      var _s = document.createElement('link');

      _s.onload = onload;
      _s.type = "text/css";
      _s.rel = "stylesheet";
      _s.charset = "utf-8";
      _s.href = url;
      document.head.appendChild(_s);
    }
  });
}
/**
 * [codeHighlight 代码高亮]
 * @param  {HTMLElement}      dom [代码高亮]
 */


function codeHighlight(dom, config) {
  Promise.all(config.asset.map(loadAsset)).then(function () {
    if (!window.hljs || !dom) return;
    window.hljs.configure({
      // useBR: true, // 是否使用br
      tabReplace: 4
    });

    _toConsumableArray(dom.querySelectorAll('code.highlight')).forEach(function (code) {
      window.hljs.highlightBlock(code);
    });
  });
}

function getConfig(initConfig) {
  return _objectSpread({
    asset: []
  }, initConfig);
}

var Markdown =
/*#__PURE__*/
function () {
  function Markdown(dom, config, str) {
    _classCallCheck(this, Markdown);

    this.dom = dom;
    this.config = config;
    this.prevRoot = null;
  }

  _createClass(Markdown, [{
    key: "update",
    value: function update(str) {
      this.dom.classList.add('markdown');
      var result = getParseResult(str);
      var diffResult = diffNode(this.prevRoot, result.root);
      this.prevRoot = result.root;
      patch(diffResult, this.dom);
      console.log(diffResult);
      console.log('resultRoot::', result.root);
      var config = getConfig(this.config);
      config.useHighlight && codeHighlight(this.dom, config);
    }
  }]);

  return Markdown;
}();

export { Markdown as default };
Markdown.parser = parser;
Markdown.trans = trans;
Markdown.getParseResult = getParseResult;
Markdown.codeHighlight = codeHighlight;

function markdown($dom, str, config) {
  var result = getParseResult(str);
  trans(result.root, this.dom);
  config = getConfig(config);
  codeHighlight($dom, config);
}

export { Markdown, parser, trans, codeHighlight, getParseResult, markdown };
