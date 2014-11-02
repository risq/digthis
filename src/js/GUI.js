/*===========================
=            GUI            =
===========================*/

var GUI = (function() {

    var $searchInput,
        $artistSearchContainer,
        $bottomBar,
        $listenButton,
        $addTrackToFavoriteButton;

    function init() {
        $searchInput = $('#artist-search-input');
        $artistSearchContainer = $('#artist-search');
        $bottomBar = $('#bottom-bar');
        $listenButton = $('#cratedigger-record-listen');
        $addTrackToFavoriteButton = $('.track-cover');
        

        initEventListeners();

    }

    function initEventListeners() {
        $searchInput.on('keypress', onSearchInputKeypress);
        $listenButton.on('click', onListenButtonClick);
        $addTrackToFavoriteButton.on('click', onAddTrackToFavoriteButtonClick);
    }

    function onSearchInputKeypress(e) {
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

    function onListenButtonClick(e) {
        e.stopPropagation();
        DeezerPlayer.playTrackFromCrate(cratedigger.getSelectedRecord().data);
        return false;
    }

    function onAddTrackToFavoriteButtonClick(e) {
        var playingTrack = DeezerPlayer.getPlayingTrack();
        if (playingTrack) {
            Tastes.addTrackToFavorite(playingTrack);
        }
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