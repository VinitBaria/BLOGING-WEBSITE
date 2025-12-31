// Load environment variables
require('dotenv').config();

const express = require('express');
const connectToDB = require('./connection');
const path = require('path');
const userController = require('./routes/user');
const blogController = require('./routes/blog');
const cookieParser = require('cookie-parser');
const auth = require('./middleware/user');
const logger = require('./middleware/logged');

// Connect to database using environment variable
connectToDB(process.env.MONGODB_URI);

const app = express();
const port = process.env.PORT || 9000;
app.use(cookieParser());
app.use(express.json());
app.use(logger);
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.resolve('./public')));


app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));


app.use('/',userController);
app.use('/blog',blogController);


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});