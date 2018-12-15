'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

Object.defineProperty(exports, '__esModule', {
  value: true
});
/**
 * diff AST
 * 如果node.type发生变化，那就是replace，反则为update
 * update需要diff props与children
 *  1. props为object，保留key不用参与diff
 *  2. children是数组，需要一定的算法
 *
 * diff array
 * 1. 先删除，根据type是否在nextNode里存在
 * 2. diff filterPrevChildren与 nextChildren
 * 如果前后两次是node位置发生变化【比较复杂】
 *
 * 后一次插入了新的nodes【相对简单】
 * [1 2 3 4] [1 2 6 3 4]
 *
 * 每种类型的个数是一致的，那么就是移动
 * 每种类型的个数是不一致的，那么就是
 */

/**
 * 添加node diff，提升性能
 *
 * @export
 * @param {*} prevNode
 * @param {*} nextNode
 * @returns
 **/

function diffNode(prevNode, nextNode) {
  if (!prevNode) {
    return {
      type: 'add',
      prevNode: prevNode,
      nextNode: nextNode
    };
  }

  if (!nextNode) {
    return {
      type: 'del',
      prevNode: prevNode,
      nextNode: nextNode
    };
  }

  if (prevNode.type !== nextNode.type) {
    // 如果类型不一样，就重新创建
    return {
      type: 'replace',
      prevNode: prevNode,
      nextNode: nextNode
    };
  } // type一样，比对props与children


  var update = {
    type: 'update',
    prevNode: prevNode,
    nextNode: nextNode,
    propsChange: [],
    children: []
  };
  var propsDiffResult = diffObject(prevNode, nextNode);

  if (propsDiffResult.length) {
    var _update$propsChange;

    (_update$propsChange = update.propsChange).push.apply(_update$propsChange, _toConsumableArray(propsDiffResult));
  }

  update.children = diffArr(prevNode, nextNode).filter(function (i) {
    return i;
  }); // 如果真的有update

  if (update.propsChange.length + update.children.length > 0) {
    return update;
  } // 如果前后节点没有发生变化，则继承上一个node上的相关信息


  nextNode.__htmlNode = prevNode.__htmlNode;
  nextNode.__update = prevNode.__update;
  return update;
} // 判断数组是否一致
// v1版本不对数组diff的性能做优化
// 需要添加replace功能

/**
 * prevArr nextArr
 * 从prevArr中取出nextArr中所含有的type，为filterArr
 * 然后对filterArr中的元素进行move update add
 * 然后做 patch
 * @export
 * @param {*} prevNode
 * @param {*} nextNode
 * @returns
 */


function diffArr(prevNode, nextNode) {
  var _prevNode$children = prevNode.children,
      prevArr = _prevNode$children === void 0 ? [] : _prevNode$children;
  var _nextNode$children = nextNode.children,
      nextArr = _nextNode$children === void 0 ? [] : _nextNode$children;
  var delArr = [];
  var addArr = [];
  var moveArr = [];
  var updateArr = []; // 如果不存在这个type类型，需要删除

  var filterPrevArr = prevArr.filter(function (item, index) {
    if (!nextArr.some(function (i) {
      return i.type === item.type;
    })) {
      delArr.push(diffNode(item, null));
      return false;
    }

    return true;
  }); // 取有效元素

  nextArr.forEach(function (item, moveTo) {
    filterPrevArr.some(function (ele, index) {
      if (ele.type === item.type) {
        filterPrevArr[index] = {
          isDel: true,
          ele: ele
        };
        return true;
      }

      return false;
    });
  }); // 删除剩余元素

  filterPrevArr.filter(function (i) {
    return !i.isDel;
  }).forEach(function (item) {
    return delArr.push(diffNode(item, null));
  }); // 去除有用的元素

  var ff = filterPrevArr.filter(function (i) {
    return i.isDel;
  }).map(function (i) {
    return i.ele;
  }); // 最后的move/update add

  nextArr.forEach(function (item, moveTo) {
    var isMatch = ff.some(function (ele, index) {
      if (ele.type === item.type) {
        // 注释元素，表示其已经使用过了
        ff.splice(index, 1); // 需要把ff的元素位置进行实时更新，否则将会出现位置错乱

        ff.splice(moveTo > index ? moveTo - 1 : moveTo, 0, {
          used: true,
          ele: ele
        });

        if (index !== moveTo) {
          moveArr.push({
            type: 'move',
            prevNode: ele,
            nextNode: item,
            current: index,
            // 如果目标位置大于当前位置，则需要移动的目标元素下一个元素的前面
            moveTo: moveTo > index ? moveTo + 1 : moveTo
          });
        }

        var result = diffNode(ele, item);
        moveArr.push(result); // 元素需要先移动

        return true;
      }

      return false;
    });

    if (!isMatch) {
      // 使用占用元素，以矫正index
      ff.splice(moveTo, 0, {
        add: true,
        item: item
      });
      var result = diffNode(null, item);
      moveArr.push(_objectSpread({}, result, {
        moveTo: moveTo
      }));
    }
  });
  return delArr.concat(moveArr, updateArr, addArr); // 首先来讲filterPrevArr的所有type, nextArr内都是存在的，但可能数量是不一致的
  // [ 1 2 3 ] [ 1 4 3 5 2 ]
  // 4 在 [ 2 3 ] 中不存在，insert after 1
  // 3 在 [ 2 3 ] 中存在，但是3前面还有2，因此需要move，move到4后面
  // 5 在 [ 2 ] 中不存在, insert after 3
  // 2 早 [ 2 ] 中存在，保持不变
} // object diff


function diffObject() {
  var prevNode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var nextNode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var prevKeys = Object.keys(prevNode);
  var nextKeys = Object.keys(nextNode);
  var change = []; // 删除

  prevKeys.forEach(function (key) {
    // 不需要参与diff的key
    if (['__htmlNode', '__parent', '__update', 'children', 'type'].includes(key)) {
      return;
    }

    if (nextKeys.includes(key)) {
      if (prevNode[key] !== nextNode[key]) {
        change.push({
          type: 'change',
          key: key,
          prevNode: prevNode,
          nextNode: nextNode
        });
      }

      return;
    }

    change.push({
      type: 'del',
      key: key,
      prevNode: prevNode,
      nextNode: nextNode
    });
  });
  nextKeys.forEach(function (key) {
    if (!prevKeys.includes(key)) {
      change.push({
        type: 'add',
        key: key,
        prevNode: prevNode,
        nextNode: nextNode
      });
    }
  });
  return change;
}
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
  };
  /**
   * 更改当前node
   * @method changeCurrentNode
   * @param  {Object}          child    [需要切换到的node]
   * @param  {Function}        callback [切换后需要执行的callback]
   */

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
            children: []
          }; // 添加子li

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

function insertBefore(newDom, refDom) {
  if (refDom && refDom.parentElement) {
    refDom.parentElement.insertBefore(newDom, refDom);
  }

  return newDom;
}
/**
 *
 * 对diff结果做patch
 * @param {DiffResult} diffResult
 */


function patch(diffResult) {
  var $container = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document.body;
  if (!diffResult) return;
  var nextNode = diffResult.nextNode;

  switch (diffResult.type) {
    case 'del':
      {
        var __htmlNode = diffResult.prevNode.__htmlNode;

        if (!__htmlNode.parentElement) {
          console.log('delete error::', diffResult);
        }

        __htmlNode.parentElement.removeChild(__htmlNode);

        break;
      }

    case 'add':
      {
        trans(nextNode, $container, {
          beforeAppend: function beforeAppend(ele) {
            var ref = $container.childNodes[diffResult.moveTo];

            if (ref) {
              insertBefore(ele, ref);
              return true;
            }
          }
        });
        break;
      }

    case 'replace':
      {
        var _htmlNode = diffResult.prevNode.__htmlNode;
        var $parent = document.createDocumentFragment();
        trans(nextNode, $parent);

        _htmlNode.parentElement.replaceChild($parent, _htmlNode);

        break;
      }

    case 'move':
      {
        var moveTo = diffResult.moveTo;
        var prevNode = diffResult.prevNode;
        var parent = prevNode.__htmlNode.parentElement; // 如果目标元素和当前元素相同，则不用移动

        if (parent.childNodes[moveTo] !== prevNode.__htmlNode) {
          if (parent.childNodes[moveTo]) {
            insertBefore(prevNode.__htmlNode, parent.childNodes[moveTo]);
          } else {
            parent.appendChild(prevNode.__htmlNode);
          }
        }

        break;
      }

    case 'update':
      {
        var propsChange = diffResult.propsChange,
            children = diffResult.children,
            _prevNode = diffResult.prevNode,
            _nextNode = diffResult.nextNode;
        var _htmlNode2 = _prevNode.__htmlNode; // 继承htmlNode

        _nextNode.__htmlNode = _htmlNode2; // 继承update

        if (_prevNode.__update) {
          _nextNode.__update = _prevNode.__update;
        }

        propsChange.forEach(function (item) {
          var key = item.key;

          switch (item.type) {
            case 'change':
            case 'add':
              {
                var newValue = _nextNode[key]; // 如果有自带更新方法

                if (_prevNode.__update) {
                  _prevNode.__update(key, _nextNode);

                  break;
                } // 更新文本节点


                if (_htmlNode2 instanceof Text) {
                  _htmlNode2.data = newValue;
                  break;
                } // 更新其他属性


                _htmlNode2.setAttribute(key, newValue);

                break;
              }

            case 'del':
              {
                _htmlNode2.removeAttribute(key);

                break;
              }
          }
        });
        children.forEach(function (diff) {
          return patch(diff, _htmlNode2);
        });
        break;
      }

    default:
      {
        console.error('canot handle type', diffResult, diffResult.type);
      }
  }
}
/**
 * AST转HTMLNode
 * 转换结束后AST上需要有HTMLNode的引用，方便下次patch，对HTMLNode做增删改
 * AST也应该提供props update方法，用来处理props更新
 */
// 获取节点上的所有文本信息


function getText(node) {
  var str = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  if (node.type === 'text') {
    str += node.value || '';
  }

  node.children && node.children.forEach(function (child) {
    str += getText(child);
  });
  return str;
}
/**
 * AST 转 dom
 * @param {ASTNode} node
 * @param {HTMLElement} $parent
 */


function trans(node, $parent) {
  var option = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var ele;

  switch (node.type) {
    case 'audio':
    case 'video':
      {
        // 处理iframe
        // 我们允许添加iframe，但是限制iframe的大小
        if (/^<iframe(\s*.+)*><\/iframe>$/.test(node.src.trim())) {
          ele = document.createElement('div');
          ele.className = 'audio'; // https 不允许加载http的iframe

          ele.innerHTML = node.src.replace('http://', '//');
          var iframe = ele.querySelector('iframe');
          iframe.style.cssText += ';max-width: 100%; max-height: 60vw; overflow: hidden;';
        } else {
          ele = document.createElement(node.type);
          ele.src = node.src;
          ele.alt = node.alt;
          ele.controls = 'true';
        }

        break;
      }

    case 'img':
      {
        var result = node.src.match(/\.(\d+)x(\d+)\./);

        if (result) {
          var _result$slice = result.slice(1, 3),
              _result$slice2 = _slicedToArray(_result$slice, 2),
              width = _result$slice2[0],
              height = _result$slice2[1]; // 图片宽高占位


          var src = node.src;
          ele = document.createElement('div');
          ele.style.cssText = ";position: relative; max-width: ".concat(width, "px; overflow: hidden; background: rgb(219, 221, 215);");
          ele.innerHTML = "<div style=\"padding-top: ".concat(height / width * 100, "%;\">\n                            <img ").concat(LY.lazyLoad.caches.includes(src) ? "src=\"".concat(src, "\" data-img-cache=\"true\"") : '', "\n                                class=\"lazy-load-img img-loading\"\n                                data-lazy-img=\"").concat(node.src, "\"\n                                style=\"position: absolute; width: 100%; height: 100%; top: 0;\" />\n                        </div>");
          break;
        } else {
          ele = document.createElement(node.type);
          ele.src = node.src;
          ele.alt = node.alt;
          break;
        }
      }

    case 'text':
      {
        var text = node.value;
        ele = document.createTextNode(text);
        break;
      }

    case 'br':
      {
        ele = document.createElement(node.type);
        break;
      }

    case 'a':
      {
        ele = document.createElement(node.type);
        ele.href = node.href;
        ele.target = '_blank';
        break;
      }

    case 'code':
      {
        ele = document.createElement('pre');
        var code = document.createElement('code'); // 需要在node上添加__update方法，方便更新属性

        node.__update = function (key, newNode) {
          switch (key) {
            case 'language':
              {
                code.className = ['highlight', newNode[key] || ''].join(' ');
                break;
              }

            case 'value':
              {
                code.textContent = newNode[key]; // 不能使用innerHTML

                break;
              }

            default:
              break;
          }
        };

        node.__update('language', node);

        node.__update('value', node);

        ele.appendChild(code);
        break;
      }

    case 'inlineCode':
      {
        ele = document.createElement('code');
        ele.className = 'inlineCode';
        break;
      }

    case 'h1':
      {
        ele = document.createElement(node.type);
        var a = document.createElement('a');
        var id = getText(node);
        a.href = "#".concat(id);
        a.id = id;
        ele.appendChild(a);
        break;
      }

    case 'ul':
      {
        ele = document.createElement(node.type);

        node.__update = function (key, nodeNode) {
          ele.style.cssText += ";list-style-type:".concat(nodeNode[key], ";");
        };

        node.__update('listStyleType', node);

        break;
      }

    default:
      {
        ele = document.createElement(node.type);
        node.indent && (ele.style.cssText += ';padding-left: 2em;'); // table表格需要设置边框

        if (node.type == 'table') {
          ele.setAttribute('border', '1');
        }
      }
  }

  node.tag && ele.setAttribute('tag', node.tag);
  node.children && node.children.forEach(function (child) {
    return trans(child, ele);
  });
  var notAppend = option.beforeAppend && option.beforeAppend(ele);
  !notAppend && $parent.appendChild(ele);
  node.__htmlNode = ele;
  return ele;
}
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
      var _s2 = document.createElement('link');

      _s2.onload = onload;
      _s2.type = "text/css";
      _s2.rel = "stylesheet";
      _s2.charset = "utf-8";
      _s2.href = url;
      document.head.appendChild(_s2);
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

Markdown.parser = parser;
Markdown.trans = trans;
Markdown.getParseResult = getParseResult;
Markdown.codeHighlight = codeHighlight;

function markdown($dom, str, config) {
  $dom.innerHTML = '';
  $dom.classList.add('markdown');
  var result = getParseResult(str);
  trans(result.root, $dom);
  config = getConfig(config);
  codeHighlight($dom, config);
}

exports.Markdown = Markdown;
exports.parser = parser;
exports.trans = trans;
exports.codeHighlight = codeHighlight;
exports.getParseResult = getParseResult;
exports.markdown = markdown;