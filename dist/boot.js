(() => {
  const enterButton = document.getElementById('enterBtn');
  const objectiveTitle = document.querySelector('.objective b');
  const objectiveDetail = document.getElementById('enemyCount');
  const roomRuleText = document.getElementById('roomRule');
  const door = { x: 480, y: 58, radius: 78 };

  enterButton.onclick = event => {
    event.preventDefault();
    init();
  };

  const startRoom = spawn;
  spawn = () => {
    startRoom();
    S.x = 480;
    S.y = 550;
    S.phase = 'countdown';
    S.countdown = 3;
    S.paused = true;
    objectiveTitle.textContent = 'Prepare yourself';
    objectiveDetail.textContent = '3';
    roomRuleText.textContent = 'Combat begins after the countdown.';
  };

  const showChoice = choose;
  choose = type => {
    if (type === 'room') S.phase = 'reward';
    showChoice(type);
  };

  const startNextOrOpenDoor = spawn;
  spawn = () => {
    if (S && S.phase === 'reward') {
      S.room = Math.max(1, S.room - 1);
      S.phase = 'gate';
      S.paused = false;
      S.xp = Math.max(0, S.xp);
      objectiveTitle.textContent = 'The door is open';
      objectiveDetail.textContent = 'Move to the north door';
      roomRuleText.textContent = 'Stand near the open door and press Enter.';
      return;
    }
    startNextOrOpenDoor();
  };

  const runFrame = update;
  update = delta => {
    if (!S) return runFrame(delta);

    if (S.phase === 'countdown') {
      S.paused = true;
      S.countdown = Math.max(0, S.countdown - delta);
      const remaining = Math.ceil(S.countdown);
      objectiveTitle.textContent = remaining ? 'Prepare yourself' : 'Fight!';
      objectiveDetail.textContent = remaining ? String(remaining) : 'The chamber is live';
      if (S.countdown <= 0) {
        S.phase = 'combat';
        S.paused = false;
        objectiveTitle.textContent = 'Clear the chamber';
        objectiveDetail.textContent = `${S.enemies.length} enemies remain`;
        roomRuleText.textContent = 'Defeat every enemy to claim an upgrade.';
      }
      return;
    }

    if (S.phase === 'gate') {
      S.paused = false;
      runFrame(delta);
      const nearDoor = Math.hypot(S.x - door.x, S.y - door.y) < door.radius;
      objectiveTitle.textContent = nearDoor ? 'Press Enter' : 'The door is open';
      objectiveDetail.textContent = nearDoor ? 'Enter the next chamber' : 'Move to the north door';
      return;
    }

    if (!S.paused && S.enemies.length) {
      const target = S.enemies.reduce((nearest, enemy) => {
        if (!nearest) return enemy;
        return Math.hypot(enemy.x - S.x, enemy.y - S.y) < Math.hypot(nearest.x - S.x, nearest.y - S.y) ? enemy : nearest;
      }, null);
      mouse.x = target.x;
      mouse.y = target.y;
      const wasAttacking = mouse.down;
      mouse.down = true;
      runFrame(delta);
      mouse.down = wasAttacking;
      return;
    }
    runFrame(delta);
  };

  const paintFrame = draw;
  draw = () => {
    paintFrame();
    if (!S) return;
    if (S.phase === 'gate') {
      ctx.save();
      ctx.fillStyle = '#08090b';
      ctx.fillRect(426, 21, 108, 32);
      ctx.fillStyle = '#e6b45e';
      ctx.shadowColor = '#ef7c32';
      ctx.shadowBlur = 20;
      ctx.fillRect(438, 26, 84, 23);
      ctx.fillStyle = '#090b0d';
      ctx.fillRect(447, 31, 66, 19);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f4ead7';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ENTER', 480, 72);
      ctx.restore();
    }
    if (S.phase === 'countdown') {
      ctx.save();
      ctx.fillStyle = '#00000088';
      ctx.fillRect(0, 0, 960, 640);
      ctx.fillStyle = '#f4ead7';
      ctx.font = 'bold 96px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(String(Math.max(1, Math.ceil(S.countdown))), 480, 345);
      ctx.restore();
    }
  };

  addEventListener('keydown', event => {
    if (event.key !== 'Enter' || !S || S.phase !== 'gate') return;
    if (Math.hypot(S.x - door.x, S.y - door.y) >= door.radius) return;
    S.room += 1;
    S.phase = 'transition';
    spawn();
  });
})();
