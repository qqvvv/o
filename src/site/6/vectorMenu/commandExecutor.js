/**
 * 命令执行器 - 纯自动发现，无需手动注册
 */
export class CommandExecutor {
  constructor(options = {}) {
    this.commands = new Map();
    this.debug = options.debug || false;
    this.onError = options.onError || console.error;
    this.globalScope = options.globalScope || globalThis;

    return new Proxy(this, {
      get: (target, prop) => {
        // 保护内部属性和方法
        if (prop in target || typeof target[prop] === 'function') {
          return Reflect.get(target, prop);
        }
        // 拦截任何属性访问作为命令调用
        return (...args) => target.execute(prop, ...args);
      }
    });
  }

  /**
   * 查找函数处理器
   */
  findHandler(commandName) {
    // 优先检查显式注册
    const registered = this.commands.get(commandName);
    if (registered?.handler) {
      return registered.handler;
    }

    // 其次检查全局作用域
    if (typeof this.globalScope[commandName] === 'function') {
      return this.globalScope[commandName];
    }

    return null;
  }

  /**
   * 执行命令
   */
  execute(commandName, metadata = {}, ...args) {
    let actualFuncName = commandName;

    // 如果有 funcName 属性，优先使用它
    if (metadata?.funcName) {
      actualFuncName = metadata.funcName;
    }

    const handler = this.findHandler(actualFuncName);

    if (!handler) {
      if (this.debug) {
        console.warn(`[CMD] Command "${actualFuncName}" not found, skipped.`);
      }
      return;
    }

    try {
      const result = handler(...args);
      if (this.debug) {
        console.log(`[CMD] ${actualFuncName} executed`);
      }
      return result;
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  /**
   * 显式注册命令（可选，用于特殊逻辑）
   */
  register(name, handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Handler for "${name}" must be a function`);
    }
    this.commands.set(name, { handler });
    return this;
  }

  has(name) {
    return this.commands.has(name) || 
           typeof this.globalScope[name] === 'function';
  }

  getAll() {
    return Array.from(this.commands.keys());
  }
}
