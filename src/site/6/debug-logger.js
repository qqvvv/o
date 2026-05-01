/**
 * 调试日志模块 - 独立模块
 * 功能：实时记录库加载过程、统计信息、性能数据
 * 使用：await import() 动态加载或 import {} from 静态导入
 */

/**
 * 调试日志记录器
 */
export class DebugLogger {
    constructor() {
        this.logs = [];
        this.tableData = [];
        this.container = null;
        this.tableContainer = null;
        this.logTextContainer = null;
        this.isReady = false;
        this.jsPanel = null;
        this.originalConsoleError = null;
    }

    /**
     * 初始化容器（创建 div）
     */
    initContainer() {
        this.container = document.createElement('div');
        this.container.id = 'refer-library-debug-log';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 900px;
            max-height: 500px;
            background: #1e1e1e;
            border: 2px solid #00ff00;
            border-radius: 8px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            color: #00ff00;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #00ff00;
        `;

        const title = document.createElement('span');
        title.textContent = '📦 ReferLibrary Debug Console';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '14px';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: #00ff00;
            font-size: 16px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
        `;
        closeBtn.onclick = () => this.container.style.display = 'none';

        header.appendChild(title);
        header.appendChild(closeBtn);

        this.tableContainer = document.createElement('div');
        this.tableContainer.style.cssText = `
            overflow-y: auto;
            flex: 0 0 280px;
            margin-bottom: 10px;
        `;

        this.logTextContainer = document.createElement('div');
        this.logTextContainer.id = 'debug-log-text';
        this.logTextContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 8px;
            background: #0d0d0d;
            border-radius: 4px;
            border: 1px solid #333333;
            min-height: 100px;
        `;

        this.container.appendChild(header);
        this.container.appendChild(this.tableContainer);
        this.container.appendChild(this.logTextContainer);

        document.body.appendChild(this.container);
        this.isReady = true;

        this._hookConsoleError();
    }

    /**
     * 劫持 console.error
     */
    _hookConsoleError() {
        this.originalConsoleError = console.error;
        console.error = (...args) => {
            this.originalConsoleError.apply(console, args);

            const message = args
                .map(arg => {
                    if (arg instanceof Error) {
                        return `${arg.message}${arg.stack ? '\n' + arg.stack : ''}`;
                    }
                    return typeof arg === 'string' ? arg : JSON.stringify(arg);
                })
                .join(' ');

            this.log(message, 'error');
        };
    }

    /**
     * 初始化 jsPanel（需要 jsPanel 库已加载）
     */
    async initJsPanel() {
        if (typeof jsPanel === 'undefined') {
            return false;
        }

        try {
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }

            this.jsPanel = jsPanel.create({
                headerTitle: '📦 ReferLibrary Debug Console',
                contentSize: '900px 500px',
                position: 'right-top',
                theme: 'dark',
                dragit: { containment: 'window' },
                resizeit: { containment: 'window' },
            });

            if (this.container) {
                this.container.style.position = 'static';
                this.container.style.bottom = 'auto';
                this.container.style.right = 'auto';
                this.container.style.width = '100%';
                this.container.style.height = '100%';
                this.container.style.maxHeight = 'none';
                this.container.style.border = 'none';
                this.container.style.borderRadius = '0';
                this.container.style.boxShadow = 'none';
                this.container.style.margin = '0';
                this.container.style.padding = '0';

                const jsPanelContent = this.jsPanel.content;
                if (jsPanelContent) {
                    jsPanelContent.innerHTML = '';
                    jsPanelContent.appendChild(this.container);
                }
            }

            return true;
        } catch (err) {
            console.warn('[DebugLogger] jsPanel init failed:', err);
            return false;
        }
    }

    /**
     * 添加表格行
     */
    addTableRow(fileName, source, exportName, format, duration) {
        const row = {
            fileName,
            source,
            exportName: exportName || '-',
            format: format || '-',
            duration: duration ? `${duration}ms` : '-'
        };

        this.tableData.push(row);
        this._updateTable();
    }

    /**
     * 更新表格显示
     */
    _updateTable() {
        const tableHtml = this._generateTableHtml();

        if (this.isReady && this.tableContainer) {
            this.tableContainer.innerHTML = tableHtml;
        }
    }

    /**
     * 生成表格 HTML
     */
    _generateTableHtml() {
        if (this.tableData.length === 0) {
            return '<p style="color: #666;">等待加载任务...</p>';
        }

        let html = `
            <table style="
                width: 100%;
                border-collapse: collapse;
                color: #00ff00;
                font-size: 12px;
            ">
                <thead>
                    <tr style="border-bottom: 2px solid #00ff00;">
                        <th style="text-align: left; padding: 8px; color: #ffcc00;">文件</th>
                        <th style="text-align: left; padding: 8px; color: #ffcc00;">源</th>
                        <th style="text-align: left; padding: 8px; color: #ffcc00;">函数名</th>
                        <th style="text-align: center; padding: 8px; color: #ffcc00;">模式</th>
                        <th style="text-align: center; padding: 8px; color: #ffcc00;">耗时</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.tableData.forEach((row, index) => {
            const bgColor = index % 2 === 0 ? 'transparent' : 'rgba(0, 255, 0, 0.05)';
            html += `
                <tr style="
                    border-bottom: 1px solid #333333;
                    background: ${bgColor};
                    transition: background 0.3s;
                ">
                    <td style="padding: 6px 8px; word-break: break-all;">${row.fileName}</td>
                    <td style="padding: 6px 8px; color: #66ccff;">${row.source}</td>
                    <td style="padding: 6px 8px; color: #ff99cc;">${row.exportName}</td>
                    <td style="padding: 6px 8px; text-align: center; color: #99ff99;">${row.format}</td>
                    <td style="padding: 6px 8px; text-align: center; color: #ffcc99; font-weight: bold;">${row.duration}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        return html;
    }

    /**
     * 添加日志文本
     */
    log(message, type = 'log') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, message, type };

        this.logs.push(logEntry);
        this._outputToConsole(timestamp, message, type);
        this._outputToPanel(timestamp, message, type);
    }

    /**
     * 输出到控制台
     */
    _outputToConsole(timestamp, message, type) {
        const prefix = `[${timestamp}]`;
        const styles = {
            log: 'color: #0066cc;',
            warn: 'color: #ff9900;',
            error: 'color: #ff0000;',
            success: 'color: #00cc00;',
        };

        if (this.originalConsoleError && type === 'error') {
            return;
        }

        const consoleMethod = type === 'error' ? 'error' :
                               type === 'warn' ? 'warn' :
                               type === 'success' ? 'log' : 'log';

        console[consoleMethod](`%c${prefix} ${message}`, styles[type] || styles.log);
    }

    /**
     * 输出到 div 容器
     */
    _outputToPanel(timestamp, message, type) {
        const colorMap = {
            log: '#0099ff',
            warn: '#ffcc00',
            error: '#ff3333',
            success: '#00ff00',
        };

        const logLine = document.createElement('div');
        logLine.style.color = colorMap[type] || '#00ff00';
        logLine.style.marginBottom = '2px';
        logLine.style.fontSize = '12px';
        logLine.style.wordBreak = 'break-all';
        logLine.textContent = `[${timestamp}] ${message}`;

        if (this.isReady && this.logTextContainer) {
            this.logTextContainer.appendChild(logLine);
            this.logTextContainer.scrollTop = this.logTextContainer.scrollHeight;
        }
    }

    /**
     * 获取日志历史
     */
    getHistory() {
        return this.logs;
    }

    /**
     * 获取表格数据
     */
    getTableData() {
        return this.tableData;
    }

    /**
     * 清空所有数据
     */
    clear() {
        this.logs = [];
        this.tableData = [];
        this._updateTable();

        if (this.logTextContainer) {
            this.logTextContainer.innerHTML = '';
        }
    }

    /**
     * 恢复原始 console.error
     */
    restore() {
        if (this.originalConsoleError) {
            console.error = this.originalConsoleError;
        }
    }
}

export default DebugLogger;
