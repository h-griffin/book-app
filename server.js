'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const superagent = require('superagent');
const pg = require('pg');
const PORT = process.env.PORT || 3001;
const ejs = require('ejs');

//read form info
app.use(express.urlencoded({ extended: true}));

//server side templating
app.set('view engine', 'ejs');

//static routs
app.use(express.static('public'));

app.get('/hello', (request, response) => {
  response.send('hello from ejs');
});

app.get('/searches/new', (request, response) => {
  response.render('./pages/searches/new');
});

app.post('/searches', (request, response) => {
  response.send(request.body);
});

app.get('/', (request, response) => {
  response.render('./pages/index.ejs');
});

app.listen(PORT, () => {
  console.log('server is running on port: ' + PORT);
});
