"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = patch;

var _index = require("./index.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DiffResult = function DiffResult() {
  _classCallCheck(this, DiffResult);

  this.type = '';
  this.prevNode = {
    type: '',
    children: [],
    __htmlNode: document.body
  };
  this.nextNode = {
    type: '',
    children: [],
    propsChange: [],
    __moveTo: {}
  };
  this.children = [];
  this.propsChange = [];
};

function insertBefore(newDom, refDom) {
  if (refDom && refDom.parentElement) {
    refDom.parentElement.insertBefore(newDom, refDom);
  }

  return newDom;
}

function findIndex(ele) {
  console.log(ele);
  var childNodes = ele.parentElement.childNodes;

  for (var i = 0, len = childNodes.length; i < len; i++) {
    if (childNodes[i] === ele) {
      return i;
    }
  }
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
        (0, _index.trans)(nextNode, $container, {
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
        (0, _index.trans)(nextNode, $parent);

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