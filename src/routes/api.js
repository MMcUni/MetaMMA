const express = require('express');
const router = express.Router();
const connectToDatabase = require('../database/connection');

router.get('/events', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("fights");
    
    const events = await collection.find({}).limit(20).toArray();
    res.json(events);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
});

module.exports = router;