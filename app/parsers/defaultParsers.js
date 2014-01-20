define( [
    './HTMLParser',
    './ToDOMParser',
    './DOMParser'
 ], function( HTMLParser, ToDOMParser, DOMParser ) {

    return {
        toDOM: new ToDOMParser,
        html: new HTMLParser,
        dom: new DOMParser
    }


} )