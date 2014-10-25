var app = (function () {

    var apiKey = 'ASJCKIVQOBWZNXULY';
    var curSong = null;
    var sessionId = null;

    function init () {
        jQuery.ajaxSettings.traditional = true; 
        getPlaylist({
            fromYear: 1990,
            toYear: 1999,
            results: 64
        });
    }

    function callApi(action, args, options, done, doneFormatting) {
        var defaults = {
            'api_key' : apiKey,
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

    function getPlaylist(options, playlist) {
        var args = {
            'genre': 'hip hop',
            'results': 100,
            'bucket': [ 'id:7digital-US', 'id:deezer', 'tracks', 'audio_summary'], 
            'type':'genre-radio',
            'adventurousness': 0.8
        };
        callApi('playlist/static', args, options, onPlaylistGet, function(songs) {
            if (playlist) {
                playlist = playlist.concat(songs);
            }
            else {
                playlist = songs;
            }

            if (playlist.length < options.results) {
                getPlaylist(options, playlist);
            }
            else {
                playlist = playlist.slice(0, options.results);
                cratedigger.loadRecords(playlist);
            }

            console.log(playlist.length);
        });
    }

    function onPlaylistGet(error, response, options, doneFormatting) {
        if (!error) {
            var songs = $.map(response.songs, function(song) {
                return formatResponseSong(song, options);
            });
            $('#cover').attr('src', songs[0].cover);
            doneFormatting(songs);
        }
    }

    function formatResponseSong(songData, options) {
        tracksData = getDataFromTracks(songData.tracks, options);
        if (tracksData) {
            //console.log(songData);
            
            var song = {
                title: songData.title,
                artist: songData.artist_name,
                cover: tracksData.cover,
                year: tracksData.year,
                hasSleeve: false
            };
            return song;
        }
        else {
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
            for (var i = 0; (i < length && (!data.cover || !data.year)); i++) {
                if (tracks[i].catalog == 'deezer' && !data.year && tracks[i].album_date) {
                    data.year = tracks[i].album_date.substring(0,4);
                }
                else if (tracks[i].catalog == '7digital-US' && !data.cover && tracks[i].release_image) {
                    data.cover = tracks[i].release_image;
                }
            }
            if (data.cover && data.year) {
                if(options && options.fromYear && data.year < options.fromYear) {
                    return null;
                }
                if(options && options.toYear && data.year > options.toYear) {
                    return null;
                }
                return data;
            }
            else {
                return null;
            }
        }
        else {
            return false;
        }
    }

    function formatCoverUrl(url) {
        return url.substring(0, url.length-7) + '500.jpg';
    }

    return {
        init: init
    };
})();





$(function() {
    cratedigger.init({
        elements: {
            rootContainerId     : 'cratedigger',
            canvasContainerId   : 'cratedigger-canvas',
            loadingContainerId  : 'cratedigger-loading',
            infosContainerId    : 'cratedigger-infos',
            titleContainerId    : 'cratedigger-record-title',
            artistContainerId   : 'cratedigger-record-artist',
            coverContainerId    : 'cratedigger-record-cover'
        }
    });
    app.init();
});

