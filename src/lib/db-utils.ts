
// src/lib/db-utils.ts
import path from 'path';
import type fsType from 'fs/promises'; // Import fs type for type safety

let fs: typeof fsType; // Declare fs variable

// Dynamically import fs/promises only when this module is loaded on the server
async function loadFs() {
    if (!fs) {
        // Use dynamic import if running on the server
        if (typeof window === 'undefined') {
            try {
                // @ts-ignore - Dynamically import fs/promises
                fs = (await import('fs/promises'));
                 // Check if the default export is the module itself
                 if (fs && typeof fs !== 'object') {
                    // If import('fs/promises') returns the module directly (ESM style)
                    // No need for .default
                 } else if (fs && (fs as any).default) {
                     // If it returns an object with a default property (CommonJS style or bundled)
                     fs = (fs as any).default;
                 } else {
                    throw new Error("Loaded 'fs/promises' module structure unexpected.");
                 }

            } catch (e) {
                console.error("Failed to load 'fs/promises'. This module should only run on the server.", e);
                // Handle the error appropriately, maybe throw or set a flag
                throw new Error("Filesystem operations are not available in this environment.");
            }
        } else {
            throw new Error("Filesystem operations cannot be performed in the browser.");
        }
    }
}


// Ensure the data directory exists
const dataDir = path.resolve(process.cwd(), 'src/data');

const ensureDataDir = async () => {
  await loadFs(); // Ensure fs is loaded before using it
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

/**
 * Reads data from a JSON file in the data directory.
 * If the file doesn't exist, it returns the defaultValue.
 * @param filename The name of the JSON file (e.g., 'users.json').
 * @param defaultValue The default value to return if the file is not found or empty.
 * @returns The parsed JSON data or the default value.
 */
export async function readData<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDataDir(); // Ensures fs is loaded
  const filePath = path.join(dataDir, filename);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    if (!fileContent) {
        console.warn(`Data file ${filename} is empty. Using default value.`);
        return defaultValue;
    }
    return JSON.parse(fileContent, dateReviver) as T; // Use dateReviver during parsing
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log(`Data file ${filename} not found. Initializing with default value.`);
      // Initialize the file with default value if it doesn't exist
      await writeData(filename, defaultValue);
      return defaultValue;
    }
     console.error(`Error reading data file ${filename}:`, error);
     // In case of other errors (like parsing), return default to prevent crashes
     // Consider more robust error handling for production
     return defaultValue;
  }
}

/**
 * Writes data to a JSON file in the data directory.
 * @param filename The name of the JSON file (e.g., 'users.json').
 * @param data The data to write (will be JSON.stringify'd).
 */
export async function writeData<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir(); // Ensures fs is loaded
  const filePath = path.join(dataDir, filename);
  try {
    const jsonString = JSON.stringify(data, null, 2); // Pretty print JSON
    await fs.writeFile(filePath, jsonString, 'utf-8');
  } catch (error) {
    console.error(`Error writing data file ${filename}:`, error);
    // Handle write errors appropriately (e.g., retry, log, notify)
  }
}

/**
 * Converts Maps to objects suitable for JSON serialization.
 * @param map The Map to convert.
 * @returns An object representation of the Map.
 */
export function mapToObject<K extends string | number | symbol, V>(map: Map<K, V>): Record<K, V> {
    const obj = {} as Record<K, V>;
    map.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}

/**
 * Converts objects back to Maps after JSON deserialization.
 * @param obj The object to convert.
 * @returns A Map representation of the object.
 */
export function objectToMap<K extends string, V>(obj: Record<K, V>): Map<K, V> {
    const map = new Map<K, V>();
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            map.set(key, obj[key]);
        }
    }
    return map;
}

// Helper for Date serialization/deserialization
// This function will be used by JSON.parse in readData
export const dateReviver = (key: string, value: any): any => {
  // Regex to check if the string looks like an ISO date string
  const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/; // Allow optional milliseconds
  if (typeof value === 'string' && dateFormat.test(value)) {
    // If it matches, parse it into a Date object
    const date = new Date(value);
    // Optional: Check if the date is valid after parsing
    if (!isNaN(date.getTime())) {
        return date;
    }
  }
  // Otherwise, return the value as is
  return value;
};
