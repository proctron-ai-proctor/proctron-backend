const wrtc = require("wrtc");

module.exports = class webRTCConnection {
  constructor(socket, id) {
    const master = new wrtc.RTCPeerConnection();
    var readyForIce = false;
    var remoteIceCandidates = [];

    const drainRemoteIce = () => {
      if (readyForIce) {
        remoteIceCandidates.forEach(async (candidate) => {
          try {
            await master.addIceCandidate(candidate);
          } catch (error) {
            console.log(error);
          }
        });
        remoteIceCandidates = [];
      }
    };

    master.onicecandidate = (evt) => {
      if (evt.candidate) socket.emit("credentials", { ice: evt.candidate });
    };
    master.onnegotiationneeded = async () => {
      try {
        const offer = await master.createOffer();
        await master.setLocalDescription(offer);
        socket.emit("credentials", { sdp: master.localDescription });
      } catch (error) {
        console.log(error);
      }
    };
    socket.on("exam/credentials", async ({ sdp, ice }) => {
      try {
        if (sdp) {
          await master.setRemoteDescription(sdp);
          if (sdp.type == "offer") {
            const ans = await master.createAnswer();
            await master.setLocalDescription(ans);
            socket.emit("credentials", { sdp: master.localDescription });
            readyForIce = true;
            drainRemoteIce();
          }
        } else if (ice) {
          remoteIceCandidates.push(ice);
          drainRemoteIce();
        }
      } catch (error) {
        console.log(error);
      }
    });
    master.ondatachannel = (evt) => {
      const masterChannel = evt.channel;
      masterChannel.onmessage = (evt) => {
        console.log(evt.data);
      };
    };
    master.ontrack = (evt) => {
      const stream = evt.streams[0];
      const videoSinks = stream.getVideoTracks().map((track) => {
        return new RTCVideoSink(track);
      });
    };
  }
};
