require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.get('/api/test', async (req, res) => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        return res.status(500).send('Error: MONGO_URI environment variable not set.');
    }

    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(uri);
        console.log('Connection successful!');
        res.status(200).send('SUCCESS: Connected to MongoDB!');
    } catch (error) {
        console.error('--- MONGODB CONNECTION FAILED ---');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        res.status(500).json({
            message: 'Failed to connect to MongoDB.',
            errorName: error.name,
            errorMessage: error.message
        });
    }
});

module.exports = app;