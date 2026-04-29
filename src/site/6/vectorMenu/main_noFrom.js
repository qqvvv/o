(async () => {
  const url = "https://rra.pages.dev/6/vectorMenu/menuUI_esm.js";
  try {
    const { initializeApp } = await import( url );
    initializeApp ();
  } catch (error) {
    console.error(error);
  }
})();