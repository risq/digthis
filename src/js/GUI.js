/*===========================
=            GUI            =
===========================*/

var GUI = ( function () {

    var $searchInput,
        $artistSearchContainer,
        $listenButton,
        $likeTrackButton,
        $dislikeTrackButton,
        $digArtistButton,
        $bottomBar,
        $bottomBarPrevButton,
        $bottomBarMidButton,
        $bottomBarNextButton,
        $home,
        $screenSwitch,
        $switcher,
        $switcherButton,
        $deezerLogin;

    function init() {

        $searchInput = $( '#home-input' );
        $artistSearchContainer = $( '#home' );
        $listenButton = $( '#cratedigger-record-listen' );
        $likeTrackButton = $( '#cratedigger-record-like' );
        $dislikeTrackButton = $( '#cratedigger-record-dislike' );
        $digArtistButton = $( '#dig-artist-button' );
        $bottomBar = $( '#bottom-bar' );
        $bottomBarPrevButton = $bottomBar.find( '.bottom-bar-prev-button' );
        $bottomBarMidButton = $bottomBar.find( '.bottom-bar-mid-button' );
        $bottomBarNextButton = $bottomBar.find( '.bottom-bar-next-button' );
        $screenSwitch = $( '.screen-switch' );
        $home = $( '#home' );
        $deezerLogin = $( '.deezer-login-container' );
        $switcher = $( '.switcher' );
        $switcherButton = $( '.switcher-button' );


        initEventListeners();

    }

    function initEventListeners() {
        $searchInput.on( 'keypress', onSearchInputKeypress );
        $listenButton.on( 'click', onListenButtonClick );
        $likeTrackButton.on( 'click', onLiketrackButtonClick );
        $dislikeTrackButton.on( 'click', onDisliketrackButtonClick );
        $digArtistButton.on( 'click', onDigArtistButtonClick );
        $bottomBarPrevButton.on( 'click', onBottomBarPrevButtonClick );
        $bottomBarMidButton.on( 'click', onBottomBarMidButtonClick );
        $bottomBarNextButton.on( 'click', onBottomBarNextButtonClick );
        $screenSwitch.on( 'click', onScreenSwitchClick );
        $switcherButton.on( 'click', onSwitcherButtonClick );
    }


    function onBottomBarPrevButtonClick( e ) {
        console.log( 'prev', cratedigger );
        cratedigger.selectPrevRecord();
    }

    function onBottomBarMidButtonClick( e ) {
        cratedigger.flipSelectedRecord();
    }

    function onBottomBarNextButtonClick( e ) {
        cratedigger.selectNextRecord();
    }


    function onSearchInputKeypress( e ) {
        if ( e.which == 13 && $searchInput.val() && $searchInput.val() !== '' ) {
            $searchInput.prop( 'disabled', true );
            $artistSearchContainer.fadeOut( 1000 );
            API.getPlaylistFromArtist( $searchInput.val(), function ( playlist ) {
                cratedigger.startRender();
                cratedigger.loadRecords( playlist );
                DeezerPlayer.setTracksCollection( playlist );
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
            $likeTrackButton.addClass( 'loading' );
            Tastes.likeTrack( playingTrack, setTrackLiked );
        }
    }

    function onDisliketrackButtonClick( e ) {
        var playingTrack = DeezerPlayer.getPlayingTrack();
        if ( playingTrack ) {
            $dislikeTrackButton.addClass( 'loading' );
            Tastes.dislikeTrack( playingTrack, setTrackDisliked );
        }
    }

    function onDigArtistButtonClick( e ) {
        var playingTrack = DeezerPlayer.getPlayingTrack();
        if ( playingTrack && playingTrack.artist ) {
            cratedigger.showLoading();
            API.getPlaylistFromArtist( playingTrack.artist, function ( playlist ) {
                cratedigger.loadRecords( playlist );
                DeezerPlayer.setTracksCollection( playlist );
            } );
        }
    }

    function onScreenSwitchClick( e ) {
        $home.toggleClass( 'bottom-screen-visible' );
    }

    function onSwitcherButtonClick( e ) {
        $switcher.toggleClass( 'switched' );
    }

    function setTrackLiked() {
        console.log( 'onTrackLiked' );
        $likeTrackButton.addClass( 'active' );
        $dislikeTrackButton.removeClass( 'active' );
        $likeTrackButton.removeClass( 'loading' );
        $dislikeTrackButton.removeClass( 'loading' );
    }

    function setTrackDisliked() {
        $likeTrackButton.removeClass( 'active' );
        $dislikeTrackButton.addClass( 'active' );
        $likeTrackButton.removeClass( 'loading' );
        $dislikeTrackButton.removeClass( 'loading' );
    }

    function resetTrackLikeButtons() {
        $likeTrackButton.removeClass( 'active' );
        $dislikeTrackButton.removeClass( 'active' );
        $likeTrackButton.removeClass( 'loading' );
        $dislikeTrackButton.removeClass( 'loading' );
    }

    function updateTrackTasteButtons( track ) {
        var trackState = Tastes.getTrackTasteState( track.id );
        console.log( 'track taste state', trackState );
        if ( trackState === 'liked' ) {
            setTrackLiked();
        } else if ( trackState === 'disliked' ) {
            setTrackDisliked();
        } else {
            resetTrackLikeButtons();
        }
    }

    function showBottomBar() {
        $bottomBar.removeClass( 'hidden' );
    }

    function hideBottomBar() {
        $bottomBar.addClass( 'hidden' );
    }

    function hideDeezerLogin() {
        $deezerLogin.hide();
    }

    return {
        init: init,
        showBottomBar: showBottomBar,
        hideBottomBar: hideBottomBar,
        updateTrackTasteButtons: updateTrackTasteButtons,
        hideDeezerLogin: hideDeezerLogin
    };

} )();
