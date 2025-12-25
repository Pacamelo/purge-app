/**
 * Regex Worker
 *
 * Executes regex patterns in a separate thread to enable true timeout termination.
 * When the main thread calls worker.terminate(), the regex execution is killed
 * immediately, preventing ReDoS attacks from freezing the browser.
 *
 * SECURITY: This provides genuine protection against catastrophic backtracking
 * by running regex in an interruptible context.
 */

export interface RegexWorkerMessage {
  id: string;
  type: 'matchAll';
  pattern: string;
  flags: string;
  text: string;
}

export interface RegexWorkerResult {
  id: string;
  success: boolean;
  matches?: Array<{
    match: string;
    index: number;
    groups?: Record<string, string>;
  }>;
  error?: string;
}

// Worker code as a string that will be converted to a Blob URL
export const regexWorkerCode = `
self.onmessage = function(e) {
  const { id, type, pattern, flags, text } = e.data;

  if (type !== 'matchAll') {
    self.postMessage({ id, success: false, error: 'Unknown message type' });
    return;
  }

  try {
    const regex = new RegExp(pattern, flags);
    const matches = [];

    // Reset lastIndex for global patterns
    regex.lastIndex = 0;

    let match;
    let maxMatches = 10000; // Safety limit to prevent infinite loops
    let count = 0;

    while ((match = regex.exec(text)) !== null && count < maxMatches) {
      matches.push({
        match: match[0],
        index: match.index,
        groups: match.groups || undefined
      });

      // Prevent infinite loops for zero-length matches
      if (match[0].length === 0) {
        regex.lastIndex++;
      }

      count++;
    }

    self.postMessage({ id, success: true, matches });
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
`;

/**
 * Create a Blob URL for the worker code
 */
export function createRegexWorkerUrl(): string {
  const blob = new Blob([regexWorkerCode], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

/**
 * Execute regex in a worker with true timeout termination.
 * If the timeout fires, the worker is terminated, stopping the regex.
 */
export async function executeRegexInWorker(
  pattern: RegExp,
  text: string,
  timeoutMs: number = 100
): Promise<RegExpMatchArray[]> {
  return new Promise((resolve) => {
    let worker: Worker | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let workerUrl: string | null = null;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
        workerUrl = null;
      }
    };

    const resolveOnce = (result: RegExpMatchArray[]) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };

    try {
      workerUrl = createRegexWorkerUrl();
      worker = new Worker(workerUrl);

      const messageId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);

      // Set up timeout - this will TERMINATE the worker if it takes too long
      timeoutId = setTimeout(() => {
        resolveOnce([]);
      }, timeoutMs);

      worker.onmessage = (e: MessageEvent<RegexWorkerResult>) => {
        if (e.data.id !== messageId) return;

        if (e.data.success && e.data.matches) {
          // Convert worker matches back to RegExpMatchArray-like format
          const results: RegExpMatchArray[] = e.data.matches.map((m) => {
            const arr = [m.match] as RegExpMatchArray;
            arr.index = m.index;
            arr.input = text;
            arr.groups = m.groups;
            return arr;
          });
          resolveOnce(results);
        } else {
          resolveOnce([]);
        }
      };

      worker.onerror = () => {
        resolveOnce([]);
      };

      // Send the regex to the worker
      const message: RegexWorkerMessage = {
        id: messageId,
        type: 'matchAll',
        pattern: pattern.source,
        flags: pattern.flags,
        text,
      };
      worker.postMessage(message);
    } catch {
      resolveOnce([]);
    }
  });
}
