const kurento = require("kurento-client");
const uuid = require("uuid");

module.exports = class kurentoWebRTC {
  constructor(socket, id, user) {
    var sessions = {};
    var candidatesQueue = {};
    var kurentoClient = null;

    var argv = {
      ws_uri: "ws://127.0.0.1:8888/kurento",
      file_uri: `file:///tmp/${user}-${uuid.v4()}.webm`,
    };
    
    const getKurentoClient = (callback) => {
      if (kurentoClient !== null) {
        return callback(null, kurentoClient);
      }
      kurento(argv.ws_uri, (error, _kurentoClient) => {
        if (error) {
          console.log(error);
          return callback(error);
        }
        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
      });
    };
    const createMediaElements = (pipeline, callback) => {
      pipeline.create(
        "RecorderEndpoint",
        { uri: argv.file_uri },
        (error, recorderEndpoint) => {
          if (error) {
            console.log(error);
            return callback(error);
          }
          pipeline.create("WebRtcEndpoint", (error, webRTCEndpoint) => {
            if (error) {
              console.log(error);
              return callback(error);
            }
            return callback(null, webRTCEndpoint, recorderEndpoint);
          });
        }
      );
    };
    const connectMediaElements = (
      webRTCEndpoint,
      recorderEndpoint,
      callback
    ) => {
      webRTCEndpoint.connect(recorderEndpoint, (error) => {
        if (error) {
          return callback(error);
        }
        webRTCEndpoint.connect(webRTCEndpoint, (error) => {
          if (error) {
            return callback(error);
          }
          console.log(`connected to ${user}`);
          return callback(null);
        });
      });
    };
    const startExam = (id, offer, callback) => {
      if (!id) {
        console.log("no id");
        return callback("provide id");
      }
      getKurentoClient((error, kurentoClient) => {
        if (error) {
          console.log(error);
          return callback(error);
        }
        kurentoClient.create("MediaPipeline", (error, pipeline) => {
          if (error) {
            console.log(error);
            return callback(error);
          }
          createMediaElements(
            pipeline,
            (error, webRTCEndpoint, recorderEndpoint) => {
              if (error) {
                pipeline.release();
                console.log(error);
              }
              if (candidatesQueue[id]) {
                while (candidatesQueue[id].length) {
                  console.log("adding ice");
                  var candidate = candidatesQueue[id].shift();
                  webRTCEndpoint.addIceCandidate(candidate);
                }
              }
              connectMediaElements(
                webRTCEndpoint,
                recorderEndpoint,
                (error) => {
                  if (error) {
                    console.log("media element error");
                    pipeline.release();
                    return callback(error);
                  }
                }
              );
              webRTCEndpoint.on("OnIceCandidate", (evt) => {
                console.log("ice sent");
                var candidate = kurento.getComplexType("IceCandidate")(
                  evt.candidate
                );
                socket.emit("credentials", { ice: candidate });
              });
              webRTCEndpoint.processOffer(offer.sdp, (error, answer) => {
                if (error) {
                  pipeline.release();
                  console.log(error);
                  return callback(error);
                }
                sessions[id] = {
                  pipeline: pipeline,
                  webRTCEndpoint: webRTCEndpoint,
                };
                return callback(null, answer);
              });
              webRTCEndpoint.gatherCandidates((error) => {
                if (error) {
                  return callback(error);
                }
              });
              recorderEndpoint.record();
              console.log(`Recording at ${argv.file_uri}`);
            }
          );
        });
      });
    };

    socket.on("exam/start", ({ offer }) => {
      startExam(id, offer, (error, answer) => {
        if (error) {
          console.log(error);
        }
        const _answer = {
          type: "answer",
          sdp: answer,
        };
        socket.emit("credentials", { sdp: _answer });
      });
    });
    socket.on("exam/credentials", ({ ice }) => {
      if (ice) {
        var candidate = kurento.getComplexType("IceCandidate")(ice);
        if (sessions[id]) {
          var webRTCEndpoint = sessions[id].webRTCEndpoint;
          webRTCEndpoint.addIceCandidate(candidate);
          console.log("ice added");
        } else {
          console.log("queueing");
          if (!candidatesQueue[id]) {
            candidatesQueue[id] = [];
          }
          candidatesQueue[id].push(candidate);
        }
      }
    });
    socket.on("exam/stop", () => {
      if (sessions[id]) {
        var pipeline = sessions[id].pipeline;
        pipeline.release();
        console.log(`stopped ${user}`);
      }
    });
  }
};
