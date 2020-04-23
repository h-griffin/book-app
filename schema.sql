DROP TABLE IF EXISTS books;

CREATE TABLE books(
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  author VARCHAR(255),
  description TEXT,
  isbn VARCHAR(255),
  image_url VARCHAR(255),
  bookshelf VARCHAR(255)
);

INSERT INTO books (title, author, description, isbn, image_url, bookshelf) VALUES (
  'Dune',
  'Frank Herbert',
  'ISBN_13 9780441013593',
  'link i dont want to do rn',
  'Follows fhhfoeivn description',
  'Fantasy'
);