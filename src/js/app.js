/*===========================
=            API            =
===========================*/
var API = (function() {

    var apiKey = 'ASJCKIVQOBWZNXULY';
    var curSong = null;
    var sessionId = null;
    var maxReq = 20;
    var playlistIDs = [];
    var playlistReleaseIDs = [];

    function init() {
        jQuery.ajaxSettings.traditional = true;
    }

    function getPlaylistFromArtist(artist, done) {
        playlistIDs = [];
        playlistReleaseIDs = [];
        var args = {
            name: artist,
            results: maxReq
        };
        callApi('artist/similar', args, null, function(error, data) {
            if (!error) {
                artists = $.map(data.artists, function(item) {
                    return item.name;
                });
                artists.unshift(artist);
                requestPlaylistPart({
                    fromYear: 1990,
                    toYear: 1999,
                    results: 48,
                    artists: artists
                }, null, null, function(playlist) {
                    newPlaylist = shuffle(playlist);

                    done(playlist);
                });
            } else {
                console.log('error');
            }
        });
    }

    function callApi(action, args, options, done, doneFormatting) {
        var defaults = {
            'api_key': apiKey,
        };
        var url = 'http://developer.echonest.com/api/v4/' + action;
        args = $.extend({}, defaults, args);
        $.getJSON(url, args,
            function(data) {
                if (data.response.status.code === 0) {
                    done(false, data.response, options, doneFormatting);
                } else {
                    done(true);
                }
            },
            function() {
                done(true);
            }
        );
    }

    function requestPlaylistPart(options, playlist, reqCount, onPlaylistLoaded) {
        reqCount = reqCount ? reqCount : 0;
        var currentArtist = options.artists[reqCount] ? options.artists[reqCount] : options.artists[0];
        var currentResults = reqCount === 0 ? 80 : 40;
        var currentVariety = reqCount === 0 ? 0.4 : 0.8;
        var currentDistrib = reqCount === 0 ? 'focused' : 'wandering';
        console.log(currentArtist);
        var args = {
            'results': currentResults,
            'artist': currentArtist,
            'bucket': ['id:deezer', 'tracks'],
            'type': 'artist-radio',
            'variety': currentVariety,
            'distribution': 'focused',
        };

        if (reqCount <= maxReq) {
            reqCount = reqCount + 1;
            callApi('playlist/static', args, options, onPlaylistPartGet, function(songs) {
                onPlaylistPartFormatted(options, songs, playlist, reqCount, onPlaylistLoaded);
            });
        }
    }

    function onPlaylistPartFormatted(options, songs, playlist, reqCount, playlistLoaded) {
        if (playlist) {
            playlist = playlist.concat(songs);
        } else {
            playlist = songs;
        }

        if (playlist.length < options.results && reqCount <= maxReq) {
            requestPlaylistPart(options, playlist, reqCount, playlistLoaded);
        } else {
            playlist = playlist.slice(0, options.results);
            callUrl302(playlist, function(error, newPlaylist) {
                if (!error) {
                    playlistLoaded(newPlaylist);
                }
            });
        }
    }

    function onPlaylistPartGet(error, response, options, doneFormatting) {
        if (!error) {
            var songs = $.map(response.songs, function(song) {
                return formatResponseSong(song, options);
            });
            doneFormatting(songs);
        }
    }

    function formatResponseSong(songData, options) {
        tracksData = getDataFromTracks(songData.tracks, options);

        if (tracksData && $.inArray(songData.id, playlistIDs) === -1 && $.inArray(tracksData.release_id, playlistReleaseIDs) === -1) {
            console.log(playlistIDs.length);
            var song = {
                title: songData.title,
                artist: songData.artist_name,
                cover: tracksData.cover,
                year: tracksData.year,
                deezer_id: tracksData.id,
                deezer_releaseId: tracksData.release_id,
                hasSleeve: false
            };
            playlistIDs.push(songData.id);
            playlistReleaseIDs.push(tracksData.release_id);
            return song;
        } else {
            return null;
        }
    }

    function getDataFromTracks(tracks, options) {
        var length = tracks.length;
        var data = {
            cover: null,
            year: null
        };
        if (length) {
            for (var i = 0; i < length; i++) {
                if (tracks[i].catalog == 'deezer' && tracks[i].album_date) {
                    data.year       = tracks[i].album_date.substring(0, 4);
                    data.id         = tracks[i].foreign_id.split(':')[2];
                    data.release_id = tracks[i].foreign_release_id.split(':')[2];
                    data.cover      = 'http://api.deezer.com/album/' + data.release_id + '/image?size=big';
                    break;
                }
            }
            if (data.cover && data.year) {
                // if (options && options.fromYear && data.year < options.fromYear) {
                //     return null;
                // }
                // if (options && options.toYear && data.year > options.toYear) {
                //     return null;
                // }
                return data;
            } else {
                return null;
            }
        } else {
            return false;
        }
    }

    function formatCoverUrl(url) {
        return url.substring(0, url.length - 7) + '500.jpg';
    }

    function callUrl302(data, done) {
        var url = 'https://url302.herokuapp.com/';
        $.ajax({
            type: "POST",
            url: url,
            dataType: 'json',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(data),
            success: function(data) {
                done(false, data);
            },
            error: function() {
                done(true);
            }
        });
    }

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [rev. #1]
    function shuffle(v) {
        for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
        return v;
    }

    return {
        init: init,
        getPlaylistFromArtist: getPlaylistFromArtist
    };
})();



/*===========================
=            GUI            =
===========================*/

var GUI = (function() {

    var $searchInput,
        $artistSearchContainer,
        $bottomBar,
        $listenButton;

    function init() {
        $searchInput = $('#artist-search-input');
        $artistSearchContainer = $('#artist-search');
        $bottomBar = $('#bottom-bar');
        $listenButton = $('#cratedigger-record-listen');
        

        initEventListeners();

    }

    function initEventListeners() {
        $searchInput.keypress(searchInputKeypressHandler);
        $listenButton.on('click', listenButtonClickHandler);
    }

    function searchInputKeypressHandler(e) {
        if (e.which == 13 && $searchInput.val() && $searchInput.val() !== '') {
            $searchInput.prop('disabled', true);
            API.getPlaylistFromArtist($searchInput.val(), function(playlist) {
                cratedigger.loadRecords(playlist);
                DeezerPlayer.setTracksCollection(playlist);
                setTimeout(function() {
                    $artistSearchContainer.fadeOut(1000);
                }, 2000);
            });
        }
    }

    function listenButtonClickHandler(e) {
        e.stopPropagation();
        DeezerPlayer.playTrackFromCrate(cratedigger.getSelectedRecord().data);
        return false;
    }

    function openBottomBar() {
    }

    function closeBottomBar() {
    }

    return {
        init: init,
        openBottomBar: openBottomBar,
        closeBottomBar: closeBottomBar
    };

})();




/*====================================
=            DeezerPlayer            =
====================================*/

var DeezerPlayer = (function() {

    var player,
        $trackArtist,
        $trackTitle,
        $trackCover,
        $trackBar,
        $bufferBar,
        $buttonPrev,
        $buttonPlayPause,
        $buttonNext,
        tracksCollection,
        history = [],
        historyPos,
        playingTrack,
        waitingTrackToPlay = false,
        playTimeout,
        playerState = 'paused',
        constants = {
            playTimeout: 5000
        };

    function init() {
        DZ.init({
            appId  : '146221',
            channelUrl : 'http://risq.github.io/digthis/channel.html',
            player: {
                // container : 'player',
                // width: 400,
                // height: 80,
                // playlist: false,
                onload: onPlayerLoaded
            }
        });

        $trackArtist     = $('.track .track-artist');
        $trackTitle      = $('.track .track-title');
        $trackCover      = $('.track .track-cover');
        $trackBar        = $('.track-bar');
        $bufferBar       = $('.buffer-bar');
        $buttonPrev      = $('.track-control-button.button-prev');
        $buttonPlayPause = $('.track-control-button.button-playpause');
        $buttonNext      = $('.track-control-button.button-next');

        initEventListeners();
    }

    function initEventListeners() {
        $buttonPrev.on('click', onPrevButtonClick);
        $buttonPlayPause.on('click', onPlayPauseButtonClick);
        $buttonNext.on('click', onNextButtonClick);
    }
    
    function onPrevButtonClick(e) {
        playPrevTrack()
    }
    
    function onPlayPauseButtonClick(e) {
        if (playerState == 'paused') {
            DZ.player.play();
            playPauseButtonSetToPause();      
        }
        else {
            DZ.player.pause();
            playPauseButtonSetToPlay(); 
        }
    }
    
    function onNextButtonClick(e) {
        playNextTrack()
    }

    function onPlayerLoaded() {
        DZ.getLoginStatus(function(response) {
            if (response.authResponse) {
                console.log('Logged in !');
            } else {
                console.log('Not logged :(');
            }
        });
        DZ.Event.subscribe('player_play', onTrackPlay);
        DZ.Event.subscribe('track_end', onTrackEnd);
        DZ.Event.subscribe('player_position', onPlayerPositionUpdate);
        DZ.Event.subscribe('player_buffering', onPlayerBufferingUpdate);
        DZ.Event.subscribe('current_track', function(arg){
            console.log('current_track', arg.index, arg.track.title, arg.track.album.title);
        });
    }

    function onTrackPlay() { // not needed ? see current_track
        if (waitingTrackToPlay) {
            clearInterval(playTimeout);
            playingTrack = waitingTrackToPlay;
            $trackArtist.text(waitingTrackToPlay.artist);
            $trackTitle.text(waitingTrackToPlay.title);
            $trackCover.css('background-image', 'url(' + waitingTrackToPlay.cover +')');
            waitingTrackToPlay = false;
        }
    }

    function onPlayerPositionUpdate(arg) {
        $trackBar.css('width', (100*arg[0]/arg[1]) + '%');
    }

    function onPlayerBufferingUpdate(percent) {
        $bufferBar.css('width', percent + '%');  
    }

    function onTrackEnd() {
        if (playingTrack) {
            playingTrack = false;
            playUnplayedTrack();
        }
    }

    function playTrack(track) {
        DZ.player.playTracks([track.deezer_id]);
        waitingTrackToPlay = track;
        playTimeout = setTimeout(function() {
            if (waitingTrackToPlay) {
                console.log('Error');
                playNextTrack();
            }
        }, constants.playTimeout);
        playPauseButtonSetToPause();
        console.log('playin track', track);
    }

    function playTrackFromCrate(track) {
        playTrack(track);
        history.push(track);
        historyPos = history.length - 1;
        console.log(history);
    }

    function playNextTrack() {
        if (historyPos == history.length - 1) {
            playUnplayedTrack();
            historyPos = history.length - 1;
        }
        else {
            historyPos = historyPos + 1;
            playTrack(history[historyPos]);
        }
    }

    function playPrevTrack() {
        if (history[historyPos - 1]) {
            historyPos = historyPos - 1;
            playTrack(history[historyPos]);
        }
    }

    function playUnplayedTrack() {
        var track = tracksCollection[Math.floor(Math.random()*tracksCollection.length)];
        playTrack(track);
        history.push(track);
    }

    function playPauseButtonSetToPlay() {
        playerState = 'paused';
        $buttonPlayPause.text('Play');
    }

    function playPauseButtonSetToPause() {
        playerState = 'playing';
        $buttonPlayPause.text('Pause');
    }

    function login() {
        DZ.login(function (response) {
            if (response.authResponse) {
                console.log('Welcome!  Fetching your information.... ');
                DZ.api('/user/me', function (response) {
                    console.log('Good to see you, ' + response.name + '.');
                });
                userToken = response.authResponse.accessToken;
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, { perms: 'email, manage_library' });
    }

    function setTracksCollection(tracks) {
        tracksCollection = tracks;
    }

    return {
        init: init,
        playTrackFromCrate: playTrackFromCrate,
        setTracksCollection: setTracksCollection
    };

})();


/*===========================
=            App            =
===========================*/

var App = (function() {

    function init() {
        cratedigger.init({
            postprocessing: false,
            infoPanelOpened: function() {
                GUI.openBottomBar();
            },
            infoPanelClosed: function() {
                GUI.openBottomBar();   
            },
            elements: {
                rootContainerId: 'cratedigger',
                canvasContainerId: 'cratedigger-canvas',
                loadingContainerId: 'cratedigger-loading',
                infosContainerId: 'cratedigger-infos',
                titleContainerId: 'cratedigger-record-title',
                artistContainerId: 'cratedigger-record-artist',
                coverContainerId: 'cratedigger-record-cover'
            }
        });

        API.init();
        GUI.init();
        DeezerPlayer.init();

        // API.getPlaylistFromArtist('the roots', function(playlist) {
        //     cratedigger.loadRecords(playlist);
        // });
    }

    return {
        init: init
    };

})();





$(function() {
    App.init();
});

//todo : cratedigger test raycast first touched