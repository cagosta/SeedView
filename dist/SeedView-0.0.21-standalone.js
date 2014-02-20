(function () {
/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("bower_components/almond/almond", function(){});

define( 'Seed/helpers',[],function( ) {


    // dirty, todo
    Function.prototype.bind || ( Function.prototype.bind = function( scope ) {
        var self = this
        return ( function() {
            return ( self.apply( scope, arguments ) )
        } )
    } )

    return {

        capitalize: function( s ) {
            return ( s.charAt( 0 ).toUpperCase( ) + s.slice( 1 ) )
        },

        remove: function( a, v ) {
            for ( var i = a.length; i--; ) {
                if ( a[ i ] === v ) a.splice( i, 1 )
            }
            return a
        },

        clone: function( o ) { // clones an object (only lvl 1, see hardClone)
            var res = {};
            for ( var i in o )
                if ( o.hasOwnProperty( i ) ) res[ i ] = o[ i ]
            return res
        },

        extend: function( o ) {
            for ( var i = 1, n = arguments.length; i < n; i++ ) {
                var e = typeof( arguments[ i ] ) === 'object' || typeof( arguments[ i ] ) === 'function' ? arguments[ i ] : {}
                for ( var j in e )
                    if ( e.hasOwnProperty( j ) ) {
                        o[ j ] = e[ j ]
                    }
            }
            return o
        },

        find: function( a, f ) {
            for ( var i = 0, n = a.length; i < n; i++ ) {
                if ( f( a[ i ], i ) ) return a[ i ]
            }
            return false
        }

    }

} );
define( 'Seed/extendHooker',[
    './helpers'
 ], function( _ ) {


    var ExtendHooker = function( ) {

    }

    ExtendHooker.prototype =  {

        getHooks: function( ) {

        },

        hookify: function( Extendable ) {

            var hooks = Extendable.__hooks = [ ]

            Extendable.registerHook = function( hook ) {
                Extendable.__hooks.push( hook )
            }

            Extendable.hasHook = function( hook ) {
                if ( typeof hook === 's' ) {
                    return !!_.find( hooks, function( h ) {
                        return h.id === hook
                    } )
                }
                return !!_.find( hooks, function( h ) {
                    return h === hook
                } )
            }


            Extendable.unregisterHook = function( hook ) {
                return _.remove( hooks, hook )
            }

            
        }

    }


    return new ExtendHooker

} );
define( 'Seed/extendHooks/plusMinusExtendHook',[ '../helpers' ], function( _ ) {

    /**
     * Mix two params, to get the better mix
     *
     * @private
     * @param {String|Array|Object|Number} before
     * @param {String|Array|Object|Number} after
     * @returns an extended object if before and after are objects
     */

    var extendReturn = function( before, after ) {

        if ( typeof( after ) === "undefined" ) {
            return before;
        }

        if ( typeof( after ) === "object" && typeof( before ) === "object" ) {
            return _.extend( {}, before, after );
        }

        return after;
    };


    /**
     * Two Fns executed in once
     *
     * @private
     * @param {Object|Function} before a function or object that is executed before
     * @param  {Object|Function} after a function or object that is executed before
     * @returns {Object|Function} a function that calls before and then after
     */

    var mergeFns = function( before, after ) {

        if ( typeof( before ) === "function" || typeof( after ) === "function" ) {
            return function( ) {
                var beforeR = ( typeof( before ) === "function" ?
                    before.apply( this, arguments ) :
                    before
                ),
                    afterR = ( typeof( after ) === "function" ?
                        after.apply( this, arguments ) :
                        after
                    );

                return extendReturn( beforeR, afterR );
            };
        } else {
            return extendReturn( before, after );
        }

    };



    /**
     * extend an object with +/- convention
     *
     * @private
     * @param {Object} oldObj an object to extend from
     * @param  {Object} a key-value object to add to oldObject, with +key and -key
     * @returns {Object} an extended object
     */


    return {
        name: 'plusMinus',
        handle: function( oldObj, extendObj ) {

            // var resObj =  {},
            var resObj = oldObj,
                nullFn = function( ) {};

            for ( var i in extendObj )
                if ( extendObj.hasOwnProperty( i ) ) {
                    var reg = /(^\+|^-)(.*)/g;

                    if ( reg.test( i ) ) { // merge fns
                        var key = i.replace( reg, "$2" ),
                            old = oldObj[ key ] || nullFn,
                            extFn = extendObj[ i ];

                        switch ( i.charAt( 0 ) ) {
                            case "+":
                                resObj[ key ] = mergeFns( old, extFn );
                                break;
                            case "-":
                                resObj[ key ] = mergeFns( extFn, old );
                                break;
                        }

                        delete oldObj[ i ]
                        
                    } else { // merge object
                        resObj[ i ] = extendObj[ i ];
                    }
                }
            return resObj;
        }
    }

} );
define('Seed/extendHooks/accessors/TypeChecker',[],function(  ) {

    Array.isArray = Array.isArray || function( o ) {
        return Object.prototype.toString.call( o ) == "[object Array]"
    }

    Function.prototype.bind || ( Function.prototype.bind = function( scope ) {
        var self = this;
        return ( function( ) {
            return ( self.apply( scope, arguments ) );
        } );
    } )

    var TypeChecker = function( ) {
        this.is = this.is.bind( this )
    }

    TypeChecker.prototype = {

        is: function( type, arg ) {
            if ( arg !== null && typeof arg !== 'undefined' && typeof arg.isTypeOf === 'function' )
                return arg.isTypeOf( type )
            if ( this[ type ] ) // check if this type is defined here
                return this[ type ]( arg ) || false;
            return typeof arg === type.toLowerCase( )
        },

        Truthy: function( arg ) {
            return !! arg
        },

        Falsy: function( arg ) {
            return !! arg
        },


        Array: function( a ){
            return Array.isArray( a )
        },

        Point: function( f ) {
            return f && f.isPoint
        },

        Valid: function( t ) {
            return typeof t !== 'undefined'
        },

        defined: function( o ){
            return typeof o !== 'undefined'
        },

        //From jQuery
        PlainObject: function( obj ) {
            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            var hasOwnProperty = Object.prototype.hasOwnProperty,
                toString = Object.prototype.toString;
            if ( !obj || toString.call( obj ) !== '[object Object]' || obj.nodeType || obj.setInterval ) {
                return false;
            }

            // Not own constructor property must be Object
            if ( obj.constructor && !hasOwnProperty.call( obj, 'constructor' ) && !hasOwnProperty.call( obj.constructor.prototype, 'isPrototypeOf' ) ) {
                return false;
            }
            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.

            var key;
            for ( key in obj ) {}

            return key === undefined || hasOwnProperty.call( obj, key );
        },

        isStructure: function( structure, obj ){
            var error 
            if ( ! this.is( 'PlainObject', obj )  ){
                error = 'TypeChecker: Object ' + obj + ' is not a plain Object'
                return false
            }
            for ( var key in structure ) if ( structure.hasOwnProperty( key ) ){
                var type = structure[ key ]
                if ( ! key in obj )
                    error = 'TypeChecker: Key ' + key + ' is not in ' + object 
                
                if ( this.is( 'PlainObject', structure[ key ] )) // if value is a plain objet, reccursive check
                    return this.isStructure( structure[ key ], obj[ key ])
                if ( ! this.is( type, obj[ key ] ) )
                    error = 'TypeChecker: Key ' + key + ' is not in ' + object 

            }
            if ( error ){
                throw new Error( error )
                return false
            }
            return true
        },

        Profile: function( p ){
            return this.isStructure({
                label: 'String',
                id:    'String'
            }, p )
        },

        BenchmarkRawData: function( d ){
            return this.isStructure({
                settings: 'PlainObject',
                data: {
                    W: 'PlainObject',
                    M: 'PlainObject'
                }
            }, d )
        }



    };

    return TypeChecker

} );
define( 'Seed/extendHooks/accessors/defaultTypeChecker',[
    './TypeChecker'
], function( TypeChecker ){


    var typeChecker = ( new TypeChecker )
    return typeChecker

});
define( 'Seed/extendHooks/accessorsExtendHook',[
    './accessors/defaultTypeChecker',
    '../helpers'
], function( defaultTypeChecker, _, Seed ) {

    var AccessorHandler = function( oldPrototype, accessorString, extendObj, typeChecker ){
        this.id              = 'accessors'
        this.accessorString = accessorString
        this.extendObj       = extendObj
        this.typeChecker     = typeChecker
        this.typeChecker.is  = this.typeChecker.is.bind( this.typeChecker )
        this.oldPrototype    = oldPrototype
        this.create( )
    }

    AccessorHandler.prototype = {

        create: function( ){
            var firstChar            =  this.accessorString.charAt( 0 ),
                isPrivate            =  ( firstChar === '-' ),
                isPublic             =  ! isPrivate,
                accessorString       =  ( firstChar === '-' || firstChar === '+' ) ? this.accessorString.slice( 1 ) : this.accessorString, // remove + and - 
                accessorStringSplit  =  accessorString.split( '|' ),
                type                 =  accessorStringSplit[ 1 ],
                name                 =  accessorStringSplit[ 0 ],
                capitalizedName      =  _.capitalize( name ),
                prefix               =  ( isPrivate ? '_' : '' ),
                getterName           =  prefix + 'get' + capitalizedName,
                setterName           =  prefix + 'set' + capitalizedName,
                accessorName         =  prefix + name,
                typeChecker          =  this.typeChecker,
                self                 =  this,
                error 
            // console.log( this.getExtendHookConfiguration( ).allAccessors )
            // console.log( name, this.accessorString) 
            if ( !_.find( this.getExtendHookConfiguration( ).allAccessors, function( x ){ return x } ) )
                // console.log( 'accessorsExtendHook - erasing parent accessors ' + name )
            // else 
                this.getExtendHookConfiguration( ).allAccessors.push( name )

            this.addMethod( getterName, function( ) {
                return this[ accessorName ]
            } )

            if ( type )
                this.addMethod( setterName, function( v ) {
                    if ( self.typeChecker.is( type, v ) ){
                        this[ accessorName ] = v
                        return v
                    }
                    else {
                        try {
                            error = JSON.stringify( v ) + ' is not a ' + type
                        } catch(e ){
                            
                        }
                        debugger // dev mode, TODO
                        throw new Error( error )
                    }
                } )
            else 
                this.addMethod( setterName, function( v ) {
                    this[ accessorName ] = v
                    return v
                })
        },

        getOldObj: function( ) {
            return this.oldPrototype
        },

        getExtendObj: function( ) {
            return this.extendObj
        },

        getExtendHookConfiguration: function( ) {
            return this.getOldObj( ).__extendHooks[ this.id ]
        },

        addMethod: function( methodName, f ){
            if ( ! this.extendObj[ methodName ] )
                this.oldPrototype[ methodName ] = f
            // else 
                // console.log( 'accessorsExtendHook - ' + methodName + ' is define in extendObj' )
        }

    }


    var AccessorExtendHook = function( ){
            this.id          = 'accessors'
            this.handle      = this.handle.bind( this )
            this.typeChecker = defaultTypeChecker
    }

    AccessorExtendHook.prototype = {

        configure: function( confObj ){
            if ( confObj.typeChecker )
                this.typeChecker = confObj.typeChecker
        },

        initializeHook: function( oldObj, extendObj ){
            var accessors = [] // add 
            extendObj.__extendHooks = oldObj.__extendHooks || { }
            extendObj.__extendHooks[ this.id ] = {
                id: this.id,
                allAccessors: accessors
            }
        },

        hasHook: function( oldObj ){
            return oldObj && oldObj.__extendHooks && oldObj.__extendHooks[ this.id ]
        },

        handle: function( oldObj, extendObj ){
            var accessors = extendObj.accessors

            if ( ! this.hasHook( oldObj ) )
                this.initializeHook( oldObj, extendObj )

            if ( !accessors )
                return oldObj

            for ( var i = 0; i < accessors.length; i++ ){
                new AccessorHandler( oldObj, accessors[ i ], extendObj, this.typeChecker )
            }
            

            return oldObj
        }

    }

    return new AccessorExtendHook

} );
define( 'Seed/extendHooks/typeExtendHook',[
    '../helpers'
], function(  _  ) {


    var TypeExtendHook = function( ) {
            this.id          = 'type'
            this.handle      = this.handle.bind( this )
    }

    var TypeHookHandler = function( o ) {

        this.id           = 'type'
        this.oldObj       = o.oldObj
        this.extendObj    = o.extendObj
        // console.log( 'type', this.getExtendObj( ).type, this.getOldObj( ).types )
        if ( ! this.hasHook( ) ){
            this.initializeHook( )
        }
        this.handleExtendObjType( )
    }

    TypeHookHandler.prototype = {

        handleExtendObjType: function( ){
            var oldTypes = this.getOldObj( ).getTypes( ).slice( ), // copy array of previoustypes
                newType = this.getExtendObj( ).type
                 
            this.getOldObj( ).types = oldTypes
            if ( typeof newType !== 'string' ) // no type or invalid type type ( ha ha )
                return
            if ( oldTypes.indexOf( newType ) !== -1 )
                return
            this.getOldObj( ).types.push( newType )
        },

        hasHook: function(  ){
            return this.getOldObj( ).__extendHooks && this.oldObj.__extendHooks[ this.id ]
        },

        getHookConfigurationObject: function( ){
            return this.getOldObj( ).__extendHooks[ this.id ]
        },

        getTypes: function( ){
            return this.getOldObj( ).types
        },

        initializeHook: function( ){
            if ( ! this.getOldObj( ).__extendHooks )
                this.getOldObj( ).__extendHooks = { }

            this.getOldObj( ).__extendHooks[ this.id ] = {
                id:       this.id
            }

            this.getOldObj( ).isTypeOf = function( type ){
                return this.types.indexOf( type ) !== -1
            } 

            this.getOldObj( ).types = [ ]

            this.getOldObj( ).getTypes = function( ){
                return this.types
            }
        },

        getOldObj: function( ){
            return this.oldObj
        },

        getExtendObj: function( ){
            return this.extendObj
        }

    }

    TypeExtendHook.prototype = {

        configure: function( ){

        },


        handle: function( oldObj, extendObj ){

            new TypeHookHandler({
                oldObj:    oldObj,
                extendObj: extendObj
            })

            return oldObj
        }

    }

    return new TypeExtendHook

} );
define( 'Seed/extendHookRegistrations',[
    './extendHooks/plusMinusExtendHook',
    './extendHooks/accessorsExtendHook',
    './extendHooks/typeExtendHook',
 ], function( plusMinusExtendHook, accessorsExtendHook, typeExtendHook ) {


    return [ accessorsExtendHook, typeExtendHook, plusMinusExtendHook ]


} );
define( 'Seed/Extendable',[
    './helpers',
    './extendHooker',
    './extendHookRegistrations'
 ], function( _ , extendHooker, hookList ) {


    /**
     * This is the basic extendable element, it is used by fjs.View, fjs.Controller and others ...
     * It allows user to specifies '+_String:methodName_' to augment set the + method of the prototype of the new element with the defined method
     * if A is extended and A has a method named 'some_random_method',
     * if you do B = A.extend({
     *  '+some_random_method' : add
     * })
     * B.some_random_method <=> function() {
     *  A.prototype.some_random_method();
     *  add();
     * }
     * @export Seed/Extendable


     */
    var Extendable = function( ) {};

    /**
     * Initialize an object
     *
     * @this {Extendable}
     * @param {Object} configuration Object
     */

    Extendable.prototype.constructor = function( ) {};

    // here we hookify Extendable
    
    extendHooker.hookify( Extendable )
    for ( var i = 0; i < hookList.length; i++ ){
        Extendable.registerHook( hookList[i] )
    }

    /**
     * Call init function from the cstructor signleton scope, useful to add custom afterNew/beforeNew callbacks
     *
     * @param {object} inst The instance scope
     * @param {array} args arguments
     */

    Extendable[ 'new' ] = function( inst, args ) {
        
    };




    /**
     * Singleton extend with +/- convention
     *
     * @private
     * @param {Object} basicObj configuration key-value object with +/-key
     * @returns {Object} extObj
     *
     */

    var extendCstr = function( basicObj, extObj ) {

        var Res;
        Res = function( o ) {
            Res[ 'new' ].call( Res, this, arguments );
        };

        var attrs = _.extend( {}, basicObj, pm( basicObj, extObj ) );

        for ( var i in attrs )
            if ( attrs.hasOwnProperty( i ) ) {
                Res[ i ] = attrs[ i ];
            }

        return Res;
    };



    /**
     * Extend a Constructor with +/- convention
     *
     * @public
     * @param {Object} obj configuration key-value object with '+key' or '-key'
     *
     */


    Extendable.extend = function( obj ) {

        var C = function( o ) {
            // C[ 'new' ].call( C, this, arguments );
            // ( typeof( args[ 0 ] ) !== 'boolean' || args[ 0 ] !== false ) && this.constructor.apply( this, arguments );
            ( typeof( arguments[ 0 ] ) !== 'boolean' || arguments[ 0 ] !== false ) && ( C.prototype.constructor).apply( this, arguments );
        };


        //copy constructor ownProperty (i.e. extend and new)
        var attrs = _.clone( this );

        for ( var i in attrs )
            if ( attrs.hasOwnProperty( i ) ) {
                C[ i ] = attrs[ i ];
            }

        var hooks = Extendable.__hooks,
            hooked = _.extend( new this( false ), obj )

            for ( var i = 0; i < hooks.length; i++ ) {
                hooked = hooks[ i ].handle( hooked, obj )
            }

        C.prototype = hooked
        // C.prototype = extend(new this(false), pm(this.prototype, obj));

        return C;
    };

    return Extendable;

} );
define( 'Seed/Eventable',[
    './Extendable',
    './helpers'
  ], function( Extendable, _ ) {

  /**
   * For publishing events
   * @export Seed/Eventable
   */

  return Extendable.extend( {

    constructor: function( ) {
      this._events = {};
      this._attached = [ ];
    },

    /**
     * Publisher method, Fire an event
     *
     * @public
     * @param {string} eventName
     * @param {..} [arguments] the arguments to pass through the event pipe
     *
     */

    emit: function( eventName ) {

      var evs = this._events[ eventName ];
      if ( evs ) {
        var args = Array.prototype.slice.call( arguments, 1 );

        // last subscribe is the first to be called
        for ( var i = evs.length; i--; ) {
          //TODO profiling to this line 
          evs[ i ].fn.apply( evs[ i ].subscriber, args );
          //evs[i](args[0], args[1], args[2], args[3]);
        }
      }

    },

    // fire alias, temporary
    fire: function( ) {
        this.emit.apply( this, arguments )
    },

    /**
    * Publisher method, Subscribe to an event
    *
    * Note : it's important to provide an subscriber object to detach the event when the subscriber is destroyed, else you may have issues to destroy events
    *
    * @public
    * @param {String} eventName '*' means 'all', subsribe multi events with 'evt1 evt2 ...'
    * @param {Object|Function} subscriber if Object, the subscriber instance else the function to attach
    * @param {String|Function|Object} [functionPointer='subscriber.'on'+eventName'] if the subscriber is an object, a string pointes to subscriber method, a function would be executed in the subscriber scope
    * @returns {Object} subscription 
    *
    * @example 
    // call subscriber.onStart when publisher fire 'start'
    var sub = publisher.on('start', subscriber); 
    
    sub.un(); // stops the subscription
    
    // call subscriber.onStart when publisher fire 'start' and subscriber.onEnd when publisher fire 'end'
    publisher.on('start end', subscriber);
    
    // call subscriber.onPublisherStart when publisher fire 'start'
    publisher.on('start', subscriber, 'onPublisherStart'); 
    
    // call fn in the subscriber scope
    publisher.on('start', subscriber, fn); 
    
    // call fn in the subscriber scope (equivalent to previous), use for more compatibility with classic use
    publisher.on('start', fn, subscriber);
    
    // call fn when publisher fire start, use with caution when you'll never want to detach event at any destroy
    publisher.on('start', fn); 

    */

    on: function( eventName, subscriber, fn ) {

      var evts = eventName.split( ' ' );

      // multimorph API handling
      if ( typeof( subscriber ) === 'function' ) {
        var oldFn = fn;
        fn = subscriber;
        subscriber = oldFn;
      }

      // multi events handling
      if ( evts.length === 1 ) {
        return this._on( evts[ 0 ], subscriber, fn );
      } else {

        var ons = [ ];
        for ( var i = 0; i < evts.length; i++ ) {
          ons[ i ].push( this._on( evtName, subscriber, fn ) );
        }

        return {
          un: function( ) {
            for ( var i = 0; i < ons.length; i++ ) {
              ons[ i ].un( );
            }
          }
        };
      }
    },

    /**
     * @private
     */

    _on: function( eventName, subscriber, f ) {

      // subscriber format validation
      if ( subscriber && typeof( subscriber.attach ) !== 'function' ) {
        throw new Error( 'The subscriber should have a attach(event) method' );
        return;
      }

      // fn multimorphism handling
      if ( typeof( f ) === 'string' ) {
        f = subscriber[ f ];
      } else if ( typeof( f ) === 'undefined' ) {
        f = subscriber[ 'on' + _.capitalize( eventName ) ];
      }

      if ( typeof( f ) !== 'function' ) {
        throw new Error( 'Cannot find the function to subscribe to ' + eventName );
        return;
      }

      var _this = this,
        subObj = {
          fn: f,
          subscriber: subscriber
        },
        ret = {
          un: function( ) {
            _this._rmSubscription( eventName, subObj );
          }
        };

      // subscriber.attach( ret );

      ( this._events[ eventName ] || ( this._events[ eventName ] = [ ] ) ).push( subObj );

      return ret;
    },

    /**
     * Publisher method, Remove a Subscription, private, use subscription.un()
     *
     * @private
     * @param {string} eventName
     * @param {object} subscription object
     *
     */

    _rmSubscription: function( eventName, subObj ) {

      _.remove( this._events[ eventName ], subObj );
      if ( this._events[ eventName ].length == 0 ) {
        delete this._events[ eventName ];
      }
    },

    /**
     *  Subscriber method
     *  Attach a subscription to this
     *  @param {object} subscription
     */

    attach: function( subscription ) {
      this._attached.push( subscription );
    },

    /**
     *  Subscriber method
     *  Detach all subscription
     */

    detachAll: function( ) {
      for ( var i = 0; i < this._attached.length; i++ ) {
        this._attached[ i ].un( );
      }
      this._attached = [ ];
    }
  } );

} );
/**
 * SeedHq version: "0.0.16" Copyright (c) 2011-2012, Cyril Agosta ( cyril.agosta.dev@gmail.com) All Rights Reserved.
 * Available via the MIT license.
 * see: http://github.com/cagosta/SeedHq for details
 */


define( 'Seed/SeedHq',[
  './Eventable',
  './helpers' // remove me 
], function( Eventable, helpers ) {

    /**
     * @class Seed
     * @param {object} o configuration object
     * @example
     *
     */

    return Eventable.extend( {

        /**
         * init instance attributes
         *
         * @param {object} o configuration object
         */
        constructor: function( o ) {

            ( o = o ||  {} );

            //publisher init
            this._events = [];

            //subscriber init
            this._attached = [];

            this._subs = [];

            this._o = o;

            if ( o._a ) {
                this._a = o._a;
            }

            this.setOptions();
        },

        /**
         * no options by default
         */

        options: {},

        /**
         * keys declared in options are set as attribute in the instance
         */
        bindMethod: function( methodName ) {
            this[ methodName ] = this[ methodName ].bind( this )
        },

        setOptions: function() {
            var setter
            if ( this.options ) {
                for ( var i in this.options )
                    if ( this.options.hasOwnProperty( i ) ) {
                        if ( typeof( this._o[ i ] ) === 'undefined' ) this[ i ] = this.options[ i ];
                        else {
                            setter = 'set' + helpers.capitalize( i )
                            if ( typeof this[ setter ] === 'function' ) { // accessors extend hook todo
                                this[ setter ]( this._o[ i ] )
                            } else {
                                this[ i ] = this._o[ i ];
                            }
                        }
                    }
            }
        },

        /**
         * Build a sub instance, that will be destroyed with this
         * @params {function} C Constructor of the sub instance
         * @params {object} o configuration options of the sub instance
         * @returns {object} c instance built
         */

        sub: function( C, o ) {
            if ( typeof( C ) !== 'function' ) {
                throw new Error( 'C is not a valid constructor' );
            }
            var c = new C( this.subParams( o ) );
            this._subs.push( c );
            return c;
        },

        /**
         * Add custom keys in the sub configuratin object from this
         *
         * @params {object} o start sub configuration object
         * @returns {object} o extended sub configuration object
         */

        subParams: function( o ) {
            ( o || ( o = {} ) );
            o._parent = this;
            if ( this._a ) {
                o._a = this._a;
            }
            return o;
        },

        /**
         * Destroy the objects, his events and his sub objects
         */

        destroy: function() {
            this.detachAll();
            for ( var i = 0; i < this._subs.length; i++ ) {
                this._subs[ i ].destroy()
            }
        }

    } );

} );
define('Seed/Seed',[
    './SeedHq'
], function( SeedHq ){

    return SeedHq

});
define( 'mangrove-utils/dom/addEventListener',[],function() {



    return ( function() {
        
        if ( window.addEventListener )
            return function( el, ev, fn, c ) {
                return el.addEventListener( ev, fn, !! c )
            }
        return function( el, ev, fn ) {
            return el.attachEvent( 'on' + ev, function( e ) {
                var e = e || window.event
                e.target = e.target || e.srcElement
                e.relatedTarget = e.relatedTarget || e.fromElement || e.toElement
                e.isImmediatePropagationStopped = e.isImmediatePropagationStopped || false
                e.preventDefault = e.preventDefault || function() {
                        e.returnValue = false
                    }
                e.stopPropagation = e.stopPropagation || function() {
                    e.cancelBubble = true
                }
                e.stopImmediatePropagation = e.stopImmediatePropagation || function() {
                    e.stopPropagation()
                    e.isImmediatePropagationStopped = true
                }
                if ( !e.isImmediatePropagationStopped )
                    fn( e )
            } )
        }
    }() )

} );
define('mangrove-utils/dom/keyCodes',[],function(){

    return {
    	backspace:		8,
		tab:			9,
		enter: 			13,
		shift: 			16,
		ctrl:			17,
		alt:			18,
		pauseBbreak: 	19,
		capsLock: 		20,
		escape: 		27,
		pageUp: 		33,
		pageDown: 		34,
		end: 			35,
		home: 			36,
		leftArrow: 		37,
		upArrow: 		38,
		rightArrow: 	39,
		downArrow: 		40,
		insert: 		45,
		delete: 		46,
		0: 				48,
		1: 				49,
		2: 				50,
		3: 				51,
		4: 				52,
		5: 				53,
		6: 				54,
		7: 				55,
		8: 				56,
		9: 				57,
		a: 				65,
		b: 				66,
		c: 				67,
		d:				68,
		e:				69,
		f:				70,
		g: 				71,
		h: 				72,
		i:				73,
		j:				74,
		k:				75,
		l:				76,
		m: 				77,
		n: 				78,
		o: 				79,
		p: 				80,
		q: 				81,
		r: 				82,
		s: 				83,
		t: 				84,
		u: 				85,
		v: 				86,
		w: 				87,
		x: 				88,
		y: 				89,
		z: 				90,
		leftWindowKey: 	91,
		rightWindowKey: 92,
		selectKey: 		93,
		numpad0: 		96,
		numpad1: 		97,
		numpad2: 		98,
		numpad3: 		99,
		numpad4: 		100,
		numpad5: 		101,
		numpad6: 		102,
		numpad7: 		103,
		numpad8: 		104,
		numpad9: 		105,
		multiply: 		106,
		add: 			107,
		subtract: 		109,
		decimalPoint: 	110,
		divide: 		111,
		f1: 			112,
		f2: 			113,
		f3: 			114,
		f4: 			115,
		f5: 			116,
		f6: 			117,
		f7: 			118,
		f8: 			119,
		f9: 			120,
		f10: 			121,
		f11: 			122,
		f12: 			123,
		numLock: 		144,
		scrollLock: 	145,
		semiColon: 		186,
		equalSign: 		187,
		comma: 			188,
		dash: 			189,
		period: 		190,
		forwardSlash: 	191,
		graveAccent: 	192,
		openBracket: 	219,
		backSlash: 		220,
		closeBraket: 	221,
		singleQuote: 	222
    };

});
/**
 * @license RequireJS domReady 2.0.1 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/domReady for details
 */
/*jslint */
/*global require: false, define: false, requirejs: false,
  window: false, clearInterval: false, document: false,
  self: false, setInterval: false */


define('mangrove-utils/dom/ready',[],function () {
    

    var isTop, testDiv, scrollIntervalId,
        isBrowser = typeof window !== "undefined" && window.document,
        isPageLoaded = !isBrowser,
        doc = isBrowser ? document : null,
        readyCalls = [];

    function runCallbacks(callbacks) {
        var i;
        for (i = 0; i < callbacks.length; i += 1) {
            callbacks[i](doc);
        }
    }

    function callReady() {
        var callbacks = readyCalls;

        if (isPageLoaded) {
            //Call the DOM ready callbacks
            if (callbacks.length) {
                readyCalls = [];
                runCallbacks(callbacks);
            }
        }
    }

    /**
     * Sets the page as loaded.
     */
    function pageLoaded() {
        if (!isPageLoaded) {
            isPageLoaded = true;
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
            }

            callReady();
        }
    }

    if (isBrowser) {
        if (document.addEventListener) {
            //Standards. Hooray! Assumption here that if standards based,
            //it knows about DOMContentLoaded.
            document.addEventListener("DOMContentLoaded", pageLoaded, false);
            window.addEventListener("load", pageLoaded, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", pageLoaded);

            testDiv = document.createElement('div');
            try {
                isTop = window.frameElement === null;
            } catch (e) {}

            //DOMContentLoaded approximation that uses a doScroll, as found by
            //Diego Perini: http://javascript.nwbox.com/IEContentLoaded/,
            //but modified by other contributors, including jdalton
            if (testDiv.doScroll && isTop && window.external) {
                scrollIntervalId = setInterval(function () {
                    try {
                        testDiv.doScroll();
                        pageLoaded();
                    } catch (e) {}
                }, 30);
            }
        }

        //Check if document already complete, and if so, just trigger page load
        //listeners. Latest webkit browsers also use "interactive", and
        //will fire the onDOMContentLoaded before "interactive" but not after
        //entering "interactive" or "complete". More details:
        //http://dev.w3.org/html5/spec/the-end.html#the-end
        //http://stackoverflow.com/questions/3665561/document-readystate-of-interactive-vs-ondomcontentloaded
        //Hmm, this is more complicated on further use, see "firing too early"
        //bug: https://github.com/requirejs/domReady/issues/1
        //so removing the || document.readyState === "interactive" test.
        //There is still a window.onload binding that should get fired if
        //DOMContentLoaded is missed.
        if (document.readyState === "complete") {
            pageLoaded();
        }
    }

    /** START OF PUBLIC API **/

    /**
     * Registers a callback for DOM ready. If DOM is already ready, the
     * callback is called immediately.
     * @param {Function} callback
     */
    function domReady(callback) {
        if (isPageLoaded) {
            callback(doc);
        } else {
            readyCalls.push(callback);
        }
        return domReady;
    }

    domReady.version = '2.0.1';

    /**
     * Loader Plugin API method
     */
    domReady.load = function (name, req, onLoad, config) {
        if (config.isBuild) {
            onLoad(null);
        } else {
            domReady(onLoad);
        }
    };

    /** END OF PUBLIC API **/

    return domReady;
});
define( 'mangrove-utils/dom/removeEventListener',[],function() {

    return ( function() {
        if ( window.removeEventListener )
            return function( el, ev, fn, c ) {
                return el.removeEventListener( ev, fn, !! c )
            }
        return function( el, ev, fn ) {
            el.detachEvent( ev, fn )
        }
    }() )

} );
define( 'mangrove-utils/dom/all',[
    './addEventListener',
    './keyCodes',
    './ready',
    './removeEventListener'
 ], function( addEventListener, keyCodes, ready, removeEventListener ) {


    return {
        addEventListener: addEventListener,
        keyCodes: keyCodes,
        ready: ready,
        removeEventListener: removeEventListener
    }

} );
define( 'Array.nocomplex/isArray',[],function() {

    Array.isArray = Array.isArray || function( o ) {
        return Object.prototype.toString.call( o ) == "[object Array]"
    }

    return Array.isArray

} );
//  Underscore.string
//  (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
//  Underscore.string is freely distributable under the terms of the MIT license.
//  Documentation: https://github.com/epeli/underscore.string
//  Some code is borrowed from MooTools and Alexandru Marasteanu.
//  Version '2.3.2'

!function(root, String){
  

  // Defining helper functions.

  var nativeTrim = String.prototype.trim;
  var nativeTrimRight = String.prototype.trimRight;
  var nativeTrimLeft = String.prototype.trimLeft;

  var parseNumber = function(source) { return source * 1 || 0; };

  var strRepeat = function(str, qty){
    if (qty < 1) return '';
    var result = '';
    while (qty > 0) {
      if (qty & 1) result += str;
      qty >>= 1, str += str;
    }
    return result;
  };

  var slice = [].slice;

  var defaultToWhiteSpace = function(characters) {
    if (characters == null)
      return '\\s';
    else if (characters.source)
      return characters.source;
    else
      return '[' + _s.escapeRegExp(characters) + ']';
  };

  // Helper for toBoolean
  function boolMatch(s, matchers) {
    var i, matcher, down = s.toLowerCase();
    matchers = [].concat(matchers);
    for (i = 0; i < matchers.length; i += 1) {
      matcher = matchers[i];
      if (!matcher) continue;
      if (matcher.test && matcher.test(s)) return true;
      if (matcher.toLowerCase() === down) return true;
    }
  }

  var escapeChars = {
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: "'"
  };

  var reversedEscapeChars = {};
  for(var key in escapeChars) reversedEscapeChars[escapeChars[key]] = key;
  reversedEscapeChars["'"] = '#39';

  // sprintf() for JavaScript 0.7-beta1
  // http://www.diveintojavascript.com/projects/javascript-sprintf
  //
  // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
  // All rights reserved.

  var sprintf = (function() {
    function get_type(variable) {
      return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
    }

    var str_repeat = strRepeat;

    var str_format = function() {
      if (!str_format.cache.hasOwnProperty(arguments[0])) {
        str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
      }
      return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
    };

    str_format.format = function(parse_tree, argv) {
      var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
      for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i]);
        if (node_type === 'string') {
          output.push(parse_tree[i]);
        }
        else if (node_type === 'array') {
          match = parse_tree[i]; // convenience purposes only
          if (match[2]) { // keyword argument
            arg = argv[cursor];
            for (k = 0; k < match[2].length; k++) {
              if (!arg.hasOwnProperty(match[2][k])) {
                throw new Error(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
              }
              arg = arg[match[2][k]];
            }
          } else if (match[1]) { // positional argument (explicit)
            arg = argv[match[1]];
          }
          else { // positional argument (implicit)
            arg = argv[cursor++];
          }

          if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
            throw new Error(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
          }
          switch (match[8]) {
            case 'b': arg = arg.toString(2); break;
            case 'c': arg = String.fromCharCode(arg); break;
            case 'd': arg = parseInt(arg, 10); break;
            case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
            case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
            case 'o': arg = arg.toString(8); break;
            case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
            case 'u': arg = Math.abs(arg); break;
            case 'x': arg = arg.toString(16); break;
            case 'X': arg = arg.toString(16).toUpperCase(); break;
          }
          arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
          pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
          pad_length = match[6] - String(arg).length;
          pad = match[6] ? str_repeat(pad_character, pad_length) : '';
          output.push(match[5] ? arg + pad : pad + arg);
        }
      }
      return output.join('');
    };

    str_format.cache = {};

    str_format.parse = function(fmt) {
      var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
      while (_fmt) {
        if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
          parse_tree.push(match[0]);
        }
        else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
          parse_tree.push('%');
        }
        else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
          if (match[2]) {
            arg_names |= 1;
            var field_list = [], replacement_field = match[2], field_match = [];
            if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
              while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else {
                  throw new Error('[_.sprintf] huh?');
                }
              }
            }
            else {
              throw new Error('[_.sprintf] huh?');
            }
            match[2] = field_list;
          }
          else {
            arg_names |= 2;
          }
          if (arg_names === 3) {
            throw new Error('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
          }
          parse_tree.push(match);
        }
        else {
          throw new Error('[_.sprintf] huh?');
        }
        _fmt = _fmt.substring(match[0].length);
      }
      return parse_tree;
    };

    return str_format;
  })();



  // Defining underscore.string

  var _s = {

    VERSION: '2.3.0',

    isBlank: function(str){
      if (str == null) str = '';
      return (/^\s*$/).test(str);
    },

    stripTags: function(str){
      if (str == null) return '';
      return String(str).replace(/<\/?[^>]+>/g, '');
    },

    capitalize : function(str){
      str = str == null ? '' : String(str);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    chop: function(str, step){
      if (str == null) return [];
      str = String(str);
      step = ~~step;
      return step > 0 ? str.match(new RegExp('.{1,' + step + '}', 'g')) : [str];
    },

    clean: function(str){
      return _s.strip(str).replace(/\s+/g, ' ');
    },

    count: function(str, substr){
      if (str == null || substr == null) return 0;

      str = String(str);
      substr = String(substr);

      var count = 0,
        pos = 0,
        length = substr.length;

      while (true) {
        pos = str.indexOf(substr, pos);
        if (pos === -1) break;
        count++;
        pos += length;
      }

      return count;
    },

    chars: function(str) {
      if (str == null) return [];
      return String(str).split('');
    },

    swapCase: function(str) {
      if (str == null) return '';
      return String(str).replace(/\S/g, function(c){
        return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
      });
    },

    escapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/[&<>"']/g, function(m){ return '&' + reversedEscapeChars[m] + ';'; });
    },

    unescapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/\&([^;]+);/g, function(entity, entityCode){
        var match;

        if (entityCode in escapeChars) {
          return escapeChars[entityCode];
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
          return String.fromCharCode(parseInt(match[1], 16));
        } else if (match = entityCode.match(/^#(\d+)$/)) {
          return String.fromCharCode(~~match[1]);
        } else {
          return entity;
        }
      });
    },

    escapeRegExp: function(str){
      if (str == null) return '';
      return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    },

    splice: function(str, i, howmany, substr){
      var arr = _s.chars(str);
      arr.splice(~~i, ~~howmany, substr);
      return arr.join('');
    },

    insert: function(str, i, substr){
      return _s.splice(str, i, 0, substr);
    },

    include: function(str, needle){
      if (needle === '') return true;
      if (str == null) return false;
      return String(str).indexOf(needle) !== -1;
    },

    join: function() {
      var args = slice.call(arguments),
        separator = args.shift();

      if (separator == null) separator = '';

      return args.join(separator);
    },

    lines: function(str) {
      if (str == null) return [];
      return String(str).split("\n");
    },

    reverse: function(str){
      return _s.chars(str).reverse().join('');
    },

    startsWith: function(str, starts){
      if (starts === '') return true;
      if (str == null || starts == null) return false;
      str = String(str); starts = String(starts);
      return str.length >= starts.length && str.slice(0, starts.length) === starts;
    },

    endsWith: function(str, ends){
      if (ends === '') return true;
      if (str == null || ends == null) return false;
      str = String(str); ends = String(ends);
      return str.length >= ends.length && str.slice(str.length - ends.length) === ends;
    },

    succ: function(str){
      if (str == null) return '';
      str = String(str);
      return str.slice(0, -1) + String.fromCharCode(str.charCodeAt(str.length-1) + 1);
    },

    titleize: function(str){
      if (str == null) return '';
      str  = String(str).toLowerCase();
      return str.replace(/(?:^|\s|-)\S/g, function(c){ return c.toUpperCase(); });
    },

    camelize: function(str){
      return _s.trim(str).replace(/[-_\s]+(.)?/g, function(match, c){ return c ? c.toUpperCase() : ""; });
    },

    underscored: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    },

    dasherize: function(str){
      return _s.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    },

    classify: function(str){
      return _s.titleize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, '');
    },

    humanize: function(str){
      return _s.capitalize(_s.underscored(str).replace(/_id$/,'').replace(/_/g, ' '));
    },

    trim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrim) return nativeTrim.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('\^' + characters + '+|' + characters + '+$', 'g'), '');
    },

    ltrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimLeft) return nativeTrimLeft.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('^' + characters + '+'), '');
    },

    rtrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimRight) return nativeTrimRight.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp(characters + '+$'), '');
    },

    truncate: function(str, length, truncateStr){
      if (str == null) return '';
      str = String(str); truncateStr = truncateStr || '...';
      length = ~~length;
      return str.length > length ? str.slice(0, length) + truncateStr : str;
    },

    /**
     * _s.prune: a more elegant version of truncate
     * prune extra chars, never leaving a half-chopped word.
     * @author github.com/rwz
     */
    prune: function(str, length, pruneStr){
      if (str == null) return '';

      str = String(str); length = ~~length;
      pruneStr = pruneStr != null ? String(pruneStr) : '...';

      if (str.length <= length) return str;

      var tmpl = function(c){ return c.toUpperCase() !== c.toLowerCase() ? 'A' : ' '; },
        template = str.slice(0, length+1).replace(/.(?=\W*\w*$)/g, tmpl); // 'Hello, world' -> 'HellAA AAAAA'

      if (template.slice(template.length-2).match(/\w\w/))
        template = template.replace(/\s*\S+$/, '');
      else
        template = _s.rtrim(template.slice(0, template.length-1));

      return (template+pruneStr).length > str.length ? str : str.slice(0, template.length)+pruneStr;
    },

    words: function(str, delimiter) {
      if (_s.isBlank(str)) return [];
      return _s.trim(str, delimiter).split(delimiter || /\s+/);
    },

    pad: function(str, length, padStr, type) {
      str = str == null ? '' : String(str);
      length = ~~length;

      var padlen  = 0;

      if (!padStr)
        padStr = ' ';
      else if (padStr.length > 1)
        padStr = padStr.charAt(0);

      switch(type) {
        case 'right':
          padlen = length - str.length;
          return str + strRepeat(padStr, padlen);
        case 'both':
          padlen = length - str.length;
          return strRepeat(padStr, Math.ceil(padlen/2)) + str
                  + strRepeat(padStr, Math.floor(padlen/2));
        default: // 'left'
          padlen = length - str.length;
          return strRepeat(padStr, padlen) + str;
        }
    },

    lpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr);
    },

    rpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'right');
    },

    lrpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'both');
    },

    sprintf: sprintf,

    vsprintf: function(fmt, argv){
      argv.unshift(fmt);
      return sprintf.apply(null, argv);
    },

    toNumber: function(str, decimals) {
      if (!str) return 0;
      str = _s.trim(str);
      if (!str.match(/^-?\d+(?:\.\d+)?$/)) return NaN;
      return parseNumber(parseNumber(str).toFixed(~~decimals));
    },

    numberFormat : function(number, dec, dsep, tsep) {
      if (isNaN(number) || number == null) return '';

      number = number.toFixed(~~dec);
      tsep = typeof tsep == 'string' ? tsep : ',';

      var parts = number.split('.'), fnums = parts[0],
        decimals = parts[1] ? (dsep || '.') + parts[1] : '';

      return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep) + decimals;
    },

    strRight: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strRightBack: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.lastIndexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strLeft: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    strLeftBack: function(str, sep){
      if (str == null) return '';
      str += ''; sep = sep != null ? ''+sep : sep;
      var pos = str.lastIndexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    toSentence: function(array, separator, lastSeparator, serial) {
      separator = separator || ', ';
      lastSeparator = lastSeparator || ' and ';
      var a = array.slice(), lastMember = a.pop();

      if (array.length > 2 && serial) lastSeparator = _s.rtrim(separator) + lastSeparator;

      return a.length ? a.join(separator) + lastSeparator + lastMember : lastMember;
    },

    toSentenceSerial: function() {
      var args = slice.call(arguments);
      args[3] = true;
      return _s.toSentence.apply(_s, args);
    },

    slugify: function(str) {
      if (str == null) return '';

      var from  = "ąàáäâãåæăćęèéëêìíïîłńòóöôõøśșțùúüûñçżź",
          to    = "aaaaaaaaaceeeeeiiiilnoooooosstuuuunczz",
          regex = new RegExp(defaultToWhiteSpace(from), 'g');

      str = String(str).toLowerCase().replace(regex, function(c){
        var index = from.indexOf(c);
        return to.charAt(index) || '-';
      });

      return _s.dasherize(str.replace(/[^\w\s-]/g, ''));
    },

    surround: function(str, wrapper) {
      return [wrapper, str, wrapper].join('');
    },

    quote: function(str, quoteChar) {
      return _s.surround(str, quoteChar || '"');
    },

    unquote: function(str, quoteChar) {
      quoteChar = quoteChar || '"';
      if (str[0] === quoteChar && str[str.length-1] === quoteChar)
        return str.slice(1,str.length-1);
      else return str;
    },

    exports: function() {
      var result = {};

      for (var prop in this) {
        if (!this.hasOwnProperty(prop) || prop.match(/^(?:include|contains|reverse)$/)) continue;
        result[prop] = this[prop];
      }

      return result;
    },

    repeat: function(str, qty, separator){
      if (str == null) return '';

      qty = ~~qty;

      // using faster implementation if separator is not needed;
      if (separator == null) return strRepeat(String(str), qty);

      // this one is about 300x slower in Google Chrome
      for (var repeat = []; qty > 0; repeat[--qty] = str) {}
      return repeat.join(separator);
    },

    naturalCmp: function(str1, str2){
      if (str1 == str2) return 0;
      if (!str1) return -1;
      if (!str2) return 1;

      var cmpRegex = /(\.\d+)|(\d+)|(\D+)/g,
        tokens1 = String(str1).toLowerCase().match(cmpRegex),
        tokens2 = String(str2).toLowerCase().match(cmpRegex),
        count = Math.min(tokens1.length, tokens2.length);

      for(var i = 0; i < count; i++) {
        var a = tokens1[i], b = tokens2[i];

        if (a !== b){
          var num1 = parseInt(a, 10);
          if (!isNaN(num1)){
            var num2 = parseInt(b, 10);
            if (!isNaN(num2) && num1 - num2)
              return num1 - num2;
          }
          return a < b ? -1 : 1;
        }
      }

      if (tokens1.length === tokens2.length)
        return tokens1.length - tokens2.length;

      return str1 < str2 ? -1 : 1;
    },

    levenshtein: function(str1, str2) {
      if (str1 == null && str2 == null) return 0;
      if (str1 == null) return String(str2).length;
      if (str2 == null) return String(str1).length;

      str1 = String(str1); str2 = String(str2);

      var current = [], prev, value;

      for (var i = 0; i <= str2.length; i++)
        for (var j = 0; j <= str1.length; j++) {
          if (i && j)
            if (str1.charAt(j - 1) === str2.charAt(i - 1))
              value = prev;
            else
              value = Math.min(current[j], current[j - 1], prev) + 1;
          else
            value = i + j;

          prev = current[j];
          current[j] = value;
        }

      return current.pop();
    },

    toBoolean: function(str, trueValues, falseValues) {
      if (typeof str === "number") str = "" + str;
      if (typeof str !== "string") return !!str;
      str = _s.trim(str);
      if (boolMatch(str, trueValues || ["true", "1"])) return true;
      if (boolMatch(str, falseValues || ["false", "0"])) return false;
    }
  };

  // Aliases

  _s.strip    = _s.trim;
  _s.lstrip   = _s.ltrim;
  _s.rstrip   = _s.rtrim;
  _s.center   = _s.lrpad;
  _s.rjust    = _s.lpad;
  _s.ljust    = _s.rpad;
  _s.contains = _s.include;
  _s.q        = _s.quote;
  _s.toBool   = _s.toBoolean;

  // Exporting

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      module.exports = _s;

    exports._s = _s;
  }

  // Register as a named module with AMD.
  if (typeof define === 'function' && define.amd)
    define('underscore.string', [], function(){ return _s; });


  // Integrate with Underscore.js if defined
  // or create our own underscore object.
  root._ = root._ || {};
  root._.string = root._.str = _s;
}(this, String);

define( 'String.nocomplex/uncapitalize',[],function() {

    String.prototype.uncapitalize = function() {
        return ( this[ 0 ].toLowerCase() + this.substr( 1, this.length - 1 ) );
    };

} );
/**
 * String.nocomplex version: "0.0.9" Copyright (c) 2011-2012, Cyril Agosta ( cyril.agosta.dev@gmail.com) All Rights Reserved.
 * Available via the MIT license.
 * see: http://github.com/cagosta/String.nocomplex for details
 */

define( 'String.nocomplex/String.nocomplex',[
    'underscore.string',
    './uncapitalize'
 ], function( helpers, uncapitalize ) {


    
    var slice = Array.prototype.slice,
        addMethod = function( method ) {
            String.prototype[ method ] = function() {
                var args = slice.call( arguments )
                args.unshift( this )
                return helpers[ method ].apply( this, args )
            }
        }

    for ( var method in helpers )
        if ( helpers.hasOwnProperty( method ) ) {
            addMethod( method )
        }

    return String.prototype

} );
define( 'Array.nocomplex/collect',[],function() {

    Array.prototype.collect = function( f ) {
        var res = [];
        if ( typeof( f ) === "string" ) {
            for ( var i = -1, n = this.length; ++i < n; ) {
                res.push( this[ i ][ f ] );
            }
        } else {
            for ( var i = -1, n = this.length; ++i < n; ) {
                res.push( f( this[ i ] ) );
            }
        }
        return res;
    };

} );
define( 'Array.nocomplex/each',[],function() {

    Array.prototype.each = function( f ) {
        for ( var i = 0, n = this.length; i < n; i++ ) {
            f( this[ i ], i );
        }
        return this;
    };

} );
define( 'Array.nocomplex/first',[],function() {

    Array.prototype.first = function( f ) {
        for ( var i = 0, n = this.length; i < n; i++ ) {
            if ( f( this[ i ] ) ) return this[ i ];
        }
        return null;
    };

} );
define( 'Array.nocomplex/has',[],function() {

    Array.prototype.has = function( value ) {
        for ( var i = this.length; i--; ) {
            if ( this[ i ] === value ) {
                return true;
            }
        }
        return false;
    };

} );
define( 'Array.nocomplex/last',[],function() {

    Array.prototype.last = function() {
        return this[ this.length - 1 ];
    };

} );
define( 'Array.nocomplex/map',[],function() {


    Array.prototype.map = Array.prototype.map || function( fn, scope ) {
        if ( scope ) fn = fn.bind( scope );
        var r = this.slice();
        if ( typeof( fn ) === 'function' ) {
            for ( var i = 0, n = r.length; i < n; i++ ) r[ i ] = fn( r[ i ], i );
        } else {
            fn = fn.substr( 2, fn.length );
            for ( var i = 0, n = r.length; i < n; i++ ) r[ i ] = r[ i ][ fn ]();
        }
        return r;
    };


} );
define( 'Array.nocomplex/onEls',[],function() {

    Array.prototype.onEls = function( f ) {
        for ( var i = this.length; i--; ) this[ i ] = f( this[ i ], i );
        return this;
    };

} );
define( 'Array.nocomplex/remove',[],function() {

    Array.prototype.remove = function( v ) {
        for ( var i = this.length; i--; ) {
            if ( this[ i ] === v ) this.splice( i, 1 );
        }
        return this;
    };

} );
define( 'Array.nocomplex/removeOneValue',[],function() {

    Array.prototype.removeOneValue = function( v ) {
        for ( var i = this.length; i--; ) {
            if ( this[ i ] === v ) {
                return ( this.splice( i, 1 ) );
            }
        }
    };

} );
define( 'Array.nocomplex/except',[],function() {

    Array.prototype.except = function( v ) {
        var res = [];
        for ( var i = 0, n = this.length; i < n; i++ )
            if ( this[ i ] !== v ) res.push( this[ i ] )
        return res;
    }

} );
define( 'Array.nocomplex/exceptFn',[],function() {

    Array.prototype.exceptFn = function( f ) {
        var r = this.slice();
        for ( var i = r.length; i--; )
            if ( f( r[ i ] ) ) r.splice( i, 1 );
        return r;
    }

} );
define( 'Array.nocomplex/indexOf',[],function() {


    Array.prototype.indexOf = Array.prototype.indexOf || function( s ) {
        var i, l
        for ( i = 0, l = this.length; i < l; i++ )
            if ( this[ i ] === s )
                return i
        return -1
    };

} );
define( 'Array.nocomplex/isIn',[ './has' ], function() {


    Array.prototype.isIn = function( array ) {
        for ( var i = this.length; i--; ) {
            if ( !array.has( this[ i ] ) ) return false;
        }
        return true;
    }

} );
define( 'Array.nocomplex/send',[],function() {

    Array.prototype.send = function( method ) {
        var args = Array.prototype.slice.call( arguments );
        args.splice( 0, 1 );
        if ( typeof( method ) === 'string' ) {
            for ( var i = -1, n = this.length; ++i < n; ) {
                if ( this[ i ] )
                    this[ i ][ method ].apply( this[ i ], args );
            }
        } else
            for ( var i = -1, n = this.length; ++i < n; ) method.apply( {}, [ this[ i ] ].concat( args ) );
        return this;
    };

} );
define( 'Array.nocomplex/uniq',[ './has' ], function() {

    Array.prototype.uniq = function( f ) {
        if ( !f ) {
            var res = []
            for ( var i = this.length; i--; ) {
                !res.has( this[ i ] ) && res.push( this[ i ] );
            }
            return res;
        } else {
            var res = [],
                _r = [];
            for ( var i = 0, n = this.length; i < n; i++ ) {
                var v = f( this[ i ] );
                if ( !_r.has( v ) ) {
                    res.push( this[ i ] )
                    _r.push( v );
                }
            }
            return res;
        }
    }

} );
define( 'Array.nocomplex/equals',[ './isIn' ], function() {

    Array.prototype.equals = function( array ) {
        if ( this.isIn( array ) && array.isIn( this ) ) {
            return true;
        }
        return false;
    };


} );
define( 'Array.nocomplex/find',[],function() {

  Array.prototype.find = function( f ) {
    for ( var i = 0, n = this.length; i < n; i++ ) {
      if ( f( this[ i ], i ) ) return this[ i ];
    }
    return false;
  };

  Array.prototype.findReverse = function( f ) {
    for ( var i = this.length; i--; ) {
      if ( f( this[ i ], i ) ) return this[ i ];
    }
    return false;
  };

} );
define( 'Array.nocomplex/where',[],function() {

    Array.prototype.where = function( f ) {
        var res = [];
        for ( var i = 0, n = this.length; i < n; i++ ) {
            if ( f( this[ i ] ) ) res.push( this[ i ] );
        }
        return res;
    }

} );
define( 'Array.nocomplex/findIndexOf',[],function() {

    Array.prototype.findIndexOf = function( f ) {
        for ( var i = 0, n = this.length; i < n; i++ ) {
            if ( f( this[ i ], i ) ) return i;
        }
        return false;
    };


} );
define( 'Array.nocomplex/findByKey',[],function() {

    Array.prototype.findByKey = function( key, value ) {
        for ( var i = 0, n = this.length; i < n; i++ ) {
            if ( this[ i ][ key ] === value ) return this[ i ];
        }
        return false;
    };

} );
define( 'Array.nocomplex/basics',[
	'./collect',
	'./each',
	'./first',
	'./has',
	'./last',
	'./map',
	'./onEls',
	'./remove',
	'./removeOneValue',
	'./remove',
	'./except',
	'./exceptFn',
	'./indexOf',
	'./isIn',
	'./send',
	'./uniq',
	'./equals',
	'./find',
	'./where',
	'./findIndexOf',
	'./findByKey'
 ], function(){ return Array.prototype });
define( 'Array.nocomplex/math/all',[],function() {

    var methods = {

        equals: function( a ) {
            for ( var i = this.length; i--; )
                if ( a[ i ] !== this[ i ] ) return false;
            return true;
        },

        multiply: function( a ) {
            var ret = [];
            if ( typeof( a ) === 'number' ) {
                for ( var i = this.length; i--; ) {
                    ret[ i ] = this[ i ] * a;
                }
            } else {
                for ( var i = this.length; i--; ) {
                    ret[ i ] = this[ i ] * a[ i ];
                }
            }
            return ( ret );
        },

        divide: function( a ) {
            var ret = [];
            if ( typeof( a ) === 'number' ) {
                for ( var i = this.length; i--; ) {
                    ret[ i ] = this[ i ] / a;
                }
            } else {
                for ( var i = this.length; i--; ) {
                    ret[ i ] = this[ i ] / a[ i ];
                }
            }
            return ( ret );
        },

        min: function( f ) {
            var r = f ? this.map( f ) : this
            return Math.min.apply( null, r )
        },

        minMax: function( f ) {
            return [ this.min( f ), this.max( f ) ]
        },

        max: function( f ) {
            var r = f ? this.map( f ) : this
            return Math.max.apply( null, r )
        },

        average: function() {
            var ave = 0;
            for ( var i = this.length; i--; ) {
                ave += this[ i ]
            }
            return ave / this.length
        },

        minus: function( a ) {
            var ret = [];
            if ( typeof( a ) === 'number' ) {
                for ( var i = this.length; i--; ) {
                    ret[ i ] = this[ i ] - a;
                }
            } else {
                for ( var i = this.length; i--; ) {
                    ret[ i ] = this[ i ] - a[ i ];
                }
            }
            return ( ret );
        },

        domain: function( bounds, range ) {
            var min = range && typeof range[ 0 ] === "number" ? range[ 0 ] : this.min(),
                max = range && typeof range[ 1 ] === "number" ? range[ 1 ] : this.max(),
                a, b;
            if ( min === max ) { // if all data are equal, return range[ 0 ]
                return this.map( function() { 
                    return bounds[ 0 ]
                } )
            }
            a = ( bounds[ 1 ] - bounds[ 0 ] ) / ( max - min );
            b = ( bounds[ 0 ] * max - bounds[ 1 ] * min ) / ( max - min )
            return this.multiply( a ).add( b )
        },

        add: function( a ) {
            var ret = [];
            if ( typeof( a ) === 'number' ) {
                for ( var i = this.length; i--; ) {
                    ret[ i ] = this[ i ] + a;
                }
            } else {
                for ( var i = this.length; i--; ) {
                    ret[ i ] = this[ i ] + a[ i ];
                }
            }
            return ( ret );
        },

        round: function() {
            for ( var i = this.length; i--; ) {
                this[ i ] = Math.round( this[ i ] );
            }
            return ( this );
        },

        sum: function( f ) {
            var r = 0
            for ( var i = this.length; i--; ) {
                r += f( i )
            }
            return r
        },

        orth: function() {
            if ( this.length != 2 ) {
                throw Error;
            }
            return [ -this[ 1 ], this[ 0 ] ];
        },

        norm: function() {
            return Math.sqrt( this.sum( function( i ) {
                return i * i
            } ) );
        }

    };

    for ( var method in methods )
        if ( methods.hasOwnProperty( method ) )
            Array.prototype[  method ] = methods[ method ]


    return Array.prototype
    
} );
define('Array.nocomplex/all',[
	'./basics', 
	'./math/all'
], function(){ return Array.prototype });
define( 'SeedView/Parser',[
    'Seed/Seed'
 ], function( Seed ) {


    return Seed.extend( {


        parse: function() {

            console.log( 'overide me' )

        }

    } )

} );
define('SeedView/parsers/HTMLParser',[
    '../Parser'
], function( Parser ){


    return Parser.extend({

        '+options': {
            name: 'html'
        },

        '+constructor': function( ){
            
        },

        parse: function( view ) { // dirty


            var fragment = document.createElement(),
                container = document.createElement( 'container' ),
                flaggedElements
                container.innerHTML = view.template
                fragment.appendChild( container.childNodes[ 0 ] )
                view._fragment = fragment
                view._elements = {
                    root: view._fragment
                }
            flaggedElements = view.getElementsByAttribute( 'flag' )
            for ( var i = 0; i < flaggedElements.length; i++ ) {
                view.addElement( flaggedElements[ i  ].getAttribute( 'flag' ), flaggedElements[ i ] )
            }
        }

    })


});
/**
 * toDOM version: "0.0.7" Copyright (c) 2011-2012, Cyril Agosta ( cyril.agosta.dev@gmail.com) All Rights Reserved.
 * Available via the MIT license.
 * see: http://github.com/cagosta/toDOM for details
 */

define( 'toDOM/toDOM',[],function () {

    return function toDOM( tree, scope ) {

        var obj = tree,
            k, l, el, attr, childEl, p, q, evt, style, children

        if ( !obj.tag )
            obj.tag = 'div'


        el = document.createElement( obj.tag )

        if ( obj.attr )
            for ( attr in obj.attr )
                if ( obj.attr.hasOwnProperty( attr ) )
                    el.setAttribute( attr, obj.attr[ attr ] )



        if ( obj.label )
            scope[ obj.label ] = el


        if ( obj.className )
            el.className = obj.className


        if ( typeof( obj.innerHTML ) !== 'undefined' )
            if ( typeof( obj.innerHTML ) === 'function' )
                el.innerHTML = obj.innerHTML.call( scope ) || ''
            else
                el.innerHTML = obj.innerHTML

        if ( obj.events )
            for ( evt in obj.events )
                if ( obj.events.hasOwnProperty( evt ) )
                    el[ 'on' + evt ] = obj.events[ evt ]


        if ( obj.style )
            for ( style in obj.style )
                if ( obj.style.hasOwnProperty( style ) )
                    el.style[ style ] = obj.style[ style ]


        if ( obj.children ) {
            children = obj.children
            for ( k = 0, l = children.length; k < l; k++ ) {
                childEl = toDOM( children[ k ], scope )
                el.appendChild( childEl )
            }
        }

        return el

    }

} );
define('SeedView/parsers/ToDOMParser',[
    '../Parser',
    'toDOM/toDOM'
], function( Parser, toDOM ){
    
    return Parser.extend({

        '+options': {
            name: 'toDOM'
        },

        '+constructor': function( ){

        },

        parse: function( view ){ // dirty
            var elements = { },
                template = view.getTemplate(),
                node = toDOM( template, elements )

            return {
                node: node,
                elements: elements
            }
        }

    })

});
define( 'SeedView/parsers/DOMParser',[
    '../Parser'
 ], function( Parser ) {

    return Parser.extend( {

        '+options': {
            name: 'dom'
        },

        '+constructor': function() {

        },

        parse: function( view ) { // todo add label?
            return {
                node: view.getTemplate()
            }
        }

    } )

} );
define( 'SeedView/parsers/defaultParsers',[
    './HTMLParser',
    './ToDOMParser',
    './DOMParser'
 ], function( HTMLParser, ToDOMParser, DOMParser ) {

    return {
        toDOM: new ToDOMParser,
        html: new HTMLParser,
        dom: new DOMParser
    }


} );
/**
 * SeedView version: "0.0.21" Copyright (c) 2011-2012, Cyril Agosta ( cyril.agosta.dev@gmail.com) All Rights Reserved.
 * Available via the MIT license.
 * see: http://github.com/cagosta/SeedView for details
 */

define( 'SeedView/SeedView',[
    'Seed/Seed',
    'mangrove-utils/dom/all',
    'Array.nocomplex/isArray',
    'String.nocomplex/String.nocomplex',
    'Array.nocomplex/all',
    './parsers/defaultParsers'
], function( Seed, dom, isArray, Str, Arr, defaultParsers ) {

    /**
     *
     * @constructor SeedView
     *
     */


    var View = Seed.extend(  {

        type: 'View',

        accessors: [ 'data', 'node', 'template', 'elements' ],

        '+options': {
            parser: 'toDOM', // retrocompatibility, todo remove me
            template: null,
            events: null,
            data: null,
            parsers: defaultParsers,
            subviews: null,
            contained: null,
            elements: null,
            node: null
        },

        _isView: true,

        '+constructor': function( a, b ) {

            this.data = this.data ||  {}
            this.subviews = this.subviews || {}
            this.contained = this.contained || {}
            this.elements = this.elements  || {}
            this.detectParser()
            this.parse()


            if ( typeof this.data === 'function' )
                this.data = this.data.bind( this )()

            if ( this.events )
                this.DOMEvent( this.events )

            this._displayState = {}

        },

        hasElement: function( label ) {

            return !!this.elements[ label ]

        },

        buildSubviews: function() {

            this.eachElement( function( el, key ) {

                this.subviews[ key ] = new View( {
                    template: el
                } )

            }.bind( this ) )

        },

        eachElement: function( f ) {

            var elementIds = Object.keys( this.elements ),
                elements = this.elements;

            elementIds.each( function( key ) {

                f( elements[ key ], key )

            } )

        },

        parse: function() {

            var parser = this.parsers[  this.parser ],
                parsed, elements

            if ( !parser )
                throw new Error( 'No parser: ' + this.parser )


            parsed = parser.parse( this )


            if ( !parsed )
                throw new Error( 'Parse error ' )

            if ( !parsed.node )
                throw new Error( 'No node given from parse' )

            this.setNode( parsed.node )


            elements = parsed.elements
            if ( !elements )
                elements = {}

            elements.root = parsed.node

            this.setElements( elements )

        },

        addElement: function( key, el ) {

            this.elements[  key ] = el
            this.contained[  key ] = []

        },

        subview: function( label ) { // to do

            return this.subviews[ label ]

        },

        getElementById: function( elmLabel, id ) {

            if ( !id ) {
                id = elmLabel
                elmLabel = 'root'
            }

            return this.element( elmLabel ).getElementById( id )

        },

        getElementsByClassName: function( elmLabel, className ) {

            if ( !className ) {
                className = elmLabel
                elmLabel = 'root'
            }

            return this.element( elmLabel ).getElementsByClassName( className )

        },

        detectParser: function() {

            if ( !this.template )
                throw new Error( 'views/View needs a valid template' )
            if ( this.parser )
                return
            if ( this.template.nodeName )
                this.parser = 'dom'
            else if ( typeof this.template === 'string' && this.template.charAt( 0 ) === '<' )
                this.parser = 'html'

        },

        getElementByAttribute: function( attribute, value ) {

            var allElements = this.element( 'root' ).getElementsByTagName( '*' )

            for ( var i = 0; i < allElements.length; i++ ) {
                if ( allElements[ i ].getAttribute( attribute ) === value ) {
                    return allElements[ i ];
                }
            }

        },

        getElementsByAttribute: function( attribute ) {

            var ret = []
            var allElements = this.element( 'root' ).getElementsByTagName( '*' )

            for ( var i = 0; i < allElements.length; i++ ) {
                if ( allElements[ i ].getAttribute( attribute ) ) {
                    ret.push( allElements[ i ] )
                }
            }

            return ret

        },


        html: function() {

            return this.node

        },

        clone: function() {

            return new View( this.template, this.data )

        },

        element: function( name ) {

            if ( !this.elements || !this.elements[ name ] )
                debugger

            return this.elements[ name ]

        },

        DOMEvent: function( eltRef, event, handler, capture ) { // Benj code, pretty huh ?

            var view = this,
                elt, k, c

            if ( arguments.length <= 2 && eltRef && eltRef.constructor === Object ) {
                c = !! arguments[ 1 ]
                for ( k in eltRef )
                    ( function( eltRef, events ) {

                        var k
                        for ( k in events )
                            view.DOMEvent( eltRef, k, events[ k ], c )
                    }( k, eltRef[ k ] ) )
            } else
            if ( elt = view.element( eltRef ), elt )
                ( function( elt, handler, view ) {

                    var events = event.split( " " ),
                        i = 0,
                        l = events.length

                    for ( ; i < l; i++ )
                        dom.addEventListener( elt, events[ i ], function( e ) {

                            handler.apply( view, [  e, view ] )
                        }, !! capture )
                }( elt, handler, view ) )

            return view

        },

        checkArguments: function( args, check ) {

            var allArgs = Array.prototype.slice.call( args ) // why ?

            return allArgs.length === check;

        },

        toggle: function( elmLabel ) {

            elmLabel = elmLabel || 'root'
            if ( typeof this._displayState[ elmLabel ] === 'undefined' ) {
                this._displayState[ elmLabel ] = 1
            }
            this._displayState[ elmLabel ] ? this.hide( elmLabel ) : this.show( elmLabel )

        },

        show: function( elmLabel ) {

            elmLabel = elmLabel ||  'root'

            this.css( elmLabel, {
                display: 'block'
            } )

            this._displayState[ elmLabel ] = 1

        },

        hide: function( elmLabel ) {

            elmLabel = elmLabel || 'root'

            this.css( elmLabel, {
                display: 'none'
            } )

            this._displayState[ elmLabel ] = 0

        },

        prepend: function() {

        },

        attachEvent: function( elmLabel, eventName, cb ) {

            if ( this.checkArguments( arguments, 2 ) ) {

                cb = eventName;
                eventName = elmLabel;
                elmLabel = 'root';

            }

            var el = this.element( elmLabel )
            dom.addEventListener( el, eventName, cb.bind( this ) )

        },

        attachEvents: function( elmLabel, o ) {

            if ( !o ) {
                o = elmLabel
                elmLabel = 'root'
            }

            for ( var eventName in o )
                if ( o.hasOwnProperty( eventName ) )
                    this.attachEvent( elmLabel, eventName, o[ eventName ] )

        },

        css: function( elmLabel, o ) {

            var el, style

            if ( this.checkArguments( arguments, 1 ) ) {
                o = elmLabel;
                elmLabel = 'root';
            }

            el = this.element( elmLabel )
            style = el.style;

            if ( typeof o !== 'string' )
                for ( var i in o )
                    if ( o.hasOwnProperty( i ) )
                        style[ i ] = o[ i ]
                    else
                        for ( var i in el )
                            if ( el.hasOwnProperty( i ) )
                                if ( i == o )
                                    return style[ o ]

        },

        attr: function( elmLabel, o ) {

            var el

            if ( this.checkArguments( arguments, 1 ) ) {
                o = elmLabel;
                elmLabel = 'root';
            }

            el = this.element( elmLabel )

            for ( var i in o )
                if ( o.hasOwnProperty( i ) )
                    el[ i ] = o[ i ]

        },

        append: function( elmLabel, node ) {

            if ( !node ) {
                node = elmLabel
                elmLabel = 'root'
            }

            this.element( elmLabel ).appendChild( node )

        },

        innerText: function( elmLabel, text ) {

            var el

            if ( !text ) {
                text = elmLabel
                elmLabel = 'root'
            }

            el = this.element( elmLabel )

            if ( 'innerText' in el )
                el.innerText = text
            else
                el.textContent = text

        },

        innerHTML: function( elmLabel, text ) {

            elmLabel = elmLabel ||  'root'
            var el = this.element( elmLabel )
            el.innerHTML = text

        },

        hasClass: function( elmLabel, name ) {

            if ( this.checkArguments( arguments, 1 ) ) {
                name = elmLabel;
                elmLabel = 'root';
            }

            var el = this.element( elmLabel )

            return ( new RegExp( '(\\s|^)' + name + '(\\s|$)' ) ).test( el.className )

        },

        addClass: function( elmLabel, name ) {

            if ( this.checkArguments( arguments, 1 ) ) {
                name = elmLabel;
                elmLabel = 'root';
            }

            var el = this.element( elmLabel )
            if ( !this.hasClass( elmLabel, name ) ) {
                el.className += ( el.className ? ' ' : '' ) + name
            }

        },

        removeClass: function( elmLabel, name ) {

            if ( this.checkArguments( arguments, 1 ) ) {
                name = elmLabel
                elmLabel = 'root'
            }
            var el = this.element( elmLabel )
            if ( this.hasClass( elmLabel, name ) )
                el.className = el.className.replace( new RegExp( '(\\s|^)' + name + '(\\s|$)' ), ' ' ).replace( /^\s+|\s+$/g, '' )

        },

        insert: function( elmLabel, views ) {

            if ( !views ) {
                views = elmLabel
                elmLabel = 'container'
            }

            views = Array.isArray( views ) ? views : [ views ]
            this.contained[ elmLabel ] = this.contained[ elmLabel ] ||  []
            views.each( function( view ) {

                this.insertView( elmLabel, view )
            }.bind( this ) )

        },

        viewContained: function( elmLabel ) {

            if ( !elmLabel )
                elmLabel = 'container'

            return this.contained[ elmLabel ]

        },

        insertView: function( elmLabel, view ) {

            if ( !view )
                debugger // hell yeah

            this.contained[ elmLabel ].push( view )
            this.element( elmLabel ).appendChild( view.html() )

        },

        insertAt: function( elmLabel, view, index ) {

            var el

            elmLabel = elmLabel ||  'container'
            el = this.element( elmLabel )
            el.insertBefore( view.html(), el.childNodes[ index ] )

        },

        reoder: function( elmLabel, view, index ) { // broken

            var fromIndex = this.contained[  elmLabel ].indexOf( view )
            elmLabel = elmLabel ||  'container'

            if ( fromIndex !== -1 ) {
                this.contained[ elmLabel ].splice( index, 0, this.contained[  elmLabel ].splice( fromIndex, 1 )[ 0 ] )
                this.remove( elmLabel, view )
                this.insertAt( elmLabel, view, index )
            }

        },

        removeAll: function( elmLabel ) {

            if ( !elmLabel )
                elmLabel = 'container'

            if ( !this.hasContained( elmLabel ) )
                return


            for ( var i = 0; i < this.contained[ elmLabel ].length; i++ )
                this.remove( elmLabel, this.contained[ elmLabel ][ i ] )

        },

        hasContained: function( elmLabel ) {

            return !!this.contained[ elmLabel ]

        },

        recover: function() {

            var root = this.element( 'root' )

            if ( root.parentNode )
                root.parentNode.removeChild( root )

        },

        remove: function( elmLabel, view ) {

            var index

            elmLabel = elmLabel || 'container'
            index = this.contained[ elmLabel ].indexOf( view )
            el = view.element( 'root' )

            if ( index !== -1 ) {
                el.parentNode && el.parentNode.removeChild( el )
            }

        },

        eachContained: function( f ) {

            for ( var element in this.contained )
                if ( this.contained.hasOwnProperty( element ) )
                    f( this.viewContained( element ), element )

        },

        hasElement: function( label ) {

            return !!this.elements[ label ]

        },

        containA: function( label ) {

            return !!this.contained[ label ]

        },

        contain: function( label, view ) {

            if ( !view ) {
                view = label
                label = 'container'
            }

            return this.containA( label ) && this.contained[ label ].has( view )


        },

        hasParentNode: function() {

            return !!this.getParentNode()

        },

        getParentNode: function() {

            return this.element( 'root' ).parentNode

        },

        hasText: function( elmLabel, text ) {

            var regexp, el, innerText

            if ( !text ) {
                text = elmLabel
                elmLabel = 'root'
            }

            regexp = text

            if ( typeof regexp === 'string' )
                regexp = new RegExp( regexp, 'gi' )

            el = this.element( elmLabel )
            if ( !el )
                return false

            innerText = el.innerHTML
            return regexp.test( innerText )

        }


    } )

    return View

} );
var EngineDetector = function() {
    this.isNode = false
    this.isBrowser = false
    this.isUnknown = false
    this._exports
    this.detect()
}

EngineDetector.prototype = {

    detect: function() {
        if ( typeof module !== 'undefined' && module.exports )
            this._setAsNode()
        else if ( typeof window !== "undefined" )
            this._setAsBrowser()
        else
            this._setAsUnknown()
    },

    _setAsNode: function() {
        this.isNode = true
        this.name = 'node'
    },

    _setAsBrowser: function() {
        this.isBrowser = true
        this._global = window
        this.name = 'browser'
    },

    _setAsUnknown: function() {
        this.isUnknown = true
        this.name = 'unknown'
    },

    setGlobal: function( e ) {
        this._global = e
    },

    ifNode: function( f ) {
        if ( this.isNode )
            f()
    },

    ifBrowser: function( f ) {
        if ( this.isBrowser )
            f()
    },


    exports: function( key, exported ) {
        if ( this.isNode ) {
            this._global.exports = exported
        } else if ( this.isBrowser )
            this._global[  key ] = exported
    },

}

var engine = new EngineDetector()


var baseUrl, requirejs;

engine.ifNode( function() {

    baseUrl = __dirname
    requirejs = require( 'requirejs' )
    engine.setGlobal( module )

} )

engine.ifBrowser( function() {
    baseUrl = '.'
} )


requirejs.config( {
    baseUrl: function(){ return ( typeof define === 'undefined') ? __dirname: '.'}(),
    shim: {
        mocha: {
            exports: 'mocha'
        }
    },
    paths: {
        SeedView: '.',
        engineDetector: 'bower_components/engineDetector/app',
        almond: 'bower_components/almond/almond',
        chai: 'bower_components/chai/chai',
        'chai-as-promised': 'bower_components/chai-as-promised/lib/chai-as-promised',
        mocha: 'bower_components/mocha/mocha',
        'normalize-css': 'bower_components/normalize-css/normalize.css',
        requirejs: 'bower_components/requirejs/require',
        async: 'bower_components/requirejs-plugins/src/async',
        depend: 'bower_components/requirejs-plugins/src/depend',
        font: 'bower_components/requirejs-plugins/src/font',
        goog: 'bower_components/requirejs-plugins/src/goog',
        image: 'bower_components/requirejs-plugins/src/image',
        json: 'bower_components/requirejs-plugins/src/json',
        mdown: 'bower_components/requirejs-plugins/src/mdown',
        noext: 'bower_components/requirejs-plugins/src/noext',
        propertyParser: 'bower_components/requirejs-plugins/src/propertyParser',
        'Markdown.Converter': 'bower_components/requirejs-plugins/lib/Markdown.Converter',
        text: 'bower_components/requirejs-plugins/lib/text',
        'sinon-chai': 'bower_components/sinon-chai/lib/sinon-chai',
        sinonjs: 'bower_components/sinonjs/sinon',
        'Array.nocomplex': 'bower_components/Array.nocomplex/app',
        'String.nocomplex': 'bower_components/String.nocomplex/app',
        'mangrove-utils': 'bower_components/mangrove-utils/app',
        'underscore.string': 'bower_components/underscore.string/lib/underscore.string',
        ifEngineIsNode: 'bower_components/engineDetector/app/ifEngineIsNode',
        ifEngineIsBrowser: 'bower_components/engineDetector/app/ifEngineIsBrowser',
        toDOM: 'bower_components/toDOM/app',
        Seed: 'bower_components/Seed/app',
        window: 'bower_components/engineDetector/app/window',
        engine: 'bower_components/engineDetector/app/engine'
    }
} )


var isStandalone = !! requirejs._defined,
    synchronous = isStandalone

engine.ifNode(function(){

    synchronous = true

})

if ( synchronous ) { // case standalone

    var SeedView = requirejs( 'SeedView/SeedView' )

    engine.exports( 'SeedView', SeedView )


} else {

    requirejs( [ 'SeedView/SeedView' ], function( SeedView ) {
        engine.exports( 'SeedView', SeedView )
    } )

}
;
define("SeedView/main", function(){});
}());