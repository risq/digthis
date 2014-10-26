var app = (function() {

    var apiKey = 'ASJCKIVQOBWZNXULY';
    var curSong = null;
    var sessionId = null;
    var maxReq = 15;
    var playlistIDs = [];

    function init() {
        jQuery.ajaxSettings.traditional = true;
        
        getPlaylist('The Roots');
    }

    function getPlaylist(artist) {
        playlistIDs = [];
        var args = {
            name: artist
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
                });
            }
            else {
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

    function requestPlaylistPart(options, playlist, reqCount) {
        reqCount = reqCount ? reqCount : 0;
        var currentArtist = options.artists[reqCount] ? options.artists[reqCount] : options.artists[0];
        console.log(currentArtist);
        var args = {
            // 'genre': 'hip hop',
            'results': 50,
            'artist': currentArtist,
            'bucket': ['id:deezer', 'tracks'],
            'type': 'artist-radio',
            'adventurousness': 1,
            'variety': 1,
            'distribution': 'wandering',
        };

        if (reqCount <= maxReq) {
            reqCount = reqCount + 1;
            callApi('playlist/static', args, options, onPlaylistPartGet, function(songs) {
                onPlaylistPartFormatted(options, songs, playlist, reqCount);
            });
        }
    }

    function onPlaylistPartFormatted(options, songs, playlist, reqCount) {
        if (playlist) {
            playlist = playlist.concat(songs);
        } else {
            playlist = songs;
        }

        if (playlist.length < options.results && reqCount <= maxReq) {
            requestPlaylistPart(options, playlist, reqCount);
        } else {
            playlist = playlist.slice(0, options.results);
            callUrl302(playlist, function(error, newPlaylist) {
                if(!error) {
                    newPlaylist = shuffle(newPlaylist);
                    cratedigger.loadRecords(newPlaylist);
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

        if (tracksData && $.inArray(songData.id, playlistIDs) === -1) {
            console.log(playlistIDs.length);
            var song = {
                title: songData.title,
                artist: songData.artist_name,
                cover: tracksData.cover,
                year: tracksData.year,
                id: songData.id,
                hasSleeve: false
            };
            playlistIDs.push(songData.id);
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
                    data.year = tracks[i].album_date.substring(0, 4);
                    var id = tracks[i].foreign_release_id.split(':')[2];
                    data.cover = 'http://api.deezer.com/album/' + id + '/image?size=big';
                    
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
    function shuffle(v){
        for(var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
        return v;
    }

    return {
        init: init
    };
})();





$(function() {
    cratedigger.init({
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
    app.init();
});
