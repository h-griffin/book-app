'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const app = express();
const pg = require('pg');
const PORT = process.env.PORT || 3001;
const ejs = require('ejs');

//read form info
app.use(express.urlencoded({ extended: true}));

//server side templating
app.set('view engine', 'ejs');

//static routs
app.use(express.static('public'));

function Book(data){
  this.image = data.image;
  this.title = data.title;
  this.author = data.author;
  this.description = data.description;
  this.isbn = data.isbn;
  this.bookshelf = data.bookshelf;
}

app.get('/hello', (request, response) => {
  response.send('hello from ejs');
});

app.get('/searches/new', (request, response) => {
  response.render('./pages/searches/new');
});

function bookHandler(request, response){
  let queryType = request.body.search[0];
  let queryTerms = request.body.search[1];
  let url = `https://www.googleapis.com/books/v1/volumes?q=+in${queryTerms}:${queryType}`; //google api
  superagent.get(url) //returns promise
    .then(results => results.body.items.map(book => new Book(book.volumeInfo)))
    .then(book => response.render('./pages/searches/show', {book : book})) //send- needs to be render later on to show
    .catch(error => {
      console.log('superagent error', request, response);
    });
}

app.post('/searches', bookHandler);

app.get('/', (request, response) => {
  response.render('./pages/index.ejs');
});

app.listen(PORT, () => {
  console.log('server is running on port: ' + PORT);
});
