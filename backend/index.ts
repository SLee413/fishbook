const express = require('express');
const app = express();


app.use('/', (req, res) => {
  res.send(200);
});

app.listen(5000, () => console.log('API is running on http://localhost:5000/'));
