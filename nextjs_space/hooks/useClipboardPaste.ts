'use client';

import { useEffect, useCallback } from 'react';

interface UseClipboardPasteOptions {
  onImagePaste: (file: File) => void;
  enabled?: boolean;
}

/**
 * Hook to handle clipboard paste events for images
 * Detects when user pastes an image (Ctrl+V / Cmd+V) and calls onImagePaste callback
 */
export function useClipboardPaste({ onImagePaste, enabled = true }: UseClipboardPasteOptions) {
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (!enabled) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            // Create a new file with a descriptive name
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extension = file.type.split('/')[1] || 'png';
            const newFile = new File(
              [file],
              `clipboard-${timestamp}.${extension}`,
              { type: file.type }
            );
            onImagePaste(newFile);
            return;
          }
        }
      }
    },
    [onImagePaste, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste, enabled]);
}

/**
 * Utility function to check if clipboard contains an image
 */
export async function hasClipboardImage(): Promise<boolean> {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Utility function to read image from clipboard
 */
export async function readClipboardImage(): Promise<File | null> {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const extension = type.split('/')[1] || 'png';
          return new File(
            [blob],
            `clipboard-${timestamp}.${extension}`,
            { type }
          );
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}
