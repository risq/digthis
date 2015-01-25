/*====================================
=            DeezerPlayer            =
====================================*/

var DeezerPlayer = ( function () {

    var player,
        $trackArtist,
        $trackTitle,
        $trackCover,
        $trackBar,
        $bufferBar,
        $buttonPrev,
        $buttonPlayPause,
        $buttonNext,
        $deezerLoginButton,
        tracksCollection,
        history = [],
        historyPos,
        playingTrack,
        waitingTrackToPlay = false,
        playTimeout,
        loggedUserID,
        playerState = 'stopped',
        isLoggedIn = false;
    constants = {
        playTimeout: 5000
    };

    function init() {
        DZ.init( {
            appId: '146221',
            // channelUrl : 'http://risq.github.io/digthis/channel.html',
            channelUrl: 'http://localhost:1337/channel.html',
            player: {
                // container : 'player',
                // width: 400,
                // height: 80,
                // playlist: false,
                onload: onPlayerLoaded
            }
        } );

        $trackArtist = $( '.track .track-artist' );
        $trackTitle = $( '.track .track-title' );
        $trackCover = $( '.track .track-cover' );
        $trackBar = $( '.track-bar' );
        $bufferBar = $( '.buffer-bar' );
        $buttonPrev = $( '.track-control-button.button-prev' );
        $buttonPlayPause = $( '.track-control-button.button-playpause' );
        $buttonNext = $( '.track-control-button.button-next' );
        $deezerLoginButton = $( '#deezer-login-button' );

        initEventListeners();
    }

    function initEventListeners() {
        $buttonPrev.on( 'click', onPrevButtonClick );
        $buttonPlayPause.on( 'click', onPlayPauseButtonClick );
        $buttonNext.on( 'click', onNextButtonClick );
        $deezerLoginButton.on( 'click', login );
    }

    function onPrevButtonClick( e ) {
        playPrevTrack();
    }

    function play() {
        DZ.player.play();
        playPauseButtonSetToPause();
    }

    function pause() {
        DZ.player.pause();
        playPauseButtonSetToPlay();
    }

    function onPlayPauseButtonClick( e ) {
        if ( playerState === 'paused' ) {
            play();
        } else if ( playerState === 'playing' ) {
            pause();
        }
    }

    function onNextButtonClick( e ) {
        playNextTrack();
    }

    function onPlayerLoaded() {
        DZ.getLoginStatus( function ( response ) {
            if ( response.authResponse ) {
                console.log( response );
                userIsLoggedIn( response.userID );
            }
        } );
        DZ.Event.subscribe( 'player_play', onTrackPlay );
        DZ.Event.subscribe( 'track_end', onTrackEnd );
        DZ.Event.subscribe( 'player_position', onPlayerPositionUpdate );
        DZ.Event.subscribe( 'player_buffering', onPlayerBufferingUpdate );
        DZ.Event.subscribe( 'current_track', function ( arg ) {
            console.log( 'current_track', arg.index, arg.track.title, arg.track.album.title );
        } );
    }

    function onTrackPlay() { // not needed ? see current_track
        if ( waitingTrackToPlay ) {
            clearInterval( playTimeout );
            playingTrack = waitingTrackToPlay;
            $trackArtist.text( waitingTrackToPlay.artist );
            $trackTitle.text( waitingTrackToPlay.title );
            $trackCover.css( 'background-image', 'url(' + waitingTrackToPlay.cover + ')' );
            GUI.updateTrackTasteButtons( waitingTrackToPlay );
            waitingTrackToPlay = false;
        }
    }

    function onPlayerPositionUpdate( arg ) {
        $trackBar.css( 'width ', ( 100 * arg[ 0 ] / arg[ 1 ] ) + ' % ' );
    }

    function onPlayerBufferingUpdate( percent ) {
        $bufferBar.css( 'width', percent + '%' );
    }

    function onTrackEnd() {
        if ( playingTrack ) {
            playingTrack = false;
            playUnplayedTrack();
        }
    }

    function playTrack( track ) {
        DZ.player.playTracks( [ track.deezer_id ] );
        waitingTrackToPlay = track;
        playTimeout = setTimeout( function () {
            if ( waitingTrackToPlay ) {
                console.log( 'Error' );
                playNextTrack();
            }
        }, constants.playTimeout );
        playPauseButtonSetToPause();
        console.log( 'playin track', track );
    }

    function playTrackFromCrate( track ) {
        playTrack( track );
        history.push( track );
        historyPos = history.length - 1;
    }

    function playNextTrack() {
        pause();
        if ( historyPos == history.length - 1 ) {
            playUnplayedTrack();
            historyPos = history.length - 1;
        } else {
            historyPos = historyPos + 1;
            playTrack( history[ historyPos ] );
        }
    }

    function playPrevTrack() {
        pause();
        if ( history[ historyPos - 1 ] ) {
            historyPos = historyPos - 1;
            playTrack( history[ historyPos ] );
        }
    }

    function playUnplayedTrack() {
        var track = tracksCollection[ Math.floor( Math.random() * tracksCollection.length ) ];
        playTrack( track );
        history.push( track );
    }

    function playPauseButtonSetToPlay() {
        playerState = 'paused';
        $buttonPlayPause.text( 'Play' );
    }

    function playPauseButtonSetToPause() {
        playerState = 'playing';
        $buttonPlayPause.text( 'Pause' );
    }

    function login() {
        DZ.login( function ( response ) {
            if ( response.authResponse ) {
                userIsLoggedIn( response.userID );
                DZ.api( '/user/me', function ( response ) {
                    console.log( 'Good to see you, ' + response.name + '.' );
                } );
                userToken = response.authResponse.accessToken;
            } else {
                console.log( 'User cancelled login or did not fully authorize.' );
            }
        } );
    }

    function userIsLoggedIn( userID ) {
        if ( !isLoggedIn ) {
            isLoggedIn = true;
            loggedUserID = userID;
            $deezerLoginButton.hide();
            console.log( 'User is logged with id', userID );
            Tastes.init( userID );
        }
    }

    function setTracksCollection( tracks ) {
        tracksCollection = tracks;
    }

    function getPlayingTrack() {
        return playingTrack;
    }

    return {
        init: init,
        playTrackFromCrate: playTrackFromCrate,
        setTracksCollection: setTracksCollection,
        getPlayingTrack: getPlayingTrack
    };

} )();
