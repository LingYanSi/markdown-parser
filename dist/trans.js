"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = trans;

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var ASTNode = function ASTNode() {
  _classCallCheck(this, ASTNode);

  this.type = '';
  this.children = [];
  this.src = '';
  this.alt = '';
  this.language = '';
  this.value = '';
};
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