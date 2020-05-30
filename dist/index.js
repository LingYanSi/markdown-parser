'use strict';

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

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


    nextNode.__htmlNode = prevNode.__htmlNode;
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

  var filterPrevArr = prevArr.filter(function (item, index) {
    if (!nextArr.some(function (i) {
      return i.type === item.type;
    })) {
      diffNode(item, null, diffResultArr);
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
  });
}

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
}

var listReg = /^(\s*)([-+])/;
/**
 * 父组件一路向上查询
 */

function sortUl(ul) {
  var SPACE_PER = 5;

  var newUl = _objectSpread({}, ul, {
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
        _item$raw$match2 = _slicedToArray(_item$raw$match, 3),
        prevStr = _item$raw$match2[0],
        space = _item$raw$match2[1],
        char = _item$raw$match2[2];

    var ident = Math.floor(space.length / SPACE_PER); // ident 如果<= 当前的ident，那就需要向上切换
    // 如果比当前的ident大的话，就变成当前的子元素，并把current Node更改到
    // 如果是一个li，要添加子li，应当再创建一个ul

    item.ident = ident;
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
    type: 'ul',
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
      var _matchResult = _slicedToArray(matchResult, 3),
          prevStr = _matchResult[0],
          space = _matchResult[1],
          char = _matchResult[2];

      ul.children.push({
        type: 'li',
        char: char,
        raw: line,
        ul: {
          // li可能会嵌套列表
          type: 'ul',
          children: []
        },
        children: [line.slice(prevStr.length)]
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


var Reg = {
  // > 引用
  get queto() {
    return /^>(((?!\n\n)[\s\S])*)\n\n/;
  },

  // # 标题
  get head() {
    return /^\s*(#{1,6})([^\n]*)\n?/;
  },

  // - 无序list
  // + 有序list
  get ul() {
    return /^([-+]\s+((?!\n\n)[\s\S])*)\n\n/;
  },

  // `行内code`
  get inlineCode() {
    return /^`([^`]*)`/;
  },

  // ```代码块```
  get code() {
    return /^`{3}\n(((?!```)[\s\S])*)\n`{3}/;
  },

  get br() {
    return /^\n/;
  },

  get text() {
    return /^[^\n]*\n?/;
  },

  // --- 分割线
  get hr() {
    return /(^-{3,}\n)/;
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

  // - [] 待完成事项
  // - [x] 完成事情
  get todoItem() {
    return /^-\ +\[\s*(x?)\s*\]\ +/;
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
/**
 * 获取指定字符串的匹配结果，支持循环嵌套
 * @param {string} [str='']
 * @param {string} [startTag='[']
 * @param {string} [endTag=']']
 * @returns
 */

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
/**
 * [parser 获取AST]
 * @method parser
 * @param  {String} [str=''] [description]
 * @return {AST}          [ast tree]
 */


function parser() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var defaultNode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  str += '\n\n';
  var node = defaultNode || {
    children: [],
    type: 'root'
  };
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
    } // 中划线


    if (Reg.lineThrough.test(textStr)) {
      handleText(textStr.replace(Reg.lineThrough, function (m, $0) {
        var child = {
          type: 'lineThrough',
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
        changeCurrentNode({
          type: 'video',
          src: $src,
          alt: $alt
        });
        return '';
      }));
      return;
    } // 音频


    if (Reg.audio.test(textStr)) {
      textStr = textStr.replace(Reg.audio, function (m, $alt, $src) {
        changeCurrentNode({
          type: 'audio',
          src: $src,
          alt: $alt
        });
        return '';
      });
      handleText(textStr);
      return;
    } // 图片


    if (Reg.img.test(textStr)) {
      handleText(textStr.replace(Reg.img, function (m, $alt, $src) {
        changeCurrentNode({
          type: 'img',
          src: $src,
          alt: $alt
        });
        return '';
      }));
      return;
    } // 换行


    if (textStr[0] == '\n') {
      changeCurrentNode({
        type: 'br'
      });
      handleText(textStr.slice(1));
      return;
    } // 文本,如果前一个元素是文本元素，就追加上去，反则新增文本元素


    var lastChild = node.children[node.children.length - 1];

    if (lastChild && lastChild.type === 'text') {
      lastChild.value += textStr[0];
    } else {
      changeCurrentNode({
        type: 'text',
        value: handleTranslationCode(textStr[0])
      });
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

      changeCurrentNode({
        type: 'br'
      });
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
      changeCurrentNode(h);
      h.children = parser(leftStr.replace(/^\s*\n/, ''), h).children;
      changeCurrentNode({
        type: 'br'
      });
      slice(_all2);
      next();
      return;
    } // code


    if (parseBlockCode(str, function (_ref5) {
      var language = _ref5.language,
          content = _ref5.content,
          raw = _ref5.raw;
      changeCurrentNode({
        type: 'code',
        language: language,
        value: content
      });
      slice(raw);
    })) {
      next();
      return;
    }

    if (Reg.todoItem.test(str)) {
      var _ref6 = str.match(Reg.todoItem) || [],
          _ref7 = _slicedToArray(_ref6, 1),
          _all3 = _ref7[0];

      if (_all3 !== undefined) {
        changeCurrentNode({
          type: 'todoItem',
          checked: _all3.includes('x')
        });
      }

      slice(_all3);
      next();
      return;
    }

    if (parseUL(str, function (_ref8) {
      var raw = _ref8.raw,
          list = _ref8.list;
      var LIST_STYLES = ['disc', // 实心圆
      'circle', // 空心圆
      'square'];
      var DECIMAL = 'decimal';

      var xx = function xx(ul) {
        var children = ul.children,
            deep = ul.deep;
        var child = {
          type: 'ul',
          listStyleType: children[0].char === '+' ? DECIMAL : LIST_STYLES[deep % LIST_STYLES.length],
          children: []
        };
        changeCurrentNode(child, function () {
          children.forEach(function (item) {
            changeCurrentNode({
              type: 'li',
              children: []
            }, function () {
              item.children.forEach(function (line) {
                handleText(line);
              });
              item.ul.children.length && xx(item.ul);
            });
          });
        });
      };

      xx(list);
      slice(raw);
    })) {
      next();
      return;
    } // tbale


    if (parseTable(str, function (result) {
      changeCurrentNode({
        type: 'table',
        children: []
      }, function () {
        // table头
        changeCurrentNode({
          type: 'thead',
          children: []
        }, function () {
          changeCurrentNode({
            type: 'tr',
            children: []
          }, function () {
            result.table.head.forEach(function (item) {
              changeCurrentNode({
                type: 'th',
                children: []
              }, function () {
                handleText(item);
              });
            });
          });
        });
        changeCurrentNode({
          type: 'tbody',
          children: []
        }, function () {
          result.table.body.forEach(function (item) {
            changeCurrentNode({
              type: 'tr',
              children: []
            }, function () {
              item.forEach(function (item) {
                changeCurrentNode({
                  type: 'th',
                  children: []
                }, function () {
                  handleText(item);
                });
              });
            });
          });
        });
      });
      changeCurrentNode({
        type: 'br'
      });
      slice(result.raw);
    })) {
      next();
      return;
    } // hr


    if (Reg.hr.test(str)) {
      var _ref9 = str.match(Reg.hr) || [],
          _ref10 = _slicedToArray(_ref9, 1),
          _all4 = _ref10[0];

      if (_all4 !== undefined) {
        changeCurrentNode({
          type: 'hr',
          children: []
        });
      }

      slice(_all4);
      next();
      return;
    } // 单行text


    if (Reg.text.test(str)) {
      var _ref11 = str.match(Reg.text) || [''],
          _ref12 = _slicedToArray(_ref11, 1),
          _all5 = _ref12[0];

      handleText(_all5);
      slice(_all5);
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
          var __htmlNode = item.prevNode.__htmlNode;

          if (!__htmlNode.parentElement) {
            console.log('delete error::', item);
          }

          __htmlNode.parentElement.removeChild(__htmlNode);

          break;
        }

      case 'add':
        {
          var $realContainer = nextNode.__parent && nextNode.__parent.__htmlNode || $container;
          console.log('addd', $realContainer, nextNode);
          trans(nextNode, $realContainer, {
            beforeAppend: function beforeAppend(ele) {
              console.log(ele);
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
          var _htmlNode = item.prevNode.__htmlNode;
          var $parent = document.createDocumentFragment();
          trans(nextNode, $parent);

          _htmlNode.parentElement.replaceChild($parent, _htmlNode);

          break;
        }

      case 'move':
        {
          var moveTo = item.moveTo;
          var prevNode = item.prevNode;
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
          var propsChange = item.propsChange,
              _prevNode = item.prevNode,
              _nextNode = item.nextNode;
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
          break;
        }

      default:
        {
          console.error('canot handle type', item, item.type);
        }
    }
  });
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
          ele.innerHTML = "<div style=\"padding-top: ".concat(height / width * 100, "%;\">\n                            <img ").concat(LY.lazyLoad.caches.includes(src) ? "src=\"".concat(src, "\" data-img-cache=\"true\"") : '', "\n                                class=\"lazy-load-img img-loading\"\n                                data-lazy-img=\"").concat(node.src, "\"\n                                data-src=\"").concat(node.src, "\"\n                                style=\"position: absolute; width: 100%; height: 100%; top: 0;\" />\n                        </div>");
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
        ele = document.createElement(node.type); // 添加一个
        // const a = document.createElement('a')
        // const id = getText(node)
        // a.href = `#${id}`
        // a.id = id
        // ele.appendChild(a)

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

    case 'lineThrough':
      {
        ele = document.createElement('span');
        ele.style.cssText += ";text-decoration: line-through;";
        break;
      }

    case 'todoItem':
      {
        ele = document.createElement('input');
        ele.type = 'checkbox';
        ele.checked = node.checked;
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

  if (!(option.beforeAppend && option.beforeAppend(ele))) {
    $parent.appendChild(ele);
  }

  node.__htmlNode = ele;
  return ele;
}
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
      console.log(diffResult, result.root);
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
  console.log(result);
  trans(result.root, $dom);
  config = getConfig(config);
  codeHighlight($dom, config);
}

function markdownInfo(str) {
  var _getParseResult = getParseResult(str),
      root = _getParseResult.root,
      info = _objectWithoutProperties(_getParseResult, ["root"]);

  return info;
}

exports.Markdown = Markdown;
exports.parser = parser;
exports.trans = trans;
exports.codeHighlight = codeHighlight;
exports.getParseResult = getParseResult;
exports.markdown = markdown;
exports.markdownInfo = markdownInfo;