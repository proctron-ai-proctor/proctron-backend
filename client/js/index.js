var videoInput;
var videoOutput;
var state = null;
var stream;

const socket = io.connect("http://127.0.0.1:3000", {
  query: "user=slayer@gmail.com",
});
const pc = new RTCPeerConnection();
const I_CAN_START = 0;
const I_CAN_STOP = 1;
const I_AM_STARTING = 2;

pc.addEventListener("icecandidate", (evt) => {
  onIceCandidate(evt);
});

window.onload = function () {
  console = new Console();
  console.log("Page loaded ...");
  videoInput = document.getElementById("videoInput");
  videoOutput = document.getElementById("videoOutput");
  setState(I_CAN_START);
};

socket.on("credentials", async ({ sdp, ice }) => {
  try {
    if (sdp) {
      console.log("got answer");
      await pc.setRemoteDescription(sdp);
      console.log("set");
      setState(I_CAN_STOP);
    } else if (ice) {
      console.log("got ice");
      await pc.addIceCandidate(ice);
      console.log("ice set");
    }
  } catch (error) {
    console.log(error);
  }
});

const start = async () => {
  try {
    console.log("Starting video call ...");
    setState(I_AM_STARTING);
    showSpinner(videoInput, videoOutput);

    console.log("Creating WebRtcPeer and generating local sdp offer ...");
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    console.log("Received local stream");
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("exam/start", { offer: offer });
  } catch (error) {
    console.log(error);
  }
};

const onIceCandidate = (evt) => {
  console.log("sending ice");
  socket.emit("exam/credentials", { ice: evt.candidate });
};

function stop() {
  console.log("Stopping video call ...");
  setState(I_CAN_START);
  if (pc) {
    stream.getTracks().forEach(function (track) {
      track.stop();
    });
    pc.close();
    socket.emit("exam/stop");
  }
  hideSpinner(videoInput, videoOutput);
}

function setState(nextState) {
  switch (nextState) {
    case I_CAN_START:
      $("#start").attr("disabled", false);
      $("#start").attr("onclick", "start()");
      $("#stop").attr("disabled", true);
      $("#stop").removeAttr("onclick");
      break;

    case I_CAN_STOP:
      $("#start").attr("disabled", true);
      $("#stop").attr("disabled", false);
      $("#stop").attr("onclick", "stop()");
      break;

    case I_AM_STARTING:
      $("#start").attr("disabled", true);
      $("#start").removeAttr("onclick");
      $("#stop").attr("disabled", true);
      $("#stop").removeAttr("onclick");
      break;

    default:
      onError("Unknown state " + nextState);
      return;
  }
  state = nextState;
}

function showSpinner() {
  for (var i = 0; i < arguments.length; i++) {
    arguments[i].poster = "./img/transparent-1px.png";
    arguments[i].style.background =
      'center transparent url("./img/spinner.gif") no-repeat';
  }
}

function hideSpinner() {
  for (var i = 0; i < arguments.length; i++) {
    arguments[i].src = "";
    arguments[i].poster = "./img/webrtc.png";
    arguments[i].style.background = "";
  }
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', "click", function (event) {
  event.preventDefault();
  $(this).ekkoLightbox();
});
