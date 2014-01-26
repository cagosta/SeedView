/**
 * SeedHq version: "0.0.16" Copyright (c) 2011-2012, Cyril Agosta ( cyril.agosta.dev@gmail.com) All Rights Reserved.
 * Available via the MIT license.
 * see: http://github.com/cagosta/SeedHq for details
 */

/**
 * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/domReady for details
 */

//  Underscore.string
//  (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
//  Underscore.string is freely distributable under the terms of the MIT license.
//  Documentation: https://github.com/epeli/underscore.string
//  Some code is borrowed from MooTools and Alexandru Marasteanu.
//  Version '2.3.2'

// Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>

/**
 * String.nocomplex version: "0.0.9" Copyright (c) 2011-2012, Cyril Agosta ( cyril.agosta.dev@gmail.com) All Rights Reserved.
 * Available via the MIT license.
 * see: http://github.com/cagosta/String.nocomplex for details
 */

/**
 * toDOM version: "0.0.7" Copyright (c) 2011-2012, Cyril Agosta ( cyril.agosta.dev@gmail.com) All Rights Reserved.
 * Available via the MIT license.
 * see: http://github.com/cagosta/toDOM for details
 */

/**
 * SeedView version: "0.0.18" Copyright (c) 2011-2012, Cyril Agosta ( cyril.agosta.dev@gmail.com) All Rights Reserved.
 * Available via the MIT license.
 * see: http://github.com/cagosta/SeedView for details
 */

define("Seed/helpers",[],function(){return Function.prototype.bind||(Function.prototype.bind=function(e){var t=this;return function(){return t.apply(e,arguments)}}),{capitalize:function(e){return e.charAt(0).toUpperCase()+e.slice(1)},remove:function(e,t){for(var n=e.length;n--;)e[n]===t&&e.splice(n,1);return e},clone:function(e){var t={};for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);return t},extend:function(e){for(var t=1,n=arguments.length;n>t;t++){var r="object"==typeof arguments[t]||"function"==typeof arguments[t]?arguments[t]:{};for(var i in r)r.hasOwnProperty(i)&&(e[i]=r[i])}return e},find:function(e,t){for(var n=0,r=e.length;r>n;n++)if(t(e[n],n))return e[n];return!1}}}),define("Seed/extendHooker",["./helpers"],function(e){var t=function(){};return t.prototype={getHooks:function(){},hookify:function(t){var n=t.__hooks=[];t.registerHook=function(e){t.__hooks.push(e)},t.hasHook=function(t){return"s"==typeof t?!!e.find(n,function(e){return e.id===t}):!!e.find(n,function(e){return e===t})},t.unregisterHook=function(t){return e.remove(n,t)}}},new t}),define("Seed/extendHooks/plusMinusExtendHook",["../helpers"],function(e){var t=function(t,n){return"undefined"==typeof n?t:"object"==typeof n&&"object"==typeof t?e.extend({},t,n):n},n=function(e,n){return"function"==typeof e||"function"==typeof n?function(){var r="function"==typeof e?e.apply(this,arguments):e,i="function"==typeof n?n.apply(this,arguments):n;return t(r,i)}:t(e,n)};return{name:"plusMinus",handle:function(e,t){var r=e,i=function(){};for(var o in t)if(t.hasOwnProperty(o)){var s=/(^\+|^-)(.*)/g;if(s.test(o)){var a=o.replace(s,"$2"),u=e[a]||i,c=t[o];switch(o.charAt(0)){case"+":r[a]=n(u,c);break;case"-":r[a]=n(c,u)}delete e[o]}else r[o]=t[o]}return r}}}),define("Seed/extendHooks/accessors/TypeChecker",[],function(){Array.isArray=Array.isArray||function(e){return"[object Array]"==Object.prototype.toString.call(e)},Function.prototype.bind||(Function.prototype.bind=function(e){var t=this;return function(){return t.apply(e,arguments)}});var e=function(){this.is=this.is.bind(this)};return e.prototype={is:function(e,t){return null!==t&&"undefined"!=typeof t&&"function"==typeof t.isTypeOf?t.isTypeOf(e):this[e]?this[e](t)||!1:typeof t===e.toLowerCase()},Truthy:function(e){return!!e},Falsy:function(e){return!!e},Array:function(e){return Array.isArray(e)},Point:function(e){return e&&e.isPoint},Valid:function(e){return"undefined"!=typeof e},defined:function(e){return"undefined"!=typeof e},PlainObject:function(e){var t=Object.prototype.hasOwnProperty,n=Object.prototype.toString;if(!e||"[object Object]"!==n.call(e)||e.nodeType||e.setInterval)return!1;if(e.constructor&&!t.call(e,"constructor")&&!t.call(e.constructor.prototype,"isPrototypeOf"))return!1;var r;for(r in e);return void 0===r||t.call(e,r)},isStructure:function(e,t){var n;if(!this.is("PlainObject",t))return n="TypeChecker: Object "+t+" is not a plain Object",!1;for(var r in e)if(e.hasOwnProperty(r)){var i=e[r];if(!r in t&&(n="TypeChecker: Key "+r+" is not in "+object),this.is("PlainObject",e[r]))return this.isStructure(e[r],t[r]);this.is(i,t[r])||(n="TypeChecker: Key "+r+" is not in "+object)}if(n)throw new Error(n);return!0},Profile:function(e){return this.isStructure({label:"String",id:"String"},e)},BenchmarkRawData:function(e){return this.isStructure({settings:"PlainObject",data:{W:"PlainObject",M:"PlainObject"}},e)}},e}),define("Seed/extendHooks/accessors/defaultTypeChecker",["./TypeChecker"],function(e){var t=new e;return t}),define("Seed/extendHooks/accessorsExtendHook",["./accessors/defaultTypeChecker","../helpers"],function(e,t){var n=function(e,t,n,r){this.id="accessors",this.accessorString=t,this.extendObj=n,this.typeChecker=r,this.typeChecker.is=this.typeChecker.is.bind(this.typeChecker),this.oldPrototype=e,this.create()};n.prototype={create:function(){var e,n=this.accessorString.charAt(0),r="-"===n,i="-"===n||"+"===n?this.accessorString.slice(1):this.accessorString,o=i.split("|"),s=o[1],a=o[0],u=t.capitalize(a),c=r?"_":"",l=c+"get"+u,f=c+"set"+u,h=c+a,p=(this.typeChecker,this);t.find(this.getExtendHookConfiguration().allAccessors,function(e){return e})||this.getExtendHookConfiguration().allAccessors.push(a),this.addMethod(l,function(){return this[h]}),s?this.addMethod(f,function(t){if(p.typeChecker.is(s,t))return this[h]=t,t;try{e=JSON.stringify(t)+" is not a "+s}catch(n){}throw new Error(e)}):this.addMethod(f,function(e){return this[h]=e,e})},getOldObj:function(){return this.oldPrototype},getExtendObj:function(){return this.extendObj},getExtendHookConfiguration:function(){return this.getOldObj().__extendHooks[this.id]},addMethod:function(e,t){this.extendObj[e]||(this.oldPrototype[e]=t)}};var r=function(){this.id="accessors",this.handle=this.handle.bind(this),this.typeChecker=e};return r.prototype={configure:function(e){e.typeChecker&&(this.typeChecker=e.typeChecker)},initializeHook:function(e,t){var n=[];t.__extendHooks=e.__extendHooks||{},t.__extendHooks[this.id]={id:this.id,allAccessors:n}},hasHook:function(e){return e&&e.__extendHooks&&e.__extendHooks[this.id]},handle:function(e,t){var r=t.accessors;if(this.hasHook(e)||this.initializeHook(e,t),!r)return e;for(var i=0;i<r.length;i++)new n(e,r[i],t,this.typeChecker);return e}},new r}),define("Seed/extendHooks/typeExtendHook",["../helpers"],function(){var e=function(){this.id="type",this.handle=this.handle.bind(this)},t=function(e){this.id="type",this.oldObj=e.oldObj,this.extendObj=e.extendObj,this.hasHook()||this.initializeHook(),this.handleExtendObjType()};return t.prototype={handleExtendObjType:function(){var e=this.getOldObj().getTypes().slice(),t=this.getExtendObj().type;this.getOldObj().types=e,"string"==typeof t&&-1===e.indexOf(t)&&this.getOldObj().types.push(t)},hasHook:function(){return this.getOldObj().__extendHooks&&this.oldObj.__extendHooks[this.id]},getHookConfigurationObject:function(){return this.getOldObj().__extendHooks[this.id]},getTypes:function(){return this.getOldObj().types},initializeHook:function(){this.getOldObj().__extendHooks||(this.getOldObj().__extendHooks={}),this.getOldObj().__extendHooks[this.id]={id:this.id},this.getOldObj().isTypeOf=function(e){return-1!==this.types.indexOf(e)},this.getOldObj().types=[],this.getOldObj().getTypes=function(){return this.types}},getOldObj:function(){return this.oldObj},getExtendObj:function(){return this.extendObj}},e.prototype={configure:function(){},handle:function(e,n){return new t({oldObj:e,extendObj:n}),e}},new e}),define("Seed/extendHookRegistrations",["./extendHooks/plusMinusExtendHook","./extendHooks/accessorsExtendHook","./extendHooks/typeExtendHook"],function(e,t,n){return[t,n,e]}),define("Seed/Extendable",["./helpers","./extendHooker","./extendHookRegistrations"],function(e,t,n){var r=function(){};r.prototype.constructor=function(){},t.hookify(r);for(var i=0;i<n.length;i++)r.registerHook(n[i]);return r["new"]=function(){},r.extend=function(t){var n=function(){("boolean"!=typeof arguments[0]||arguments[0]!==!1)&&n.prototype.constructor.apply(this,arguments)},i=e.clone(this);for(var o in i)i.hasOwnProperty(o)&&(n[o]=i[o]);for(var s=r.__hooks,a=e.extend(new this(!1),t),o=0;o<s.length;o++)a=s[o].handle(a,t);return n.prototype=a,n},r}),define("Seed/Eventable",["./Extendable","./helpers"],function(e,t){return e.extend({constructor:function(){this._events={},this._attached=[]},emit:function(e){var t=this._events[e];if(t)for(var n=Array.prototype.slice.call(arguments,1),r=t.length;r--;)t[r].fn.apply(t[r].subscriber,n)},fire:function(){this.emit.apply(this,arguments)},on:function(e,t,n){var r=e.split(" ");if("function"==typeof t){var i=n;n=t,t=i}if(1===r.length)return this._on(r[0],t,n);for(var o=[],s=0;s<r.length;s++)o[s].push(this._on(evtName,t,n));return{un:function(){for(var e=0;e<o.length;e++)o[e].un()}}},_on:function(e,n,r){if(n&&"function"!=typeof n.attach)throw new Error("The subscriber should have a attach(event) method");if("string"==typeof r?r=n[r]:"undefined"==typeof r&&(r=n["on"+t.capitalize(e)]),"function"!=typeof r)throw new Error("Cannot find the function to subscribe to "+e);var i=this,o={fn:r,subscriber:n},s={un:function(){i._rmSubscription(e,o)}};return(this._events[e]||(this._events[e]=[])).push(o),s},_rmSubscription:function(e,n){t.remove(this._events[e],n),0==this._events[e].length&&delete this._events[e]},attach:function(e){this._attached.push(e)},detachAll:function(){for(var e=0;e<this._attached.length;e++)this._attached[e].un();this._attached=[]}})}),define("Seed/SeedHq",["./Eventable","./helpers"],function(e,t){return e.extend({constructor:function(e){e=e||{},this._events=[],this._attached=[],this._subs=[],this._o=e,e._a&&(this._a=e._a),this.setOptions()},options:{},bindMethod:function(e){this[e]=this[e].bind(this)},setOptions:function(){var e;if(this.options)for(var n in this.options)this.options.hasOwnProperty(n)&&("undefined"==typeof this._o[n]?this[n]=this.options[n]:(e="set"+t.capitalize(n),"function"==typeof this[e]?this[e](this._o[n]):this[n]=this._o[n]))},sub:function(e,t){if("function"!=typeof e)throw new Error("C is not a valid constructor");var n=new e(this.subParams(t));return this._subs.push(n),n},subParams:function(e){return e||(e={}),e._parent=this,this._a&&(e._a=this._a),e},destroy:function(){this.detachAll();for(var e=0;e<this._subs.length;e++)this._subs[e].destroy()}})}),define("Seed/Seed",["./SeedHq"],function(e){return e}),define("mangrove-utils/dom/addEventListener",[],function(){return function(){return window.addEventListener?function(e,t,n,r){return e.addEventListener(t,n,!!r)}:function(e,t,n){return e.attachEvent("on"+t,function(e){var e=e||window.event;e.target=e.target||e.srcElement,e.relatedTarget=e.relatedTarget||e.fromElement||e.toElement,e.isImmediatePropagationStopped=e.isImmediatePropagationStopped||!1,e.preventDefault=e.preventDefault||function(){e.returnValue=!1},e.stopPropagation=e.stopPropagation||function(){e.cancelBubble=!0},e.stopImmediatePropagation=e.stopImmediatePropagation||function(){e.stopPropagation(),e.isImmediatePropagationStopped=!0},e.isImmediatePropagationStopped||n(e)})}}()}),define("mangrove-utils/dom/keyCodes",[],function(){return{backspace:8,tab:9,enter:13,shift:16,ctrl:17,alt:18,pauseBbreak:19,capsLock:20,escape:27,pageUp:33,pageDown:34,end:35,home:36,leftArrow:37,upArrow:38,rightArrow:39,downArrow:40,insert:45,"delete":46,0:48,1:49,2:50,3:51,4:52,5:53,6:54,7:55,8:56,9:57,a:65,b:66,c:67,d:68,e:69,f:70,g:71,h:72,i:73,j:74,k:75,l:76,m:77,n:78,o:79,p:80,q:81,r:82,s:83,t:84,u:85,v:86,w:87,x:88,y:89,z:90,leftWindowKey:91,rightWindowKey:92,selectKey:93,numpad0:96,numpad1:97,numpad2:98,numpad3:99,numpad4:100,numpad5:101,numpad6:102,numpad7:103,numpad8:104,numpad9:105,multiply:106,add:107,subtract:109,decimalPoint:110,divide:111,f1:112,f2:113,f3:114,f4:115,f5:116,f6:117,f7:118,f8:119,f9:120,f10:121,f11:122,f12:123,numLock:144,scrollLock:145,semiColon:186,equalSign:187,comma:188,dash:189,period:190,forwardSlash:191,graveAccent:192,openBracket:219,backSlash:220,closeBraket:221,singleQuote:222}}),define("mangrove-utils/dom/ready",[],function(){function e(e){var t;for(t=0;t<e.length;t+=1)e[t](c)}function t(){var t=l;u&&t.length&&(l=[],e(t))}function n(){u||(u=!0,s&&clearInterval(s),t())}function r(e){return u?e(c):l.push(e),r}var i,o,s,a="undefined"!=typeof window&&window.document,u=!a,c=a?document:null,l=[];if(a){if(document.addEventListener)document.addEventListener("DOMContentLoaded",n,!1),window.addEventListener("load",n,!1);else if(window.attachEvent){window.attachEvent("onload",n),o=document.createElement("div");try{i=null===window.frameElement}catch(f){}o.doScroll&&i&&window.external&&(s=setInterval(function(){try{o.doScroll(),n()}catch(e){}},30))}"complete"===document.readyState&&n()}return r.version="2.0.1",r.load=function(e,t,n,i){i.isBuild?n(null):r(n)},r}),define("mangrove-utils/dom/removeEventListener",[],function(){return function(){return window.removeEventListener?function(e,t,n,r){return e.removeEventListener(t,n,!!r)}:function(e,t,n){e.detachEvent(t,n)}}()}),define("mangrove-utils/dom/all",["./addEventListener","./keyCodes","./ready","./removeEventListener"],function(e,t,n,r){return{addEventListener:e,keyCodes:t,ready:n,removeEventListener:r}}),define("Array.nocomplex/isArray",[],function(){return Array.isArray=Array.isArray||function(e){return"[object Array]"==Object.prototype.toString.call(e)},Array.isArray}),!function(e,t){function n(e,t){var n,r,i=e.toLowerCase();for(t=[].concat(t),n=0;n<t.length;n+=1)if(r=t[n]){if(r.test&&r.test(e))return!0;if(r.toLowerCase()===i)return!0}}var r=t.prototype.trim,i=t.prototype.trimRight,o=t.prototype.trimLeft,s=function(e){return 1*e||0},a=function(e,t){if(1>t)return"";for(var n="";t>0;)1&t&&(n+=e),t>>=1,e+=e;return n},u=[].slice,c=function(e){return null==e?"\\s":e.source?e.source:"["+d.escapeRegExp(e)+"]"},l={lt:"<",gt:">",quot:'"',amp:"&",apos:"'"},f={};for(var h in l)f[l[h]]=h;f["'"]="#39";var p=function(){function e(e){return Object.prototype.toString.call(e).slice(8,-1).toLowerCase()}var n=a,r=function(){return r.cache.hasOwnProperty(arguments[0])||(r.cache[arguments[0]]=r.parse(arguments[0])),r.format.call(null,r.cache[arguments[0]],arguments)};return r.format=function(r,i){var o,s,a,u,c,l,f,h=1,d=r.length,m="",g=[];for(s=0;d>s;s++)if(m=e(r[s]),"string"===m)g.push(r[s]);else if("array"===m){if(u=r[s],u[2])for(o=i[h],a=0;a<u[2].length;a++){if(!o.hasOwnProperty(u[2][a]))throw new Error(p('[_.sprintf] property "%s" does not exist',u[2][a]));o=o[u[2][a]]}else o=u[1]?i[u[1]]:i[h++];if(/[^s]/.test(u[8])&&"number"!=e(o))throw new Error(p("[_.sprintf] expecting number but found %s",e(o)));switch(u[8]){case"b":o=o.toString(2);break;case"c":o=t.fromCharCode(o);break;case"d":o=parseInt(o,10);break;case"e":o=u[7]?o.toExponential(u[7]):o.toExponential();break;case"f":o=u[7]?parseFloat(o).toFixed(u[7]):parseFloat(o);break;case"o":o=o.toString(8);break;case"s":o=(o=t(o))&&u[7]?o.substring(0,u[7]):o;break;case"u":o=Math.abs(o);break;case"x":o=o.toString(16);break;case"X":o=o.toString(16).toUpperCase()}o=/[def]/.test(u[8])&&u[3]&&o>=0?"+"+o:o,l=u[4]?"0"==u[4]?"0":u[4].charAt(1):" ",f=u[6]-t(o).length,c=u[6]?n(l,f):"",g.push(u[5]?o+c:c+o)}return g.join("")},r.cache={},r.parse=function(e){for(var t=e,n=[],r=[],i=0;t;){if(null!==(n=/^[^\x25]+/.exec(t)))r.push(n[0]);else if(null!==(n=/^\x25{2}/.exec(t)))r.push("%");else{if(null===(n=/^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(t)))throw new Error("[_.sprintf] huh?");if(n[2]){i|=1;var o=[],s=n[2],a=[];if(null===(a=/^([a-z_][a-z_\d]*)/i.exec(s)))throw new Error("[_.sprintf] huh?");for(o.push(a[1]);""!==(s=s.substring(a[0].length));)if(null!==(a=/^\.([a-z_][a-z_\d]*)/i.exec(s)))o.push(a[1]);else{if(null===(a=/^\[(\d+)\]/.exec(s)))throw new Error("[_.sprintf] huh?");o.push(a[1])}n[2]=o}else i|=2;if(3===i)throw new Error("[_.sprintf] mixing positional and named placeholders is not (yet) supported");r.push(n)}t=t.substring(n[0].length)}return r},r}(),d={VERSION:"2.3.0",isBlank:function(e){return null==e&&(e=""),/^\s*$/.test(e)},stripTags:function(e){return null==e?"":t(e).replace(/<\/?[^>]+>/g,"")},capitalize:function(e){return e=null==e?"":t(e),e.charAt(0).toUpperCase()+e.slice(1)},chop:function(e,n){return null==e?[]:(e=t(e),n=~~n,n>0?e.match(new RegExp(".{1,"+n+"}","g")):[e])},clean:function(e){return d.strip(e).replace(/\s+/g," ")},count:function(e,n){if(null==e||null==n)return 0;e=t(e),n=t(n);for(var r=0,i=0,o=n.length;;){if(i=e.indexOf(n,i),-1===i)break;r++,i+=o}return r},chars:function(e){return null==e?[]:t(e).split("")},swapCase:function(e){return null==e?"":t(e).replace(/\S/g,function(e){return e===e.toUpperCase()?e.toLowerCase():e.toUpperCase()})},escapeHTML:function(e){return null==e?"":t(e).replace(/[&<>"']/g,function(e){return"&"+f[e]+";"})},unescapeHTML:function(e){return null==e?"":t(e).replace(/\&([^;]+);/g,function(e,n){var r;return n in l?l[n]:(r=n.match(/^#x([\da-fA-F]+)$/))?t.fromCharCode(parseInt(r[1],16)):(r=n.match(/^#(\d+)$/))?t.fromCharCode(~~r[1]):e})},escapeRegExp:function(e){return null==e?"":t(e).replace(/([.*+?^=!:${}()|[\]\/\\])/g,"\\$1")},splice:function(e,t,n,r){var i=d.chars(e);return i.splice(~~t,~~n,r),i.join("")},insert:function(e,t,n){return d.splice(e,t,0,n)},include:function(e,n){return""===n?!0:null==e?!1:-1!==t(e).indexOf(n)},join:function(){var e=u.call(arguments),t=e.shift();return null==t&&(t=""),e.join(t)},lines:function(e){return null==e?[]:t(e).split("\n")},reverse:function(e){return d.chars(e).reverse().join("")},startsWith:function(e,n){return""===n?!0:null==e||null==n?!1:(e=t(e),n=t(n),e.length>=n.length&&e.slice(0,n.length)===n)},endsWith:function(e,n){return""===n?!0:null==e||null==n?!1:(e=t(e),n=t(n),e.length>=n.length&&e.slice(e.length-n.length)===n)},succ:function(e){return null==e?"":(e=t(e),e.slice(0,-1)+t.fromCharCode(e.charCodeAt(e.length-1)+1))},titleize:function(e){return null==e?"":(e=t(e).toLowerCase(),e.replace(/(?:^|\s|-)\S/g,function(e){return e.toUpperCase()}))},camelize:function(e){return d.trim(e).replace(/[-_\s]+(.)?/g,function(e,t){return t?t.toUpperCase():""})},underscored:function(e){return d.trim(e).replace(/([a-z\d])([A-Z]+)/g,"$1_$2").replace(/[-\s]+/g,"_").toLowerCase()},dasherize:function(e){return d.trim(e).replace(/([A-Z])/g,"-$1").replace(/[-_\s]+/g,"-").toLowerCase()},classify:function(e){return d.titleize(t(e).replace(/[\W_]/g," ")).replace(/\s/g,"")},humanize:function(e){return d.capitalize(d.underscored(e).replace(/_id$/,"").replace(/_/g," "))},trim:function(e,n){return null==e?"":!n&&r?r.call(e):(n=c(n),t(e).replace(new RegExp("^"+n+"+|"+n+"+$","g"),""))},ltrim:function(e,n){return null==e?"":!n&&o?o.call(e):(n=c(n),t(e).replace(new RegExp("^"+n+"+"),""))},rtrim:function(e,n){return null==e?"":!n&&i?i.call(e):(n=c(n),t(e).replace(new RegExp(n+"+$"),""))},truncate:function(e,n,r){return null==e?"":(e=t(e),r=r||"...",n=~~n,e.length>n?e.slice(0,n)+r:e)},prune:function(e,n,r){if(null==e)return"";if(e=t(e),n=~~n,r=null!=r?t(r):"...",e.length<=n)return e;var i=function(e){return e.toUpperCase()!==e.toLowerCase()?"A":" "},o=e.slice(0,n+1).replace(/.(?=\W*\w*$)/g,i);return o=o.slice(o.length-2).match(/\w\w/)?o.replace(/\s*\S+$/,""):d.rtrim(o.slice(0,o.length-1)),(o+r).length>e.length?e:e.slice(0,o.length)+r},words:function(e,t){return d.isBlank(e)?[]:d.trim(e,t).split(t||/\s+/)},pad:function(e,n,r,i){e=null==e?"":t(e),n=~~n;var o=0;switch(r?r.length>1&&(r=r.charAt(0)):r=" ",i){case"right":return o=n-e.length,e+a(r,o);case"both":return o=n-e.length,a(r,Math.ceil(o/2))+e+a(r,Math.floor(o/2));default:return o=n-e.length,a(r,o)+e}},lpad:function(e,t,n){return d.pad(e,t,n)},rpad:function(e,t,n){return d.pad(e,t,n,"right")},lrpad:function(e,t,n){return d.pad(e,t,n,"both")},sprintf:p,vsprintf:function(e,t){return t.unshift(e),p.apply(null,t)},toNumber:function(e,t){return e?(e=d.trim(e),e.match(/^-?\d+(?:\.\d+)?$/)?s(s(e).toFixed(~~t)):0/0):0},numberFormat:function(e,t,n,r){if(isNaN(e)||null==e)return"";e=e.toFixed(~~t),r="string"==typeof r?r:",";var i=e.split("."),o=i[0],s=i[1]?(n||".")+i[1]:"";return o.replace(/(\d)(?=(?:\d{3})+$)/g,"$1"+r)+s},strRight:function(e,n){if(null==e)return"";e=t(e),n=null!=n?t(n):n;var r=n?e.indexOf(n):-1;return~r?e.slice(r+n.length,e.length):e},strRightBack:function(e,n){if(null==e)return"";e=t(e),n=null!=n?t(n):n;var r=n?e.lastIndexOf(n):-1;return~r?e.slice(r+n.length,e.length):e},strLeft:function(e,n){if(null==e)return"";e=t(e),n=null!=n?t(n):n;var r=n?e.indexOf(n):-1;return~r?e.slice(0,r):e},strLeftBack:function(e,t){if(null==e)return"";e+="",t=null!=t?""+t:t;var n=e.lastIndexOf(t);return~n?e.slice(0,n):e},toSentence:function(e,t,n,r){t=t||", ",n=n||" and ";var i=e.slice(),o=i.pop();return e.length>2&&r&&(n=d.rtrim(t)+n),i.length?i.join(t)+n+o:o},toSentenceSerial:function(){var e=u.call(arguments);return e[3]=!0,d.toSentence.apply(d,e)},slugify:function(e){if(null==e)return"";var n="ąàáäâãåæăćęèéëêìíïîłńòóöôõøśșțùúüûñçżź",r="aaaaaaaaaceeeeeiiiilnoooooosstuuuunczz",i=new RegExp(c(n),"g");return e=t(e).toLowerCase().replace(i,function(e){var t=n.indexOf(e);return r.charAt(t)||"-"}),d.dasherize(e.replace(/[^\w\s-]/g,""))},surround:function(e,t){return[t,e,t].join("")},quote:function(e,t){return d.surround(e,t||'"')},unquote:function(e,t){return t=t||'"',e[0]===t&&e[e.length-1]===t?e.slice(1,e.length-1):e},exports:function(){var e={};for(var t in this)this.hasOwnProperty(t)&&!t.match(/^(?:include|contains|reverse)$/)&&(e[t]=this[t]);return e},repeat:function(e,n,r){if(null==e)return"";if(n=~~n,null==r)return a(t(e),n);for(var i=[];n>0;i[--n]=e);return i.join(r)},naturalCmp:function(e,n){if(e==n)return 0;if(!e)return-1;if(!n)return 1;for(var r=/(\.\d+)|(\d+)|(\D+)/g,i=t(e).toLowerCase().match(r),o=t(n).toLowerCase().match(r),s=Math.min(i.length,o.length),a=0;s>a;a++){var u=i[a],c=o[a];if(u!==c){var l=parseInt(u,10);if(!isNaN(l)){var f=parseInt(c,10);if(!isNaN(f)&&l-f)return l-f}return c>u?-1:1}}return i.length===o.length?i.length-o.length:n>e?-1:1},levenshtein:function(e,n){if(null==e&&null==n)return 0;if(null==e)return t(n).length;if(null==n)return t(e).length;e=t(e),n=t(n);for(var r,i,o=[],s=0;s<=n.length;s++)for(var a=0;a<=e.length;a++)i=s&&a?e.charAt(a-1)===n.charAt(s-1)?r:Math.min(o[a],o[a-1],r)+1:s+a,r=o[a],o[a]=i;return o.pop()},toBoolean:function(e,t,r){return"number"==typeof e&&(e=""+e),"string"!=typeof e?!!e:(e=d.trim(e),n(e,t||["true","1"])?!0:n(e,r||["false","0"])?!1:void 0)}};d.strip=d.trim,d.lstrip=d.ltrim,d.rstrip=d.rtrim,d.center=d.lrpad,d.rjust=d.lpad,d.ljust=d.rpad,d.contains=d.include,d.q=d.quote,d.toBool=d.toBoolean,"undefined"!=typeof exports&&("undefined"!=typeof module&&module.exports&&(module.exports=d),exports._s=d),"function"==typeof define&&define.amd&&define("underscore.string",[],function(){return d}),e._=e._||{},e._.string=e._.str=d}(this,String),define("String.nocomplex/uncapitalize",[],function(){String.prototype.uncapitalize=function(){return this[0].toLowerCase()+this.substr(1,this.length-1)}}),define("String.nocomplex/String.nocomplex",["underscore.string","./uncapitalize"],function(e){var t=Array.prototype.slice,n=function(n){String.prototype[n]=function(){var r=t.call(arguments);return r.unshift(this),e[n].apply(this,r)}};for(var r in e)e.hasOwnProperty(r)&&n(r);return String.prototype}),define("Array.nocomplex/collect",[],function(){Array.prototype.collect=function(e){var t=[];if("string"==typeof e)for(var n=-1,r=this.length;++n<r;)t.push(this[n][e]);else for(var n=-1,r=this.length;++n<r;)t.push(e(this[n]));return t}}),define("Array.nocomplex/each",[],function(){Array.prototype.each=function(e){for(var t=0,n=this.length;n>t;t++)e(this[t],t);return this}}),define("Array.nocomplex/first",[],function(){Array.prototype.first=function(e){for(var t=0,n=this.length;n>t;t++)if(e(this[t]))return this[t];return null}}),define("Array.nocomplex/has",[],function(){Array.prototype.has=function(e){for(var t=this.length;t--;)if(this[t]===e)return!0;return!1}}),define("Array.nocomplex/last",[],function(){Array.prototype.last=function(){return this[this.length-1]}}),define("Array.nocomplex/map",[],function(){Array.prototype.map=Array.prototype.map||function(e,t){t&&(e=e.bind(t));var n=this.slice();if("function"==typeof e)for(var r=0,i=n.length;i>r;r++)n[r]=e(n[r],r);else{e=e.substr(2,e.length);for(var r=0,i=n.length;i>r;r++)n[r]=n[r][e]()}return n}}),define("Array.nocomplex/onEls",[],function(){Array.prototype.onEls=function(e){for(var t=this.length;t--;)this[t]=e(this[t],t);return this}}),define("Array.nocomplex/remove",[],function(){Array.prototype.remove=function(e){for(var t=this.length;t--;)this[t]===e&&this.splice(t,1);return this}}),define("Array.nocomplex/removeOneValue",[],function(){Array.prototype.removeOneValue=function(e){for(var t=this.length;t--;)if(this[t]===e)return this.splice(t,1)}}),define("Array.nocomplex/except",[],function(){Array.prototype.except=function(e){for(var t=[],n=0,r=this.length;r>n;n++)this[n]!==e&&t.push(this[n]);return t}}),define("Array.nocomplex/exceptFn",[],function(){Array.prototype.exceptFn=function(e){for(var t=this.slice(),n=t.length;n--;)e(t[n])&&t.splice(n,1);return t}}),define("Array.nocomplex/indexOf",[],function(){Array.prototype.indexOf=Array.prototype.indexOf||function(e){var t,n;for(t=0,n=this.length;n>t;t++)if(this[t]===e)return t;return-1}}),define("Array.nocomplex/isIn",["./has"],function(){Array.prototype.isIn=function(e){for(var t=this.length;t--;)if(!e.has(this[t]))return!1;return!0}}),define("Array.nocomplex/send",[],function(){Array.prototype.send=function(e){var t=Array.prototype.slice.call(arguments);if(t.splice(0,1),"string"==typeof e)for(var n=-1,r=this.length;++n<r;)this[n]&&this[n][e].apply(this[n],t);else for(var n=-1,r=this.length;++n<r;)e.apply({},[this[n]].concat(t));return this}}),define("Array.nocomplex/uniq",["./has"],function(){Array.prototype.uniq=function(e){if(e){for(var t=[],n=[],r=0,i=this.length;i>r;r++){var o=e(this[r]);n.has(o)||(t.push(this[r]),n.push(o))}return t}for(var t=[],r=this.length;r--;)!t.has(this[r])&&t.push(this[r]);return t}}),define("Array.nocomplex/equals",["./isIn"],function(){Array.prototype.equals=function(e){return this.isIn(e)&&e.isIn(this)?!0:!1}}),define("Array.nocomplex/find",[],function(){Array.prototype.find=function(e){for(var t=0,n=this.length;n>t;t++)if(e(this[t],t))return this[t];return!1},Array.prototype.findReverse=function(e){for(var t=this.length;t--;)if(e(this[t],t))return this[t];return!1}}),define("Array.nocomplex/where",[],function(){Array.prototype.where=function(e){for(var t=[],n=0,r=this.length;r>n;n++)e(this[n])&&t.push(this[n]);return t}}),define("Array.nocomplex/findIndexOf",[],function(){Array.prototype.findIndexOf=function(e){for(var t=0,n=this.length;n>t;t++)if(e(this[t],t))return t;return!1}}),define("Array.nocomplex/findByKey",[],function(){Array.prototype.findByKey=function(e,t){for(var n=0,r=this.length;r>n;n++)if(this[n][e]===t)return this[n];return!1}}),define("Array.nocomplex/basics",["./collect","./each","./first","./has","./last","./map","./onEls","./remove","./removeOneValue","./remove","./except","./exceptFn","./indexOf","./isIn","./send","./uniq","./equals","./find","./where","./findIndexOf","./findByKey"],function(){return Array.prototype}),define("Array.nocomplex/math/all",[],function(){var e={equals:function(e){for(var t=this.length;t--;)if(e[t]!==this[t])return!1;return!0},multiply:function(e){var t=[];if("number"==typeof e)for(var n=this.length;n--;)t[n]=this[n]*e;else for(var n=this.length;n--;)t[n]=this[n]*e[n];return t},divide:function(e){var t=[];if("number"==typeof e)for(var n=this.length;n--;)t[n]=this[n]/e;else for(var n=this.length;n--;)t[n]=this[n]/e[n];return t},min:function(e){var t=e?this.map(e):this;return Math.min.apply(null,t)},minMax:function(e){return[this.min(e),this.max(e)]},max:function(e){var t=e?this.map(e):this;return Math.max.apply(null,t)},average:function(){for(var e=0,t=this.length;t--;)e+=this[t];return e/this.length},minus:function(e){var t=[];if("number"==typeof e)for(var n=this.length;n--;)t[n]=this[n]-e;else for(var n=this.length;n--;)t[n]=this[n]-e[n];return t},domain:function(e,t){var n,r,i=t&&"number"==typeof t[0]?t[0]:this.min(),o=t&&"number"==typeof t[1]?t[1]:this.max();return i===o?this.map(function(){return e[0]}):(n=(e[1]-e[0])/(o-i),r=(e[0]*o-e[1]*i)/(o-i),this.multiply(n).add(r))},add:function(e){var t=[];if("number"==typeof e)for(var n=this.length;n--;)t[n]=this[n]+e;else for(var n=this.length;n--;)t[n]=this[n]+e[n];return t},round:function(){for(var e=this.length;e--;)this[e]=Math.round(this[e]);return this},sum:function(e){for(var t=0,n=this.length;n--;)t+=e(n);return t},orth:function(){if(2!=this.length)throw Error;return[-this[1],this[0]]},norm:function(){return Math.sqrt(this.sum(function(e){return e*e}))}};for(var t in e)e.hasOwnProperty(t)&&(Array.prototype[t]=e[t]);return Array.prototype}),define("Array.nocomplex/all",["./basics","./math/all"],function(){return Array.prototype}),define("SeedView/Parser",["Seed/Seed"],function(e){return e.extend({parse:function(){console.log("overide me")}})}),define("SeedView/parsers/HTMLParser",["../Parser"],function(e){return e.extend({"+options":{name:"html"},"+constructor":function(){},parse:function(e){var t,n=document.createElement(),r=document.createElement("container");r.innerHTML=e.template,n.appendChild(r.childNodes[0]),e._fragment=n,e._elements={root:e._fragment},t=e.getElementsByAttribute("flag");for(var i=0;i<t.length;i++)e.addElement(t[i].getAttribute("flag"),t[i])}})}),define("toDOM/toDOM",[],function(){return function e(t,n){var r,i,o,s,a,u,c,l,f=t;if(f.tag||(f.tag="div"),o=document.createElement(f.tag),f.attr)for(s in f.attr)f.attr.hasOwnProperty(s)&&o.setAttribute(s,f.attr[s]);if(f.label&&(n[f.label]=o),f.className&&(o.className=f.className),"undefined"!=typeof f.innerHTML&&(o.innerHTML="function"==typeof f.innerHTML?f.innerHTML.call(n)||"":f.innerHTML),f.events)for(u in f.events)f.events.hasOwnProperty(u)&&(o["on"+u]=f.events[u]);if(f.style)for(c in f.style)f.style.hasOwnProperty(c)&&(o.style[c]=f.style[c]);if(f.children)for(l=f.children,r=0,i=l.length;i>r;r++)a=e(l[r],n),o.appendChild(a);return o}}),define("SeedView/parsers/ToDOMParser",["../Parser","toDOM/toDOM"],function(e,t){return e.extend({"+options":{name:"toDOM"},"+constructor":function(){},parse:function(e){var n={},r=e.getTemplate(),i=t(r,n);return{node:i,elements:n}}})}),define("SeedView/parsers/DOMParser",["../Parser"],function(e){return e.extend({"+options":{name:"dom"},"+constructor":function(){},parse:function(e){return{node:e.getTemplate()}}})}),define("SeedView/parsers/defaultParsers",["./HTMLParser","./ToDOMParser","./DOMParser"],function(e,t,n){return{toDOM:new t,html:new e,dom:new n}}),define("SeedView/SeedView",["Seed/Seed","mangrove-utils/dom/all","Array.nocomplex/isArray","String.nocomplex/String.nocomplex","Array.nocomplex/all","./parsers/defaultParsers"],function(e,t,n,r,i,o){var s=e.extend({type:"View",accessors:["data","node","template","elements"],"+options":{parser:null,template:"div.default_seedview_template",events:null,data:null,parsers:o,subviews:null,contained:null,elements:null,node:null},_isView:!0,"+constructor":function(){this.data=this.data||{},this.subviews=this.subviews||{},this.contained=this.contained||{},this.elements=this.elements||{},this.detectParser(),this.parse(),"function"==typeof this.data&&(this.data=this.data.bind(this)()),this.events&&this.DOMEvent(this.events),this._displayState={}},hasElement:function(e){return!!this.elements[e]},buildSubviews:function(){this.eachElement(function(e,t){this.subviews[t]=new s({template:e})}.bind(this))},eachElement:function(e){var t=Object.keys(this.elements),n=this.elements;t.each(function(t){e(n[t],t)})},parse:function(){var e,t,n=this.parsers[this.parser];if(!n)throw new Error("No parser: "+this.parser);if(e=n.parse(this),!e)throw new Error("Parse error ");if(!e.node)throw new Error("No node given from parse");this.setNode(e.node),t=e.elements,t||(t={}),t.root=e.node,this.setElements(t)},addElement:function(e,t){this.elements[e]=t,this.contained[e]=[]},subview:function(e){return this.subviews[e]},getElementById:function(e,t){return t||(t=e,e="root"),this.element(e).getElementById(t)},getElementsByClassName:function(e,t){return t||(t=e,e="root"),this.element(e).getElementsByClassName(t)},detectParser:function(){if(!this.template)throw new Error("views/View needs a valid template");this.parser||(this.parser=this.template.nodeName?"dom":"string"==typeof this.template&&"<"===this.template.charAt(0)?"html":"zen")},getElementByAttribute:function(e,t){for(var n=this.element("root").getElementsByTagName("*"),r=0;r<n.length;r++)if(n[r].getAttribute(e)===t)return n[r]},getElementsByAttribute:function(e){for(var t=[],n=this.element("root").getElementsByTagName("*"),r=0;r<n.length;r++)n[r].getAttribute(e)&&t.push(n[r]);return t},html:function(){return this.node},clone:function(){return new s(this.template,this.data)},element:function(e){return!this.elements||!this.elements[e],this.elements[e]
},DOMEvent:function(e,n,r,i){var o,s,a,u=this;if(arguments.length<=2&&e&&e.constructor===Object){a=!!arguments[1];for(s in e)(function(e,t){var n;for(n in t)u.DOMEvent(e,n,t[n],a)})(s,e[s])}else(o=u.element(e))&&function(e,r,o){for(var s=n.split(" "),a=0,u=s.length;u>a;a++)t.addEventListener(e,s[a],function(e){r.apply(o,[e,o])},!!i)}(o,r,u);return u},checkArguments:function(e,t){var n=Array.prototype.slice.call(e);return n.length===t},toggle:function(e){e=e||"root","undefined"==typeof this._displayState[e]&&(this._displayState[e]=1),this._displayState[e]?this.hide(e):this.show(e)},show:function(e){e=e||"root",this.css(e,{display:"block"}),this._displayState[e]=1},hide:function(e){e=e||"root",this.css(e,{display:"none"}),this._displayState[e]=0},prepend:function(){},attachEvent:function(e,n,r){this.checkArguments(arguments,2)&&(r=n,n=e,e="root");var i=this.element(e);t.addEventListener(i,n,r.bind(this))},attachEvents:function(e,t){t||(t=e,e="root");for(var n in t)t.hasOwnProperty(n)&&this.attachEvent(e,n,t[n])},css:function(e,t){this.checkArguments(arguments,1)&&(t=e,e="root");var n=this.element(e),r=n.style;if("string"!=typeof t)for(var i in t)if(t.hasOwnProperty(i))r[i]=t[i];else for(var i in n)if(n.hasOwnProperty(i)&&i==t)return r[t]},attr:function(e,t){this.checkArguments(arguments,1)&&(t=e,e="root");var n=this.element(e);for(var r in t)t.hasOwnProperty(r)&&(n[r]=t[r])},append:function(e,t){t||(t=e,e="root"),this.element(e).appendChild(t)},innerText:function(e,t){e=e||"root";var n=this.element(e);n.innerText=t},innerHTML:function(e,t){e=e||"root";var n=this.element(e);n.innerHTML=t},hasClass:function(e,t){this.checkArguments(arguments,1)&&(t=e,e="root");var n=this.element(e);return new RegExp("(\\s|^)"+t+"(\\s|$)").test(n.className)},addClass:function(e,t){this.checkArguments(arguments,1)&&(t=e,e="root");var n=this.element(e);this.hasClass(e,t)||(n.className+=(n.className?" ":"")+t)},removeClass:function(e,t){this.checkArguments(arguments,1)&&(t=e,e="root");var n=this.element(e);this.hasClass(e,t)&&(n.className=n.className.replace(new RegExp("(\\s|^)"+t+"(\\s|$)")," ").replace(/^\s+|\s+$/g,""))},insert:function(e,t){t||(t=e,e="container"),t=Array.isArray(t)?t:[t],this.contained[e]=this.contained[e]||[],t.each(function(t){this.insertView(e,t)}.bind(this))},contained:function(e){return e||(e="root"),this.contained[e]},insertView:function(e,t){this.contained[e].push(t),this.element(e).appendChild(t.html())},insertAt:function(e,t,n){e=e||"container";var r=this.element(e);r.insertBefore(t.html(),r.childNodes[n])},reoder:function(e,t,n){var r=this.contained[e].indexOf(t);e=e||"container",-1!==r&&(this.contained[e].splice(n,0,this.contained[e].splice(r,1)[0]),this.remove(e,t),this.insertAt(e,t,n))},removeAll:function(e){if(e||(e="container"),this.hasContained(e))for(var t=0;t<this.contained[e].length;t++)this.remove(e,this.contained[e][t])},hasContained:function(e){return!!this.contained[e]},recover:function(){var e=this.element("root");e.parentNode&&e.parentNode.removeChild(e)},remove:function(e,t){e=e||"container";var n=this.contained[e].indexOf(t),r=t.element("root");-1!==n&&r.parentNode&&r.parentNode.removeChild(r)},eachContained:function(e){for(var t in this.contained)this.contained.hasOwnProperty(t)&&e(this.contained(t),t)}});return s});var EngineDetector=function(){this.isNode=!1,this.isBrowser=!1,this.isUnknown=!1,this._exports,this.detect()};EngineDetector.prototype={detect:function(){"undefined"!=typeof module&&module.exports?this._setAsNode():"undefined"!=typeof window?this._setAsBrowser():this._setAsUnknown()},_setAsNode:function(){this.isNode=!0,this.name="node"},_setAsBrowser:function(){this.isBrowser=!0,this._global=window,this.name="browser"},_setAsUnknown:function(){this.isUnknown=!0,this.name="unknown"},setGlobal:function(e){this._global=e},ifNode:function(e){this.isNode&&e()},ifBrowser:function(e){this.isBrowser&&e()},exports:function(e,t){this.isNode?this._global.exports=t:this.isBrowser&&(this._global[e]=t)}};var engine=new EngineDetector,baseUrl,requirejs;engine.ifNode(function(){baseUrl=__dirname,requirejs=require("requirejs"),engine.setGlobal(module)}),engine.ifBrowser(function(){baseUrl="."}),requirejs.config({baseUrl:function(){return"undefined"==typeof define?__dirname:"."}(),shim:{mocha:{exports:"mocha"}},paths:{SeedView:".",engineDetector:"bower_components/engineDetector/app",almond:"bower_components/almond/almond",chai:"bower_components/chai/chai","chai-as-promised":"bower_components/chai-as-promised/lib/chai-as-promised",mocha:"bower_components/mocha/mocha","normalize-css":"bower_components/normalize-css/normalize.css",requirejs:"bower_components/requirejs/require",async:"bower_components/requirejs-plugins/src/async",depend:"bower_components/requirejs-plugins/src/depend",font:"bower_components/requirejs-plugins/src/font",goog:"bower_components/requirejs-plugins/src/goog",image:"bower_components/requirejs-plugins/src/image",json:"bower_components/requirejs-plugins/src/json",mdown:"bower_components/requirejs-plugins/src/mdown",noext:"bower_components/requirejs-plugins/src/noext",propertyParser:"bower_components/requirejs-plugins/src/propertyParser","Markdown.Converter":"bower_components/requirejs-plugins/lib/Markdown.Converter",text:"bower_components/requirejs-plugins/lib/text","sinon-chai":"bower_components/sinon-chai/lib/sinon-chai",sinonjs:"bower_components/sinonjs/sinon","Array.nocomplex":"bower_components/Array.nocomplex/app","String.nocomplex":"bower_components/String.nocomplex/app","mangrove-utils":"bower_components/mangrove-utils/app","underscore.string":"bower_components/underscore.string/lib/underscore.string",ifEngineIsNode:"bower_components/engineDetector/app/ifEngineIsNode",ifEngineIsBrowser:"bower_components/engineDetector/app/ifEngineIsBrowser",toDOM:"bower_components/toDOM/app",Seed:"bower_components/Seed/app",window:"bower_components/engineDetector/app/window",engine:"bower_components/engineDetector/app/engine"}});var isStandalone=!!requirejs._defined,synchronous=isStandalone;if(engine.ifNode(function(){synchronous=!0}),synchronous){var SeedView=requirejs("SeedView/SeedView");engine.exports("SeedView",SeedView)}else requirejs(["SeedView/SeedView"],function(e){engine.exports("SeedView",e)});define("SeedView/main",function(){});