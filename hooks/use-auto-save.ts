/**
 * Generic auto-save hook for form-like components
 * Handles debounced auto-saving with snapshot comparison
 */

import { useEffect, useRef, useCallback, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutoSaveOptions {
  /**
   * Current snapshot hash to compare against last saved state
   */
  snapshotHash: string | null;
  /**
   * Whether the form has any content worth saving
   */
  hasContent: boolean;
  /**
   * Whether the component/form is currently active/open
   */
  isActive: boolean;
  /**
   * Delay in milliseconds before triggering auto-save
   * @default 1500
   */
  delay?: number;
  /**
   * Callback to perform the actual save operation
   * Should return a promise that resolves when save is complete
   */
  onSave: (snapshotHash: string) => Promise<void>;
  /**
   * Optional callback when save status changes
   */
  onStatusChange?: (status: AutoSaveStatus) => void;
}

export interface UseAutoSaveReturn {
  /**
   * Current auto-save status
   */
  status: AutoSaveStatus;
  /**
   * Manually trigger a save (bypasses debounce)
   */
  triggerSave: () => Promise<void>;
  /**
   * Reset the auto-save state
   */
  reset: () => void;
}

/**
 * Hook for managing auto-save functionality with debouncing
 */
export function useAutoSave({
  snapshotHash,
  hasContent,
  isActive,
  delay = 1500,
  onSave,
  onStatusChange,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const saveInFlightRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHashRef = useRef<string | null>(null);
  const lastSavedHashRef = useRef<string | null>(null);
  const saveCycleRef = useRef(0);

  const updateStatus = useCallback(
    (newStatus: AutoSaveStatus) => {
      setStatus(newStatus);
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  const performSave = useCallback(
    async (hash: string) => {
      if (saveInFlightRef.current) {
        pendingHashRef.current = hash;
        return;
      }

      saveInFlightRef.current = true;
      pendingHashRef.current = null;
      updateStatus("saving");

      try {
        await onSave(hash);
        lastSavedHashRef.current = hash;
        updateStatus("saved");
      } catch (error) {
        console.error("Auto-save failed:", error);
        updateStatus("error");
      } finally {
        saveInFlightRef.current = false;
        saveCycleRef.current += 1;
      }
    },
    [onSave, updateStatus]
  );

  const triggerSave = useCallback(async () => {
    if (!snapshotHash || saveInFlightRef.current) {
      return;
    }
    await performSave(snapshotHash);
  }, [snapshotHash, performSave]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    saveInFlightRef.current = false;
    pendingHashRef.current = null;
    lastSavedHashRef.current = null;
    updateStatus("idle");
  }, [updateStatus]);

  // Main auto-save effect
  useEffect(() => {
    if (!isActive) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (
      !hasContent ||
      !snapshotHash ||
      snapshotHash === lastSavedHashRef.current
    ) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      void performSave(snapshotHash);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActive, hasContent, snapshotHash, delay, performSave]);

  // Handle pending saves after current save completes
  useEffect(() => {
    if (!isActive || !pendingHashRef.current || saveInFlightRef.current) {
      return;
    }

    const queuedHash = pendingHashRef.current;
    pendingHashRef.current = null;
    void performSave(queuedHash);
  }, [isActive, saveCycleRef.current, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    triggerSave,
    reset,
  };
}

