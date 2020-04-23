DROP TABLE IF EXISTS books;

CREATE TABLE books(
  id SERIAL PRIMARY KEY,
  author VARCHAR(255),
  title VARCHAR(255),
  isbn VARCHAR(255),
  image_url VARCHAR(255),
  description VARCHAR(500),
  bookshelf VARCHAR(255)
);

INSERT INTO books (title, author, isbn, image_url, description, bookshelf) VALUES (
  'Dune',
  'Frank Herbert',
  'ISBN_13 9780441013593',
  'link i dont want to do rn',
  'Follows fhhfoeivn description',
  'Fantasy'
);