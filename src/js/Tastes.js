/*==============================
=            Tastes            =
==============================*/

var Tastes = (function() {

    var $tastesList,
        $tasteItemTemplate,
        tasteProfileID;

    function init(userID) {
        $tastesList = $('.tastes-list');
        $tasteItemTemplate = $('.tastes-list-item.template');
        loadTasteProfile(userID);
    }

    function loadTasteProfile(userID) {
        console.log('loading taste profile...');
        API.getTasteProfile(userID, function(error, catalog) {
            if (error) {
                console.log('error on getting taste profile');
            }
            else {
                console.log('taste profile loaded');
                console.log(catalog);
                tasteProfileID = catalog.id;
                catalog.items.forEach(function(item) {
                    createTasteItemElement(item.artist_name, item.song_name);
                });
            }
        });
    }

    function createTasteItemElement(artist, track, trackID, state) {
        var $newElement = $tasteItemTemplate.clone().removeClass('template');
        $newElement.find('.tastes-artist').text(artist);
        $newElement.find('.tastes-track').text(track);
        $newElement.prependTo($tastesList);
    }

    function addTrackToFavorite(track) {
        //todo : test if already favorite
        if (tasteProfileID) {
            console.log('add to fav', track);
            API.favoriteTrack(tasteProfileID, track.id, function(error) {
                if (error) {
                    console.log('error favoriting track', track);
                }
                else {
                    console.log('track added to favs !');
                    createTasteItemElement(track.artist, track.title, track.id);
                }
            });
        }
    }

    return {
        init: init,
        addTrackToFavorite: addTrackToFavorite
    };

})();