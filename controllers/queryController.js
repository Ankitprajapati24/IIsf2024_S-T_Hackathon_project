import { readData, writeData } from '../models/dataModel.js';
import fs from 'fs';
import path from 'path';

const gpsFilePath = path.join(process.cwd(), 'data', 'gpsData.json');

// Handle /index.html?count=... to update count in database
export const updateCountFromQuery = (req, res) => {
  const { count } = req.query;

  // If "count" is not provided, serve the index.html file
  if (!count) {
    console.log('[DEBUG] No count parameter provided. Serving index.html.');
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
    return;
  }

  // Validate the "count" parameter
  if (!/^[01]{8}$/.test(count)) {
    console.error('[ERROR] Invalid count parameter.');
    return res.status(400).send('Invalid count parameter. Must be exactly 8 digits (0 or 1).');
  }

  try {
    const data = readData();
    console.log('[DEBUG] Current database content:', data);

    // Update statuses
    Object.keys(data).forEach((key, index) => {
      data[key].status = parseInt(count[index], 10);
    });

    writeData(data);
    console.log('[DEBUG] Updated database content:', data);

    // Serve index.html after updating
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  } catch (error) {
    console.error('[ERROR] Failed to update count:', error);
    res.status(500).send('Failed to update count.');
  }
};


// Handle /map.html?long=...&latt=... to update GPS data
export const updateGPSFromQuery = (req, res) => {
  const { long, latt } = req.query;

  try {
    const gpsData = JSON.parse(fs.readFileSync(gpsFilePath, 'utf-8'));

    if (!long || !latt) {
      console.log('[DEBUG] No GPS parameters provided. Using default GPS data.');
      if (gpsData.length === 0) {
        console.error('[ERROR] GPS data is empty. Cannot load map.');
        return res.status(400).send('No GPS data available.');
      }
      res.sendFile(path.join(process.cwd(), 'public', 'map.html'));
      return;
    }

    if (isNaN(long) || isNaN(latt)) {
      console.error('[ERROR] Invalid longitude or latitude parameters.');
      return res.status(400).send('Invalid longitude or latitude parameters.');
    }

    const newEntry = {
      latitude: parseFloat(latt),
      longitude: parseFloat(long),
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(gpsFilePath, JSON.stringify([newEntry], null, 2), 'utf-8');
    console.log('[DEBUG] Successfully updated GPS data:', newEntry);

    res.sendFile(path.join(process.cwd(), 'public', 'map.html'));
  } catch (error) {
    console.error('[ERROR] Failed to process GPS data:', error);
    res.status(500).send('Failed to process GPS data.');
  }
};

// Handle /api/status to return plain-text status values
export const getStatusAsPlainText = (req, res) => {
  try {
    const data = readData();
    const statuses = Object.values(data).map(item => item.status).join('');
    console.log('[DEBUG] Returning status as plain text:', statuses);

    res.type('text/plain').send(statuses); // Send plain text response
  } catch (error) {
    console.error('[ERROR] Failed to retrieve status:', error);
    res.status(500).send('Failed to retrieve status.');
  }
};
