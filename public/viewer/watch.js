let peerConnection;
let dataChannel;
const config = {
  iceServers: [
      { 
        "urls": "stun:stun.l.google.com:19302",
      }
  ]
};

const socket = io.connect(window.location.origin);

socket.on("offer", (id, description) => {
  //console.log("Offer recieved");
  peerConnection = new RTCPeerConnection(config);
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
      //console.log("answer sent");
    });
  peerConnection.ontrack = event => {
    video.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
      //console.log("candidate sent");
    }
  };
  peerConnection.ondatachannel = event => {
    //console.log("Detected new channel");
    dataChannel = event.channel
    dataChannel.onmessage = function (event) { 
      // //console.log("Got message:", event.data); 
      setFromString(event.data,camera, h1, h2)
    };
    dataChannel.onclose = function (event) { 
      console.log("Channel closed"); 
      dataChannel = null;
    };  
      dataChannel.onopen = function (event) { 
      console.log("Channel Open"); 
    };  

    
  };
});


socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("connect", () => {
  //console.log("watcher sent");
  socket.emit("watcher");
});

socket.on("broadcaster", () => {
  //console.log("watcher sent bc of broadcaster");
  socket.emit("watcher");
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
  peerConnection.close();
};

