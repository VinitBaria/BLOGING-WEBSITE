const mongoose = require('mongoose');

function connectToDatabase(url) {
    if (!url) {
        console.error('MongoDB URL is required. Please check your .env file.');
        process.exit(1);
    }
    
    return mongoose.connect(url)
        .then(() => {
            console.log('Connected to MongoDB');
            console.log(`Database URL: ${url}`);
        })
        .catch(err => {
            console.error('Error connecting to MongoDB:', err.message);
            process.exit(1);
        });
}

module.exports = connectToDatabase;