'use strict';

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
 * 1. 先删除在nextNode里不存在的type
 * 2. 保留在nextNode里存在的type
 * 3. 删除剩余的元素，最后得到 prevKeepArr
 * 4. nextNode 与 prevKeepArr 最对比，进行move/add操作，
 *      需要注意的是在获取操作的过程，需要丢prevKeepArr进行同步更新
 *      不然会导致操作混乱，数据不一致
 * 5. 返回diff结果
 */
// 为node添加id

/** @typedef {import("./../@type/index").AST} AST */

function checkIsNoNeedDiff() {
  var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  // __ 开头的未内部私有属性
  return key.startsWith('__') || ['children', '$getNode', 'type', 'raw', 'tokens', // 原始tokens信息
  'push' // node节点上的push方法
  ].includes(key);
}
/**
 * diff对象差异
 * @export
 * @param {AST} [prevNode={}]
 * @param {AST} [nextNode={}]
 * @returns
 */


function diffObject() {
  var prevNode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var nextNode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var prevKeys = Object.keys(prevNode);
  var nextKeys = Object.keys(nextNode);
  var change = []; // 删除

  prevKeys.forEach(function (key) {
    // 不需要参与diff的key
    if (checkIsNoNeedDiff(key)) {
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
/**
 * 添加node diff，提升性能
 * @export
 * @param {AST} prevNode
 * @param {AST} nextNode
 * @returns
 **/


function diffNode(prevNode, nextNode) {
  var diffResultArr = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var otherInfo = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  if (prevNode === nextNode) return diffResultArr;

  if (!prevNode) {
    diffResultArr.push(_objectSpread({
      type: 'add',
      prevNode: prevNode,
      nextNode: nextNode
    }, otherInfo));
  } else if (!nextNode) {
    diffResultArr.push(_objectSpread({
      type: 'del',
      prevNode: prevNode,
      nextNode: nextNode
    }, otherInfo));
  } else if (prevNode.type !== nextNode.type) {
    // 如果类型不一样，就重新创建
    diffResultArr.push(_objectSpread({
      type: 'replace',
      prevNode: prevNode,
      nextNode: nextNode
    }, otherInfo));
  } else {
    var _update$propsChange;

    // type一样，比对props与children
    var update = {
      type: 'update',
      prevNode: prevNode,
      nextNode: nextNode,
      propsChange: []
    };

    (_update$propsChange = update.propsChange).push.apply(_update$propsChange, _toConsumableArray(diffObject(prevNode, nextNode))); // 如果前后节点没有发生变化，则继承上一个node上的相关信息


    nextNode.$getNode = prevNode.$getNode;
    nextNode.__update = prevNode.__update;

    if (update.propsChange.length) {
      diffResultArr.push(update);
    } // 如果一个节点上的children 没有任何改变可以，忽略这个children
    // 如果一个节点上的，update的props为空
    // 甚至来讲可以把tree拍成一维数组


    diffArr(prevNode, nextNode, diffResultArr);
  }

  return diffResultArr;
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
  var diffResultArr = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var _prevNode$children = prevNode.children,
      prevArr = _prevNode$children === void 0 ? [] : _prevNode$children;
  var _nextNode$children = nextNode.children,
      nextArr = _nextNode$children === void 0 ? [] : _nextNode$children; // 如果不存在这个type类型，需要删除

  var filterPrevArr = prevArr.filter(function (item) {
    if (!nextArr.some(function (i) {
      return i.type === item.type;
    })) {
      diffNode(item, null, diffResultArr);
      return false;
    }

    return true;
  }); // 取有效元素

  nextArr.forEach(function (item) {
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
    return diffNode(item, null, diffResultArr);
  }); // 取出有用的元素

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
          diffResultArr.push({
            type: 'move',
            prevNode: ele,
            nextNode: item,
            current: index,
            // 如果目标位置大于当前位置，则需要移动的目标元素下一个元素的前面
            moveTo: moveTo > index ? moveTo + 1 : moveTo
          });
        } // 元素需要先移动


        diffNode(ele, item, diffResultArr);
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
      diffNode(null, item, diffResultArr, {
        moveTo: moveTo
      });
    }
  }); // 首先来讲filterPrevArr的所有type, nextArr内都是存在的，但可能数量是不一致的
  // [ 1 2 3 ] [ 1 4 3 5 2 ]
  // 4 在 [ 2 3 ] 中不存在，insert after 1
  // 3 在 [ 2 3 ] 中存在，但是3前面还有2，因此需要move，move到4后面
  // 5 在 [ 2 ] 中不存在, insert after 3
  // 2 早 [ 2 ] 中存在，保持不变
}

var nodeType = {
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
  li_todo: 'li-todo'
};
var TOKEN_TYPE = {
  NO_ORDER_LIST: 'no_order_list',
  // -
  ORDER_LIST: 'order_list',
  // +
  SIMPLE_URL_START: 'simple_url_start',
  // <
  SIMPLE_URL_END: 'simple_url_end',
  // >
  URL_START: 'url_start',
  // [
  URL_END: 'url_end',
  // ]
  URL_DESC_START: 'url_desc_start',
  // (
  URL_DESC_END: 'url_desc_end',
  // )
  HEAD_TITLE: 'head_title',
  // #
  IMG_START: 'img_start',
  // !
  TABLE_SPLIT: 'table_split',
  // |
  CODE_BLOCK: 'code_block',
  // `
  WHITE_SPACE: 'white_space',
  //
  LINE_END: 'line_end',
  // \n
  LINE_THROUGH: 'linethrough',
  // ~
  BLOB: 'blob',
  // *
  STRING: 'string' // 非以上关键字符之外的连续字符

}; // @ts-check
// TODO:
// 递归迭代
// 支持多字符串匹配，支持向前看，向后看
// 性能优化，在解析content的时候，顺带解析节点信息，避免算法复杂度提升🤔
// 如果当前节点信息类型不确认，是否存影响其后续token的解析规则呢？

var Token = function Token(type, raw, start, end) {
  _classCallCheck(this, Token);

  this.type = type;
  this.start = start;
  this.end = end;
  this.raw = raw;
};

var ASTNode = /*#__PURE__*/function () {
  function ASTNode() {
    var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var tokens = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    _classCallCheck(this, ASTNode);

    this.type = type;
    this.tokens = tokens;
    this.children = [];
    this.value = '';
  }
  /**
   * @param {ASTNode} child
   * @returns
   * @memberof ASTNode
   */


  _createClass(ASTNode, [{
    key: "push",
    value: function push(child) {
      child.__parent = this;
      this.children.push(child);
      return this;
    } // 可以把连续的text token合并成一个Text Node

  }, {
    key: "addToken",
    value: function addToken(token) {
      token && this.tokens.push(token); // 仅对于text node才有value属性

      this.value = this.tokens.map(function (i) {
        return i.raw;
      }).join('');
    }
  }, {
    key: "raw",
    get: function get() {
      return this.children.map(function (i) {
        return i.tokens.map(function (i) {
          return i.raw;
        }).join('');
      }).join('') || this.tokens.map(function (i) {
        return i.raw;
      }).join('');
    }
  }]);

  return ASTNode;
}();

function createAstNode(type) {
  var tokens = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var properties = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var ast = new ASTNode(type, tokens);
  Object.assign(ast, properties);

  if (type === nodeType.text) {
    ast.addToken();
  }

  return ast;
}

function token() {
  var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  /** @type {Token[]} */
  var tokens = [];
  var index = 0;

  while (index < input.length) {
    var char = input[index];
    var offset = 1;

    switch (char) {
      case '-':
        {
          tokens.push(new Token(TOKEN_TYPE.NO_ORDER_LIST, char, index, index + 1));
          break;
        }

      case '+':
        {
          tokens.push(new Token(TOKEN_TYPE.ORDER_LIST, char, index, index + 1));
          break;
        }

      case '<':
        {
          tokens.push(new Token(TOKEN_TYPE.SIMPLE_URL_START, char, index, index + 1));
          break;
        }

      case '>':
        {
          tokens.push(new Token(TOKEN_TYPE.SIMPLE_URL_END, char, index, index + 1));
          break;
        }

      case '(':
        {
          tokens.push(new Token(TOKEN_TYPE.URL_START, char, index, index + 1));
          break;
        }

      case ')':
        {
          tokens.push(new Token(TOKEN_TYPE.URL_END, char, index, index + 1));
          break;
        }

      case '[':
        {
          tokens.push(new Token(TOKEN_TYPE.URL_DESC_START, char, index, index + 1));
          break;
        }

      case ']':
        {
          tokens.push(new Token(TOKEN_TYPE.URL_DESC_END, char, index, index + 1));
          break;
        }

      case '#':
        {
          tokens.push(new Token(TOKEN_TYPE.HEAD_TITLE, char, index, index + 1));
          break;
        }

      case '!':
        {
          tokens.push(new Token(TOKEN_TYPE.IMG_START, char, index, index + 1));
          break;
        }

      case '|':
        {
          tokens.push(new Token(TOKEN_TYPE.TABLE_SPLIT, char, index, index + 1));
          break;
        }

      case '`':
        {
          tokens.push(new Token(TOKEN_TYPE.CODE_BLOCK, char, index, index + 1));
          break;
        }

      case '~':
        {
          tokens.push(new Token(TOKEN_TYPE.LINE_THROUGH, char, index, index + 1));
          break;
        }

      case '*':
        {
          tokens.push(new Token(TOKEN_TYPE.BLOB, char, index, index + 1));
          break;
        }

      case ' ':
        {
          var lastToken = tokens[tokens.length - 1];

          if (lastToken && lastToken.type === TOKEN_TYPE.WHITE_SPACE) {
            lastToken.raw += char;
            lastToken.end += 1;
          } else {
            tokens.push(new Token(TOKEN_TYPE.WHITE_SPACE, char, index, index + 1));
          }

          break;
        }

      case '\n':
        {
          tokens.push(new Token(TOKEN_TYPE.LINE_END, char, index, index + 1));
          break;
        }

      default:
        {
          // 向后看一位
          var nextChar = input[index + 1];
          var str = ''; // 处理转译字符\，避免关键char不能够正常显示

          var _ref = char === '\\' && nextChar ? [nextChar, 2] : [char, 1];

          var _ref2 = _slicedToArray(_ref, 2);

          str = _ref2[0];
          offset = _ref2[1];
          var _lastToken = tokens[tokens.length - 1];

          if (_lastToken && _lastToken.type === TOKEN_TYPE.STRING) {
            _lastToken.raw += str;
            _lastToken.end += offset;
          } else {
            tokens.push(new Token(TOKEN_TYPE.STRING, str, index, index + offset));
          }
        }
    }

    index += offset;
  }

  return tokens;
}
/**
 * 向后看，知道满足某一个条件
 * @param {number} index
 * @param {Token[]} tokens
 * @param {(t: Token, offset: number, move: Function) => bool} fn
 * @returns
 */


function watchAfterUtil(index, tokens, fn) {
  var matchTokens = [];
  var offset = index;

  var moveIndex = function moveIndex(offsetNum) {
    offset += offsetNum;
    return [tokens[offset], offset];
  };

  while (offset < tokens.length) {
    var item = tokens[offset]; // 如果匹配成功，会向后加+1

    if (!fn(item, offset, moveIndex)) {
      break;
    } else {
      matchTokens.push(item);
    }

    offset += 1;
  }

  return {
    matchTokens: matchTokens,
    nextToken: tokens[offset]
  };
}
/**
 * 向后看几个token，以判断是否符合预期
 * @param {Token[]} tokens
 * @param {number} offset 当前index
 * @param {number} [length=1] 需要后续几个token
 * @returns
 */


function watchAfter(tokens, offset) {
  var length = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  // 使用for循环替代slice，因为slice不会严格返回指定长度的数组
  var sliceTK = [];

  for (var index = offset + 1; index < offset + length + 1; index++) {
    sliceTK.push(tokens[index]);
  }

  return sliceTK;
}

var helper = {
  // 判断当前token是不是行尾，或者文本结束
  isLineEnd: function isLineEnd(token) {
    return !token || token.type === TOKEN_TYPE.LINE_END;
  },
  checkIsEnd: function checkIsEnd(tokens, index) {
    var _ref3 = [tokens[index], tokens[index + 1]],
        currentToken = _ref3[0],
        nextToken = _ref3[1];

    if (!currentToken) {
      return {
        match: []
      };
    } else if (currentToken.type === TOKEN_TYPE.LINE_END) {
      return {
        match: [currentToken]
      };
    }

    if (!nextToken) {
      return {
        match: [currentToken]
      };
    }

    return {};
  },
  // 判断下一个字符是不是行尾
  nextIsLienEnd: function nextIsLienEnd(tokens, index) {
    var token = tokens[index + 1];
    return token && token.type === TOKEN_TYPE.LINE_END;
  },
  // 判断index的前一个字符是不是行首
  isLineStart: function isLineStart(tokens, index) {
    var token = tokens[index - 1];
    return !token || token.type === TOKEN_TYPE.LINE_END;
  },
  isType: function isType(token) {
    for (var _len = arguments.length, types = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      types[_key - 1] = arguments[_key];
    }

    if (typeof token === 'string') {
      return types.includes(token);
    }

    return token && types.includes(token.type);
  },
  // 继续向后匹配表示
  goOn: {
    matchEnd: false
  },
  // 判断是否可以继续向后匹配
  isCanGoOn: function isCanGoOn(r) {
    return this.goOn === r;
  },
  // tokens转字符串
  tokensToString: function tokensToString(tokens) {
    return tokens.map(function (i) {
      return i.raw;
    }).join('');
  },
  getQueueContent: function getQueueContent() {
    var queue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var info = {};
    queue.forEach(function (i) {
      if (i.content) {
        info[i.name] = i.content;
        info[i.name + '_raw'] = i;
      }
    });
    return info;
  },
  getIdentMatcher: function getIdentMatcher() {
    return {
      content: [],
      name: 'ident',
      test: function test(type) {
        if (type !== TOKEN_TYPE.WHITE_SPACE) {
          return {
            offset: 0
          };
        }

        return helper.goOn;
      }
    };
  }
};
/**
 * 解析行内元素
 * @param {number} index
 * @param {Token[]} tokens
 * @param {ASTNode} parentNode
 * @returns
 */

function toInlineNode(index, tokens, parentNode) {
  var token = tokens[index];

  if (parseImg(index, tokens, function (matchTokens, info) {
    var node = createAstNode(nodeType.img, matchTokens);
    node.src = helper.tokensToString(info.src);
    node.alt = helper.tokensToString(info.alt);
    parentNode.push(node);
    index += matchTokens.length;
  })) {
    return index;
  }

  if (parseUrl(index, tokens, function (matchTokens, info) {
    var node = createAstNode(nodeType.url, matchTokens, {
      href: helper.tokensToString(info.src)
    });
    node.push(createAstNode(nodeType.text, info.alt));
    parentNode.push(node);
    index += matchTokens.length;
  })) {
    return index;
  }

  if (parseInlineCode(index, tokens, function (matchTokens, info) {
    var node = createAstNode(nodeType.inlineCode, matchTokens);
    node.push(createAstNode(nodeType.text, info.code));
    parentNode.push(node);
    index += matchTokens.length;
  })) {
    return index;
  }

  if (parseSimpleUrl(index, tokens, function (matchTokens, info) {
    var node = createAstNode(nodeType.url, matchTokens, {
      href: helper.tokensToString(info.src)
    });
    node.push(createAstNode(nodeType.text, info.src));
    parentNode.push(node);
    index += matchTokens.length;
  })) {
    return index;
  }

  if (parseLineThrough(index, tokens, function (matchTokens, info) {
    var node = createAstNode(nodeType.linethrough, matchTokens);
    parseInlineNodeLoop(info.content, node);
    parentNode.push(node);
    index += matchTokens.length;
  })) {
    return index;
  }

  if (parseBlob(index, tokens, function (matchTokens, info) {
    var node = createAstNode(nodeType.blod, matchTokens);
    parseInlineNodeLoop(info.content, node);
    parentNode.push(node);
    index += matchTokens.length;
  })) {
    return index;
  }

  if (parseItalic(index, tokens, function (matchTokens, info) {
    var node = createAstNode(nodeType.italic, matchTokens);
    parseInlineNodeLoop(info.content, node);
    parentNode.push(node);
    index += matchTokens.length;
  })) {
    return index;
  }

  var lastMnode = parentNode.children[parentNode.children.length - 1];

  if (lastMnode && lastMnode.type === nodeType.text) {
    lastMnode.addToken(token);
  } else {
    parentNode.push(createAstNode(nodeType.text, [token]));
  }

  index += 1;
  return index;
}
/**
 * 解析行内节点
 * @param {Token[]} tokens
 * @param {ASTNode} parentNode
 */


function parseInlineNodeLoop(tokens, parentNode) {
  var index = 0;

  while (index < tokens.length) {
    index = toInlineNode(index, tokens, parentNode);
  }
}
/**
 * 如果想递归分析，那就需要把start/end携带上，这样就不用不停的分配新数组了
 * 把token转换为Node
 * @param {Token[]} tokens
 */


function toAST(tokens, defaultRoot) {
  var root = defaultRoot || createAstNode(nodeType.root, tokens);
  var index = 0;

  while (index < tokens.length) {
    var _token = tokens[index];

    if (!_token) {
      break;
    } // 是不是行首
    // parse head


    if (_token.type === TOKEN_TYPE.LINE_END) {
      root.push(createAstNode(nodeType.br, [_token]));
      index += 1;
      continue;
    }

    if (parseHead(index, tokens, function (matchTokens, info) {
      var node = createAstNode(nodeType['h' + info.headLevel.length], matchTokens);
      parseInlineNodeLoop(info.children, node);
      root.push(node);
      index += matchTokens.length;
    })) {
      continue;
    }

    if (parseBlockCode(index, tokens, function (matchTokens, info) {
      var node = createAstNode(nodeType.code, matchTokens, {
        code: helper.tokensToString(info.code),
        language: helper.tokensToString(info.language).trim()
      });
      root.push(node);
      index += matchTokens.length;
    })) {
      continue;
    }

    if (parseBlockQuote(index, tokens, function (matchTokens, info) {
      var node = createAstNode(nodeType.queto, matchTokens);
      toAST(info.children, node);
      root.push(node);
      index += matchTokens.length;
    })) {
      continue;
    }

    if (parseTable(index, tokens, function (matchTokens, info) {
      var node = createAstNode(nodeType.table, matchTokens);
      var thead = createAstNode(nodeType.thead, info.thead);
      var theadTr = createAstNode(nodeType.tr, info.thead);
      thead.push(theadTr);
      info.thead_raw.children.forEach(function (item) {
        var th = createAstNode(nodeType.th, item);
        parseInlineNodeLoop(item, th);
        theadTr.push(th);
      });
      node.push(thead);
      var tbody = createAstNode(nodeType.tbody, info.tbody);
      info.tbody_raw.children.forEach(function (item) {
        var tbodyTr = createAstNode(nodeType.tr, info.tbody);
        tbody.push(tbodyTr);
        info.thead_raw.children.forEach(function (_, index) {
          var ele = item[index] || [];
          var td = createAstNode(nodeType.td, ele);
          parseInlineNodeLoop(ele, td);
          tbodyTr.push(td);
        }); // item.forEach(ele => {
        //     const td = createAstNode(nodeType.td, item)
        //     parseInlineNodeLoop(ele, td)
        //     tbodyTr.push(td)
        // })
      });
      node.push(tbody);
      root.push(node);
      index += matchTokens.length;
    })) {
      continue;
    }

    if (parseHr(index, tokens, function (matchTokens) {
      var node = createAstNode(nodeType.hr, matchTokens);
      root.push(node);
      index += matchTokens.length;
    })) {
      continue;
    }

    if (parseList(index, tokens, function (matchTokens, info) {
      var node = createAstNode(nodeType.ul, matchTokens);
      node.listStyleType = info[0].listStyleType;
      info.forEach(function (item) {
        var liNode = createAstNode(item.nodeType || nodeType.li);
        parseInlineNodeLoop(item.head, liNode);
        item.children.forEach(function (ele) {
          parseInlineNodeLoop(ele.content, liNode);
        });
        node.push(liNode);
      });
      root.push(node);
      index += matchTokens.length;
    })) {
      continue;
    }

    index = toInlineNode(index, tokens, root);
  }

  return root;
}
/** @typedef {(matchTokens: Token[], info: Object) => any } MatchHanlder  */

/**
 * 匹配
 * @param {number} index
 * @param {Array} tokens
 * @param {Array} queue
 * @param {MatchHanlder} handler
 * @returns {boolean}
 */


function matchUsefulTokens(index, tokens, queue, handler) {
  var matchTokens = [];
  var queueTypeIndex = 0;
  watchAfterUtil(index, tokens, function (item, currentIndex, moveIndex) {
    while (true) {
      if (_typeof(queue[queueTypeIndex]) === 'object') {
        // offset的偏移 + index大于tokens长度时，item不存在了
        if (!item) {
          break;
        }

        var testResult = queue[queueTypeIndex].test(item.type, currentIndex, tokens);

        if (helper.isCanGoOn(testResult)) {
          queue[queueTypeIndex].content.push(item);
          matchTokens.push(item);
          return true;
        } // 终止向下解析


        if (!testResult || queue[queueTypeIndex].stop) {
          return false;
        } // 移动index


        if (testResult.offset > 0) {
          matchTokens.push.apply(matchTokens, _toConsumableArray(tokens.slice(currentIndex, currentIndex + testResult.offset))); // 根据offset去矫正偏移量

          var _moveIndex = moveIndex(testResult.offset);

          var _moveIndex2 = _slicedToArray(_moveIndex, 2);

          item = _moveIndex2[0];
          currentIndex = _moveIndex2[1];
        } // TODO: 当offset大于0的时候需要记录指定的节点比如 结束标签```


        queueTypeIndex += 1; // 继续从头循环

        continue;
      } // 这里在假设下一个type一定不是一个Object


      if (queue[queueTypeIndex] && item.type === queue[queueTypeIndex]) {
        queueTypeIndex += 1;
        matchTokens.push(item); // 直到所有的都匹配到

        return queueTypeIndex !== queue.length;
      }

      return false;
    }
  }); // 没有停止解析的

  if (queueTypeIndex === queue.length && queue.every(function (i) {
    return !i.stop;
  })) {
    handler(matchTokens, helper.getQueueContent(queue));
    return true;
  }

  return false;
}
/**
 * 解析图片
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseImg(index, tokens, handler) {
  if (!helper.isType(tokens[index], TOKEN_TYPE.IMG_START)) {
    return false;
  }

  var matchTokens = [tokens[index]];

  if (parseUrl(index + 1, tokens, function (urlMatchTokens, info) {
    handler(matchTokens.concat(urlMatchTokens), info);
  })) {
    return true;
  }

  return false;
}
/**
 * 解析url
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseUrl(index, tokens, handler) {
  // 如何完美结合起来
  var queue = [TOKEN_TYPE.URL_DESC_START, {
    content: [],
    name: 'alt',
    test: function test(type) {
      return helper.isType(type, TOKEN_TYPE.URL_DESC_START, TOKEN_TYPE.URL_DESC_END) ? {
        offset: 0
      } : helper.goOn;
    }
  }, TOKEN_TYPE.URL_DESC_END, TOKEN_TYPE.URL_START, {
    content: [],
    name: 'src',
    test: function test(type) {
      return helper.isType(type, TOKEN_TYPE.URL_START, TOKEN_TYPE.URL_END) ? {
        offset: 0
      } : helper.goOn;
    }
  }, TOKEN_TYPE.URL_END]; // 在这里存储匹配到的结果，然后对，某些可递归元素继续解析 比如 [can parse content]()

  return matchUsefulTokens(index, tokens, queue, handler);
}
/**
 * 解析简单url <xxxxx>
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseSimpleUrl(index, tokens, handler) {
  var queue = [TOKEN_TYPE.SIMPLE_URL_START, {
    content: [],
    name: 'src',
    test: function test(type) {
      if (helper.isType(type, TOKEN_TYPE.SIMPLE_URL_START, TOKEN_TYPE.SIMPLE_URL_END, TOKEN_TYPE.LINE_END, TOKEN_TYPE.WHITE_SPACE)) {
        return {
          offset: 0
        };
      }

      return helper.goOn;
    }
  }, TOKEN_TYPE.SIMPLE_URL_END];
  return matchUsefulTokens(index, tokens, queue, handler);
}
/**
 * 解析行内code
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseInlineCode(index, tokens, handler) {
  // 不能是连续的``
  if (helper.isType(tokens[index], TOKEN_TYPE.CODE_BLOCK) && helper.isType(tokens[index + 1], TOKEN_TYPE.CODE_BLOCK)) {
    return false;
  }

  var queue = [TOKEN_TYPE.CODE_BLOCK, {
    content: [],
    name: 'code',
    repeatable: true,
    ignore: true,
    test: function test(type) {
      if (helper.isType(type, TOKEN_TYPE.CODE_BLOCK)) {
        return {
          offset: 1
        };
      }

      return helper.goOn;
    }
  }];
  return matchUsefulTokens(index, tokens, queue, handler);
}
/**
 * 解析文本中划线
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseLineThrough(index, tokens, handler) {
  var queue = [TOKEN_TYPE.LINE_THROUGH, TOKEN_TYPE.LINE_THROUGH, {
    content: [],
    name: 'content',
    test: function test(type, index, tokens) {
      if ([tokens[index + 1], tokens[index + 2]].every(function (i) {
        return helper.isType(i, TOKEN_TYPE.LINE_THROUGH);
      })) {
        this.content.push(tokens[index]);
        return {
          offset: 1
        };
      }

      return helper.goOn;
    }
  }, TOKEN_TYPE.LINE_THROUGH, TOKEN_TYPE.LINE_THROUGH];
  return matchUsefulTokens(index, tokens, queue, handler);
}
/**
 * 解析倾斜
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseItalic(index, tokens, handler) {
  var queue = [TOKEN_TYPE.BLOB, {
    content: [],
    name: 'content',
    test: function test(type, index, tokens) {
      if ([tokens[index + 1]].every(function (i) {
        return helper.isType(i, TOKEN_TYPE.BLOB);
      })) {
        this.content.push(tokens[index]);
        return {
          offset: 1
        };
      }

      return helper.goOn;
    }
  }, TOKEN_TYPE.BLOB];
  return matchUsefulTokens(index, tokens, queue, handler);
}
/**
 * 解析加粗
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseBlob(index, tokens, handler) {
  var queue = [TOKEN_TYPE.BLOB, TOKEN_TYPE.BLOB, {
    content: [],
    name: 'content',
    test: function test(type, index, tokens) {
      if ([tokens[index + 1], tokens[index + 2]].every(function (i) {
        return helper.isType(i, TOKEN_TYPE.BLOB);
      })) {
        this.content.push(tokens[index]);
        return {
          offset: 1
        };
      }

      return helper.goOn;
    }
  }, TOKEN_TYPE.BLOB, TOKEN_TYPE.BLOB];
  return matchUsefulTokens(index, tokens, queue, handler);
}
/**
 * 解析标题
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseHead(index, tokens, handler) {
  if (!helper.isLineStart(tokens, index)) {
    return false;
  } // 实现一个简单的向前向后看的正则


  var queue = [helper.getIdentMatcher(), {
    content: [],
    name: 'headLevel',
    stop: false,
    test: function test(type, index, tokens) {
      var _watchAfterUtil = watchAfterUtil(index, tokens, function (item) {
        return helper.isType(item, TOKEN_TYPE.HEAD_TITLE);
      }),
          matchTokens = _watchAfterUtil.matchTokens;

      if (matchTokens.length > 6 || matchTokens.length === 0) {
        this.stop = true;
        return false;
      }

      this.content = matchTokens; // 通过向前看，向后看以解析判断，是否命中Node节点

      return {
        offset: matchTokens.length
      };
    }
  }, {
    content: [],
    name: 'children',
    repeatable: true,
    ignore: true,
    test: function test(type, index, tokens) {
      // 通过向前看，向后看以解析判断，是否命中Node节点
      if (helper.isLineEnd(tokens[index])) {
        return {
          offset: 1
        }; // 忽略尾部\n
      }

      return helper.goOn;
    }
  }];
  return matchUsefulTokens(index, tokens, queue, handler);
}
/**
 * 解析代码块
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseBlockCode(index, tokens, handler) {
  if (!helper.isLineStart(tokens, index)) {
    return false;
  } // 实现一个简单的向前向后看的正则


  var queue = [TOKEN_TYPE.CODE_BLOCK, TOKEN_TYPE.CODE_BLOCK, TOKEN_TYPE.CODE_BLOCK, {
    content: [],
    name: 'language',
    test: function test(type, index, tokens) {
      // 保留换行符
      if (helper.isLineEnd(tokens[index])) {
        this.content.push(tokens[index]);
        return {
          offset: 1
        };
      } else if (helper.nextIsLienEnd(tokens, index)) {
        this.content.push(tokens[index], tokens[index + 1]); // debugger

        return {
          offset: 2
        };
      }

      return helper.goOn;
    }
  }, {
    content: [],
    name: 'code',
    test: function test(type, index, tokens) {
      // 通过向前看，向后看以解析判断，是否命中Node节点
      if (type === TOKEN_TYPE.CODE_BLOCK) {
        return helper.isLineStart(tokens, index) && watchAfter(tokens, index, 3).every(function (item, at) {
          if (at === 2) {
            return helper.isLineEnd(item);
          }

          return helper.isType(item, TOKEN_TYPE.CODE_BLOCK);
        }) ? {
          offset: 3
        } : helper.goOn;
      }

      return helper.goOn;
    }
  }];
  return matchUsefulTokens(index, tokens, queue, handler);
}
/**
 * 解析分割线
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseHr(index, tokens, handler) {
  // 实现一个简单的向前向后看的正则
  var queue = [{
    content: [],
    name: 'hr',
    test: function test(type, index, tokens) {
      // 通过向前看，向后看以解析判断，是否命中Node节点
      if (helper.isType(tokens[index], TOKEN_TYPE.NO_ORDER_LIST)) {
        var isMatch = helper.isLineStart(tokens, index) && watchAfter(tokens, index, 3).every(function (item, at) {
          if (at === 2) {
            return helper.isLineEnd(item);
          }

          return helper.isType(item, TOKEN_TYPE.NO_ORDER_LIST);
        });
        return isMatch ? {
          offset: 3
        } : false;
      }

      return false;
    }
  }];
  return matchUsefulTokens(index, tokens, queue, handler);
}
/**
 * 解析块级引用
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseBlockQuote(index, tokens, handler) {
  if (!helper.isLineStart(tokens, index)) {
    return false;
  } // 实现一个简单的向前向后看的正则


  var queue = [TOKEN_TYPE.SIMPLE_URL_END, {
    content: [],
    name: 'children',
    repeatable: true,
    ignore: true,
    test: function test(type, index, tokens) {
      // 这里暗含的意思是，这个if判断已经满足了是当前是end条件
      if (watchAfter(tokens, index, 2).every(function (i) {
        return helper.isLineEnd(i);
      })) {
        this.content.push(tokens[index]);
        return {
          offset: 2
        };
      }

      return helper.goOn;
    }
  }]; // 需要一个描述符号 \n{0,2}$

  return matchUsefulTokens(index, tokens, queue, handler);
}
/**
 * 解析列表
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseList(index, tokens, handler) {
  if (!helper.isLineStart(tokens, index)) {
    return false;
  }

  var mtks = [];
  var liList = []; // 先获取ident，然后判断是不是 - / +
  // 如果不是，就向前一个对象的children push
  // 如果是就新增一个对象

  while (true) {
    // 遇到两个换行结束遍历
    if (tokens.slice(index, index + 2).every(function (i) {
      return helper.isLineEnd(i);
    })) {
      break;
    }

    if (matchUsefulTokens(index, tokens, [helper.getIdentMatcher(), {
      content: [],
      name: 'listType',
      nodeType: nodeType.li,
      listStyleType: '',
      test: function test(type, index, tokens) {
        if (helper.isType(type, TOKEN_TYPE.NO_ORDER_LIST, TOKEN_TYPE.ORDER_LIST)) {
          this.content.push(tokens[index]); // 'disc', // 实心圆
          // 'circle', // 空心圆
          // 'square', // 方块

          this.listStyleType = type === TOKEN_TYPE.NO_ORDER_LIST ? 'disc' : 'decimal';
          var todoType = '';
          var isMatchTodo = watchAfter(tokens, index, 5).every(function (i, index) {
            switch (index) {
              case 0:
                return helper.isType(i, TOKEN_TYPE.WHITE_SPACE);

              case 1:
                return helper.isType(i, TOKEN_TYPE.URL_DESC_START);

              case 2:
                {
                  if (helper.isType(i, TOKEN_TYPE.WHITE_SPACE)) {
                    todoType = nodeType.li_todo;
                    return true;
                  }

                  if (helper.isType(i, TOKEN_TYPE.STRING) && i.raw === 'x') {
                    todoType = nodeType.li_done;
                    return true;
                  }

                  return false;
                }

              case 3:
                return helper.isType(i, TOKEN_TYPE.URL_DESC_END);

              case 4:
                return helper.isType(i, TOKEN_TYPE.WHITE_SPACE) || helper.isLineEnd(i);
            }
          });

          if (isMatchTodo) {
            var _this$content;

            (_this$content = this.content).push.apply(_this$content, _toConsumableArray(watchAfter(tokens, index, 4)));

            this.nodeType = todoType;
            return {
              offset: 5
            };
          }

          return {
            offset: 1 // TODO:忽略结尾token，但其实应当添加到info上

          };
        }

        return false;
      }
    }, {
      content: [],
      name: 'head',
      test: function test(type, index, tokens) {
        // 暗含的意思
        var result = helper.checkIsEnd(tokens, index);

        if (result.match) {
          var _this$content2;

          // 需要解决立马遇到行尾的问题
          (_this$content2 = this.content).push.apply(_this$content2, _toConsumableArray(result.match));

          return {
            offset: result.match.length // TODO:忽略结尾token，但其实应当添加到info上

          };
        }

        return helper.goOn;
      }
    }], function (mts, info) {
      index += mts.length;
      mtks.push.apply(mtks, _toConsumableArray(mts));
      liList.push({
        ident: info.ident,
        head: info.head,
        listStyleType: info.listType_raw.listStyleType,
        nodeType: info.listType_raw.nodeType,
        children: [],
        tokens: mts
      });
    })) {
      continue;
    }

    if (liList.length === 0) {
      return;
    }

    if (matchUsefulTokens(index, tokens, [{
      content: [],
      name: 'content',
      test: function test(type, index, tokens) {
        if (helper.isLineEnd(tokens[index])) {
          // 需要解决立马遇到行尾的问题
          this.content.push(tokens[index]);
          return {
            offset: 1 // TODO:忽略结尾token，但其实应当添加到info上

          };
        }

        return helper.goOn;
      }
    }], function (mts, info) {
      index += mts.length;
      mtks.push.apply(mtks, _toConsumableArray(mts));
      liList[liList.length - 1].children.push({
        type: 'normal',
        content: info.content,
        tokens: mts
      });
    })) {
      continue;
    }

    break;
  }

  if (liList.length !== 0) {
    handler(mtks, liList);
    return true;
  }

  return false;
}
/**
 * 解析表格
 * @param {number} index
 * @param {Token[]} tokens
 * @param {MatchHanlder} handler
 * @returns
 */


function parseTable(index, tokens, handler) {
  // 如果下一行的内容是  |----|----| 这种格式，则表示是table表格
  if (!helper.isLineStart(tokens, index)) {
    return false;
  } // 实现一个简单的向前向后看的正则


  var queue = [{
    content: [],
    children: [],
    name: 'thead',
    test: function test(type, index, tokens) {
      // 期望字符
      if (type !== TOKEN_TYPE.TABLE_SPLIT) {
        if (this.children.length === 0) {
          // 忽略行首的空格
          if (helper.isType(type, TOKEN_TYPE.WHITE_SPACE)) {
            return helper.goOn;
          }

          this.children.push([]);
        } // 需要时连续的 - ， --之间不能有空格


        this.children[this.children.length - 1].push(tokens[index]);
      } else if (type === TOKEN_TYPE.TABLE_SPLIT) {
        // 下一个是有效字符
        // 第一个是空格 第二个是有效字符
        if (!helper.isType(tokens[index + 1], TOKEN_TYPE.WHITE_SPACE, TOKEN_TYPE.LINE_END, TOKEN_TYPE.TABLE_SPLIT) || helper.isType(tokens[index + 1], TOKEN_TYPE.WHITE_SPACE) && !helper.isType(tokens[index + 2], TOKEN_TYPE.WHITE_SPACE, TOKEN_TYPE.LINE_END, TOKEN_TYPE.TABLE_SPLIT)) {
          this.hasSplit = true;
          this.children.push([]);
        }
      } // ----|----|------


      if (helper.isLineEnd(tokens[index])) {
        if (!this.hasSplit || this.children.length === 0) {
          return false;
        }

        this.content.push(tokens[index]); // 如果字符串

        return {
          offset: 1
        };
      }

      return helper.goOn;
    }
  }, {
    content: [],
    name: 'split',
    children: [],
    test: function test(type, index, tokens) {
      // 不会存在连续的空格
      if (!helper.isType(type, TOKEN_TYPE.NO_ORDER_LIST, TOKEN_TYPE.WHITE_SPACE, TOKEN_TYPE.LINE_END, TOKEN_TYPE.TABLE_SPLIT)) {
        this.stop = true;
        return false;
      }

      if (type !== TOKEN_TYPE.TABLE_SPLIT) {
        if (this.children.length === 0) {
          // 忽略行首的空格
          if (helper.isType(type, TOKEN_TYPE.WHITE_SPACE)) {
            return helper.goOn;
          }

          this.children.push([]);
        } // 需要时连续的 - ， --之间不能有空格


        this.children[this.children.length - 1].push(tokens[index]);
      } else if (type === TOKEN_TYPE.TABLE_SPLIT) {
        // 第一个是 -
        // 第一个是空格 第二个是 -
        if (helper.isType(tokens[index + 1], TOKEN_TYPE.NO_ORDER_LIST) || helper.isType(tokens[index + 1], TOKEN_TYPE.WHITE_SPACE) && helper.isType(tokens[index + 2], TOKEN_TYPE.NO_ORDER_LIST)) {
          this.hasSplit = true;
          this.children.push([]);
        }
      } // ----|----|------


      if (helper.isLineEnd(tokens[index])) {
        if (!this.hasSplit || this.children.length === 0) {
          return false;
        }

        this.content.push(tokens[index]); // 如果字符串

        return {
          offset: 1
        };
      }

      return helper.goOn;
    }
  }, {
    content: [],
    children: [],
    // [[[xxx], [yyyyy]], []]
    name: 'tbody',
    // 二级嵌套
    test: function test(type, index, tokens) {
      if (helper.isType(type, TOKEN_TYPE.LINE_END)) {
        this.children.push([]);
      } else {
        if (this.children.length === 0) {
          if (helper.isType(type, TOKEN_TYPE.WHITE_SPACE)) {
            return helper.goOn;
          }

          this.children.push([]);
        }

        var lastRow = this.children[this.children.length - 1]; // | xcxxx

        if (helper.isType(type, TOKEN_TYPE.TABLE_SPLIT)) {
          if (!helper.isType(tokens[index + 1], TOKEN_TYPE.WHITE_SPACE, TOKEN_TYPE.LINE_END, TOKEN_TYPE.TABLE_SPLIT) || helper.isType(tokens[index + 1], TOKEN_TYPE.WHITE_SPACE) && !helper.isType(tokens[index + 2], TOKEN_TYPE.WHITE_SPACE, TOKEN_TYPE.LINE_END, TOKEN_TYPE.TABLE_SPLIT)) {
            lastRow.push([]);
          }
        } else {
          if (lastRow.length === 0) {
            lastRow.push([]);
          }

          lastRow[lastRow.length - 1].push(tokens[index]);
        }
      }

      if (watchAfter(tokens, index, 2).every(function (i) {
        return helper.isLineEnd(i);
      })) {
        this.content.push(tokens[index]); // 如果字符串

        return {
          offset: 1
        };
      }

      return helper.goOn;
    }
  }]; // 需要一个描述符号 \n{0,2}$

  return matchUsefulTokens(index, tokens, queue, handler);
}

function parser() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return toAST(token(str));
}
/**@typedef {import("../@type").DiffResult} DiffResult */


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


function patch() {
  var diffResult = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var $container = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document.body;
  diffResult.forEach(function (item) {
    var nextNode = item.nextNode;

    switch (item.type) {
      case 'del':
        {
          var $prevNodeDom = item.prevNode.$getNode(item.type);

          if (!$prevNodeDom.parentElement) {
            console.log('delete error::', item);
          }

          $prevNodeDom.parentElement.removeChild($prevNodeDom);
          break;
        }

      case 'add':
        {
          var $realContainer = nextNode.__parent && nextNode.__parent.$getNode(item.type) || $container;
          trans(nextNode, $realContainer, {
            // 自定义新节点的插入位置，而不是所有的插在末尾处
            beforeAppend: function beforeAppend(ele) {
              var ref = $realContainer.childNodes[item.moveTo];

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
          var _$prevNodeDom = item.prevNode.$getNode(item.type);

          var $parent = document.createDocumentFragment();
          trans(nextNode, $parent);

          _$prevNodeDom.parentElement.replaceChild($parent, _$prevNodeDom);

          break;
        }

      case 'move':
        {
          var moveTo = item.moveTo;
          var prevNode = item.prevNode;

          var _$prevNodeDom2 = prevNode.$getNode(item.type);

          var parent = _$prevNodeDom2.parentElement; // 如果目标元素和当前元素相同，则不用移动

          if (parent.childNodes[moveTo] !== _$prevNodeDom2) {
            if (parent.childNodes[moveTo]) {
              insertBefore(_$prevNodeDom2, parent.childNodes[moveTo]);
            } else {
              parent.appendChild(_$prevNodeDom2);
            }
          }

          break;
        }

      case 'update':
        {
          var propsChange = item.propsChange,
              _prevNode = item.prevNode,
              _nextNode = item.nextNode;

          var _$prevNodeDom3 = _prevNode.$getNode(item.type); // 继承htmlNode


          _nextNode.$getNode = _prevNode.$getNode;

          if (_prevNode.__node) {
            _nextNode.__node = _prevNode.__node;
          } // 继承update


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


                  if (_$prevNodeDom3 instanceof Text) {
                    _$prevNodeDom3.data = newValue;
                    break;
                  } // 更新其他属性


                  _$prevNodeDom3.setAttribute(key, newValue);

                  break;
                }

              case 'del':
                {
                  _$prevNodeDom3.removeAttribute(key);

                  break;
                }
            }
          });
          break;
        }

      default:
        {
          console.error('canot handle type', item, item.type);
        }
    }
  });
} // 获取节点上的所有文本信息

/**
 * 遍历节点获取Node内的图片、文本信息
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
/**
 * AST转HTMLNode
 * 转换结束后AST上需要有HTMLNode的引用，方便下次patch，对HTMLNode做增删改
 * AST也应该提供props update方法，用来处理props更新
 */

/**@typedef {import("../@type").ASTNode} ASTNode */
// 支持ssr
// 抽象的操作 移动/删除/update
// 为什么呢？因为比如有些type video，我们想使用一个组件来实现，而非一个html标签来实现
// 所谓的渲染到多端

/**
 * AST 转 dom
 * @param {ASTNode} node
 * @param {HTMLElement} $parent
 */


function trans(node, $parent) {
  var option = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var ele; // 接受子节点的元素

  var realRoot; // 真正的根节点，因为对于某些node，他的渲染逻辑不是一个简单的html标签，而是多个标签

  var $getNode = function $getNode() {
    return ele;
  };

  switch (node.type) {
    case nodeType.audio:
    case nodeType.video:
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

    case nodeType.img:
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
          ele.innerHTML = "<div style=\"padding-top: ".concat(height / width * 100, "%;\">\n                    <img ").concat( // eslint-disable-next-line no-undef
          LY.lazyLoad.caches.includes(src) ? "src=\"".concat(src, "\" data-img-cache=\"true\"") : '', "\n                        class=\"lazy-load-img img-loading\"\n                        data-lazy-img=\"").concat(node.src, "\"\n                        data-src=\"").concat(node.src, "\"\n                        style=\"position: absolute; width: 100%; height: 100%; top: 0;\" />\n                </div>");
          break;
        } else {
          ele = document.createElement(node.type);
          ele.src = node.src;
          ele.alt = node.alt;
          break;
        }
      }

    case nodeType.url:
      {
        ele = document.createElement(node.type);
        ele.href = node.href;
        ele.target = '_blank';
        break;
      }

    case nodeType.text:
      {
        var text = node.value;
        ele = document.createTextNode(text);
        break;
      }

    case nodeType.br:
      {
        ele = document.createElement(node.type);
        break;
      }

    case nodeType.linethrough:
      {
        ele = document.createElement('span');
        ele.style.cssText += '; text-decoration: line-through;';
        break;
      }

    case nodeType.code:
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

            case 'code':
              {
                code.textContent = newNode[key]; // 不能使用innerHTML

                break;
              }
          }
        };

        node.__update('language', node);

        node.__update('code', node);

        ele.appendChild(code);
        break;
      }

    case nodeType.inlineCode:
      {
        ele = document.createElement('code');
        ele.className = 'inlineCode';
        break;
      }

    case nodeType.head:
      {
        ele = document.createElement("h".concat(node.level)); // 添加一个
        // const a = document.createElement('a')
        // const id = getText(node)
        // a.href = `#${id}`
        // a.id = id
        // ele.appendChild(a)

        break;
      }

    case nodeType.ul:
      {
        ele = document.createElement(node.type);

        node.__update = function (key, nodeNode) {
          ele.style.cssText += ";list-style-type:".concat(nodeNode[key], ";");
        };

        node.__update('listStyleType', node);

        break;
      }
    // 需要完成一个事情，就是添加和dom没有关系，我们可以包两层，包几层的结果是，删除和替换的时候需要特殊处理一下
    // 以避免dom没有删除或者替换干净
    // add / remove / replace / move

    /**
     * node.getRoot = () => [返回真实的根节点]，可以是一个数组
     */

    case nodeType.li_done:
    case nodeType.li_todo:
      {
        realRoot = document.createElement('li');
        var tag = document.createElement('span');
        tag.className = 'list-todo-tag';
        tag.textContent = node.type === nodeType.li_done ? '✅' : '🚧';
        realRoot.appendChild(tag);
        ele = document.createElement('span');
        realRoot.appendChild(ele);
        realRoot.style.cssText += ";list-style: none;";

        $getNode = function $getNode(type) {
          return type === 'add' ? ele : realRoot;
        };

        break;
      }

    case nodeType.h3:
    case nodeType.h2:
    case nodeType.h1:
      {
        ele = document.createElement(node.type); // 为标题添加id，以支持锚点

        node.__update = function (key, newNode) {
          if (key === 'id') {
            ele.id = getParserNodeInfo(newNode).text.trim();
          }
        };

        node.__update('id', node);

        break;
      }

    default:
      {
        ele = document.createElement(node.type);
        node.indent && (ele.style.cssText += ';padding-left: 2em;'); // table表格需要设置边框

        if (node.type == nodeType.table) {
          ele.setAttribute('border', '1');
        }
      }
  }

  realRoot = realRoot || ele;
  node.$getNode = $getNode;
  node.tag && ele.setAttribute('tag', node.tag);
  node.children && node.children.forEach(function (child) {
    return trans(child, ele);
  });

  if (!(option.beforeAppend && option.beforeAppend(realRoot))) {
    $parent.appendChild(realRoot);
  }

  return ele;
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
      _s2.type = 'text/css';
      _s2.rel = 'stylesheet';
      _s2.charset = 'utf-8';
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

var Markdown = /*#__PURE__*/function () {
  function Markdown(dom, config, str) {
    _classCallCheck(this, Markdown);

    this.dom = dom;
    this.config = config;
    this.prevRoot = null;

    if (str) {
      this.update(str);
    }
  }

  _createClass(Markdown, [{
    key: "update",
    value: function update(str) {
      this.dom.classList.add('markdown');
      var result = getParseResult(str);
      var diffResult = diffNode(this.prevRoot, result.root);
      this.prevRoot = result.root;
      patch(diffResult, this.dom);
      var config = getConfig(this.config);
      codeHighlight(this.dom, config);
    }
  }]);

  return Markdown;
}();

function markdown($dom, str, config) {
  $dom.innerHTML = '';
  $dom.classList.add('markdown');
  var result = getParseResult(str);
  trans(result.root, $dom);
  config = getConfig(config);
  codeHighlight($dom, config);
}

function markdownInfo(str) {
  // eslint-disable-next-line no-unused-vars
  var _getParseResult = getParseResult(str),
      root = _getParseResult.root,
      info = _objectWithoutProperties(_getParseResult, ["root"]);

  return info;
}

exports.Markdown = Markdown;
exports.codeHighlight = codeHighlight;
exports.getParseResult = getParseResult;
exports.markdown = markdown;
exports.markdownInfo = markdownInfo;
exports.parser = parser;
exports.trans = trans;