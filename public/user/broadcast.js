const peerConnections = {};
const config = {
  iceServers: [
    { 
      "urls": "stun:stun.l.google.com:19302",
    },

  ]
};
let dataChannels = {};

const socket = io.connect(window.location.origin);

socket.on("answer", (id, description) => {
  //console.log("answer recieved");
  peerConnections[id].setRemoteDescription(description);  

});

socket.on("watcher", id => {
  //console.log("watcher recieved");

    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;

    dataChannels[id] =
        peerConnection.createDataChannel("dataChannel");

      dataChannels[id].onerror = (error) => {
        //console.log("Data Channel Error:", error);
      };

      dataChannels[id].onmessage = (event) => {
        //console.log("Got Data Channel Message:", event.data);
      };

      dataChannels[id].onopen = () => {
        console.log("Datachannel open");
      };

      dataChannels[id].onclose = () => {
        console.log("Datachannel closed");
        delete dataChannels[id];
      };

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit("candidate", id, event.candidate);
        //console.log("candidate sent");
      }
    
    peerConnection.ondatachannel = event =>{
      dataChannel[id] = event.channel

      dataChannel[id].onmessage = function (event) { 
        //console.log("Got message from channel "+id+":", event.data); 
      };
      dataChannel[id].onclose = function (event) { 
        //console.log("Channel closed"); 
        delete dataChannel[id];
      };  
      dataChannel[id].onopen = function (event) { 
        //console.log("Channel OPEN"); 
      }; 
    };
    
  };
 

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
      //console.log("offer sent");
    });

});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
  //console.log("candidate recieved");
});

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

socket.on("connect", () => {
  //console.log("broadcaster sent");
  socket.emit("broadcaster");
});


function send(data){
  let sent = false;
  for(id of Object.keys(peerConnections)){
    if(dataChannels[id] && dataChannels[id].readyState == "open")
    dataChannels[id].send(data)
    sent = true;
  }
  return sent;
}