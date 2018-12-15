"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parser = parser;
exports.Reg = void 0;

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

  get code() {
    return /^`{3}(((?!```)[\s\S])*)`{3}/;
  },

  get queto() {
    return /^>(((?!\n\n)[\s\S])*)\n\n/;
  },

  get head() {
    return /^(#{1,6})([^\n]*)\n?/;
  },

  get ul() {
    return /^([-+]\s+((?!\n\n)[\s\S])*)\n\n/;
  },

  get url() {
    return /^\[([^\]]+)\]\(([^)]+)\)/;
  },

  // 行内code
  get inlineCode() {
    return /^`([^`]*)`/;
  },

  get br() {
    return /^\n/;
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
  }

};
exports.Reg = Reg;

function getMatchResult() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var startTag = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '[';
  var endTag = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ']';
  var index = 0;
  var startIndex = -1;
  var openMatch = 0;

  var isEqual = function isEqual(match) {
    return str.slice(index, index + match.length) === match;
  };

  while (index < str.length) {
    var current = str[index];

    if (!openMatch) {
      if (!current.trim()) {
        index += 1;
        continue;
      } else if (isEqual(startTag)) {
        startIndex = index;
        openMatch += 1;
        index += startTag.length;
        continue;
      } else {
        return [undefined, str];
      }
    }

    if (isEqual(endTag)) {
      openMatch -= 1;
      index += endTag.length;
    } else if (isEqual(startTag)) {
      openMatch += 1;
      index += startTag.length;
    } else {
      index += 1;
    }

    if (!openMatch) {
      return [str.slice(startIndex + startTag.length, index - endTag.length), str.slice(index)];
    }
  }

  return [undefined, str];
}

function splitChar() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var char = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
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
    type: 'root'
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
    child.__parent = node;
    callback && callback();
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
      type: 'table',
      children: []
    };
    changeCurrentNode(table, function () {
      // thead
      str = str.replace(/(.+)\n?/, function (m, $0) {
        var thead = {
          type: 'thead',
          children: []
        };
        changeCurrentNode(thead, function () {
          var tr = {
            type: 'tr',
            children: []
          };
          changeCurrentNode(tr, function () {
            $0.trim().split('|').slice(1, -1).map(function (item) {
              var th = {
                type: 'th',
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
        type: 'tbody',
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
              type: 'tr',
              children: []
            };
            changeCurrentNode(child, function () {
              var _arr;

              var arr = line.trim().split('|');
              arr = arr[0] ? arr.slice(0, LEN) : arr.slice(1).slice(0, LEN); // 补全数组

              (_arr = arr).push.apply(_arr, _toConsumableArray(Array(LEN - arr.length).fill('')));

              arr.forEach(function (item) {
                var child = {
                  type: 'td',
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
          type: 'a',
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
          type: 'b',
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
          type: 'i',
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
            type: 'inlineCode',
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
          type: 'video',
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
          type: 'audio',
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
          type: 'img',
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
        type: 'br'
      });
      handleText(textStr.slice(1));
      return;
    } // 文本,如果前一个元素是文本元素，就追加上去，反则新增文本元素


    var lastChild = node.children[node.children.length - 1];

    if (lastChild && lastChild.type === 'text') {
      lastChild.value += textStr[0];
    } else {
      node.children.push({
        type: 'text',
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
            type: 'ul',
            listStyleType: IS_PLUS ? DECIMAL : LIST_STYLES[DEEP % LIST_STYLES.length],
            children: []
          };
          changeCurrentNode(_child, function () {
            next(currentDeep + 1);
          });
          next(currentDeep);
          return;
        } else if (DEEP == currentDeep) {
          var _child2 = {
            type: 'li',
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
        type: 'br'
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
        type: "h".concat(head.length),
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

      var _getMatchResult = getMatchResult(match, '[', ']'),
          _getMatchResult2 = _slicedToArray(_getMatchResult, 2),
          tag = _getMatchResult2[0],
          leftStr = _getMatchResult2[1];

      var h = {
        type: 'queto',
        tag: tag,
        children: []
      };

      var _child3 = parser(leftStr.replace(/^\s*\n/, ''));

      h.children = _child3.children;
      node.children.push(h);
      node.children.push({
        type: 'br'
      });
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
        type: 'code',
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
      node.children.push({
        type: 'br'
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
          type: 'hr',
          children: []
        });
      }

      slice(_all5);
      next();
      return;
    } // 单行text


    if (Reg.text.test(str)) {
      var _ref5 = str.match(Reg.text) || [''],
          _ref6 = _slicedToArray(_ref5, 1),
          _all6 = _ref6[0];

      handleText(_all6);
      slice(_all6);
      next();
      return;
    }

    throw new Error("cannot handle str:".concat(str));
  }

  next();
  return node;
}