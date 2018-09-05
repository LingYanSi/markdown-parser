function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

/*
 * 1. 关键字 \n# \n- \n+ \n ```language ```
 * queto: \n> \n\n结束
 * markdown 没有嵌套
 * 逐字匹配，除了img/url/code/text/外需要对数据进行循环解析，直到解析到这四种基础格式位置
 * 行内关键字包括 *** ** ![]() []()
 * 对于table的支持
 * \n|--|--|--|
 * 如果不以 #{1,6} - > ``` 开头表明就是字符串
 */
var Reg = {
  get hr() {
    return /(^-{3,}[^\n]+\n?)/;
  },

  // 行内code
  get inlineCode() {
    return /^`([^`]*)`/;
  },

  get code() {
    return /^`{3}(((?!```)[\s\S])*)`{3}/;
  },

  get queto() {
    return /^\s*>(((?!\n\n)[\s\S])*)\n\n/;
  },

  get head() {
    return /^(#{1,6})([^\n]*)\n?/;
  },

  get br() {
    return /^\n/;
  },

  get ul() {
    return /^\s*([-+]\s+((?!\n\n)[\s\S])*)\n\n/;
  },

  get text() {
    return /^[^\n]*\n?/;
  },

  get blod() {
    return /^\*{3}(((?!\*{3}).)*)\*{3}/;
  },

  get italic() {
    return /^\*{2}(((?!\*{2}).)*)\*{2}/;
  },

  get video() {
    return /^!{3}\[([^\]]*)\]\(([^)]+)\)/;
  },

  get audio() {
    return /^!{2}\[([^\]]*)\]\(([^)]+)\)/;
  },

  get img() {
    return /^!\[([^\]]*)\]\(([^)]+)\)/;
  },

  get url() {
    return /^\[([^\]]+)\]\(([^)]+)\)/;
  }

};

function splitChar() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var char = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var fist = '';
  var index = str.indexOf(char);
  return [str.slice(0, index), str.slice(index + char.length)];
}
/**
 * [parser 获取AST]
 * @method parser
 * @param  {String} [str=''] [description]
 * @return {AST}          [ast tree]
 */


function parser() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  str += '\n\n';
  var node = {
    children: [],
    name: 'root'
    /**
     * 更改当前node
     * @method changeCurrentNode
     * @param  {Object}          child    [需要切换到的node]
     * @param  {Function}        callback [切换后需要执行的callback]
     */

  };

  function changeCurrentNode(child, callback) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var _options$isPush = options.isPush,
        isPush = _options$isPush === void 0 ? true : _options$isPush;
    var cacheNode = node;
    node = child;
    callback();
    node = cacheNode;
    isPush && node.children.push(child);
  }

  function slice() {
    var all = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    str = str.slice(all.length);
  } // 判断是否匹配到 h ul code queto


  function testTableIsEnd(STR) {
    return [Reg.head, // 标题 H
    Reg.ul, // list
    Reg.code, // code
    Reg.queto].some(function (regexp) {
      return regexp.test(STR);
    });
  }
  /*
      格式
      |西溪|sss|
      |---|---|
      |sdfsad|sdfasdf|
  */
  // 解析table


  function parseTable() {
    /**
     * [getLineContent 获取指定字符串的指定行]
     * @method getLineContent
     * @param  {String}       [str='']    [description]
     * @param  {Number}       [lineNum=0] [description]
     * @return {Array}                   [description]
     */
    function getLineContent() {
      var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var lineNum = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var line = str.split('\n')[lineNum].trim(); // 判断是否符合以 |开头 |结尾

      if (/^\|.+\|$/.test(line)) {
        return line.split('|').slice(1, -1);
      }

      return [];
    }

    var head = getLineContent(str, 0);
    var split = getLineContent(str, 1);
    var LEN = head.length; // 判断是否相等，split需要符合/^-+$/规则

    if (LEN == 0 || head.length != split.length || !split.every(function (item) {
      return /^-+$/.test(item.replace(/\s/g, ''));
    })) {
      return;
    }

    var table = {
      name: 'table',
      children: []
    };
    changeCurrentNode(table, function () {
      // thead
      str = str.replace(/(.+)\n?/, function (m, $0) {
        var thead = {
          name: 'thead',
          children: []
        };
        changeCurrentNode(thead, function () {
          var tr = {
            name: 'tr',
            children: []
          };
          changeCurrentNode(tr, function () {
            $0.trim().split('|').slice(1, -1).map(function (item) {
              var th = {
                name: 'th',
                children: []
              };
              changeCurrentNode(th, function () {
                handleText(item);
              });
            });
          });
        });
        return '';
      });
      str = str.replace(/.+\n?/, ''); // tbody

      var tbody = {
        name: 'tbody',
        children: []
      };
      changeCurrentNode(tbody, function () {
        var isNotEnd = true;

        var _loop = function _loop() {
          var line = (str.match(/^.+\n?/) || [])[0]; // 没有匹配到

          if (!line) {
            return "break";
          } // 匹配到其他块级元素


          if (testTableIsEnd(line)) {
            return "break";
          } else {
            str = str.replace(line, '');
            var child = {
              name: 'tr',
              children: []
            };
            changeCurrentNode(child, function () {
              var _arr;

              var arr = line.trim().split('|');
              arr = arr[0] ? arr.slice(0, LEN) : arr.slice(1).slice(0, LEN); // 补全数组

              (_arr = arr).push.apply(_arr, _toConsumableArray(Array(LEN - arr.length).fill('')));

              arr.forEach(function (item) {
                var child = {
                  name: 'td',
                  children: []
                };
                changeCurrentNode(child, function () {
                  handleText(item);
                });
              });
            });
          }
        };

        while (isNotEnd) {
          var _ret = _loop();

          if (_ret === "break") break;
        }
      });
    });
    return true;
  }
  /**
   * [handleText 处理文本]
   * @method handleText
   * @param  {string}   [textStr=''] [description]
   */


  function handleText() {
    var textStr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!textStr) {
      return;
    } // 链接


    if (Reg.url.test(textStr)) {
      handleText(textStr.replace(Reg.url, function (m, $text, $href) {
        var child = {
          name: 'a',
          href: $href,
          value: $text,
          children: []
        };
        changeCurrentNode(child, function () {
          handleText($text);
        });
        return '';
      }));
      return;
    } // 加粗


    if (Reg.blod.test(textStr)) {
      handleText(textStr.replace(Reg.blod, function (m, $0) {
        var child = {
          name: 'b',
          children: []
        };
        changeCurrentNode(child, function () {
          handleText($0);
        });
        return '';
      }));
      return;
    } // 倾斜


    if (Reg.italic.test(textStr)) {
      handleText(textStr.replace(Reg.italic, function (m, $0) {
        var child = {
          name: 'i',
          children: []
        };
        changeCurrentNode(child, function () {
          handleText($0);
        });
        return '';
      }));
      return;
    } // 行内code


    if (Reg.inlineCode.test(textStr)) {
      handleText(textStr.replace(Reg.inlineCode, function (m, $0) {
        if ($0) {
          var child = {
            name: 'inlineCode',
            children: []
          };
          changeCurrentNode(child, function () {
            handleText($0);
          });
        }

        return '';
      }));
      return;
    } // 视频


    if (Reg.video.test(textStr)) {
      handleText(textStr.replace(Reg.video, function (m, $alt, $src) {
        var child = {
          name: 'video',
          src: $src,
          alt: $alt
        };
        node.children.push(child);
        return '';
      }));
      return;
    } // 音频


    if (Reg.audio.test(textStr)) {
      textStr = textStr.replace(Reg.audio, function (m, $alt, $src) {
        var child = {
          name: 'audio',
          src: $src,
          alt: $alt
        };
        node.children.push(child);
        return '';
      });
      handleText(textStr);
      return;
    } // 图片


    if (Reg.img.test(textStr)) {
      handleText(textStr.replace(Reg.img, function (m, $alt, $src) {
        var child = {
          name: 'img',
          src: $src,
          alt: $alt
        };
        node.children.push(child);
        return '';
      }));
      return;
    } // 换行


    if (textStr[0] == '\n') {
      node.children.push({
        name: 'br'
      });
      handleText(textStr.slice(1));
      return;
    } // 文本,如果前一个元素是文本元素，就追加上去，反则新增文本元素


    var lastChild = node.children[node.children.length - 1];

    if (lastChild && lastChild.name === 'text') {
      lastChild.value += textStr[0];
    } else {
      node.children.push({
        name: 'text',
        value: handleTranslationCode(textStr[0])
      });
    }

    handleText(textStr.slice(1));
  } // 处理需转译字符


  function handleTranslationCode(STR) {
    return STR.replace(/>/g, '>').replace(/\\#/g, '#').replace(/\\`/g, '`').replace(/\\-/g, '-').replace(/\\\*/g, '*');
  }
  /**
   * [handleUl 处理list字符串]
   * @method handleUl
   * @param  {String} [str=''] [description]
   */


  function handleUl() {
    var ulStr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    ulStr = "".concat(ulStr, "\n"); // 根据$space去识别嵌套
    // 按行处理

    var SPACE_PER = 5; // SPACE_PER 表示一个层级

    var LIST_STYLES = ['disc', // 实心圆
    'circle', // 空心圆
    'square'];
    var DECIMAL = 'decimal';

    function next() {
      var currentDeep = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : -1;
      if (!ulStr) return;
      var line = (ulStr.match(/.+\n?/) || [])[0];
      var space = line.match(/\s*/)[0];
      var DEEP = Math.floor(space.length / SPACE_PER);

      if (/^[-+]\s+/.test(line.trim())) {
        // 如果是加号，表示是一个有序列表
        var IS_PLUS = line.match(/\s*[-+]/)[0].trim() == '+';

        if (DEEP == currentDeep + 1) {
          // 如果当前行属于新行，就如下一个ul
          var _child = {
            name: 'ul',
            type: IS_PLUS ? DECIMAL : LIST_STYLES[DEEP % LIST_STYLES.length],
            children: []
          };
          changeCurrentNode(_child, function () {
            next(currentDeep + 1);
          });
          next(currentDeep);
          return;
        } else if (DEEP == currentDeep) {
          var _child2 = {
            name: 'li',
            children: [] // 添加子li

          };
          changeCurrentNode(_child2, function () {
            handleText(line.replace(/\s*[-+]\s*/, ''));
          });
          ulStr = ulStr.slice(line.length);
          next(currentDeep);
          return;
        } else if (DEEP < currentDeep) {
          // 返回到父节点
          return;
        }
      }

      var child = node.children[node.children.length - 1];
      changeCurrentNode(child, function () {
        handleText(line);
      }, {
        isPush: false
      });
      ulStr = ulStr.slice(line.length);
      next(currentDeep);
    }

    next();
  } // 迭代器


  function next() {
    if (/^\n{1,2}$/.test(str)) {
      return;
    } // 解析完毕


    if (!str) {
      return;
    } // 换行符


    if (/Reg.br/.test(str)) {
      var _str$match = str.match(Reg.br),
          _str$match2 = _slicedToArray(_str$match, 1),
          all = _str$match2[0];

      node.children.push({
        name: 'br'
      });
      slice(all);
      next();
      return;
    } // 标题


    if (Reg.head.test(str)) {
      var _ref = str.match(Reg.head) || [],
          _ref2 = _slicedToArray(_ref, 3),
          _all = _ref2[0],
          head = _ref2[1],
          content = _ref2[2];

      var child = {
        name: "h".concat(head.length),
        children: []
      };
      changeCurrentNode(child, function () {
        handleText(content);
      });
      slice(_all);
      next();
      return;
    } // 引用


    if (Reg.queto.test(str)) {
      var _str$match3 = str.match(Reg.queto),
          _str$match4 = _slicedToArray(_str$match3, 2),
          _all2 = _str$match4[0],
          match = _str$match4[1];

      var h = {
        name: 'queto',
        children: []
      };

      var _child3 = parser(match);

      h.children = _child3.children;
      node.children.push(h);
      slice(_all2);
      next();
      return;
    } // code


    if (Reg.code.test(str)) {
      var _str$match5 = str.match(Reg.code),
          _str$match6 = _slicedToArray(_str$match5, 2),
          _all3 = _str$match6[0],
          _match = _str$match6[1];

      var _splitChar$map = splitChar(_match, '\n').map(function (i) {
        return i.trim();
      }),
          _splitChar$map2 = _slicedToArray(_splitChar$map, 2),
          language = _splitChar$map2[0],
          value = _splitChar$map2[1];

      node.children.push({
        name: 'code',
        language: language,
        value: value
      });
      slice(_all3);
      next();
      return;
    } // ul


    if (Reg.ul.test(str)) {
      var _str$match7 = str.match(Reg.ul),
          _str$match8 = _slicedToArray(_str$match7, 2),
          _all4 = _str$match8[0],
          _match2 = _str$match8[1];

      changeCurrentNode(node, function () {
        handleUl(_match2);
      }, {
        isPush: false
      });
      slice(_all4);
      next();
      return;
    } // tbale


    if (str.match(/.+\n/) && /\|.+\|/.test(str.match(/.+\n/)[0].trim()) && parseTable(str)) {
      next();
      return;
    } // hr


    if (Reg.hr.test(str)) {
      var _ref3 = str.match(Reg.hr) || [],
          _ref4 = _slicedToArray(_ref3, 1),
          _all5 = _ref4[0];

      if (_all5 !== undefined) {
        node.children.push({
          name: 'hr',
          children: []
        });
      }

      slice(_all5);
      next();
      return;
    } // 单行text


    if (Reg.text.test(str)) {
      var _ref5 = str.match(Reg.text) || [],
          _ref6 = _slicedToArray(_ref5, 1),
          _all6 = _ref6[0];

      var _child4 = {
        name: 'div',
        indent: /^ {2,}/.test(_all6),
        // 是否需要缩进
        children: []
      };
      changeCurrentNode(_child4, function () {
        handleText(_all6);
      });
      slice(_all6);
      next();
      return;
    }

    throw new Error("cannot handle str:".concat(str));
  }

  next();
  return node;
}

function getText(node) {
  var str = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  str += node.name === 'text' ? node.value : '';
  node.children && node.children.forEach(function (child) {
    str += getText(child);
  });
  return str;
}
/**
 * AST 转 dom
 * @param {*} nodes
 * @param {*} $parent
 */


function trans(nodes, $parent) {
  Array.isArray(nodes) && nodes.forEach(function (node) {
    switch (node.name) {
      case 'audio':
      case 'video':
        {
          // 处理iframe
          // 我们允许添加iframe，但是限制iframe的大小
          if (/^<iframe(\s*.+)*><\/iframe>$/.test(node.src.trim())) {
            var _ele = document.createElement('div'); // https 不允许加载http的iframe


            _ele.innerHTML = node.src.replace('http://', '//');

            var iframe = _ele.querySelector('iframe');

            iframe.style.cssText += ';max-width: 100%; max-height: 60vw; overflow: hidden;';
            $parent.appendChild(iframe);
            break;
          }

          var ele = document.createElement(node.name);
          ele.src = node.src;
          ele.alt = node.alt;
          ele.controls = 'true';
          $parent.appendChild(ele);
          break;
        }

      case 'img':
        {
          var width;
          var height;
          var result = node.src.match(/\.(\d+)x(\d+)\./);

          if (result) {
            var _result$slice = result.slice(1, 3);

            var _result$slice2 = _slicedToArray(_result$slice, 2);

            width = _result$slice2[0];
            height = _result$slice2[1];
            // 图片宽高占位
            var src = node.src;
            var div = document.createElement('div');
            div.style.cssText = ";position: relative; max-width: ".concat(width, "px; overflow: hidden; background: rgb(219, 221, 215);");
            div.innerHTML = "<div style=\"padding-top: ".concat(height / width * 100, "%;\">\n                            <img ").concat(LY.lazyLoad.caches.includes(src) ? "src=\"".concat(src, "\" data-img-cache=\"true\"") : '', "\n                                class=\"lazy-load-img img-loading\"\n                                data-lazy-img=\"").concat(node.src, "\"\n                                style=\"position: absolute; width: 100%; height: 100%; top: 0;\" />\n                        </div>");
            $parent.appendChild(div);
            break;
          } else {
            var _ele2 = document.createElement(node.name);

            _ele2.src = node.src;
            _ele2.alt = node.alt;
            $parent.appendChild(_ele2);
            break;
          }
        }

      case 'text':
        {
          var text = node.value;

          var _ele3 = document.createTextNode(text);

          $parent.appendChild(_ele3);
          break;
        }

      case 'br':
        {
          var _ele4 = document.createElement(node.name);

          $parent.appendChild(_ele4);
          break;
        }

      case 'a':
        {
          var _ele5 = document.createElement(node.name);

          _ele5.href = node.href;
          _ele5.target = '_blank';
          trans(node.children, _ele5);
          $parent.appendChild(_ele5);
          break;
        }

      case 'code':
        {
          var _ele6 = document.createElement('pre');

          var code = document.createElement('code');
          code.className = ['highlight', node.language || ''].join(' ');
          code.textContent = node.value; // 不能使用innerHTML

          _ele6.appendChild(code);

          $parent.appendChild(_ele6);
          break;
        }

      case 'inlineCode':
        {
          var _ele7 = document.createElement('code');

          _ele7.className = 'inlineCode';
          trans(node.children, _ele7);
          $parent.appendChild(_ele7);
          break;
        }

      case 'h1':
        {
          var _ele8 = document.createElement(node.name);

          var a = document.createElement('a');
          var id = getText(node);
          a.href = "#".concat(id);
          a.id = id;

          _ele8.appendChild(a);

          trans(node.children, _ele8);
          $parent.appendChild(_ele8);
          break;
        }

      case 'ul':
        {
          var _ele9 = document.createElement(node.name);

          _ele9.style.cssText += ";list-style-type:".concat(node.type, ";");
          trans(node.children, _ele9);
          $parent.appendChild(_ele9);
          break;
        }

      default:
        {
          var _ele10 = document.createElement(node.name);

          node.indent && (_ele10.style.cssText += ';padding-left: 2em;'); // table表格需要设置边框

          if (node.name == 'table') {
            _ele10.setAttribute('border', '1');
          }

          trans(node.children, _ele10);
          $parent.appendChild(_ele10);
        }
    }
  });
}
/**
 * [cache 缓存]
 * @type {Object}
 */


var cache = {};
/**
 * [getParserNodeInfo 获取]
 * @param  {Node} node [markdown AST]
 * @return      [description]
 */

function getParserNodeInfo(node) {
  var text = '';
  var imgs = [];

  function next(mNode) {
    if (mNode.name == 'text') {
      text += mNode.value || '';
    }

    if (mNode.name == 'img') {
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
/**
 * [info 获取解析后的信息]
 * @param  {String} [str=''] [description]
 */


function info() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var item = cache[str];

  if (!item) {
    var root = parser(str);
    item = _objectSpread({
      root: root
    }, getParserNodeInfo(root));
    cache[str] = item;
  }

  return item;
} // 加载静态资源


function loadAsset(url) {
  if (url.endsWith('.js')) {
    return new Promise(function (res) {
      var s = document.createElement('script');

      s.onload = function () {
        res();
      };

      s.src = url;
      document.head.appendChild(s);
    });
  }

  if (url.endsWith('.css')) {
    return new Promise(function (res) {
      var s = document.createElement('link');

      s.onload = function () {
        res();
      };

      s.type = "text/css";
      s.rel = "stylesheet";
      s.charset = "utf-8";
      s.href = url;
      document.head.appendChild(s);
    });
  }
}
/**
 * [codeHighlight 代码高亮]
 * @method codeHighlight
 * @param  {DOM}      dom [代码高亮]
 */


function codeHighlight(dom, config) {
  Promise.all(config.highlightSource.map(loadAsset)).then(function (success) {
    window.hljs.configure({
      // useBR: true, // 是否使用br
      tabReplace: 4
    });

    _toConsumableArray(dom.querySelectorAll('code.highlight')).forEach(function (code) {
      window.hljs.highlightBlock(code);
    });
  });
}

function markdown(dom) {
  var str = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var config = arguments.length > 2 ? arguments[2] : undefined;
  dom.innerHTML = '';
  dom.classList.add('markdown');
  var item = markdown.info(str);
  trans(item.root.children, dom);
  config = _objectSpread({
    highlightSource: ['/src/theme.css', '/asset/highlight.min.js', '/asset/highlight.theme.atom-one-dark.css'],
    // 代码高亮库加载
    useHighlight: true,
    // 是否使用高亮
    cache: true
  }, config);
  config.useHighlight && codeHighlight(dom, config);
}

markdown.parser = parser;
markdown.trans = trans;
markdown.info = info;
markdown.codeHighlight = codeHighlight;
export default markdown;
export { markdown, parser };
