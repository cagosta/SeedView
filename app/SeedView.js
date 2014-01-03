/**
 * SeedView version: "0.0.3" Copyright (c) 2011-2012, Cyril Agosta ( cyril.agosta.dev@gmail.com) All Rights Reserved.
 * Available via the MIT license.
 * see: http://github.com/cagosta/SeedView for details
 */

define( [
    'SeedHq/Seed',
    'utils/dom/all',
    'Array.nocomplex/isArray',
    'String.nocomplex/String.nocomplex',
    'Array.nocomplex/all'
 ], function( Seed, dom, HTMLExpression, isArray, Str, Arr ) {


    var View = Seed.extend(  {

        type: 'View',

        accessors: [ 'data', 'rawData|PlainObject' ],

        '+options': {
            parser: null,
            template: null,
            rawData: null,
            events: null,
            data: null
        },

        _isView: true,

        '+constructor': function( a, b ) {
            if ( b ) {
                this.template = a
                this.data = b
            }
            this._template = this.template
            this._data = this.data
            this._elements = {}
            this._contained = {}
            this._subviews = {}
            this.detectParser()
            this.parse()

            if ( this._DOMEvents )
                this.DOMEvent( this._DOMEvents )
            if ( this.events )
                this.DOMEvent( this.events )
            this._displayState = {}
        },


        buildSubviews: function() {
            this.eachElement( function( el, key ) {
                this._subviews[ key ] = new View( {
                    template: el
                } )
            }.bind( this ) )
        },

        eachElement: function( f ) {
            var elementIds = Object.keys( this._elements ),
                elements = this._elements
                elementIds.each( function( key ) {
                    f( elements[ key ], key )
                } )
        },

        parse: function() {
            this[ 'parse' + this.parser.capitalize() ]()
        },

        parseHtml: function() {
            var fragment = document.createDocumentFragment(),
                container = document.createElement( 'container' ),
                flaggedElements
                container.innerHTML = this.template
                fragment.appendChild( container.childNodes[ 0 ] )
                this._fragment = fragment
                this._elements = {
                    root: this._fragment
                }
            flaggedElements = this.getElementsByAttribute( 'flag' )
            for ( var i = 0; i < flaggedElements.length; i++ ) {
                this.addElement( flaggedElements[ i  ].getAttribute( 'flag' ), flaggedElements[ i ] )
            }
        },

        addElement: function( key, el ) {
            this._elements[  key ] = el
            this._contained[  key ] = []
        },

        subview: function( label ) {
            return this._subviews[ label ]
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


        parseDOMElement: function() {
            this._fragment = this.template
            this._elements = {
                root: this._fragment
            }
        },

        detectParser: function() {
            if ( !this.template )
                throw new Error( 'views/View needs a valid template' )
            if ( this.parser )
                return
            if ( this.template.nodeName )
                this.parser = 'DOMElement'
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


        _fragmentStatus: 1,
        _signature: '',

        html: function() {
            // if ( !this._fragmentStatus )
            //     this.recover()

            this._fragmentStatus = 0
            return this._fragment
        },

        recover: function() {
            var buffer, rootElts = ( buffer = this.element( "root" ), Array.isArray( buffer ) ) ? buffer : buffer ? [ buffer ] : [],
                i = 0,
                l = rootElts.length

                this._fragment = document.createDocumentFragment()

                for ( ; i < l; i++ )
                    this._fragment.appendChild( rootElts[ i ] )
                this._fragmentStatus = 1
        },

        clone: function() {
            return new View( this.template, this.data )
        },

        element: function( name ) {
            return Array.isArray( this._elements[ name ] ) ? [].concat( this._elements[ name ] ) : this._elements[ name ]
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

        setSignature: function( signature ) {
            this._signature = signature;
        },

        error: function( message ) {
            var name = this._name ? '[' + this._name + ']' : '';
            throw new Error( '[View]' + name + ' ' + message + '.' );
        },

        errorElementNotFound: function( name ) {
            this.error( 'element label (' + name + ') not found' );
        },

        errorAgumentInvalid: function( argument ) {
            this.error( this._signature + ': ' + argument + ' is invalid' );
        },

        errorNotAView: function( name ) {
            this.error( this._signature + ': ' + name + ' is not a view instance' );
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
            this.setSignature( 'attachEvent(elmLabel, eventName, cb)' );
            if ( this.checkArguments( arguments, 2 ) ) {
                cb = eventName;
                eventName = elmLabel;
                elmLabel = 'root';
            }
            if ( !eventName ) {
                this.errorAgumentInvalid( 'eventName' );
            }
            if ( !cb ) {
                this.errorAgumentInvalid( 'cb' );
            }
            var el = this.element( elmLabel )
            if ( !el ) {
                this.errorElementNotFound( elmLabel );
                return;
            }
            dom.addEventListener( el, eventName, cb.bind( this ) )
        },

        css: function( elmLabel, o ) {
            this.setSignature( 'css(elmLabel, o)' );
            if ( this.checkArguments( arguments, 1 ) ) {
                o = elmLabel;
                elmLabel = 'root';
            }
            if ( !o ) {
                this.errorAgumentInvalid( 'o' );
            }
            var el = this.element( elmLabel )
            if ( !el ) {
                this.errorElementNotFound( elmLabel );
                return;
            }
            var style = el.style;
            if ( !style ) {
                this.error( 'element label (' + elmLabel + ') has no styles found' );
                return;
            }
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
            this.setSignature( 'attr(elmLabel, o)' );
            if ( this.checkArguments( arguments, 1 ) ) {
                o = elmLabel;
                elmLabel = 'root';
            }
            if ( !o ) {
                this.errorAgumentInvalid( 'o' );
            }
            var el = this.element( elmLabel )
            if ( !el ) {
                this.errorElementNotFound( elmLabel );
                return;
            }
            if ( typeof o !== 'string' ) {
                for ( var i in o ) {
                    if ( o.hasOwnProperty( i ) ) {
                        el[ i ] = o[ i ]
                    }
                }
            } else {
                for ( var i in el ) {
                    if ( el.hasOwnProperty( i ) ) {
                        if ( i == o ) {
                            return el[ o ]
                        }
                    }
                }
            }
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
            if ( !el ) {
                this.errorElementNotFound( elmLabel );
                return;
            }
            el.innerText = text
        },

        innerHTML: function( elmLabel, text ) {
            elmLabel = elmLabel ||  'root'
            var el = this.element( elmLabel )
            if ( !el ) {
                this.errorElementNotFound( elmLabel );
                return;
            }
            el.innerHTML = text
        },

        hasClass: function( elmLabel, name ) {
            this.setSignature( 'hasClass(elmLabel, name)' );
            if ( this.checkArguments( arguments, 1 ) ) {
                name = elmLabel;
                elmLabel = 'root';
            }
            var el = this.element( elmLabel )
            if ( !el ) {
                this.errorElementNotFound( elmLabel );
                return;
            }
            if ( typeof name !== 'string' ) {
                this.errorAgumentInvalid( 'name' );
            }
            return ( new RegExp( '(\\s|^)' + name + '(\\s|$)' ) ).test( el.className );
        },

        addClass: function( elmLabel, name ) {
            this.setSignature( 'hasClass(elmLabel, name)' );
            if ( this.checkArguments( arguments, 1 ) ) {
                name = elmLabel;
                elmLabel = 'root';
            }

            var el = this.element( elmLabel )
            if ( !el ) {
                this.errorElementNotFound( elmLabel );
                return;
            }
            if ( typeof name !== 'string' ) {
                this.errorAgumentInvalid( 'name' );
            }
            if ( !this.hasClass( elmLabel, name ) ) {
                el.className += ( el.className ? ' ' : '' ) + name
            }
        },

        removeClass: function( elmLabel, name ) {
            this.setSignature( 'hasClass(elmLabel, name)' );
            if ( this.checkArguments( arguments, 1 ) ) {
                name = elmLabel
                elmLabel = 'root'
            }
            var el = this.element( elmLabel )
            if ( !el ) {
                this.errorElementNotFound( elmLabel );
                return;
            }
            if ( typeof name !== 'string' )
                this.errorAgumentInvalid( 'name' )
            if ( this.hasClass( elmLabel, name ) )
                el.className = el.className.replace( new RegExp( '(\\s|^)' + name + '(\\s|$)' ), ' ' ).replace( /^\s+|\s+$/g, '' )
        },

        insert: function( elmLabel, views ) {
            this.setSignature( 'insert([...])' );
            if ( !views ) {
                views = elmLabel
                elmLabel = 'root'
            }
            views = Array.isArray( views ) ? views : [ views ]
            this._contained[ elmLabel ] = this._contained[ elmLabel ] ||  []
            views.each( function( view ) {
                this.insertView( elmLabel, view )
            }.bind( this ) )
        },

        insertView: function( elmLabel, view ) {
            this._contained[ elmLabel ].push( view )
            this.element( elmLabel ).appendChild( view.html() )
        },


        insertAt: function( view, index ) {
            var el = this.element( 'container' )
            if ( !el ) {
                this.error( 'element label "container" not exist' )
            }
            el.insertBefore( view.html(), el.childNodes[ index ] )
        },

        reoder: function( view, index ) {
            var fromIndex = this._contained.indexOf( view )
            if ( fromIndex !== -1 ) {
                this._contained.splice( index, 0, this._contained.splice( fromIndex, 1 )[ 0 ] )
                this.remove( view )
                this.insertAt( view, index )
            }
        },

        removeAll: function() {
            for ( var i = 0; i < this._contained.length; i++ )
                this.remove( this._contained[ i ] )
        },

        remove: function( view ) {
            var index = this._contained.indexOf( view ),
                el = view.html()
                if ( index !== -1 ) {
                    el.parentNode && el.parentNode.removeChild( el )
                }
        }
    } )

    return View

} )