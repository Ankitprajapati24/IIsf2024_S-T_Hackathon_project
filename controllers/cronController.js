import cron from 'node-cron';
import { readData, writeData } from '../models/dataModel.js';

// Check and update statuses for exact matching times
export const checkAndUpdateStatuses = () => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const data = readData();

  let updated = false;

  Object.keys(data).forEach((key) => {
    const entry = data[key];

    // Only update if the status is 0 and the time matches the current time
    if (entry.status === 0 && entry.time === currentTime) {
      entry.status = 1;
      console.log(`Updated status of ${key} to 1 at ${currentTime}`);
      updated = true;
    }
  });

  if (updated) {
    writeData(data);
  }
};

// Schedule the cron job to check every second
export const scheduleCronJobs = () => {
  cron.schedule('* * * * * *', () => {
    console.log('Running cron job to check matching times...');
    checkAndUpdateStatuses();
  });
};
