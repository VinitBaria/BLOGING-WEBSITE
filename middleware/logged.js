const fs = require('fs');
const path = require('path');

async function logged(req, res, next) {
    const logDir = path.join(__dirname, '../logs'); // folder to store logs
    const logFile = path.join(logDir, 'log.txt');   // full path to log file

    // Ensure the logs folder exists
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;

    // Append log entry; create file if it doesn't exist
    fs.appendFile(logFile, logEntry, (err) => {
        if (err) {
            console.error('Error writing to log file', err);
        }
    });

    next();
}

module.exports = logged;
