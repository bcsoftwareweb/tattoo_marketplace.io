import { uid } from "@/lib/format";

const DATABASE_NAME = "blackline.community-videos.v1";
const STORE_NAME = "videos";
export const MAX_FLASH_DURATION_SECONDS = 60;

export function readVideoDuration(file: File) {
  if (file.type !== "video/mp4" && file.type !== "video/webm") {
    return Promise.reject(new Error("Choose an MP4 or WebM video for a Flash."));
  }
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    const finish = (callback: () => void) => {
      URL.revokeObjectURL(url);
      video.onloadedmetadata = null;
      video.onerror = null;
      callback();
    };

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      finish(() => {
        if (!Number.isFinite(duration) || duration <= 0) reject(new Error("Could not read the video duration."));
        else resolve(duration);
      });
    };
    video.onerror = () => finish(() => reject(new Error("Could not read this video. Try an MP4 or WebM file.")));
    video.src = url;
  });
}

function openDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not support local video storage."));
  }
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local video storage."));
    request.onblocked = () => reject(new Error("Local video storage is blocked by another tab. Close other BLACKLINE tabs and try again."));
  });
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save local video data."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Local video storage was interrupted."));
  });
}

export async function saveCommunityVideo(file: File) {
  const database = await openDatabase();
  const id = uid("flash");
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const done = transactionComplete(transaction);
    transaction.objectStore(STORE_NAME).put(file, id);
    await done;
    return id;
  } finally {
    database.close();
  }
}

export async function loadCommunityVideo(id: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const done = transactionComplete(transaction);
    const request = transaction.objectStore(STORE_NAME).get(id);
    const requestResult = new Promise<unknown>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not load this Flash."));
    });
    const [result] = await Promise.all([requestResult, done]);
    return result instanceof Blob ? result : null;
  } finally {
    database.close();
  }
}

export async function deleteCommunityVideo(id: string) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const done = transactionComplete(transaction);
    transaction.objectStore(STORE_NAME).delete(id);
    await done;
  } finally {
    database.close();
  }
}

export async function clearCommunityVideos() {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const done = transactionComplete(transaction);
    transaction.objectStore(STORE_NAME).clear();
    await done;
  } finally {
    database.close();
  }
}
