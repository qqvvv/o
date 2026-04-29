(async () => {
  const menu = "https://rra.pages.dev/6/vectorMenu/menuUI_click.js";
  const exec = "https://rra.pages.dev/6/vectorMenu/commandExecutor.js";
  try {
    const { initializeApp } = await import( menu );
    const data = `
- 层一功能1
- 层一折叠1
  - 层二折叠1
    - 层三功能1
    - 层三功能2
  - 层二功能1 #?<endCluster=true &simpleAnchor=alias
- 层一功能2 #?<comment= #YggdrAML
`;

    const { CommandExecutor } = await import( exec );
    window.executor = executor;
    initializeApp ( data );
    // 创建命令执行器
    const executor = new CommandExecutor({ debug: true });
    executor.registerBatch({
      '层一功能1': () => console.log('执行: 层一功能1'),
      '层二折叠1': () => console.log('执行: 层二折叠1'),
      '层三功能1': () => console.log('执行: 层三功能1'),
      '层三功能2': () => console.log('执行: 层三功能2'),
      '层二功能1': () => console.log('执行: 层二功能1'),
      '层一功能2': () => console.log('执行: 层一功能2')
    });
  } catch (error) {
    console.error(error);
  }
})();