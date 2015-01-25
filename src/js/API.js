/*===========================
=            API            =
===========================*/
var API = (function() {

    var apiKey = 'ASJCKIVQOBWZNXULY';
    var apiUrl = 'http://developer.echonest.com/api/v4/';
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
        advancedAPIRequest('artist/similar', args, null, function(error, data) {
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

    function advancedAPIRequest(action, args, options, done, doneFormatting) {
        var defaults = {
            'api_key': apiKey,
        };
        var url = apiUrl + action;
        args = $.extend({}, defaults, args);
        $.getJSON(url, args,
            function(data) {
                if (data.response.status.code === 0) {
                    done(false, data.response, options, doneFormatting);
                } else { // error
                    done(true);
                }
            }
        ).fail(function() {
            done(true);
        });
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
            advancedAPIRequest('playlist/static', args, options, onPlaylistPartGet, function(songs) {
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
            console.log('selected songs :', songs.length)
            doneFormatting(songs);
        }
    }

    function formatResponseSong(songData, options) {
        tracksData = getDataFromTracks(songData.tracks, options);

        if (tracksData && $.inArray(songData.id, playlistIDs) === -1) {
            // unique albums :  && $.inArray(tracksData.release_id, playlistReleaseIDs) === -1
            var song = {
                id: songData.id,
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
            // console.log(songData);
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

    /*==========  Taste Profile  ==========*/

    function getTasteProfileFromUserID(userID, done) {

        $.ajax({
            type: 'GET',
            url: apiUrl + 'tasteprofile/profile',
            data: { 
                api_key: apiKey,
                name: userID
            },
            dataType: 'json'
        })
        .done(function(data) {
            var profileID = data.response.catalog.id;
            readTasteProfile(profileID, function(error, catalog) {
                if (error) {
                    done(true);
                }
                else {
                    done(false, catalog);
                }
            });
        })
        .fail(function() {
            console.log('taste profile not found for user ' + userID + ', trying to create one...');
            createTasteProfile(userID, function(error, data) {
                if (error) {
                    console.log('error creating taste profile for user ' + userID);
                    done(true);
                }
                else {
                    console.log('taste profile created');
                    done(false, {
                        id: data.response,
                        items: []
                    });
                }
            });
        });
    }

    function readTasteProfile(profileID, done) {
        console.log('readTasteProfile', profileID);

        $.ajax({
            type: 'GET',
            url: apiUrl + 'tasteprofile/read',
            data: { 
                api_key: apiKey,
                id: profileID
            },
            dataType: 'json'
        })
        .done(function(data) {
            done(false, data.response.catalog);
        })
        .fail(function() {
            done(true);
        });
    }

    function createTasteProfile(userID, done) {
        console.log('createTasteProfile', userID);

        $.ajax({
            type: 'POST',
            url: apiUrl + 'tasteprofile/create',
            data: { 
                api_key: apiKey,
                name: userID,
                type: 'general'
            },
            dataType: 'json'
        })
        .done(function(data) {
            done(false, data);
        })
        .fail(function() {
            done(true);
        });
    }

    function likeTrack(profileID, trackID, done) {
        console.log('likeTrack', trackID);

        $.ajax({
            type: 'GET',
            url: apiUrl + 'tasteprofile/rate',
            data: { 
                api_key: apiKey,
                id: profileID,
                item: trackID,
                rating: 10
            },
            dataType: 'json'
        })
        .done(function(data) {
            done(false, data);
        })
        .fail(function() {
            done(true);
        });
    }

    function dislikeTrack(profileID, trackID, done) {
        console.log('dislikeTrack', trackID);

        $.ajax({
            type: 'GET',
            url: apiUrl + 'tasteprofile/rate',
            data: { 
                api_key: apiKey,
                id: profileID,
                item: trackID,
                rating: 1
            },
            dataType: 'json'
        })
        .done(function(data) {
            done(false, data);
        })
        .fail(function() {
            done(true);
        });
    }

    /*==========  Utils  ==========*/

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [rev. #1]
    function shuffle(v) {
        for (var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
        return v;
    }

    return {
        init: init,
        getPlaylistFromArtist: getPlaylistFromArtist,
        getTasteProfileFromUserID: getTasteProfileFromUserID,
        readTasteProfile: readTasteProfile,
        likeTrack: likeTrack,
        dislikeTrack: dislikeTrack
    };
})();