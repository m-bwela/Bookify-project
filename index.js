import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Book notes",
  password: "tyedatabase",
  port: 5432,
});

db.connect();

let search;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true}));


let sort = "review_id";
let order = 'ASC';

app.get("/", async(req, res) => {
  try {
    const response = await db.query(`SELECT * FROM books JOIN book_reviews ON books.book_id = book_reviews.book_id ORDER BY ${sort} ${order}`);
    const result = response.rows;
    res.render("index.ejs", { search: search, data: result});
  } catch (error) {
    console.log("Error executing query:", error);
  }
});

app.get("/book", async(req, res) => {
  const coverId = req.query.coverId;
  const title = req.query.title;
  const author = req.query.author;
 
  try {
    const response = await db.query(`SELECT * FROM books JOIN book_reviews ON books.book_id = book_reviews.book_id`);
    const result = response.rows;
    const bookChecking = result.find((book) => book.title === req.query.title);
    const review = bookChecking ? bookChecking.review_text : undefined;
    const book_id = bookChecking ? bookChecking.book_id : undefined;
    res.render("add.ejs", {
      title : title,
      author : author,
      review : review,
      book_id : book_id,
      coverId : coverId
    });
  } catch (error) {
    console.log("Error fetching searched data", error.message);
  }
});

app.post("/order", async(req, res) => {
  sort = req.body.sort;
  order = 'ASC';
  if (sort === 'rating') {
    order = 'DESC';
  }
  res.redirect("/");
});

app.post("/add", async(req, res) => {
  const title = req.body.title;
  const review_text =req.body.review_text;
  const coverId = req.body.cover_id;
  const rating = req.body.rating;
  const author = req.body.author;

  try {
    await db.query('BEGIN');
    const newBook = await db.query(`INSERT INTO books (title, author, cover_id)
      VALUES ($1, $2, $3) RETURNING book_id`, [title, author, coverId]
    );
    const newReview = await db.query(`INSERT INTO book_reviews (book_id, review_text, rating)
      VALUES ($1, $2, $3) RETURNING *`, [newBook.rows[0].book_id, review_text, rating]
    );
     await db.query('COMMIT');
     res.redirect("/");
  } catch (error) {
    console.log("An Error occurred in adding the book review.", error.message);
    res.status(400);
  }
});

app.post("/amendReview", async(req, res) => {
  const review_text = req.body.review_text;
  const book_id = req.body.bookId;
  const rating = req.body.rating;
  const currentDate = new Date().toISOString();

  try {
    const response = await db.query(`UPDATE book_reviews SET review_text = $1, rating = $2, review_date = $3 WHERE book_id = $4 RETURNING *`, [review_text, book_id, rating, currentDate]);
    const result = response.rows;
    console.log(`${book_id}, ${rating}, ${currentDate}`);
    res.redirect("/");
  } catch (error) {
    console.log("Error:", error);
  }
});

app.delete("/delete/:id", async(req, res) => {
  const bookId = req.params.id;

  try {
    await db.query('BEGIN');
    await db.query("DELETE FROM book_reviews WHERE book_id = $1", [bookId]);
    await db.query("DELETE FROM books WHERE book_id = $1", [bookId]);
    await db.query("COMMIT");
  } catch (error) {
    res.status(500).send("Error deleting review.");
  }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});