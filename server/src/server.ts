import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const port = 8130;

console.log('NODE_ENV:', process.env.NODE_ENV);
const isDevelopment = process.env.NODE_ENV === 'dev';
const dataDir = isDevelopment ? path.join(__dirname, '..', '..', 'example') : path.join(__dirname, '..', 'public');

// Ensure the uploads directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust '*' to restrict domains as necessary
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Health check endpoint
app.get('/test', (req, res) => {
    res.send('Hello, World!');
});

// Endpoint to download a specific file
app.get('/file/*', (req, res) => {
    const params = req.params as { 0: string };
    const filePath = path.join(dataDir, params[0]);

    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
        // perform file download
        if (isDevelopment) {
            console.log('Serving:', filePath);
        }
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Endpoint to fetch directory data
app.get('/dir/*', (req, res) => {

    const params = req.params as { 0: string };
    if (params[0] === '') {
        res.status(400).send('Invalid path');
        return;
    }

    const filePath = path.join(dataDir, params[0]);

    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
        if (isDevelopment) {
            console.log('Dir found:', filePath);
        }

        // perform directory scan
        let mode = undefined;

        // manifest
        const manifest = readJSONFile(path.join(filePath, 'manifest.json'));
        if (manifest) {
            mode = manifest.children;
        }
        else {
            mode = null;
        }
        const filesToIgnore = ['manifest.json', manifest?.landing];

        // children
        const data: any[] = [];
        const items = fs.readdirSync(filePath);
        items.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        for (const item of items) {
            const itemPath = path.join(filePath, item);
            const stat = fs.statSync(itemPath);

            if (mode === 'dir') {
                if (stat.isDirectory()) {
                    const childManifest = readJSONFile(path.join(itemPath, 'manifest.json'));
                    if (childManifest) {
                        childManifest.path = item;
                        childManifest.state = 'cloud';
                        data.push(childManifest);
                    }
                }
            }
            else if (mode === null) { // no manifest
                if (stat.isDirectory()) {
                    data.push({ path: item, state: 'cloud' });
                }
            }
            else if (stat.isFile()) {
                if (!filesToIgnore.includes(item)) {
                    data.push({ path: item, state: 'cloud' });
                }
            }
        }
        res.send(data);
    } else {
        res.status(404).send('Directory not found');
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

function readJSONFile(filePath: string) {
    try {
        const data = fs.readFileSync(filePath);
        const dataJSON = JSON.parse(data.toString());
        return dataJSON;
    } catch (e) {
        return null;
    }
}