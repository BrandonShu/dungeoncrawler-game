(() => {
  const enter = document.getElementById('enterBtn');
  if (!enter) return;
  enter.onclick = event => {
    event.preventDefault();
    init();
  };
})();
