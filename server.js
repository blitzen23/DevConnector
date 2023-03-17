const express = require('express');
const connectDB = require('./db');
require('dotenv').config();
const app = express();

// Connect Database
connectDB();

// Your code
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.resolve(__dirname, 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(
      path.resolve(__dirname, 'client', 'build', 'index.html'),
      function (err) {
        if (err) {
          res.status(500).send(err);
        }
      }
    );
  });
}

// Init Middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => {
  res.send('API Running');
});

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
