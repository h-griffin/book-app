'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const app = express();
const pg = require('pg');
const PORT = process.env.PORT || 3001;
const ejs = require('ejs');

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const dbClient = new pg.Client(process.env.DATABASE_URL);
dbClient.connect(err => {
  if (err){
    console.log(err);
  }else{
    console.log('data base connected');
  }
});

//read form info
app.use(express.urlencoded({ extended: true}));

//server side ejs templating
app.set('view engine', 'ejs');

//static routs
app.use(express.static('public'));

//volhas constructor
function Book(data){
  this.imageUrl = parseImageUrl(data.imageLinks.smallThumbnail);
  this.title = data.title;
  this.author = data.author;
  this.description = data.description;
  this.isbn = `${data.industryIdentifiers[0].type} ${data.industryIdentifiers[0].identifier}`;
  this.bookshelf = data.bookshelf;
}
//old one just in case
// function Book(data){
//   this.image= data.image;
//   this.title = data.title;
//   this.author = data.author;
//   this.description = data.description;
//   this.isbn = data.isbn;
//   this.bookshelf =data.bookshelf;
// }

//change http to https ? 'turnary'?
function parseImageUrl(imageUrl){
  if(imageUrl !== ''){
    return imageUrl.includes('http://')
      ? imageUrl.replace(/^http:/, 'https:')
      : imageUrl;
  }
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
      errorHandler('superagent error', request, response);
    });
}

app.post('/searches', bookHandler);

// app.get('/', (request, response) => {
//   response.render('./pages/index.ejs');
// });

//jacob something with database
app.get('/', (request, response) => {
  let selectQuery = `SELECT * FROM books;`;
  return dbClient.query(selectQuery)
    .then(results => {
      if(results.rowCount === 0){
        console.log('RENDER FROM DB');
        response.render('pages/searches/new');
      } else {
        response.send('/pages/index', {books : results.rows, count : results.rowCount});
      }
    })
    .catch(error => {
      errorHandler('database error', request, response);
    });
});

//jacob / express? database?
app.get('/books/:id', (request, response) => {
  const bookId = request.params.id; //attach data and influence rout

  console.log(request.query); // url query stings : ?key:value
  console.log(request.body); //attaching header to request? sending as object not just string

  let selectQuery = `SELECT * FROM books WHERE id=$1;`;
  let selectValues = [bookId];

  dbClient.query(selectQuery, selectValues)
    .then(data => {
      console.log(data.rows);
      response.send('In Progress');
    });
});

//if no book id
app.get('books', (request,response) => response.send('no id present'));

//insert api info into DB
app.post('/books', (request, response) => {
  const { title, author, description, isbn, image_url, bookshelf } = request.body;

  let addBookSQL = `INSERT INTO books (title, author, description, isbn, image_url, bookshelf) VALUES ($1, $2, $3, $4, $5, $6)`;
  let addBookValues = [title, author, description, isbn, image_url, bookshelf];

  dbClient.query(addBookSQL, addBookValues)
    .then(data => {
      console.log(data.rows);
      response.send('adding book in progress');
      response.render('pages/details', {book: data.rows[0]});
    })
    .catch(error => {
      errorHandler('somethings bad over here', request, response);
    });
  // response.send({title, author, description, isbn, image_url, bookshelf});
});

//update a resource
app.put('/books/:id', (request, response) => {
  const bookId = request.params.id;
  const { title, author, description, image_url, isbn, bookshelf} = request.body;
  console.log(request.body.title);

  //query db for books that have id
  let SQL =`UPDATE books SET title=$1, author=$2, description=$3, image_url=$4, isbn=$5, bookshelf=$6 WHERE id=$7`;
  let values = [title, author, description, image_url, isbn, bookshelf, bookId];

  //use SQL UPDATE WHERE to modify the row record
  dbClient.query(SQL, values)
    .then(data => {
      response.send(data); //render later
    })
    .catch(error =>{
      errorHandler('this is an error bad bad', request, response);
    });

  //send back new row

  //invalidate old thing and replace with new
  response.send(bookId);
});

function errorHandler(error, request, response){
  console.log(error);
  response.render('./pages/error', {error: 'sorry somethings wrong'});
}

app.listen(PORT, () => {
  console.log('server is running on port: ' + PORT);
});
