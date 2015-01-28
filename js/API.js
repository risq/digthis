var API=function(){function init(){jQuery.ajaxSettings.traditional=!0}function getPlaylistFromArtist(artist,done){playlistIDs=[],playlistReleaseIDs=[];var args={name:artist,results:maxReq};advancedAPIRequest("artist/similar",args,null,function(error,data){error?console.log("error"):(artists=$.map(data.artists,function(item){return item.name}),artists.unshift(artist),requestPlaylistPart({fromYear:1990,toYear:1999,results:48,artists:artists},null,null,function(playlist){newPlaylist=shuffle(playlist),done(playlist)}))})}function advancedAPIRequest(action,args,options,done,doneFormatting){var defaults={api_key:apiKey},url=apiUrl+action;args=$.extend({},defaults,args),$.getJSON(url,args,function(data){0===data.response.status.code?done(!1,data.response,options,doneFormatting):done(!0)}).fail(function(){done(!0)})}function requestPlaylistPart(options,playlist,reqCount,onPlaylistLoaded){reqCount=reqCount?reqCount:0;var currentArtist=options.artists[reqCount]?options.artists[reqCount]:options.artists[0],currentResults=0===reqCount?80:40,currentVariety=0===reqCount?.4:.8;console.log(currentArtist);var args={results:currentResults,artist:currentArtist,bucket:["id:deezer","tracks"],type:"artist-radio",variety:currentVariety,distribution:"focused"};maxReq>=reqCount&&(reqCount+=1,advancedAPIRequest("playlist/static",args,options,onPlaylistPartGet,function(songs){onPlaylistPartFormatted(options,songs,playlist,reqCount,onPlaylistLoaded)}))}function onPlaylistPartFormatted(options,songs,playlist,reqCount,playlistLoaded){playlist=playlist?playlist.concat(songs):songs,playlist.length<options.results&&maxReq>=reqCount?requestPlaylistPart(options,playlist,reqCount,playlistLoaded):(playlist=playlist.slice(0,options.results),callUrl302(playlist,function(error,newPlaylist){error||playlistLoaded(newPlaylist)}))}function onPlaylistPartGet(error,response,options,doneFormatting){if(!error){var songs=$.map(response.songs,function(song){return formatResponseSong(song,options)});console.log("selected songs :",songs.length),doneFormatting(songs)}}function formatResponseSong(songData,options){if(tracksData=getDataFromTracks(songData.tracks,options),tracksData&&-1===$.inArray(songData.id,playlistIDs)){var song={id:songData.id,title:songData.title,artist:songData.artist_name,cover:tracksData.cover,year:tracksData.year,deezer_id:tracksData.id,deezer_releaseId:tracksData.release_id,hasSleeve:!1};return playlistIDs.push(songData.id),playlistReleaseIDs.push(tracksData.release_id),song}return null}function getDataFromTracks(tracks){var length=tracks.length,data={cover:null,year:null};if(length){for(var i=0;length>i;i++)if("deezer"==tracks[i].catalog&&tracks[i].album_date){data.year=tracks[i].album_date.substring(0,4),data.id=tracks[i].foreign_id.split(":")[2],data.release_id=tracks[i].foreign_release_id.split(":")[2],data.cover="http://api.deezer.com/album/"+data.release_id+"/image?size=big";break}return data.cover&&data.year?data:null}return!1}function callUrl302(data,done){var url="https://url302.herokuapp.com/";$.ajax({type:"POST",url:url,dataType:"json",headers:{"Content-Type":"application/json"},data:JSON.stringify(data),success:function(data){done(!1,data)},error:function(){done(!0)}})}function getTasteProfileFromUserID(userID,done){$.ajax({type:"GET",url:apiUrl+"tasteprofile/profile",data:{api_key:apiKey,name:userID},dataType:"json"}).done(function(data){var profileID=data.response.catalog.id;readTasteProfile(profileID,function(error,catalog){error?done(!0):done(!1,catalog)})}).fail(function(){console.log("taste profile not found for user "+userID+", trying to create one..."),createTasteProfile(userID,function(error,data){error?(console.log("error creating taste profile for user "+userID),done(!0)):(console.log("taste profile created"),done(!1,{id:data.response,items:[]}))})})}function readTasteProfile(profileID,done){console.log("readTasteProfile",profileID),$.ajax({type:"GET",url:apiUrl+"tasteprofile/read",data:{api_key:apiKey,id:profileID},dataType:"json"}).done(function(data){done(!1,data.response.catalog)}).fail(function(){done(!0)})}function createTasteProfile(userID,done){console.log("createTasteProfile",userID),$.ajax({type:"POST",url:apiUrl+"tasteprofile/create",data:{api_key:apiKey,name:userID,type:"general"},dataType:"json"}).done(function(data){done(!1,data)}).fail(function(){done(!0)})}function likeTrack(profileID,trackID,done){console.log("likeTrack",trackID),$.ajax({type:"GET",url:apiUrl+"tasteprofile/rate",data:{api_key:apiKey,id:profileID,item:trackID,rating:10},dataType:"json"}).done(function(data){done(!1,data)}).fail(function(){done(!0)})}function dislikeTrack(profileID,trackID,done){console.log("dislikeTrack",trackID),$.ajax({type:"GET",url:apiUrl+"tasteprofile/rate",data:{api_key:apiKey,id:profileID,item:trackID,rating:1},dataType:"json"}).done(function(data){done(!1,data)}).fail(function(){done(!0)})}function shuffle(v){for(var j,x,i=v.length;i;j=parseInt(Math.random()*i),x=v[--i],v[i]=v[j],v[j]=x);return v}var apiKey="ASJCKIVQOBWZNXULY",apiUrl="http://developer.echonest.com/api/v4/",maxReq=20,playlistIDs=[],playlistReleaseIDs=[];return{init:init,getPlaylistFromArtist:getPlaylistFromArtist,getTasteProfileFromUserID:getTasteProfileFromUserID,readTasteProfile:readTasteProfile,likeTrack:likeTrack,dislikeTrack:dislikeTrack}}();