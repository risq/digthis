var DeezerPlayer=function(){function init(){DZ.init({appId:"146221",channelUrl:"http://risq.github.io/digthis/channel.html",player:{onload:onPlayerLoaded}}),$trackArtist=$(".track .track-artist"),$trackTitle=$(".track .track-title"),$trackCover=$(".track .track-cover"),$trackBar=$(".track-bar"),$bufferBar=$(".buffer-bar"),$buttonPrev=$(".track-control-button.button-prev"),$buttonPlayPause=$(".track-control-button.button-playpause"),$buttonNext=$(".track-control-button.button-next"),$deezerLoginButton=$("#deezer-login-button"),initEventListeners()}function initEventListeners(){$buttonPrev.on("click",onPrevButtonClick),$buttonPlayPause.on("click",onPlayPauseButtonClick),$buttonNext.on("click",onNextButtonClick),$deezerLoginButton.on("click",login)}function onPrevButtonClick(){playPrevTrack()}function play(){DZ.player.play(),playPauseButtonSetToPause()}function pause(){DZ.player.pause(),playPauseButtonSetToPlay()}function onPlayPauseButtonClick(){"paused"===playerState?play():"playing"===playerState&&pause()}function onNextButtonClick(){playNextTrack()}function onPlayerLoaded(){DZ.getLoginStatus(function(response){response.authResponse&&(console.log(response),userIsLoggedIn(response.userID))}),DZ.Event.subscribe("player_play",onTrackPlay),DZ.Event.subscribe("track_end",onTrackEnd),DZ.Event.subscribe("player_position",onPlayerPositionUpdate),DZ.Event.subscribe("player_buffering",onPlayerBufferingUpdate),DZ.Event.subscribe("current_track",function(arg){console.log("current_track",arg.index,arg.track.title,arg.track.album.title)})}function onTrackPlay(){waitingTrackToPlay&&(clearInterval(playTimeout),$trackCover.removeClass("loading"),playingTrack=waitingTrackToPlay,$trackCover.css("background-image","url("+waitingTrackToPlay.cover+")"),GUI.updateTrackTasteButtons(waitingTrackToPlay),waitingTrackToPlay=!1)}function onPlayerPositionUpdate(arg){$trackBar.css("width",100*arg[0]/arg[1]+"%")}function onPlayerBufferingUpdate(percent){$bufferBar.css("width",percent+"%")}function onTrackEnd(){playingTrack&&(playingTrack=!1,playUnplayedTrack())}function playTrack(track){pause(),$trackCover.addClass("loading"),$trackArtist.text(track.artist),$trackTitle.text(track.title),DZ.player.playTracks([track.deezer_id]),waitingTrackToPlay=track,playTimeout=setTimeout(function(){waitingTrackToPlay&&(console.log("Error"),playNextTrack())},constants.playTimeout),playPauseButtonSetToPause(),console.log("playin track",track)}function playTrackFromCrate(track){playTrack(track),history.push(track),historyPos=history.length-1}function playNextTrack(){historyPos==history.length-1?(playUnplayedTrack(),historyPos=history.length-1):(historyPos+=1,playTrack(history[historyPos]))}function playPrevTrack(){history[historyPos-1]&&(historyPos-=1,playTrack(history[historyPos]))}function playUnplayedTrack(){var track=tracksCollection[Math.floor(Math.random()*tracksCollection.length)];playTrack(track),history.push(track)}function playPauseButtonSetToPlay(){playerState="paused",$buttonPlayPause.text("Play")}function playPauseButtonSetToPause(){playerState="playing",$buttonPlayPause.text("Pause")}function login(){DZ.login(function(response){response.authResponse?(userIsLoggedIn(response.userID),DZ.api("/user/me",function(response){console.log("Good to see you, "+response.name+".")}),userToken=response.authResponse.accessToken):console.log("User cancelled login or did not fully authorize.")})}function userIsLoggedIn(userID){isLoggedIn||(isLoggedIn=!0,loggedUserID=userID,GUI.hideDeezerLogin(),console.log("User is logged with id",userID))}function setTracksCollection(tracks){tracksCollection=tracks}function getPlayingTrack(){return playingTrack}var $trackArtist,$trackTitle,$trackCover,$trackBar,$bufferBar,$buttonPrev,$buttonPlayPause,$buttonNext,$deezerLoginButton,tracksCollection,historyPos,playingTrack,playTimeout,loggedUserID,history=[],waitingTrackToPlay=!1,playerState="stopped",isLoggedIn=!1;return constants={playTimeout:5e3},{init:init,playTrackFromCrate:playTrackFromCrate,setTracksCollection:setTracksCollection,getPlayingTrack:getPlayingTrack}}();