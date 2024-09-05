const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/api');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});