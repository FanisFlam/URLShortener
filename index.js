require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');
const mongoose = require('mongoose');

//connecting to the db
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to the db');
  })
  .catch((err) => {
    console.log(err);
  });

//importing ShortURL Model
const ShortURL = require('./models/ShortURL');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  try{
    const originalURL = new URL(req.body.url);

    dns.lookup(originalURL.host, async (err, addresses, family) => {
      if(err){
        res.json({ error: 'Invalid URL'});
      }
      else {
        try{
          // checks if short URL already exists.
          const data = await ShortURL.findOne({ original_url: originalURL });

          // if it exists, it responds with a JSON with the data returned
          if(data){
            return res.status(200).json({ original_url: data.original_url, short_url: data.short_url})
          }

          // if it doesn't, it counts the elements inside the db
          // and the number will be the new short URL
          const count = await ShortURL.countDocuments({});
          
          // creating new short URL model and saving it.
          const newURL = new ShortURL({
            original_url: originalURL,
            short_url: count
          });

          await newURL.save();

          // sending new data to the browser
          res.status(201).json({ original_url: newURL.original_url, short_url: newURL.short_url})
        } catch(err){
          res.status(500).json({ error: err });
        }
      }
    });
  } catch(err) {
    res.json({error: 'Invalid URL'});
  }
});

app.get('/api/shorturl/:url', async (req, res) => {
  try{
    // Checking if short URL exists
    const data = await ShortURL.findOne({ short_url: req.params.url });

    if(data){
      // if it exists it redirects to the original URL
      res.redirect(data.original_url);
    } else {
      // if it doesn't exist, it throws a 404 error
      res.status(404).json({ error: 'No short URL found for the given input' });
    }
  } catch(err) {
    res.status(500).json({ error: err });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
