/*===========================
=            GUI            =
===========================*/

var GUI = ( function () {

    var $searchInput,
        $artistSearchContainer,
        $bottomBar,
        $listenButton,
        $likeTrackButton,
        $dislikeTrackButton,
        $digArtistButton;

    function init() {
        $searchInput = $( '#artist-search-input' );
        $artistSearchContainer = $( '#artist-search' );
        $bottomBar = $( '#bottom-bar' );
        $listenButton = $( '#cratedigger-record-listen' );
        $likeTrackButton = $( '#cratedigger-record-like' );
        $dislikeTrackButton = $( '#cratedigger-record-dislike' );
        $digArtistButton = $( '#dig-artist-button' );


        initEventListeners();

    }

    function initEventListeners() {
        $searchInput.on( 'keypress', onSearchInputKeypress );
        $listenButton.on( 'click', onListenButtonClick );
        $likeTrackButton.on( 'click', onLiketrackButtonClick );
        $dislikeTrackButton.on( 'click', onDisliketrackButtonClick );
        $digArtistButton.on( 'click', onDigArtistButtonClick );
    }

    function onSearchInputKeypress( e ) {
        if ( e.which == 13 && $searchInput.val() && $searchInput.val() !== '' ) {
            $searchInput.prop( 'disabled', true );
            API.getPlaylistFromArtist( $searchInput.val(), function ( playlist ) {
                cratedigger.loadRecords( playlist );
                DeezerPlayer.setTracksCollection( playlist );
                setTimeout( function () {
                    $artistSearchContainer.fadeOut( 1000 );
                }, 2000 );
            } );
        }
    }

    function onListenButtonClick( e ) {
        e.stopPropagation();
        DeezerPlayer.playTrackFromCrate( cratedigger.getSelectedRecord().data );
        return false;
    }

    function onLiketrackButtonClick( e ) {
        var playingTrack = DeezerPlayer.getPlayingTrack();
        if ( playingTrack ) {
            Tastes.likeTrack( playingTrack, setTrackLiked );
        }
    }

    function onDisliketrackButtonClick( e ) {
        var playingTrack = DeezerPlayer.getPlayingTrack();
        if ( playingTrack ) {
            Tastes.dislikeTrack( playingTrack, setTrackDisliked );
        }
    }

    function onDigArtistButtonClick( e ) {
        var playingTrack = DeezerPlayer.getPlayingTrack();
        if ( playingTrack && playingTrack.artist ) {
            API.getPlaylistFromArtist( playingTrack.artist, function ( playlist ) {
                cratedigger.loadRecords( playlist );
                DeezerPlayer.setTracksCollection( playlist );
            } );
        }
    }

    function setTrackLiked() {
        console.log( 'onTrackLiked' );
        $likeTrackButton.addClass( 'active' );
        $dislikeTrackButton.removeClass( 'active' );
    }

    function setTrackDisliked() {
        $likeTrackButton.removeClass( 'active' );
        $dislikeTrackButton.addClass( 'active' );
    }

    function resetTrackLikeButtons() {
        $likeTrackButton.removeClass( 'active' );
        $dislikeTrackButton.removeClass( 'active' );
    }

    function updateTrackTasteButtons( track ) {
        var trackState = Tastes.getTrackTasteState( track.id );
        if ( trackState === 'liked' ) {
            setTrackLiked();
        } else if ( trackState === 'disliked' ) {
            setTrackDisliked();
        } else {
            resetTrackLikeButtons();
        }
    }

    function openBottomBar() {}

    function closeBottomBar() {}

    return {
        init: init,
        openBottomBar: openBottomBar,
        closeBottomBar: closeBottomBar,
        updateTrackTasteButtons: updateTrackTasteButtons
    };

} )();
