var API=function(){function init(){jQuery.ajaxSettings.traditional=!0}function getPlaylistFromArtist(artist,done){playlistIDs=[],playlistReleaseIDs=[];var args={name:artist};callApi("artist/similar",args,null,function(error,data){error?console.log("error"):(artists=$.map(data.artists,function(item){return item.name}),artists.unshift(artist),requestPlaylistPart({fromYear:1990,toYear:1999,results:48,artists:artists},null,null,function(playlist){newPlaylist=shuffle(playlist),done(playlist)}))})}function callApi(action,args,options,done,doneFormatting){var defaults={api_key:apiKey},url="http://developer.echonest.com/api/v4/"+action;args=$.extend({},defaults,args),$.getJSON(url,args,function(data){0===data.response.status.code?done(!1,data.response,options,doneFormatting):done(!0)},function(){done(!0)})}function requestPlaylistPart(options,playlist,reqCount,onPlaylistLoaded){reqCount=reqCount?reqCount:0;var currentArtist=options.artists[reqCount]?options.artists[reqCount]:options.artists[0],currentResults=0===reqCount?80:40,currentVariety=0===reqCount?.4:.8;console.log(currentArtist);var args={results:currentResults,artist:currentArtist,bucket:["id:deezer","tracks"],type:"artist-radio",variety:currentVariety,distribution:"focused"};maxReq>=reqCount&&(reqCount+=1,callApi("playlist/static",args,options,onPlaylistPartGet,function(songs){onPlaylistPartFormatted(options,songs,playlist,reqCount,onPlaylistLoaded)}))}function onPlaylistPartFormatted(options,songs,playlist,reqCount,playlistLoaded){playlist=playlist?playlist.concat(songs):songs,playlist.length<options.results&&maxReq>=reqCount?requestPlaylistPart(options,playlist,reqCount,playlistLoaded):(playlist=playlist.slice(0,options.results),callUrl302(playlist,function(error,newPlaylist){error||playlistLoaded(newPlaylist)}))}function onPlaylistPartGet(error,response,options,doneFormatting){if(!error){var songs=$.map(response.songs,function(song){return formatResponseSong(song,options)});doneFormatting(songs)}}function formatResponseSong(songData,options){if(tracksData=getDataFromTracks(songData.tracks,options),tracksData&&-1===$.inArray(songData.id,playlistIDs)&&-1===$.inArray(tracksData.release_id,playlistReleaseIDs)){console.log(playlistIDs.length);var song={title:songData.title,artist:songData.artist_name,cover:tracksData.cover,year:tracksData.year,deezer_id:tracksData.id,deezer_releaseId:tracksData.release_id,hasSleeve:!1};return playlistIDs.push(songData.id),playlistReleaseIDs.push(tracksData.release_id),song}return null}function getDataFromTracks(tracks){var length=tracks.length,data={cover:null,year:null};if(length){for(var i=0;length>i;i++)if("deezer"==tracks[i].catalog&&tracks[i].album_date){data.year=tracks[i].album_date.substring(0,4),data.id=tracks[i].foreign_id.split(":")[2],data.release_id=tracks[i].foreign_release_id.split(":")[2],data.cover="http://api.deezer.com/album/"+data.release_id+"/image?size=big";break}return data.cover&&data.year?data:null}return!1}function callUrl302(data,done){var url="https://url302.herokuapp.com/";$.ajax({type:"POST",url:url,dataType:"json",headers:{"Content-Type":"application/json"},data:JSON.stringify(data),success:function(data){done(!1,data)},error:function(){done(!0)}})}function shuffle(v){for(var j,x,i=v.length;i;j=parseInt(Math.random()*i),x=v[--i],v[i]=v[j],v[j]=x);return v}var apiKey="ASJCKIVQOBWZNXULY",maxReq=15,playlistIDs=[],playlistReleaseIDs=[];return{init:init,getPlaylistFromArtist:getPlaylistFromArtist}}(),GUI=function(){function init(){$searchInput=$("#artist-search-input"),$artistSearchContainer=$("#artist-search"),$bottomBar=$("#bottom-bar"),$listenButton=$("#cratedigger-record-listen"),initEventListeners()}function initEventListeners(){$searchInput.keypress(searchInputKeypressHandler),$listenButton.on("click",listenButtonClickHandler)}function searchInputKeypressHandler(e){13==e.which&&$searchInput.val()&&""!==$searchInput.val()&&($searchInput.prop("disabled",!0),API.getPlaylistFromArtist($searchInput.val(),function(playlist){cratedigger.loadRecords(playlist),DeezerPlayer.setTracksCollection(playlist),setTimeout(function(){$artistSearchContainer.fadeOut(1e3)},2e3)}))}function listenButtonClickHandler(e){return e.stopPropagation(),DeezerPlayer.playTrack(cratedigger.getSelectedRecord().data),!1}function openBottomBar(){}function closeBottomBar(){}var $searchInput,$artistSearchContainer,$bottomBar,$listenButton;return{init:init,openBottomBar:openBottomBar,closeBottomBar:closeBottomBar}}(),DeezerPlayer=function(){function init(){DZ.init({appId:"146221",channelUrl:"http://risq.github.io/digthis/channel.html",player:{onload:onPlayerLoaded}}),$trackArtist=$(".track .track-artist"),$trackTitle=$(".track .track-title"),$trackCover=$(".track .track-cover"),$trackBar=$(".track-bar"),$bufferBar=$(".buffer-bar"),$buttonPrev=$(".track-control-button.button-prev"),$buttonPlayPause=$(".track-control-button.button-playpause"),$buttonNext=$(".track-control-button.button-next"),initEventListeners()}function initEventListeners(){$buttonPrev.on("click",onPrevButtonClick),$buttonPlayPause.on("click",onPlayPauseButtonClick),$buttonNext.on("click",onNextButtonClick)}function onPrevButtonClick(){playUnplayedTrack()}function onPlayPauseButtonClick(){"paused"==playerState?(DZ.player.play(),playPauseButtonSetToPause()):(DZ.player.pause(),playPauseButtonSetToPlay())}function onNextButtonClick(){playUnplayedTrack()}function onPlayerLoaded(){DZ.getLoginStatus(function(response){console.log(response.authResponse?"Logged in !":"Not logged :(")}),DZ.Event.subscribe("player_play",onTrackPlay),DZ.Event.subscribe("track_end",onTrackEnd),DZ.Event.subscribe("player_position",onPlayerPositionUpdate),DZ.Event.subscribe("player_buffering",onPlayerBufferingUpdate),DZ.Event.subscribe("current_track",function(arg){console.log("current_track",arg.index,arg.track.title,arg.track.album.title)})}function onTrackPlay(){waitingTrackToPlay&&(clearInterval(playTimeout),playingTrack=waitingTrackToPlay,$trackArtist.text(waitingTrackToPlay.artist),$trackTitle.text(waitingTrackToPlay.title),$trackCover.css("background-image","url("+waitingTrackToPlay.cover+")"),waitingTrackToPlay=!1)}function onPlayerPositionUpdate(arg){$trackBar.css("width",100*arg[0]/arg[1]+"%")}function onPlayerBufferingUpdate(percent){$bufferBar.css("width",percent+"%")}function onTrackEnd(){playingTrack&&(playingTrack=!1,playUnplayedTrack())}function playTrack(track){DZ.player.playTracks([track.deezer_id]),waitingTrackToPlay=track,playTimeout=setTimeout(function(){waitingTrackToPlay&&(console.log("Error"),playUnplayedTrack())},constants.playTimeout),playPauseButtonSetToPause()}function playUnplayedTrack(){console.log("play a track");var track=unplayedTracks[Math.floor(Math.random()*unplayedTracks.length)];playTrack(track)}function playPauseButtonSetToPlay(){playerState="paused",$buttonPlayPause.text("Play")}function playPauseButtonSetToPause(){playerState="playing",$buttonPlayPause.text("Pause")}function setTracksCollection(tracksCollection){unplayedTracks=tracksCollection,console.log(tracksCollection),console.log(unplayedTracks[0])}var $trackArtist,$trackTitle,$trackCover,$trackBar,$bufferBar,$buttonPrev,$buttonPlayPause,$buttonNext,unplayedTracks,playingTrack,playTimeout,waitingTrackToPlay=!1,playerState="paused",constants={playTimeout:5e3};return{init:init,playTrack:playTrack,setTracksCollection:setTracksCollection}}(),App=function(){function init(){cratedigger.init({infoPanelOpened:function(){GUI.openBottomBar()},infoPanelClosed:function(){GUI.openBottomBar()},elements:{rootContainerId:"cratedigger",canvasContainerId:"cratedigger-canvas",loadingContainerId:"cratedigger-loading",infosContainerId:"cratedigger-infos",titleContainerId:"cratedigger-record-title",artistContainerId:"cratedigger-record-artist",coverContainerId:"cratedigger-record-cover"}}),API.init(),GUI.init(),DeezerPlayer.init()}return{init:init}}();$(function(){App.init()});