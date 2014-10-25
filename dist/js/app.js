var app=function(){function init(){jQuery.ajaxSettings.traditional=!0,getPlaylist("High Tone")}function getPlaylist(artist){playlistIDs=[];var args={name:artist};callApi("artist/similar",args,null,function(error,data){error?console.log("error"):(artists=$.map(data.artists,function(item){return item.name}),artists.unshift(artist),requestPlaylistPart({fromYear:1990,toYear:1999,results:48,artists:artists,ids:[]}))})}function callApi(action,args,options,done,doneFormatting){var defaults={api_key:apiKey},url="http://developer.echonest.com/api/v4/"+action;args=$.extend({},defaults,args),$.getJSON(url,args,function(data){0===data.response.status.code?done(!1,data.response,options,doneFormatting):done(!0)},function(){done(!0)})}function requestPlaylistPart(options,playlist,reqCount){reqCount=reqCount?reqCount:0;var currentArtist=options.artists[reqCount]?options.artists[reqCount]:options.artists[0];console.log(currentArtist);var args={results:50,artist:currentArtist,bucket:["id:deezer","tracks"],type:"artist-radio",adventurousness:1,variety:1,distribution:"wandering"};maxReq>=reqCount&&(reqCount+=1,callApi("playlist/static",args,options,onPlaylistPartGet,function(songs){onPlaylistPartFormatted(options,songs,playlist,reqCount)}))}function onPlaylistPartFormatted(options,songs,playlist,reqCount){playlist=playlist?playlist.concat(songs):songs,playlist.length<options.results&&maxReq>=reqCount?requestPlaylistPart(options,playlist,reqCount):(playlist=playlist.slice(0,options.results),callUrl302(playlist,function(error,newPlaylist){error||(newPlaylist=shuffle(newPlaylist),cratedigger.loadRecords(newPlaylist))}))}function onPlaylistPartGet(error,response,options,doneFormatting){if(!error){var songs=$.map(response.songs,function(song){return formatResponseSong(song,options)});doneFormatting(songs)}}function formatResponseSong(songData,options){if(tracksData=getDataFromTracks(songData.tracks,options),tracksData&&-1===$.inArray(songData.id,playlistIDs)){console.log(playlistIDs.length);var song={title:songData.title,artist:songData.artist_name,cover:tracksData.cover,year:tracksData.year,id:songData.id,hasSleeve:!1};return playlistIDs.push(songData.id),song}return null}function getDataFromTracks(tracks){var length=tracks.length,data={cover:null,year:null};if(length){for(var i=0;length>i;i++)if("deezer"==tracks[i].catalog&&tracks[i].album_date){data.year=tracks[i].album_date.substring(0,4);var id=tracks[i].foreign_release_id.split(":")[2];data.cover="http://api.deezer.com/album/"+id+"/image?size=big";break}return data.cover&&data.year?data:null}return!1}function callUrl302(data,done){var url="https://url302.herokuapp.com/";$.ajax({type:"POST",url:url,dataType:"json",headers:{"Content-Type":"application/json"},data:JSON.stringify(data),success:function(data){done(!1,data)},error:function(){done(!0)}})}function shuffle(v){for(var j,x,i=v.length;i;j=parseInt(Math.random()*i),x=v[--i],v[i]=v[j],v[j]=x);return v}var apiKey="ASJCKIVQOBWZNXULY",maxReq=15,playlistIDs=[];return{init:init}}();$(function(){cratedigger.init({elements:{rootContainerId:"cratedigger",canvasContainerId:"cratedigger-canvas",loadingContainerId:"cratedigger-loading",infosContainerId:"cratedigger-infos",titleContainerId:"cratedigger-record-title",artistContainerId:"cratedigger-record-artist",coverContainerId:"cratedigger-record-cover"}}),app.init(),$.get("https://api.deezer.com/album/669119/image",null,function(){console.log("OK")})});