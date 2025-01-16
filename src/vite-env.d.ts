/// <reference types="vite/client" />

interface Window {
  gapi: {
    load: (api: string, options: { callback: () => void; onerror: () => void }) => void;
    client: {
      init: (options: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
      sheets: {
        spreadsheets: {
          values: {
            get: (options: { spreadsheetId: string; range: string }) => Promise<any>;
          };
        };
      };
    };
  };
}