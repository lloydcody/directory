import { StaffMember } from '../types';

const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const RANGE = 'Sheet1!A2:L'; // Include all columns up to L
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

const CACHE_KEY = 'staff-photos-cache';
const STAFF_DATA_KEY = 'staff-data';
const LAST_FETCH_KEY = 'last-fetch-time';
const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Fallback profile images from Unsplash
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=400&fit=crop'
];

let fallbackImageIndex = 0;

const getNextFallbackImage = () => {
  const image = FALLBACK_IMAGES[fallbackImageIndex];
  fallbackImageIndex = (fallbackImageIndex + 1) % FALLBACK_IMAGES.length;
  return image;
};

export async function initializeGoogleSheetsAPI() {
  if (!window.gapi) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.body.appendChild(script);
    });
  }

  return new Promise<void>((resolve, reject) => {
    window.gapi.load('client', {
      callback: async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      },
      onerror: () => reject(new Error('Failed to load GAPI client')),
    });
  });
}

async function validateImageUrl(url: string): Promise<string> {
  if (!url) return getNextFallbackImage();
  
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (!response.ok) return getNextFallbackImage();
    
    // Get the final URL after any redirects
    const finalUrl = response.url;
    const contentType = response.headers.get('content-type');
    
    return contentType?.startsWith('image/') ? finalUrl : getNextFallbackImage();
  } catch {
    return getNextFallbackImage();
  }
}

async function cachePhotos(staffMembers: StaffMember[]) {
  const cache = await caches.open(CACHE_KEY);
  
  await Promise.all(
    staffMembers.map(async (member) => {
      if (!member.photoUrl) {
        member.photoUrl = getNextFallbackImage();
        return;
      }
      
      try {
        const validatedUrl = await validateImageUrl(member.photoUrl);
        if (!validatedUrl) {
          member.photoUrl = getNextFallbackImage();
          return;
        }
        
        member.photoUrl = validatedUrl; // Update to final URL after redirects
        
        // Check if image is already in cache
        const cachedResponse = await cache.match(validatedUrl);
        if (!cachedResponse) {
          const response = await fetch(validatedUrl);
          if (response.ok) {
            await cache.put(validatedUrl, response.clone());
          }
        }
      } catch (error) {
        member.photoUrl = getNextFallbackImage();
      }
    })
  );
}

function parseRow(row: any[]): StaffMember {
  // Map columns correctly based on the spreadsheet layout
  // A:id, B:name, C:position, D:department, E:photoUrl, F:officeHours, G:email, H:phone, I:location, L:bio
  return {
    id: row[0] || crypto.randomUUID(),
    name: row[1] || '',
    position: row[2] || '',
    department: row[3] || '',
    photoUrl: row[4] || getNextFallbackImage(),
    officeHours: row[5] || '',
    email: row[6] || '',
    phone: row[7] || '',
    location: row[8] || '',
    bio: row[11] || '' // Column L (index 11) contains the bio
  };
}

export async function fetchStaffData(): Promise<StaffMember[]> {
  try {
    // Check if we have recently cached data
    const lastFetchTime = localStorage.getItem(LAST_FETCH_KEY);
    const cachedData = localStorage.getItem(STAFF_DATA_KEY);
    
    if (lastFetchTime && cachedData) {
      const timeSinceLastFetch = Date.now() - parseInt(lastFetchTime, 10);
      if (timeSinceLastFetch < UPDATE_INTERVAL) {
        const staffMembers = JSON.parse(cachedData);
        await cachePhotos(staffMembers);
        return staffMembers;
      }
    }

    // First try to get the sheet names
    const sheetsResponse = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    
    const sheets = sheetsResponse.result.sheets || [];
    const firstSheetName = sheets[0]?.properties?.title || 'Sheet1';
    const actualRange = `${firstSheetName}!A2:L`; // Make sure to include column L

    // Fetch fresh data from Google Sheets using the correct sheet name
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: actualRange,
    });

    const rows = response.result.values || [];
    const staffMembers = rows.map(parseRow);

    // Cache the data
    localStorage.setItem(STAFF_DATA_KEY, JSON.stringify(staffMembers));
    localStorage.setItem(LAST_FETCH_KEY, Date.now().toString());

    await cachePhotos(staffMembers);
    return staffMembers;
  } catch (error) {
    console.error('Error fetching staff data:', error);
    // Fallback to mock data if there's an error
    return [...mockStaffData];
  }
}