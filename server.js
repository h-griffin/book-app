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

// app.post('/searches', (request, response) => {
//   response.send(request.body);
// });

//jacob post w superagent
app.post('/searches', (request, response) => {
  let queryType = request.body.search;
  let queryTerms = request.body.query;
  let url = `https://www.googleapis.com/books/v1/volumes?q=${queryType}:${queryTerms}`; //google api
  superagent.get(url) //returns promise
    .then(results => {
      let data = results.body.items.map(book => {
        return new Book({
          title: book.volumeInfo.title || 'test',
          author: book.volumeInfo.authors[0] || 'test',
          description: book.volumeInfo.description || 'test',
          image: book.volumeInfo.imageLinks.smallThumbnail || 'test',
          isbn: book.volumeInfo.industryIdentifiers[0].identifier || 'test',
          bookshelf: 'test' || 'test',
        });
      });
      response.send(data); //needs to be render later to show
    })
    .catch(error => {
      console.log('superagent error', request, response);
    });
});

app.get('/', (request, response) => {
  response.render('./pages/index.ejs');
});

app.listen(PORT, () => {
  console.log('server is running on port: ' + PORT);
});
