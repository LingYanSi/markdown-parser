'use strict';

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

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

var NO_NEED_DIFF = ['$getNode', '__node', '__parent', '__update', 'children', 'type', 'raw'];
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
    if (NO_NEED_DIFF.includes(key)) {
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
var Reg = {
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
  }

};

function getNextLine(ss) {
  var index = ss.indexOf('\n');

  if (index > -1) {
    return [ss.slice(0, index + 1), ss.slice(index + 1)];
  }

  return [ss, ''];
}

function parseBlockCode() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var callback = arguments.length > 1 ? arguments[1] : undefined;

  // 开始
  var _ref = str.match(/^```([^\n]*)?/) || [],
      _ref2 = _slicedToArray(_ref, 2),
      startStr = _ref2[0],
      language = _ref2[1];

  if (startStr && str[startStr.length] === '\n') {
    var cursor = startStr.length;
    var newStr = str.slice(startStr.length);
    var line = '';

    while (newStr) {
      // 获取下一行
      var _getNextLine = getNextLine(newStr);

      var _getNextLine2 = _slicedToArray(_getNextLine, 2);

      line = _getNextLine2[0];
      newStr = _getNextLine2[1];
      cursor += line.length; // 匹配到code ``` 结尾，或者已经到了字符串的行尾

      var isStrEnd = !newStr && !line;

      if (/^\s*```\s*$/.test(line) || isStrEnd) {
        break;
      }
    }

    var result = {
      raw: str.slice(0, cursor),
      language: language,
      content: str.slice(startStr.length + 1, cursor - line.length),
      endIndex: cursor
    };
    callback(result);
    return result;
  }

  return null;
}

function treeShake() {
  var lineStr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  return lineStr.split('|').filter(function (i, index, arr) {
    return index === 0 || index === arr.length - 1 ? i.trim() : i;
  }).map(function (i) {
    return i.replace(/\s+$/g, '');
  });
}
/**
 * 解析table
 * @export
 * @param {string} [str='']
 * @param {function} callback
 * @returns
 */


function parseTable() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var callback = arguments.length > 1 ? arguments[1] : undefined;
  var strCache = str;
  var table = {
    head: [],
    body: []
  };
  var head = '';
  var splitLine = '';
  var index = 0;

  var _getNextLine3 = getNextLine(str);

  var _getNextLine4 = _slicedToArray(_getNextLine3, 2);

  head = _getNextLine4[0];
  str = _getNextLine4[1];

  var _getNextLine5 = getNextLine(str);

  var _getNextLine6 = _slicedToArray(_getNextLine5, 2);

  splitLine = _getNextLine6[0];
  str = _getNextLine6[1];
  index += splitLine.length + head.length;
  head = treeShake(head);
  splitLine = treeShake(splitLine);

  if (splitLine.length >= 2 && head.length) {
    table.head = head;
    var line = '';

    while (str) {
      var _getNextLine7 = getNextLine(str);

      var _getNextLine8 = _slicedToArray(_getNextLine7, 2);

      line = _getNextLine8[0];
      str = _getNextLine8[1];

      if (/^\s+$/.test(line)) {
        index += line.length;
        break;
      } else {
        // 如果遇到其他块级元素则应该结束循环？
        //
        index += line.length;
        table.body.push(treeShake(line));
      }
    }

    var result = {
      raw: strCache.slice(0, index),
      table: table,
      endIndex: index
    };
    callback(result);
    return result;
  }

  return null;
} // - 一般list
// - [x] todoList，两者都归于list类型


var listReg = /^(\s*)([-+])(\s\[[\sx]?\])?/;
/**
 * 父组件一路向上查询，只关心父节点，不关心兄弟节点
 */

function sortUl(ul) {
  var SPACE_PER = 4;

  var newUl = _objectSpread(_objectSpread({}, ul), {}, {
    ident: -1,
    deep: 0,
    children: []
  });

  var currentNode = newUl;

  var findParent = function findParent(ident) {
    var node = currentNode;

    while (node) {
      if (node.ident < ident) {
        return node.ul || node;
      }

      node = node._parent;
    }

    return null;
  };

  ul.children.forEach(function (item) {
    var _item$raw$match = item.raw.match(listReg),
        _item$raw$match2 = _slicedToArray(_item$raw$match, 2),
        space = _item$raw$match2[1];

    var ident = Math.floor(space.length / SPACE_PER); // ident 如果<= 当前的ident，那就需要向上切换
    // 如果比当前的ident大的话，就变成当前的子元素，并把current Node更改到
    // 如果是一个li，要添加子li，应当再创建一个ul

    item.ident = ident;
    item.ul = {
      // li可能会嵌套列表
      type: nodeType.ul,
      children: []
    };
    var parent = findParent(ident);

    if (parent) {
      // deep自增，需要更新到ul
      item.deep = parent.deep + 1;
      item.ul && (item.ul.deep = item.deep);
      item._parent = currentNode;
      currentNode = item;
      parent.children.push(item);
    }
  });
  return newUl;
}

function parseUL() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var callback = arguments.length > 1 ? arguments[1] : undefined;
  var strCache = str; // 如果遇到了空行则结束，否则都按照

  if (!listReg.test(str)) return;
  var index = 0;
  var line = '';
  var ul = {
    type: nodeType.ul,
    children: []
  };

  while (str) {
    var _getNextLine9 = getNextLine(str);

    var _getNextLine10 = _slicedToArray(_getNextLine9, 2);

    line = _getNextLine10[0];
    str = _getNextLine10[1];
    index += line.length; // 遇到空行则跳出

    if (!line.trim()) {
      break;
    }

    var matchResult = line.match(listReg);

    if (matchResult) {
      // eslint-disable-next-line no-unused-vars
      var _matchResult = _slicedToArray(matchResult, 4),
          prevStr = _matchResult[0],
          space = _matchResult[1],
          char = _matchResult[2],
          todoStr = _matchResult[3];

      var child = line.slice(prevStr.length);
      var todoType = nodeType.li;

      if (todoStr) {
        todoType = todoStr.indexOf('x') > -1 ? nodeType.li_done : nodeType.li_todo;
      } // 判断类型是不是todo


      ul.children.push({
        type: todoType,
        char: char,
        raw: line,
        children: [child]
      });
    } else {
      ul.children[ul.children.length - 1].children.push(line);
    }
  }

  var result = {
    raw: strCache.slice(0, index),
    list: sortUl(ul)
  };
  callback(result);
  return result;
}

function parseQuote(str, callback) {
  // 判断是不是以 < 开头，以遇到一个换行结束
  if (str[0] !== '>') return;
  var strCache = str;
  var index = 0;
  var line = '';

  while (str) {
    var _getNextLine11 = getNextLine(str);

    var _getNextLine12 = _slicedToArray(_getNextLine11, 2);

    line = _getNextLine12[0];
    str = _getNextLine12[1];
    index += line.length; // 使用两个换行作为结束符

    var _getNextLine13 = getNextLine(str),
        _getNextLine14 = _slicedToArray(_getNextLine13, 1),
        nextline = _getNextLine14[0];

    if (!line.trim() && !nextline.trim()) {
      break;
    }
  }

  var result = {
    raw: strCache.slice(0, index),
    content: strCache.slice(1, index)
  };
  callback(result);
  return result;
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
 * 简单的东西，当然可以正则搞定
 * 但目前来看markdown还是需要做一点语法分析的
 */

/** @typedef {import("./../@type/index").AST} AST */
// 向node节点上添加元数据

/**
 * [parser 获取AST]
 * @method parser
 * @param  {String} [str=''] [description]
 * @return {AST}          [ast tree]
 */


function parser() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var defaultNode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var IX = 0;

  function addRaw(node) {
    var text = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    node.raw = {
      text: text,
      start: IX,
      end: IX + text.length
    };
    return node;
  }

  var node = defaultNode || addRaw({
    children: [],
    type: nodeType.root
  }, str);
  /**
   * 更改切换上下文，方便快速添加children
   * @method changeCurrentNode
   * @param  {Object}          child    [需要切换到的node]
   * @param  {Function}        callback [切换后需要执行的callback]
   */

  function changeCurrentNode(child, callback) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var _options$isPush = options.isPush,
        isPush = _options$isPush === void 0 ? true : _options$isPush;
    child.__parent = node;
    node = child;
    callback && callback();
    node = child.__parent;
    isPush && node.children.push(child);
    return node;
  }

  function slice() {
    var all = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    str = str.slice(all.length);
    IX += all.length;
  }
  /**
   * [handleText 处理文本]
   * @method handleText
   * @param  {string}   [textStr=''] [description]
   */


  function handleText() {
    var textStr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    if (!textStr || typeof textStr !== 'string') {
      return;
    } // 链接


    if (Reg.url.test(textStr)) {
      handleText(textStr.replace(Reg.url, function (m, $text, $href) {
        var child = addRaw({
          type: nodeType.url,
          href: $href,
          alt: $text,
          children: []
        }, m);
        changeCurrentNode(child, function () {
          handleText($text);
        });
        return '';
      }));
      return;
    } // 加粗


    if (Reg.blod.test(textStr)) {
      handleText(textStr.replace(Reg.blod, function (m, $0) {
        var child = addRaw({
          type: nodeType.blod,
          children: []
        }, m);
        changeCurrentNode(child, function () {
          handleText($0);
        });
        return '';
      }));
      return;
    } // 中划线


    if (Reg.lineThrough.test(textStr)) {
      handleText(textStr.replace(Reg.lineThrough, function (m, $0) {
        var child = addRaw({
          type: nodeType.linethrough,
          children: []
        }, m);
        changeCurrentNode(child, function () {
          handleText($0);
        });
        return '';
      }));
      return;
    } // 倾斜


    if (Reg.italic.test(textStr)) {
      handleText(textStr.replace(Reg.italic, function (m, $0) {
        var child = addRaw({
          type: nodeType.italic,
          children: []
        }, m);
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
          var child = addRaw({
            type: nodeType.inlineCode,
            children: []
          }, m);
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
        changeCurrentNode(addRaw({
          type: nodeType.video,
          src: $src,
          alt: $alt
        }, m));
        return '';
      }));
      return;
    } // 音频


    if (Reg.audio.test(textStr)) {
      textStr = textStr.replace(Reg.audio, function (m, $alt, $src) {
        changeCurrentNode(addRaw({
          type: nodeType.audio,
          src: $src,
          alt: $alt
        }, m));
        return '';
      });
      handleText(textStr);
      return;
    } // 图片


    if (Reg.img.test(textStr)) {
      handleText(textStr.replace(Reg.img, function (m, $alt, $src) {
        changeCurrentNode(addRaw({
          type: nodeType.img,
          src: $src,
          alt: $alt
        }, m));
        return '';
      }));
      return;
    } // 换行


    if (textStr[0] == '\n') {
      changeCurrentNode(addRaw({
        type: nodeType.br
      }, textStr[0]));
      handleText(textStr.slice(1));
      return;
    } // 文本,如果前一个元素是文本元素，就追加上去，反则新增文本元素


    var lastChild = node.children[node.children.length - 1];

    if (lastChild && lastChild.type === nodeType.text) {
      lastChild.value += textStr[0];
    } else {
      changeCurrentNode(addRaw({
        type: nodeType.text,
        value: handleTranslationCode(textStr[0])
      }, ''));
    }

    handleText(textStr.slice(1));
  } // 处理需转译字符


  function handleTranslationCode(STR) {
    return STR.replace(/>/g, '>').replace(/\\#/g, '#').replace(/\\`/g, '`').replace(/\\-/g, '-').replace(/\\\*/g, '*');
  } // 迭代器


  function next() {
    if (/^\n{1,2}$/.test(str)) {
      return;
    } // 解析完毕


    if (!str) {
      return;
    } // 换行符


    if (Reg.br.test(str)) {
      var _str$match = str.match(Reg.br),
          _str$match2 = _slicedToArray(_str$match, 1),
          all = _str$match2[0];

      changeCurrentNode(addRaw({
        type: nodeType.br
      }, all));
      slice(all);
      next();
      return;
    } // 标题


    if (Reg.head.test(str)) {
      var _ref3 = str.match(Reg.head) || [],
          _ref4 = _slicedToArray(_ref3, 3),
          _all = _ref4[0],
          head = _ref4[1],
          content = _ref4[2];

      var child = addRaw({
        type: nodeType["h".concat(head.length)],
        id: content,
        children: []
      }, _all);
      changeCurrentNode(child, function () {
        handleText(content);
      });
      slice(_all);
      next();
      return;
    } // hr


    if (Reg.hr.test(str)) {
      var _ref5 = str.match(Reg.hr) || [],
          _ref6 = _slicedToArray(_ref5, 1),
          _all2 = _ref6[0];

      if (_all2 !== undefined) {
        changeCurrentNode(addRaw({
          type: nodeType.hr,
          children: []
        }, _all2));
      }

      slice(_all2);
      next();
      return;
    }

    if (parseQuote(str, function (_ref7) {
      var raw = _ref7.raw,
          content = _ref7.content;
      var h = addRaw({
        type: nodeType.queto,
        children: []
      }, raw);
      changeCurrentNode(h);
      h.children = parser(content, h).children;
      slice(raw);
    })) {
      next();
      return;
    } // code


    if (parseBlockCode(str, function (_ref8) {
      var language = _ref8.language,
          content = _ref8.content,
          raw = _ref8.raw;
      changeCurrentNode(addRaw({
        type: nodeType.code,
        language: language,
        value: content
      }, raw));
      slice(raw);
    })) {
      next();
      return;
    }

    if (parseUL(str, function (_ref9) {
      var raw = _ref9.raw,
          list = _ref9.list;
      var LIST_STYLES = ['disc', // 实心圆
      'circle', // 空心圆
      'square' // 方块
      ];
      var DECIMAL = 'decimal';

      var handleList = function handleList(ul) {
        var children = ul.children,
            deep = ul.deep;
        var child = {
          type: nodeType.ul,
          listStyleType: children[0].char === '+' ? DECIMAL : LIST_STYLES[deep % LIST_STYLES.length],
          children: []
        };
        changeCurrentNode(child, function () {
          children.forEach(function (item) {
            changeCurrentNode({
              type: item.type,
              children: []
            }, function () {
              item.children.forEach(function (line) {
                handleText(line);
              });
              item.ul.children.length && handleList(item.ul);
            });
          });
        });
      };

      handleList(list);
      slice(raw);
    })) {
      next();
      return;
    } // tbale


    if (parseTable(str, function (result) {
      changeCurrentNode(addRaw({
        type: nodeType.table,
        children: []
      }, result.raw), function () {
        // table头
        changeCurrentNode(addRaw({
          type: nodeType.thead,
          children: []
        }), function () {
          changeCurrentNode(addRaw({
            type: nodeType.tr,
            children: []
          }), function () {
            result.table.head.forEach(function (item) {
              changeCurrentNode(addRaw({
                type: nodeType.th,
                children: []
              }, item), function () {
                handleText(item);
              });
            });
          });
        });
        changeCurrentNode(addRaw({
          type: nodeType.tbody,
          children: []
        }), function () {
          result.table.body.forEach(function (item) {
            changeCurrentNode(addRaw({
              type: nodeType.tr,
              children: []
            }), function () {
              item.forEach(function (item) {
                changeCurrentNode(addRaw({
                  type: nodeType.td,
                  children: []
                }, item), function () {
                  handleText(item);
                });
              });
            });
          });
        });
      });
      changeCurrentNode(addRaw({
        type: nodeType.br
      }, '\n\n'));
      slice(result.raw);
    })) {
      next();
      return;
    } // 单行text


    if (Reg.text.test(str)) {
      var _ref10 = str.match(Reg.text) || [''],
          _ref11 = _slicedToArray(_ref10, 1),
          _all3 = _ref11[0];

      handleText(_all3);
      slice(_all3);
      next();
      return;
    }

    throw new Error("cannot handle str:".concat(str));
  }

  next();
  return node;
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

            case 'value':
              {
                code.textContent = newNode[key]; // 不能使用innerHTML

                break;
              }
          }
        };

        node.__update('language', node);

        node.__update('value', node);

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

    case 'li-done':
    case 'li-todo':
      {
        realRoot = document.createElement('li');
        var tag = document.createElement('span');
        tag.className = 'list-todo-tag';
        tag.textContent = node.type === 'li-done' ? '✅' : '🚧';
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