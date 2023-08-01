const express = require('express');
const crypto = require('crypto');
const ethers = require('ethers');
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
var md5 = require('md5');
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption');


app.use(express.static(__dirname));
app.use(express.json());
app.set('view engine', 'html');
app.use(bodyParser.json());

mongoose.connect("mongodb://127.0.0.1/userDB");
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = new mongoose.model("User", userSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});


app.post("/", function(req, res){
  const username = req.body.username;
  const password = md5(req.body.password);

  User.findOne({email: username})
      .then(founduser => {
          if(founduser && (founduser.password === password)){
              res.redirect("/success");
          }
          else{
              console.log("Password incorrect");
          }
      })
      .catch(err => {
          console.log(err);
      });    
});


// GET route to retrieve a nonce value for use in signing
app.get('/api/nonce', (req, res) => {
  const nonce = crypto.randomBytes(32).toString('hex');
  res.json({ nonce });
});

const secretKey = 'ilovecars';

app.post('/login', (req, res) => {
    const { signedMessage, message, address } = req.body;
    const recoveredAddress = ethers.utils.verifyMessage(message, signedMessage);
    if (recoveredAddress !== address) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Generating the JWT token
    const token = jwt.sign({ address }, secretKey, { expiresIn: '10s' });
    // Sendind the JWT token to the index.html
    res.json( token );
});


// Endpoint for verifying the JWT token and logging in the user
app.post('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verifying the JWT token
      const decoded = jwt.verify(token, secretKey);
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        res.json("tokenExpired");
      } else {
        res.json("ok");
      }

      
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });
  

app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname + '/success.html'));
});


app.listen(3000, () => {
  console.log('Server started on port 3000');
});