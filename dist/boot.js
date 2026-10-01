(() => {
  const enter = document.getElementById('enterBtn');
  if (!enter) return;
  enter.onclick = event => {
    event.preventDefault();
    init();
  };

  const runFrame = update;
  update = delta => {
    if (S && !S.paused && S.enemies.length) {
      const target = S.enemies.reduce((nearest, enemy) => {
        if (!nearest) return enemy;
        const enemyDistance = Math.hypot(enemy.x - S.x, enemy.y - S.y);
        const nearestDistance = Math.hypot(nearest.x - S.x, nearest.y - S.y);
        return enemyDistance < nearestDistance ? enemy : nearest;
      }, null);
      if (target) {
        mouse.x = target.x;
        mouse.y = target.y;
        const wasAttacking = mouse.down;
        mouse.down = true;
        runFrame(delta);
        mouse.down = wasAttacking;
        return;
      }
    }
    runFrame(delta);
  };
})();
