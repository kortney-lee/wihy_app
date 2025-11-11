/**
 * Production console override
 * Disables console.log in production to clean up output
 * while keeping warnings and errors for debugging
 */

// Only apply in production environment
if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_DEBUG_MODE !== 'true') {
  // Override console.log to be a no-op in production
  const originalLog = console.log;
  
  console.log = (...args: any[]) => {
    // Only log if it contains error or warning keywords
    const message = args.join(' ').toLowerCase();
    if (message.includes('error') || message.includes('warning') || message.includes('failed')) {
      originalLog.apply(console, args);
    }
    // Otherwise, do nothing (suppress the log)
  };
  
  // Keep console.warn and console.error unchanged for debugging
  // These are important for production troubleshooting
}

export {}; // Make this a module