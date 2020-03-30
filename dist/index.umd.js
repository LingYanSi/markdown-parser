"use strict";function _objectWithoutProperties(d,a){if(null==d)return{};var b,e,g=_objectWithoutPropertiesLoose(d,a);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(d);for(e=0;e<i.length;e++)b=i[e],!(0<=a.indexOf(b))&&Object.prototype.propertyIsEnumerable.call(d,b)&&(g[b]=d[b])}return g}function _objectWithoutPropertiesLoose(d,a){if(null==d)return{};var b,e,g={},i=Object.keys(d);for(e=0;e<i.length;e++)b=i[e],0<=a.indexOf(b)||(g[b]=d[b]);return g}function _classCallCheck(b,c){if(!(b instanceof c))throw new TypeError("Cannot call a class as a function")}function _defineProperties(d,a){for(var b,f=0;f<a.length;f++)b=a[f],b.enumerable=b.enumerable||!1,b.configurable=!0,"value"in b&&(b.writable=!0),Object.defineProperty(d,b.key,b)}function _createClass(d,a,b){return a&&_defineProperties(d.prototype,a),b&&_defineProperties(d,b),d}function _slicedToArray(b,c){return _arrayWithHoles(b)||_iterableToArrayLimit(b,c)||_nonIterableRest()}function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}function _iterableToArrayLimit(d,a){var f,b=[],g=!0,k=!1;try{for(var l,m=d[Symbol.iterator]();!(g=(l=m.next()).done)&&(b.push(l.value),!(a&&b.length===a));g=!0);}catch(a){k=!0,f=a}finally{try{g||null==m["return"]||m["return"]()}finally{if(k)throw f}}return b}function _arrayWithHoles(b){if(Array.isArray(b))return b}function _objectSpread(b){for(var c=1;c<arguments.length;c++){var d=null==arguments[c]?{}:arguments[c],e=Object.keys(d);"function"==typeof Object.getOwnPropertySymbols&&(e=e.concat(Object.getOwnPropertySymbols(d).filter(function(b){return Object.getOwnPropertyDescriptor(d,b).enumerable}))),e.forEach(function(c){_defineProperty(b,c,d[c])})}return b}function _defineProperty(d,a,b){return a in d?Object.defineProperty(d,a,{value:b,enumerable:!0,configurable:!0,writable:!0}):d[a]=b,d}function _toConsumableArray(b){return _arrayWithoutHoles(b)||_iterableToArray(b)||_nonIterableSpread()}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function _iterableToArray(b){if(Symbol.iterator in Object(b)||"[object Arguments]"===Object.prototype.toString.call(b))return Array.from(b)}function _arrayWithoutHoles(b){if(Array.isArray(b)){for(var c=0,e=Array(b.length);c<b.length;c++)e[c]=b[c];return e}}var fuckMD=function(j){"use strict";function m(b,e){if(!b)return{type:"add",prevNode:b,nextNode:e};if(!e)return{type:"del",prevNode:b,nextNode:e};if(b.type!==e.type)return{type:"replace",prevNode:b,nextNode:e};var f={type:"update",prevNode:b,nextNode:e,propsChange:[],children:[]},c=l(b,e);if(c.length){var d;(d=f.propsChange).push.apply(d,_toConsumableArray(c))}return(f.children=k(b,e).filter(function(b){return b}),0<f.propsChange.length+f.children.length)?f:(e.__htmlNode=b.__htmlNode,e.__update=b.__update,f)}function k(f,g){var h=f.children,i=void 0===h?[]:h,b=g.children,a=void 0===b?[]:b,c=[],j=[],d=i.filter(function(b){return!!a.some(function(c){return c.type===b.type})||(c.push(m(b,null)),!1)});a.forEach(function(e){d.some(function(a,b){return a.type===e.type&&(d[b]={isDel:!0,ele:a},!0)})}),d.filter(function(b){return!b.isDel}).forEach(function(b){return c.push(m(b,null))});var k=d.filter(function(b){return b.isDel}).map(function(b){return b.ele});return a.forEach(function(g,d){var a=k.some(function(c,e){if(c.type===g.type){k.splice(e,1),k.splice(d>e?d-1:d,0,{used:!0,ele:c}),e!==d&&j.push({type:"move",prevNode:c,nextNode:g,current:e,moveTo:d>e?d+1:d});var b=m(c,g);return j.push(b),!0}return!1});if(!a){k.splice(d,0,{add:!0,item:g});var c=m(null,g);j.push(_objectSpread({},c,{moveTo:d}))}}),c.concat(j,[],[])}function l(){var e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{},f=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},g=Object.keys(e),d=Object.keys(f),a=[];return g.forEach(function(b){return["__htmlNode","__parent","__update","children","type"].includes(b)?void 0:d.includes(b)?void(e[b]!==f[b]&&a.push({type:"change",key:b,prevNode:e,nextNode:f})):void a.push({type:"del",key:b,prevNode:e,nextNode:f})}),d.forEach(function(b){g.includes(b)||a.push({type:"add",key:b,prevNode:e,nextNode:f})}),a}function n(){for(var b,d=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"",g=1<arguments.length&&void 0!==arguments[1]?arguments[1]:"[",c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:"]",e=0,k=-1,l=0,m=function(b){return d.slice(e,e+b.length)===b};e<d.length;){if(b=d[e],!l)if(!b.trim()){e+=1;continue}else if(m(g)){k=e,l+=1,e+=g.length;continue}else return[void 0,d];if(m(c)?(l-=1,e+=c.length):m(g)?(l+=1,e+=g.length):e+=1,!l)return[d.slice(k+g.length,e-c.length),d.slice(e)]}return[void 0,d]}function o(){var d=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"",a=1<arguments.length&&void 0!==arguments[1]?arguments[1]:"",b=d.indexOf(a);return[d.slice(0,b),d.slice(b+a.length)]}function q(){function r(b,c){var d=2<arguments.length&&void 0!==arguments[2]?arguments[2]:{},e=d.isPush,f=u;u=b,b.__parent=u,c&&c(),u=f,(void 0===e||e)&&u.children.push(b)}function j(){var b=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"";i=i.slice(b.length)}function e(b){return[T.head,T.ul,T.code,T.queto].some(function(c){return c.test(b)})}function a(){function b(){var d=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"",a=1<arguments.length&&void 0!==arguments[1]?arguments[1]:0,b=d.split("\n")[a].trim();return /^\|.+\|$/.test(b)?b.split("|").slice(1,-1):[]}var c=b(i,0),f=b(i,1),d=c.length;if(0!=d&&c.length==f.length&&f.every(function(b){return /^-+$/.test(b.replace(/\s/g,""))}))return r({type:"table",children:[]},function(){i=i.replace(/(.+)\n?/,function(c,a){return r({type:"thead",children:[]},function(){r({type:"tr",children:[]},function(){a.trim().split("|").slice(1,-1).map(function(a){r({type:"th",children:[]},function(){g(a)})})})}),""}),i=i.replace(/.+\n?/,""),r({type:"tbody",children:[]},function(){for(var a,c=function a(){var a=(i.match(/^.+\n?/)||[])[0];return a?e(a)?"break":void(i=i.replace(a,""),r({type:"tr",children:[]},function(){var b,f=a.trim().split("|");f=f[0]?f.slice(0,d):f.slice(1).slice(0,d),(b=f).push.apply(b,_toConsumableArray(Array(d-f.length).fill(""))),f.forEach(function(a){r({type:"td",children:[]},function(){g(a)})})})):"break"};a=c(),"break"!==a;);})}),!0}function g(){var a=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"";if(a){if(T.url.test(a))return void g(a.replace(T.url,function(a,b,c){return r({type:"a",href:c,value:b,children:[]},function(){g(b)}),""}));if(T.blod.test(a))return void g(a.replace(T.blod,function(c,a){return r({type:"b",children:[]},function(){g(a)}),""}));if(T.italic.test(a))return void g(a.replace(T.italic,function(c,a){return r({type:"i",children:[]},function(){g(a)}),""}));if(T.inlineCode.test(a))return void g(a.replace(T.inlineCode,function(c,a){return a&&r({type:"inlineCode",children:[]},function(){g(a)}),""}));if(T.video.test(a))return void g(a.replace(T.video,function(d,a,b){return u.children.push({type:"video",src:b,alt:a}),""}));if(T.audio.test(a))return a=a.replace(T.audio,function(d,a,b){return u.children.push({type:"audio",src:b,alt:a}),""}),void g(a);if(T.img.test(a))return void g(a.replace(T.img,function(d,a,b){return u.children.push({type:"img",src:b,alt:a}),""}));if("\n"==a[0])return u.children.push({type:"br"}),void g(a.slice(1));var b=u.children[u.children.length-1];b&&"text"===b.type?b.value+=a[0]:u.children.push({type:"text",value:h(a[0])}),g(a.slice(1))}}function h(b){return b.replace(/>/g,">").replace(/\\#/g,"#").replace(/\\`/g,"`").replace(/\\-/g,"-").replace(/\\\*/g,"*")}function c(){function i(){var a=Math.floor,g=0<arguments.length&&void 0!==arguments[0]?arguments[0]:-1;if(f){var j=(f.match(/.+\n?/)||[])[0],c=j.match(/\s*/)[0],e=a(c.length/5);if(/^[-+]\s+/.test(j.trim())){var d="+"==j.match(/\s*[-+]/)[0].trim();if(e==g+1){var k={type:"ul",listStyleType:d?"decimal":b[e%b.length],children:[]};return r(k,function(){i(g+1)}),void i(g)}if(e==g)return r({type:"li",children:[]},function(){g(j.replace(/\s*[-+]\s*/,""))}),f=f.slice(j.length),void i(g);if(e<g)return}var l=u.children[u.children.length-1];r(l,function(){g(j)},{isPush:!1}),f=f.slice(j.length),i(g)}}var f=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"";f="".concat(f,"\n");var b=["disc","circle","square"];i()}function f(){if(!/^\n{1,2}$/.test(i)&&i){if(/Reg.br/.test(i)){var b=i.match(T.br),d=_slicedToArray(b,1),e=d[0];return u.children.push({type:"br"}),j(e),void f()}if(T.head.test(i)){var p=i.match(T.head)||[],h=_slicedToArray(p,3),k=h[0],l=h[1],m=h[2],E={type:"h".concat(l.length),children:[]};return r(E,function(){g(m)}),j(k),void f()}if(T.queto.test(i)){var U=i.match(T.queto),V=_slicedToArray(U,2),W=V[0],s=V[1],t=n(s,"[","]"),v=_slicedToArray(t,2),w=v[0],x=v[1],y={type:"queto",tag:w,children:[]},z=q(x.replace(/^\s*\n/,""));return y.children=z.children,u.children.push(y),u.children.push({type:"br"}),j(W),void f()}if(T.code.test(i)){var A=i.match(T.code),B=_slicedToArray(A,2),C=B[0],D=B[1],X=o(D,"\n").map(function(b){return b.trim()}),F=_slicedToArray(X,2),G=F[0],H=F[1];return u.children.push({type:"code",language:G,value:H}),j(C),void f()}if(T.ul.test(i)){var I=i.match(T.ul),J=_slicedToArray(I,2),K=J[0],L=J[1];return r(u,function(){c(L)},{isPush:!1}),u.children.push({type:"br"}),j(K),void f()}if(i.match(/.+\n/)&&/\|.+\|/.test(i.match(/.+\n/)[0].trim())&&a(i))return void f();if(T.hr.test(i)){var M=i.match(T.hr)||[],N=_slicedToArray(M,1),O=N[0];return void 0!==O&&u.children.push({type:"hr",children:[]}),j(O),void f()}if(T.text.test(i)){var P=i.match(T.text)||[""],Q=_slicedToArray(P,1),R=Q[0];return g(R),j(R),void f()}throw new Error("cannot handle str:".concat(i))}}var i=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"";i+="\n\n";var u={children:[],type:"root"};return f(),u}function p(b,c){return c&&c.parentElement&&c.parentElement.insertBefore(b,c),b}function r(a){var d=1<arguments.length&&void 0!==arguments[1]?arguments[1]:document.body;if(a){var c=a.nextNode;switch(a.type){case"del":{var e=a.prevNode.__htmlNode;e.parentElement||console.log("delete error::",a),e.parentElement.removeChild(e);break}case"add":{s(c,d,{beforeAppend:function(e){var b=d.childNodes[a.moveTo];if(b)return p(e,b),!0}});break}case"replace":{var f=a.prevNode.__htmlNode,g=document.createDocumentFragment();s(c,g),f.parentElement.replaceChild(g,f);break}case"move":{var b=a.moveTo,n=a.prevNode,h=n.__htmlNode.parentElement;h.childNodes[b]!==n.__htmlNode&&(h.childNodes[b]?p(n.__htmlNode,h.childNodes[b]):h.appendChild(n.__htmlNode));break}case"update":{var i=a.propsChange,k=a.children,o=a.prevNode,j=a.nextNode,l=o.__htmlNode;j.__htmlNode=l,o.__update&&(j.__update=o.__update),i.forEach(function(d){var a=d.key;switch(d.type){case"change":case"add":{var b=j[a];if(o.__update){o.__update(a,j);break}if(l instanceof Text){l.data=b;break}l.setAttribute(a,b);break}case"del":{l.removeAttribute(a);break}}}),k.forEach(function(b){return r(b,l)});break}default:console.error("canot handle type",a,a.type);}}}function u(b){var d=1<arguments.length&&void 0!==arguments[1]?arguments[1]:"";return"text"===b.type&&(d+=b.value||""),b.children&&b.children.forEach(function(b){d+=u(b)}),d}function s(a,d){var e,j=2<arguments.length&&void 0!==arguments[2]?arguments[2]:{};switch(a.type){case"audio":case"video":{if(/^<iframe(\s*.+)*><\/iframe>$/.test(a.src.trim())){e=document.createElement("div"),e.className="audio",e.innerHTML=a.src.replace("http://","//");var p=e.querySelector("iframe");p.style.cssText+=";max-width: 100%; max-height: 60vw; overflow: hidden;"}else e=document.createElement(a.type),e.src=a.src,e.alt=a.alt,e.controls="true";break}case"img":{var f=a.src.match(/\.(\d+)x(\d+)\./);if(f){var b=f.slice(1,3),g=_slicedToArray(b,2),h=g[0],k=g[1],q=a.src;e=document.createElement("div"),e.style.cssText=";position: relative; max-width: ".concat(h,"px; overflow: hidden; background: rgb(219, 221, 215);"),e.innerHTML="<div style=\"padding-top: ".concat(100*(k/h),"%;\">\n                            <img ").concat(LY.lazyLoad.caches.includes(q)?"src=\"".concat(q,"\" data-img-cache=\"true\""):"","\n                                class=\"lazy-load-img img-loading\"\n                                data-lazy-img=\"").concat(a.src,"\"\n                                style=\"position: absolute; width: 100%; height: 100%; top: 0;\" />\n                        </div>");break}else{e=document.createElement(a.type),e.src=a.src,e.alt=a.alt;break}}case"text":{var r=a.value;e=document.createTextNode(r);break}case"br":{e=document.createElement(a.type);break}case"a":{e=document.createElement(a.type),e.href=a.href,e.target="_blank";break}case"code":{e=document.createElement("pre");var i=document.createElement("code");a.__update=function(b,c){switch(b){case"language":{i.className=["highlight",c[b]||""].join(" ");break}case"value":{i.textContent=c[b];break}default:}},a.__update("language",a),a.__update("value",a),e.appendChild(i);break}case"inlineCode":{e=document.createElement("code"),e.className="inlineCode";break}case"h1":{e=document.createElement(a.type);var l=document.createElement("a"),m=u(a);l.href="#".concat(m),l.id=m,e.appendChild(l);break}case"ul":{e=document.createElement(a.type),a.__update=function(b,c){e.style.cssText+=";list-style-type:".concat(c[b],";")},a.__update("listStyleType",a);break}default:e=document.createElement(a.type),a.indent&&(e.style.cssText+=";padding-left: 2em;"),"table"==a.type&&e.setAttribute("border","1");}a.tag&&e.setAttribute("tag",a.tag),a.children&&a.children.forEach(function(a){return s(a,e)});var n=j.beforeAppend&&j.beforeAppend(e);return n||d.appendChild(e),a.__htmlNode=e,e}function c(b){function d(b){"text"==b.type&&(e+=b.value||""),"img"==b.type&&g.push(b.src),b.children&&b.children.forEach(d)}var e="",g=[];return d(b),{text:e,imgs:g}}function a(){var d=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"",a=h[d];if(!a){var f=q(d);a=_objectSpread({root:f},c(f)),h[d]=a}return a}function d(b){return new Promise(function(c){if(v[b])return c();var d=function(){v[b]=!0,c()};if(b.endsWith(".js")){var e=document.createElement("script");e.onload=d,e.src=b,document.head.appendChild(e)}else if(b.endsWith(".css")){var f=document.createElement("link");f.onload=d,f.type="text/css",f.rel="stylesheet",f.charset="utf-8",f.href=b,document.head.appendChild(f)}})}function t(b,c){Promise.all(c.asset.map(d)).then(function(){window.hljs&&b&&(window.hljs.configure({tabReplace:4}),_toConsumableArray(b.querySelectorAll("code.highlight")).forEach(function(b){window.hljs.highlightBlock(b)}))})}function g(b){return _objectSpread({asset:[]},b)}var T={get hr(){return /(^-{3,}[^\n]+\n?)/},get code(){return /^`{3}(((?!```)[\s\S])*)`{3}/},get queto(){return /^>(((?!\n\n)[\s\S])*)\n\n/},get head(){return /^\s*(#{1,6})([^\n]*)\n?/},get ul(){return /^([-+]\s+((?!\n\n)[\s\S])*)\n\n/},get url(){return /^\[([^\]]+)\]\(([^)]+)\)/},get inlineCode(){return /^`([^`]*)`/},get br(){return /^\n/},get text(){return /^[^\n]*\n?/},get blod(){return /^\*{3}(((?!\*{3}).)*)\*{3}/},get italic(){return /^\*{2}(((?!\*{2}).)*)\*{2}/},get video(){return /^!{3}\[([^\]]*)\]\(([^)]+)\)/},get audio(){return /^!{2}\[([^\]]*)\]\(([^)]+)\)/},get img(){return /^!\[([^\]]*)\]\(([^)]+)\)/}},h={},v={},e=function(){function d(a,b){_classCallCheck(this,d),this.dom=a,this.config=b,this.prevRoot=null}return _createClass(d,[{key:"update",value:function(c){this.dom.classList.add("markdown");var d=a(c),e=m(this.prevRoot,d.root);this.prevRoot=d.root,r(e,this.dom);var b=g(this.config);b.useHighlight&&t(this.dom,b)}}]),d}();return j.Markdown=e,j.parser=q,j.trans=s,j.codeHighlight=t,j.getParseResult=a,j.markdown=function(d,e,b){d.innerHTML="",d.classList.add("markdown");var f=a(e);s(f.root,d),b=g(b),t(d,b)},j.markdownInfo=function(f){var b=a(f),c=b.root,d=_objectWithoutProperties(b,["root"]);return d},j}({});