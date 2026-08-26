/// <reference types="vite/client" />

export {};

declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      id?: string;
      mode?: "read" | "readwrite";
      startIn?:
        | "desktop"
        | "documents"
        | "downloads"
        | "music"
        | "pictures"
        | "videos"
        | FileSystemHandle;
    }) => Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemHandle {
    readonly kind: "file" | "directory";
    readonly name: string;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: "file";
    getFile(): Promise<File>;
    createWritable(options?: {
      keepExistingData?: boolean;
    }): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: "directory";
    getDirectoryHandle(
      name: string,
      options?: { create?: boolean }
    ): Promise<FileSystemDirectoryHandle>;
    getFileHandle(
      name: string,
      options?: { create?: boolean }
    ): Promise<FileSystemFileHandle>;
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
    queryPermission?(descriptor?: {
      mode?: "read" | "readwrite";
    }): Promise<PermissionState>;
    requestPermission?(descriptor?: {
      mode?: "read" | "readwrite";
    }): Promise<PermissionState>;
    values?(): AsyncIterableIterator<FileSystemHandle>;
    keys?(): AsyncIterableIterator<string>;
    entries?(): AsyncIterableIterator<[string, FileSystemHandle]>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(
      data:
        | BufferSource
        | Blob
        | string
        | { type: "write"; data: BufferSource | Blob | string; position?: number }
        | { type: "seek"; position: number }
        | { type: "truncate"; size: number }
    ): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
  }
}
