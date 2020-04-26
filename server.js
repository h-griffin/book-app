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

function Book(data){
  const placeHolderImage ='https://i.imgur.com/J5LVHEL.jpg';
  let httpRegex = /^(http:\/\/)/g;
  this.title = data.title ? data.title : 'no title here';
  this.author = data.authors ? data.authors[0] : 'no author';
  this.description = data.description ? data.description : 'no description';
  this.isbn = data.industryIdentifiers ? `ISBN_13 ${data.industryIdentifiers[0].identifier}` : 'no isbn';
  this.image_url = data.imageLinks ? data.imageLinks.smallThumbnail.replace(httpRegex, 'https://') : placeHolderImage;
  this.bookshelf = data.categories ? data.categories : 'no bookshelf';
}

function bookHandler(request, response){
  let queryType = request.body.search[0];
  let queryTerms = request.body.search[1];
  let url = `https://www.googleapis.com/books/v1/volumes?q=+in${queryTerms}:${queryType}`;
  superagent.get(url)
    .then(results => results.body.items.map(book => new Book(book.volumeInfo)))
    .then(book => response.render('./pages/searches/show', {book : book}))
    .catch(error => {
      errorHandler('book handler error: superagent', request, response);
    });
}

function renderHomePage(request ,response){
  let selectQuery = `SELECT * FROM books;`;
  return dbClient.query(selectQuery)
    .then(results => {
      if(results.rowCount === 0){
        console.log('RENDER FROM DB');
        response.render('pages/searches/new');
      } else {
        response.render('./pages/index', {books : results.rows, count : results.rowCount});
      }
    })
    .catch(error => {
      errorHandler('database error', request, response);
    });
}

function saveBook(request, response){
  const { title, author, description, isbn, image_url, bookshelf } = request.body;

  let addBookSQL = `INSERT INTO books (title, author, description, isbn, image_url, bookshelf) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
  let addBookValues = [title, author, description, isbn, image_url, bookshelf];

  dbClient.query(addBookSQL, addBookValues)
    .then(data => {
      console.log(data.rows);
      response.render('pages/details', {book: data.rows[0]});
    })
    .catch(error => {
      errorHandler('somethings bad over here', request, response);
    });
}

function savedBooks(request, response){
  const bookId = request.params.id;

  console.log(request.query);
  console.log(request.body);

  let selectQuery = `SELECT * FROM books WHERE id=$1;`;
  let selectValues = [bookId];

  dbClient.query(selectQuery, selectValues)
    .then(data => {
      console.log(data.rows);
      response.send('In Progress');
    });
}

function updateBook(request, response){
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
}

app.get('/hello', (request, response) => {
  response.send('hello from ejs');
});

app.get('/searches/new', (request, response) => {
  response.render('./pages/searches/new');
});

//if no book id
app.get('books', (request,response) => response.send('no id present'));

app.get('/', renderHomePage);
app.post('/searches', bookHandler);
app.post('/books', saveBook);
app.get('/books/:id', savedBooks);
app.put('/books/:id', updateBook);

function errorHandler(error, request, response){
  console.log(error);
  response.render('./pages/error', {error: 'sorry somethings wrong'});
}

app.listen(PORT, () => {
  console.log('server is running on port: ' + PORT);
});
