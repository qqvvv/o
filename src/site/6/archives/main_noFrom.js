(async () => {
  const url = "https://rra.pages.dev/6/vectorMenu/menuUI_esm.js";
  try {
    const { initializeApp } = await import( url );
    const data = `
- 层一功能1
- 层一折叠1
  - 层二折叠1
    - 层三功能1
    - 层三功能2
  - 层二功能1 #?<endCluster=true &simpleAnchor=alias
- 层一功能2 #?<comment= #YggdrAML
`;
    initializeApp ( data );
  } catch (error) {
    console.error(error);
  }
})();