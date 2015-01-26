/*==============================
=            Tastes            =
==============================*/

var Tastes = ( function () {

    var $tastesList,
        $tasteItemTemplate,
        catalogID,
        tasteItems;

    function init( userID ) {
        $tastesList = $( '.tastes-list' );
        $tasteItemTemplate = $( '.tastes-list-item.template' );
        loadTasteProfile( userID );
    }

    function loadTasteProfile( userID ) {
        console.log( 'loading taste profile...' );
        if ( catalogID ) {
            API.readTasteProfile( catalogID, onTasteProfileLoaded );
        } else if ( userID ) {
            API.getTasteProfileFromUserID( userID, onTasteProfileLoaded );
        }
    }

    function onTasteProfileLoaded( error, catalog ) {
        if ( error ) {
            console.log( 'error on getting taste profile' );
        } else {
            console.log( 'taste profile loaded', catalog );
            catalogID = catalog.id;
            tasteItems = catalog.items;
            $tastesList.empty();
            tasteItems.forEach( function ( item ) {
                createTasteItemElement( item.artist_name, item.song_name );
            } );
        }
    }

    function createTasteItemElement( artist, track, trackID, state ) {
        var $newElement = $tasteItemTemplate.clone().removeClass( 'template' );
        $newElement.find( '.tastes-artist' ).text( artist );
        $newElement.find( '.tastes-track' ).text( track );
        $newElement.prependTo( $tastesList );
    }

    function likeTrack( track, done ) {
        //todo : test if already favorite
        if ( catalogID ) {
            API.likeTrack( catalogID, track.id, function ( error ) {
                if ( error ) {
                    console.log( 'error favoriting track', track );
                } else {
                    console.log( 'track added to favs !' );
                    // createTasteItemElement(track.artist, track.title, track.id);
                    loadTasteProfile();
                    done();
                }
            } );
        }
    }

    function dislikeTrack( track, done ) {
        //todo : test if already favorite
        if ( catalogID ) {
            API.dislikeTrack( catalogID, track.id, function ( error ) {
                if ( error ) {
                    console.log( 'error favoriting track', track );
                } else {
                    console.log( 'track added to favs !' );
                    // createTasteItemElement(track.artist, track.title, track.id);
                    loadTasteProfile();
                    done();
                }
            } );
        }
    }

    function getTrackTasteState( trackID ) {
        if ( trackID && tasteItems ) {
            console.log( 'getTrackTasteState', trackID, tasteItems );
            var track = _.find( tasteItems, {
                'song_id': trackID
            } );

            if ( track && track.rating ) {
                return track.rating > 5 ? 'liked' : 'disliked';
            } else {
                return null;
            }
        }
    }

    return {
        init: init,
        likeTrack: likeTrack,
        dislikeTrack: dislikeTrack,
        getTrackTasteState: getTrackTasteState
    };

} )();
