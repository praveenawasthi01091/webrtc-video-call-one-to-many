//our username 
var name; 
var connectedUser;
var remoteVideo=[];
  
//connecting to our signaling server
var conn = new WebSocket('ws://192.168.147.22:9090');
  
conn.onopen = function () { 
   console.log("Connected to the signaling server"); 
};
  
//when we got a message from a signaling server 
conn.onmessage = function (msg) { 
   console.log("Got message", msg.data);
	
   var data = JSON.parse(msg.data); 
	
   switch(data.type) { 
      case "login": 
         handleLogin(data.success); 
         break; 
      //when somebody wants to call us 
      case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
      case "answer": 
         handleAnswer(data.answer); 
         break; 
      //when a remote peer sends an ice candidate to us 
      case "candidate": 
         handleCandidate(data.candidate); 
         break; 
      case "leave": 
         handleLeave(); 
         break; 
      default: 
         break; 
   }
};
  
conn.onerror = function (err) { 
   console.log("Got error", err); 
};
  
//alias for sending JSON encoded messages 
function send(message) { 
   //attach the other peer username to our messages 
   if (connectedUser) { 
      message.name = connectedUser; 
   } 
	
   conn.send(JSON.stringify(message)); 
};
  
//****** 
//UI selectors block 
//******
 
var loginPage = document.querySelector('#loginPage'); 
var usernameInput = document.querySelector('#usernameInput'); 
var loginBtn = document.querySelector('#loginBtn'); 

var callPage = document.querySelector('#callPage'); 

// 2nd try
var callToUsernameInput1 = document.querySelector('#callToUsernameInput1');

var callBtn = document.querySelector('#callBtn'); 
// 2nd btn


var hangUpBtn = document.querySelector('#hangUpBtn');
  
var localVideo = document.querySelector('#localVideo'); 
 remoteVideo[0] = document.querySelector('#remoteVideo'); 

// 2nd client
 remoteVideo[1] = document.querySelector('#remoteVideo1'); 

 // 3rdd client
 remoteVideo[2] = document.querySelector('#remoteVideo2'); 

 // 4th client
 // 3rdd client
 remoteVideo[3] = document.querySelector('#remoteVideo3'); 

var i=-1;
var yourConn=[]; 
var j=-1;
var stream;
  
callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", function (event) { 
   name = usernameInput.value;
	
   if (name.length > 0) { 
      send({ 
         type: "login", 
         name: name 
      }); 
   }
	
});


function hasUserMedia() {
   navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
   return !!navigator.getUserMedia;
 }
 
 function hasRTCPeerConnection() {
   window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
   window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
   window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
   return !!window.RTCPeerConnection;
 }

/**habdle login  */
  
function handleLogin(success) { 
   if (success === false) { 
      alert("Ooops...try a different username"); 
   } else { 
      loginPage.style.display = "none"; 
      callPage.style.display = "block";

         // Get the plumbing ready for a call
    startConnection();
   }
 };


//  start connection
 function startConnection() {

   //callPage.style.display = "none";

  if (hasUserMedia()) {

     navigator.getUserMedia({ video: true, audio: false }, function (myStream) {
      stream = myStream;
      self.localVideo.srcObject = stream;
      // yourVideo.src = window.URL.createObjectURL(stream);

      if (hasRTCPeerConnection()) {
        setupPeerConnection(stream);
      } else {
        alert("Sorry, your browser does not support WebRTC.");
      }
    }, function (error) {
      console.log(error);
    });
  } else {
    alert("Sorry, your browser does not support WebRTC.");
  }
}

// set peer connection
function setupPeerConnection(stream) {
   var configuration = {
     "iceServers": [{ "url": "stun:stun.1.google.com:19302" }]
   };
   j++;
   yourConn[j] = new RTCPeerConnection(configuration);
 
   // Setup stream listening
   yourConn[j].addStream(stream);

   yourConn[j].onaddstream = function (e) {
   //   theirVideo.src = window.URL.createObjectURL(e.stream);
   i++;
     self.remoteVideo[i].srcObject = e.stream; 
   };

   // Setup ice handling
   yourConn[j].onicecandidate = function (event) {
     if (event.candidate) {
       send({
         type: "candidate",
         candidate: event.candidate
       });
     }
   };
 }

  
//initiating a call 
callBtn.addEventListener("click", function () { 
   setupPeerConnection(stream);
   var callToUsername = callToUsernameInput.value;
	
   if (callToUsername.length > 0) { 
	
      connectedUser = callToUsername;
		
      // create an offer 
      
      yourConn[j].createOffer(function (offer) { 
         send({ 
            type: "offer", 
            offer: offer 
         }); 
			
         yourConn[j].setLocalDescription(offer); 
      }, function (error) { 
         alert("Error when creating an offer"); 
      });
		
   } 
});





  
//when somebody sends us an offer 
function handleOffer(offer, name) { 
   connectedUser = name; 
   //
   yourConn[j].setRemoteDescription(new RTCSessionDescription(offer));
	
   //create an answer to an offer 
   yourConn[j].createAnswer(function (answer) { 
      yourConn[j].setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      alert("Error when creating an answer"); 
   }); 
};
  
//when we got an answer from a remote user
function handleAnswer(answer) { 
   yourConn[j].setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function handleCandidate(candidate) { 
   yourConn[j].addIceCandidate(new RTCIceCandidate(candidate)); 
};
   
//hang up 
hangUpBtn.addEventListener("click", function () { 

   send({ 
      type: "leave" 
   });  
	
   handleLeave(); 
});
  
function handleLeave() { 
   connectedUser = null; 

   var arrayLength = remoteVideo.length;
for (let k = 0; k < arrayLength; k++) {
   remoteVideo[k].srcObject=null;
}
// reset i value after hang up
 i=-1;
   // remoteVideo[0].srcObject = null; 
   // remoteVideo[1].srcObject = null; 
   // remoteVideo[2].srcObject = null; 
   // remoteVideo[3].srcObject = null; 
   //i=i-4;

   //yourConn[0].close();
   arrayLength=yourConn.length;
   for (let k = 0; k < arrayLength; k++) {
      yourConn[k].close();
   }
   // yourConn[0].close(); 
   // yourConn[1].close(); 
   // yourConn[2].close(); 
   // yourConn[3].close(); 

   for (let k = 0; k < arrayLength; k++) {
      yourConn[k].onicecandidate = null;   
      yourConn[k].onicecandidate = null; 
   }
   // yourConn.onicecandidate = null;   
   // yourConn.onicecandidate = null;   
  
   for(let k=0;k<arrayLength;k++)
   {
      setupPeerConnection(stream);
   }
   // setupPeerConnection(stream);
   // setupPeerConnection(stream);
   // setupPeerConnection(stream);
   // setupPeerConnection(stream);
};