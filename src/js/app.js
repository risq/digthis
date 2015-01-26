/*===========================
=            App            =
===========================*/

var App = (function() {

    function init() {
        $.ajaxSetup({ cache: false }); // debug

        cratedigger.init({
            infoPanelOpened: function() {
                GUI.hideBottomBar();
            },
            infoPanelClosed: function() {
                GUI.showBottomBar();   
            },
            elements: {
                rootContainerId: 'cratedigger',
                canvasContainerId: 'cratedigger-canvas',
                loadingContainerId: 'cratedigger-loading',
                infoContainerId: 'cratedigger-info',
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

    $(function() {
        App.init();
    });

    return {
        init: init
    };

})();

