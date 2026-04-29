/**
 * 命令执行器
 */

export class CommandExecutor {
  constructor(options = {}) {
    this.commands = new Map();
    this.debug = options.debug || false;
    this.onError = options.onError || console.error;
  }

  register(name, handler, metadata = {}) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for "${name}" must be a function`);
    }
    this.commands.set(name, { handler, ...metadata });
    return this;
  }

  registerBatch(commandMap) {
    Object.entries(commandMap).forEach(([name, handler]) => {
      this.register(name, handler);
    });
    return this;
  }

  execute(commandName, ...args) {
    const command = this.commands.get(commandName);
    if (!command) {
      const error = new Error(`Command not found: "${commandName}"`);
      this.onError(error);
      throw error;
    }

    try {
      const result = command.handler(...args);
      if (this.debug) {
        console.log(`[CMD] ${commandName}`);
      }
      return result;
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  has(name) {
    return this.commands.has(name);
  }

  getAll() {
    return Array.from(this.commands.keys());
  }
}
