export class LogLevel {
  static DEBUG = "DEBUG";
  static INFO = "INFO";
  static WARN = "WARN";
  static ERROR = "ERROR";
}

export class LoggerService {
  constructor(options = {}) {
    this.options = {
      logLevel: options.logLevel || LogLevel.INFO,
      enableConsole: options.enableConsole !== false,
      storeLogs: options.storeLogs !== false,
      maxStoredLogs: options.maxStoredLogs || 1000,
    };

    this.logs = [];
    this.subscribers = new Set();
  }

  /**
   * Log a message with debug level
   * @param {string} message - Message to log
   * @param {Object} data - Additional data
   */
  debug(message, data = {}) {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log a message with info level
   * @param {string} message - Message to log
   * @param {Object} data - Additional data
   */
  info(message, data = {}) {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log a message with warning level
   * @param {string} message - Message to log
   * @param {Object} data - Additional data
   */
  warn(message, data = {}) {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log a message with error level
   * @param {string} message - Message to log
   * @param {Object} data - Additional data
   */
  error(message, data = {}) {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Main logging function
   * @param {string} level - Log level
   * @param {string} message - Message to log
   * @param {Object} data - Additional data
   */
  log(level, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: this.getContext(),
    };

    // Store log
    if (this.options.storeLogs) {
      this.storeLogs(logEntry);
    }

    // Console output
    if (this.options.enableConsole) {
      this.consoleOutput(logEntry);
    }

    // Notify subscribers
    this.notifySubscribers(logEntry);
  }

  /**
   * Determine if message should be logged based on level
   * @param {string} level - Log level to check
   * @returns {boolean} Whether to log the message
   */
  shouldLog(level) {
    const levels = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
    };

    return levels[level] >= levels[this.options.logLevel];
  }

  /**
   * Store log entry in memory
   * @param {Object} logEntry - Log entry to store
   */
  storeLogs(logEntry) {
    this.logs.push(logEntry);

    // Maintain max logs limit
    if (this.logs.length > this.options.maxStoredLogs) {
      this.logs.shift();
    }
  }

  /**
   * Output log entry to console
   * @param {Object} logEntry - Log entry to output
   */
  consoleOutput(logEntry) {
    const { level, message, data, timestamp } = logEntry;

    const consoleMethod =
      {
        [LogLevel.DEBUG]: "debug",
        [LogLevel.INFO]: "info",
        [LogLevel.WARN]: "warn",
        [LogLevel.ERROR]: "error",
      }[level] || "log";

    console[consoleMethod](
      `[${timestamp}] ${level}: ${message}`,
      Object.keys(data).length ? data : ""
    );
  }

  /**
   * Get current execution context
   * @returns {Object} Context information
   */
  getContext() {
    return {
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "",
      timestamp: Date.now(),
    };
  }

  /**
   * Subscribe to log events
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of new log entry
   * @param {Object} logEntry - Log entry
   */
  notifySubscribers(logEntry) {
    this.subscribers.forEach((callback) => {
      try {
        callback(logEntry);
      } catch (error) {
        console.error("Error in log subscriber:", error);
      }
    });
  }

  /**
   * Get all stored logs
   * @param {Object} filters - Optional filters
   * @returns {Array} Filtered logs
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.level) {
      filteredLogs = filteredLogs.filter((log) => log.level === filters.level);
    }

    if (filters.startTime) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) >= new Date(filters.startTime)
      );
    }

    if (filters.endTime) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) <= new Date(filters.endTime)
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.data).toLowerCase().includes(searchLower)
      );
    }

    return filteredLogs;
  }

  /**
   * Clear all stored logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Format log entry for export
   * @param {Object} logEntry - Log entry to format
   * @returns {string} Formatted log entry
   */
  formatLogEntry(logEntry) {
    return `[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.message} ${
      Object.keys(logEntry.data).length ? JSON.stringify(logEntry.data) : ""
    }`;
  }

  /**
   * Export logs to string
   * @param {Object} filters - Optional filters
   * @returns {string} Exported logs
   */
  exportLogs(filters = {}) {
    const logs = this.getLogs(filters);
    return logs.map((log) => this.formatLogEntry(log)).join("\n");
  }
}

export default LoggerService;
