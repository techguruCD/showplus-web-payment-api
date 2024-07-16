import express from 'express';
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";

import path from "path";
import { close, returnUrl } from './payment.controller';

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../", "build")));

app.get(['/', '/login', '/findUser', '/findIdSuccess', '/findIdNoJoin', '/findPasswordChange', '/findPwComplete', '/findPwCompleteEasyjoin', '/candyCharge', '/candyCharge/:message', '/fs'], (req, res) => {
  res.sendFile(path.join(__dirname, "../", 'build', 'index.html'));
});

app.post("/api/returnUrl", returnUrl);
app.get("/api/close", close)

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    server.timeout = 600000;
})
