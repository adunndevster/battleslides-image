<template>
  <div class="file-transfer">
    <img class="logo" src="@/assets/logo_white.png" />
    <h2>Add an Image or Video</h2>
    <p>Want to add some crazy to someone's presentation? Take or find a photo or short video, and it will be uploaded to your game session.</p>
    <p>Note: These files DO NOT get uploaded to the "cloud". They go straight to your party's machine, and disappear as soon as the game is turned off.</p>
    <div class="progres-container" v-show="fileProgress > 0"><progress-bar
      :options="progressOptions"
      :value="fileProgress"
      /></div>
    <a id="btn-select-file" class="btn-select-file button is-danger">Find a file</a>
  </div>
</template>

<script>
import {FileSelector} from "../common/FileSelector";

let vue;
export default {
  name: "title-screen",
  data: () => {
    return {
      progressOptions: {
        text: {
          color: '#ffffff',
          shadowEnable: true,
          shadowColor: '#000000',
          fontSize: 14,
          fontFamily: 'Segoe UI',
          dynamicPosition: false,
          hideText: false
        },
        progress: {
          color: '#00d1b2',
          backgroundColor: '#000000'
        },
        layout: {
          height: 35,
          width: 140,
          verticalTextAlign: 61,
          horizontalTextAlign: 43,
          zeroOffset: 0,
          strokeWidth: 30,
          progressPadding: 0,
          type: 'line'
        }
      },
      fileProgress: 0,
    }
  },
  mounted() {
    vue = this;
    window.getExternalIceServers = true;

    window.onerror = console.error = function() {
            var error = JSON.stringify(arguments);
            if(error.indexOf('Blocked a frame with origin') !== -1) {
                return;
            }
            alert('Error:\n' + error);
        };
        // Muaz Khan     - https://github.com/muaz-khan
        // MIT License   - https://www.WebRTC-Experiment.com/licence/
        // Source Code   - https://github.com/muaz-khan/RTCMultiConnection
        let btnSelectFile = document.getElementById("btn-select-file")
        function setupFileTransfer() {
          joinARoom("battleslides-1234");
        }
        
        var connection;
        function joinARoom(roomId) {
            btnSelectFile.onclick = function(file) {
                if(file && (file instanceof File || file instanceof Blob) && file.size) {
                  onFileSelected(file);
                  return;
                }
                var fileSelector = new FileSelector();
                fileSelector.selectSingleFile(function(file) {
                    onFileSelected(file);
                });
            };
            var lastSelectedFile;
            var room_id = '';
            // 60k -- assuming receiving client is chrome
            var chunk_size = 60 * 1000;
            function setupWebRTCConnection() {
                if (connection) {
                    return;
                }
                const RTCMultiConnection = require('rtcmulticonnection');
                const fbr = require("fbr");
    
                connection = new RTCMultiConnection();
                // to make sure, "connection-reconnect" doesn't sends files again
                connection.fileReceived = {};
                // by default, socket.io server is assumed to be deployed on your own URL
                //connection.socketURL = '/';
                // comment-out below line if you do not have your own socket.io server
                connection.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/';
                connection.socketMessageEvent = 'file-sharing-demo';
                connection.chunkSize = chunk_size;
                connection.sdpConstraints.mandatory = {
                    OfferToReceiveAudio: false,
                    OfferToReceiveVideo: false
                };
                connection.enableFileSharing = true;
                if (room_id && room_id.length) {
                    connection.userid = room_id;
                }
                connection.channel = connection.sessionid = roomId;
                connection.session = {
                    data: true,
                    oneway: false //--- to make it one-to-many
                };
                // https://www.rtcmulticonnection.org/docs/iceServers/
                // use your own TURN-server here!
                connection.iceServers = [{
                    'urls': [
                        'stun:stun.l.google.com:19302',
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302',
                        'stun:stun.l.google.com:19302?transport=udp',
                    ]
                }];
                connection.connectedWith = {};
                connection.onmessage = function(event) {
                    if(event.data.doYouWannaReceiveThisFile) {
                        if(!connection.fileReceived[event.data.fileName]) {
                            connection.send({
                                yesIWannaReceive:false,
                                fileName: event.data.fileName
                            });
                        }
                    }
                    if(event.data.yesIWannaReceive && !!lastSelectedFile) {
                        connection.shareFile(lastSelectedFile, event.userid);
                    }
                };
                connection.onopen = function(e) {
                    try {
                        chrome.power.requestKeepAwake('display');
                    }
                    catch(e) {}
                    if (connection.connectedWith[e.userid]) return;
                    connection.connectedWith[e.userid] = true;
                    var message = '<b>' + e.userid + '</b><br>is connected.';
                    console.log(message);
                    if (!lastSelectedFile) return;
                    // already shared the file
                    var file = lastSelectedFile;
                    setTimeout(function() {
                        console.log('Sharing file<br><b>' + file.name + '</b><br>Size: <b>' + bytesToSize(file.size) + '<b><br>With <b>' + connection.getAllParticipants().length + '</b> users');
                        connection.send({
                            doYouWannaReceiveThisFile: true,
                            fileName: file.size + file.name
                        });
                    }, 500);
                };
                connection.onclose = function(e) {
                    if (connection.connectedWith[e.userid]) return;
                    console.log('Data connection has been closed between you and <b>' + e.userid + '</b>. Re-Connecting..');
                    connection.join(roomId);
                };
                connection.onerror = function(e) {
                    if (connection.connectedWith[e.userid]) return;
                    console.log('Data connection failed. between you and <b>' + e.userid + '</b>. Retrying..');
                };
                setFileProgressBarHandlers(connection);
                connection.onUserStatusChanged = function(user) {
                };
                connection.onleave = function(user) {
                    user.status = 'offline';
                    connection.onUserStatusChanged(user);
                };
                var message = 'Connecting room:<br><b>' + connection.channel + '</b>';
                console.log(message);
                connection.openOrJoin(connection.channel, function(isRoomExist, roomid) {
                    var message = 'Successfully connected to room: <b>' + roomid + '</b><hr>Other users can join you on iPhone/Android using "' + roomid + '" or desktop (Windows/MacOSX/Ubuntu) users can join using this (secure/private) URL: <a href="./file-sharing.html#' + roomid + '" target="_blank">file-sharing.html#' + roomid + '</a>';
                    // if (isRoomEists) { }
                    console.log(message);
                    connection.getSocket(function(socket) {
                      socket.on('disconnect', function() {
                         console.log('Seems disconnected.', 'red');
                      });
                      socket.on('connect', function() {
                         location.reload();
                      });
                      socket.on('error', function() {
                         location.reload();
                      });
                    });
                    window.addEventListener('offline', function() {
                      console.log('Seems disconnected.', 'red');
                    }, false);
                });
                window.connection = connection;
            }
            function setFileProgressBarHandlers(connection) {
              const progressHelper = {};
              // www.RTCMultiConnection.org/docs/onFileStart/
              connection.onFileStart = function(file) {
                  if (connection.fileReceived[file.size + file.name]) return;
                  //var message = '';
                  if (file.userid == connection.userid) {
                      //message += 'Sharing with:' + file.remoteUserId;
                  } else {
                      //message += 'Receiving from:' + file.userid;
                  }
                  //message += '<br><b>' + file.name + '</b>.';
                  //message += '<br>Size: <b>' + bytesToSize(file.size) + '</b>';
                  //message += '<br><label>0%</label> <progress></progress>';
                  if (!file.remoteUserId) {
                      //progressHelper[file.uuid].progress.max = file.maxChunks;
                      return;
                  }
                  //progressHelper[file.uuid][file.remoteUserId].progress.max = file.maxChunks;
              };
              // www.RTCMultiConnection.org/docs/onFileProgress/
              connection.onFileProgress = function(chunk) {
                  if (connection.fileReceived[chunk.size + chunk.name]) return;
                  // var helper = progressHelper[chunk.uuid];
                  // if (!helper) {
                  //     return;
                  // }
                  // if (chunk.remoteUserId) {
                  //     //helper = progressHelper[chunk.uuid][chunk.remoteUserId];
                  //     if (!helper) {
                  //         return;
                  //     }
                  // }
                  vue.fileProgress = Math.round((chunk.currentPosition / chunk.maxChunks) * 100);
                  vue.fileProgress = (vue.fileProgress > 100) ? 100 : vue.fileProgress;
                  console.log(JSON.stringify(Math.round(chunk.currentPosition / chunk.maxChunks)));
                  //helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max;
              };
              // www.RTCMultiConnection.org/docs/onFileEnd/
              connection.onFileEnd = function(file) {
                  if (connection.fileReceived[file.size + file.name]) return;
                  var message = 'Successfully shared file';
                  message += '<br><b>' + file.name + '</b>.';
                  message += '<br>With: <b>' + file.remoteUserId + '</b>.';
                  message += '<br>Size: <b>' + bytesToSize(file.size) + '</b>.';
                  console.log(message);
              };
            }
            function bytesToSize(bytes) {
                var k = 1000;
                var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                if (bytes === 0) {
                    return '0 Bytes';
                }
                var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
                return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
            }
            function onFileSelected(file) {
                var innerHTML = 'You selected:<br><b>' + file.name + '</b><br>Size: <b>' + bytesToSize(file.size) + '</b>';
                console.log(innerHTML);
                lastSelectedFile = file;
                if (connection) {
                    connection.send({
                        doYouWannaReceiveThisFile: true,
                        fileName: file.size + file.name
                    });
                }
            }
            window.onerror = console.error = function() {
                var error = JSON.stringify(arguments);
                if(error.indexOf('Blocked a frame with origin') !== -1) {
                  return;
                }
                console.log('Error:<br>' + error, 'red')
            };
            setupWebRTCConnection();
        }
        window.addEventListener('online', function() {
          location.reload();
        }, false);
        // drag-drop support
        document.addEventListener('dragover', function(e) {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
        }, false);
        document.addEventListener('drop', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if(!e.dataTransfer.files || !e.dataTransfer.files.length) {
            return;
          }
          var file = e.dataTransfer.files[0];
          if(!connection) {
            document.getElementById('join-room').onclick();
          }
          btnSelectFile.onclick(file);
        }, false);
        
      setupFileTransfer();
  },
  methods: {
    
  }
}
</script>



<style>
body {
  background-color: black;
}

.file-transfer .logo {
  width: 100%;
}

.progress-container {
  margin-top: 20px;
}

.btn-select-file
{
  margin-top: 20px;
}
</style>