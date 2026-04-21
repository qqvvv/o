class LoadingProgressManager {
  constructor() {
    this.steps = [];
    this.startTime = Date.now();
    this.panel = null;
    this.usePanel = true; // 可切换为 console 输出
  }

  initPanel() {
    if (!this.panel && window.jsPanel) {
      try {
        this.panel = jsPanel.create({
          headerTitle: "⚙️ 模块加载中...",
          position: { x: "center", y: 100 }, // ✅ 用像素而非相对位置
          width: 400,
          height: "auto",
          content: '<div id="loading-progress"></div>',
          dragit: { disable: true },
          resizeit: false,
          animateIn: "zoomIn",
        });
      } catch (error) {
        console.warn("jsPanel 初始化失败，将使用控制台输出:", error);
        this.usePanel = false;
      }
    }
    return this.panel;
  }

  updateDisplay() {
    if (!this.usePanel || !this.panel) {
      console.table(this.steps); // 降级输出
      return;
    }

    const progressDiv = document.getElementById("loading-progress");
    if (!progressDiv) return;

    const html = this.steps
      .map(
        (step) => `
        <div style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 12px;">
          <span style="color: #4CAF50;">✓</span>
          <span style="font-weight: bold;">${step.name}</span>
          <span style="color: #999; float: right;">${step.duration}</span>
          <div style="color: #666; font-size: 11px; margin-top: 2px;">${step.timestamp}</div>
        </div>
      `
      )
      .join("");

    progressDiv.innerHTML = html;
  }

  endStep(step) {
    const duration = (performance.now() - step.startTime).toFixed(2);
    this.steps.push({
      name: step.name,
      duration: `${duration}ms`,
      timestamp: new Date().toLocaleTimeString(),
    });
    this.updateDisplay();
    console.log(`✅ ${step.name} - ${duration}ms`);
  }

  startStep(stepName) {
    return {
      name: stepName,
      startTime: performance.now(),
    };
  }

  getTotalTime() {
    return ((Date.now() - this.startTime) / 1000).toFixed(2);
  }

  finish() {
    if (this.panel) {
      const header = this.panel.querySelector(".jsPanel-hdr");
      if (header) {
        header.innerHTML = `✅ 加载完成 (${this.getTotalTime()}s)`;
        header.style.backgroundColor = "#4CAF50";
      }
    }
    console.log(`🎉 总耗时: ${this.getTotalTime()}s`);
  }
}
