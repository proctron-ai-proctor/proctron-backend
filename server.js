const express = require("express");
const auth = require("./routes/auth");
const examCreds = require("./routes/examCreds");
const master = require("./routes/exam");
const jwt = require("jsonwebtoken");
const key = require("./keys/jwt-token.json");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const bodyParser = require("body-parser");

server.listen(3000);

const userAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader == null) {
    res.status(401).send({ message: "provide authorization token" });
  } else {
    const token = authHeader.split(" ")[1];
    if (token == null)
      return res.status(401).send({ message: "invalid token" });
    jwt.verify(token, key.secret, (error, user) => {
      if (error) return res.status(401).send({ message: "invalid token" });
      req.user = user;
      next();
    });
  }
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/users", auth);
app.use("/exam", userAuth, examCreds);

// io.use((socket, next) => {
//   const token = socket.handshake.auth.token
//   if (token == null) {
//     socket.emit('error', { error: 'auth token missing' })
//     socket.disconnect()
//   }
//   jwt.verify(token, key.secret, (error, user) => {
//     if (error) {
//       socket.emit('error', { error: 'invalid token' })
//       socket.disconnect()
//     }
//     console.log(user)
//     next()
//   })
// })

io.on("connection", (socket) => {
  const user = socket.handshake.query.user;
  const newPeer = new master(socket, socket.id, user);
});
