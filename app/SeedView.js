/**
 * SeedView version: "0.0.17" Copyright (c) 2011-2012, Cyril Agosta ( cyril.agosta.dev@gmail.com) All Rights Reserved.
 * Available via the MIT license.
 * see: http://github.com/cagosta/SeedView for details
 */

define( [
    'Seed/Seed',
    'mangrove-utils/dom/all',
    'Array.nocomplex/isArray',
    'String.nocomplex/String.nocomplex',
    'Array.nocomplex/all',
    './parsers/defaultParsers'
 ], function( Seed, dom, isArray, Str, Arr, defaultParsers ) {


    var View = Seed.extend(  {

        type: 'View',

        accessors: [ 'data', 'node', 'template', 'elements' ],

        '+options': {
            parser: null, // retrocompatibility, todo remove me
            template: 'div.default_seedview_template',
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
            this.elements = this.elements || {}
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

        subview: function( label ) {
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
            else
                this.parser = 'zen'
        },

        getElementByAttribute: function( attribute, value ) {
            var allElements = this.element( 'root' ).getElementsByTagName( '*' );
            for ( var i = 0; i < allElements.length; i++ ) {
                if ( allElements[ i ].getAttribute( attribute ) === value ) {
                    return allElements[ i ];
                }
            }
        },

        getElementsByAttribute: function( attribute ) {
            var ret = []
            var allElements = this.element( 'root' ).getElementsByTagName( '*' );
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

        DOMEvent: function( eltRef, event, handler, capture ) {
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
            var allArgs = Array.prototype.slice.call( args );
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

        css: function( elmLabel, o ) {
            if ( this.checkArguments( arguments, 1 ) ) {
                o = elmLabel;
                elmLabel = 'root';
            }
            var el = this.element( elmLabel )
            var style = el.style;
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
            if ( this.checkArguments( arguments, 1 ) ) {
                o = elmLabel;
                elmLabel = 'root';
            }
            var el = this.element( elmLabel )
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
            elmLabel = elmLabel || 'root'
            var el = this.element( elmLabel )
            el.innerText = text
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
            return ( new RegExp( '(\\s|^)' + name + '(\\s|$)' ) ).test( el.className );
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

        contained: function( elmLabel ) {
            if ( !elmLabel )
                elmLabel = 'root'
            return this.contained[ elmLabel ]
        },

        insertView: function( elmLabel, view ) {
            if ( !view )
                debugger
            this.contained[ elmLabel ].push( view )
            this.element( elmLabel ).appendChild( view.html() )
        },

        insertAt: function( elmLabel, view, index ) {
            elmLabel = elmLabel ||  'container'
            var el = this.element( elmLabel )
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
            if ( !this.hasContained( elmLabel ) ) {
                return
            }
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
            elmLabel = elmLabel || 'container'
            var index = this.contained[ elmLabel ].indexOf( view ),
                el = view.element( 'root' )
                if ( index !== -1 ) {
                    el.parentNode && el.parentNode.removeChild( el )
                }
        },

        eachContained: function( f ) {
            for ( var element in this.contained )
                if ( this.contained.hasOwnProperty( element ) )
                    f( this.contained( element ), element )
        }


    } )

    return View

} )