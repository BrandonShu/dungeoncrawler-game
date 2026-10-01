(() => {
  const enterButton = document.getElementById('enterBtn');
  const objectiveTitle = document.querySelector('.objective b');
  const objectiveDetail = document.getElementById('enemyCount');
  const roomRuleText = document.getElementById('roomRule');
  const progressLabel = document.querySelectorAll('.meter-block')[1].querySelector('span');
  const door = { x: 480, y: 58, radius: 78 };
  const legendaryPowers = [
    ['♛','Titan Heart','Legendary · +120 maximum health and +8 healing per kill',s=>{s.maxHp+=120;s.hp=s.maxHp;s.lifesteal+=8}],
    ['⚡','Storm Soul','Legendary · +55% attack speed and +25% movement speed',s=>{s.rate*=1.55;s.speed*=1.25}],
    ['✹','Worldsplitter','Legendary · +80% damage and a much larger attack',s=>{s.damage*=1.8;s.size+=8}]
  ];

  enterButton.onclick = event => { event.preventDefault(); init(); };

  const baseSpawn = spawn;
  const prepareRoom = () => {
    baseSpawn();
    S.x = 480;
    S.y = 550;
    S.xp = 0;
    S.xpNext = Number.MAX_SAFE_INTEGER;
    S.roomEnemyTotal = S.enemies.length;
    if (S.room % 10 === 0) {
      const bossHealth = 620 * (1 + S.room * .12);
      S.enemies = [{x:480,y:165,r:42,hp:bossHealth,max:bossHealth,speed:48+S.room,damage:28+S.room*1.2,hit:0,type:'boss',cd:0}];
      S.roomEnemyTotal = 1;
      roomRuleText.textContent = 'Boss chamber · defeat the guardian for a legendary ability.';
    }
    S.phase = 'countdown';
    S.countdown = 3;
    S.paused = true;
    progressLabel.textContent = 'ROOM PROGRESS';
    objectiveTitle.textContent = S.room % 10 === 0 ? 'Boss incoming' : 'Prepare yourself';
    objectiveDetail.textContent = '3';
    xpText.textContent = 'ROOM NOT CLEARED';
    xpBar.style.width = '0%';
  };

  spawn = () => {
    if (S && S.phase === 'reward') {
      S.room = Math.max(1, S.room - 1);
      S.phase = 'gate';
      S.paused = false;
      objectiveTitle.textContent = 'The door is open';
      objectiveDetail.textContent = 'Move to the north door';
      roomRuleText.textContent = 'Stand near the open door and press Enter.';
      xpText.textContent = 'ROOM CLEARED';
      xpBar.style.width = '100%';
      return;
    }
    prepareRoom();
  };

  const baseChoose = choose;
  const openGate = () => {
    S.phase = 'gate';
    S.paused = false;
    objectiveTitle.textContent = 'The door is open';
    objectiveDetail.textContent = 'Move to the north door';
    roomRuleText.textContent = 'Stand near the open door and press Enter.';
    ui();
    xpText.textContent = 'ROOM CLEARED';
    xpBar.style.width = '100%';
  };

  const showLegendaryChoice = () => {
    choiceEyebrow.textContent = 'Boss defeated';
    choiceTitle.textContent = 'Choose a legendary ability';
    choiceCopy.textContent = 'The guardian’s power is yours. Choose one lasting gift.';
    choiceGrid.innerHTML = legendaryPowers.map((power,index)=>`<button class="choice-card" data-i="${index}"><span class="choice-icon">${power[0]}</span><h3>${power[1]}</h3><p>${power[2]}</p></button>`).join('');
    choiceGrid.querySelectorAll('button').forEach(button=>button.onclick=()=>{
      const power=legendaryPowers[+button.dataset.i];
      power[3](S);
      if(S.relics.length<6)S.relics.push(power);
      choiceDialog.close();
      openGate();
    });
    choiceDialog.showModal();
  };

  choose = type => {
    if (type !== 'room') return;
    S.level += 1;
    S.xp = 0;
    S.xpNext = Number.MAX_SAFE_INTEGER;
    levelLabel.textContent = S.level;
    xpText.textContent = 'ROOM CLEARED';
    xpBar.style.width = '100%';
    if (S.room % 10 === 0) {
      S.phase = 'legendary';
      showLegendaryChoice();
      return;
    }
    S.phase = 'reward';
    baseChoose(type);
  };

  const baseUpdate = update;
  update = delta => {
    if (!S) return baseUpdate(delta);
    S.xp = 0;
    S.xpNext = Number.MAX_SAFE_INTEGER;
    if (S.phase === 'countdown') {
      S.paused = true;
      S.countdown = Math.max(0, S.countdown - delta);
      const remaining = Math.ceil(S.countdown);
      objectiveTitle.textContent = remaining ? (S.room%10===0?'Boss incoming':'Prepare yourself') : 'Fight!';
      objectiveDetail.textContent = remaining ? String(remaining) : 'The chamber is live';
      if (S.countdown <= 0) {
        S.phase = 'combat'; S.paused = false;
        objectiveTitle.textContent = S.room%10===0?'Defeat the guardian':'Clear the chamber';
        objectiveDetail.textContent = `${S.enemies.length} ${S.enemies.length===1?'enemy remains':'enemies remain'}`;
      }
      return;
    }
    if (S.phase === 'gate') {
      S.paused = false; baseUpdate(delta); S.xp=0;
      xpText.textContent = 'ROOM CLEARED';
      xpBar.style.width = '100%';
      const near = Math.hypot(S.x-door.x,S.y-door.y)<door.radius;
      objectiveTitle.textContent = near?'Press Enter':'The door is open';
      objectiveDetail.textContent = near?'Enter the next chamber':'Move to the north door';
      return;
    }
    if (!S.paused && S.enemies.length) {
      const target=S.enemies.reduce((near,e)=>!near||Math.hypot(e.x-S.x,e.y-S.y)<Math.hypot(near.x-S.x,near.y-S.y)?e:near,null);
      mouse.x=target.x;mouse.y=target.y;
      const held=mouse.down;mouse.down=true;baseUpdate(delta);mouse.down=held;S.xp=0;
      const defeated=S.roomEnemyTotal-S.enemies.length;
      xpText.textContent=`${defeated} / ${S.roomEnemyTotal} DEFEATED`;
      xpBar.style.width=`${Math.max(0,defeated/S.roomEnemyTotal*100)}%`;
      return;
    }
    baseUpdate(delta);S.xp=0;
  };

  const baseDraw = draw;
  draw = () => {
    baseDraw();
    if (!S) return;
    for (const enemy of S.enemies) {
      ctx.save();
      ctx.translate(enemy.x,enemy.y);
      ctx.fillStyle='#09090b99';ctx.beginPath();ctx.ellipse(0,enemy.r*.8,enemy.r*1.15,enemy.r*.42,0,0,Math.PI*2);ctx.fill();
      if(enemy.type==='boss'){
        ctx.strokeStyle='#e6b45e';ctx.lineWidth=4;ctx.shadowColor='#ef7c32';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(0,0,enemy.r+10,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='#e6b45e';ctx.beginPath();ctx.moveTo(-30,-24);ctx.lineTo(-42,-48);ctx.lineTo(-12,-35);ctx.fill();ctx.beginPath();ctx.moveTo(30,-24);ctx.lineTo(42,-48);ctx.lineTo(12,-35);ctx.fill();
        ctx.shadowBlur=0;ctx.fillStyle='#ffdf76';ctx.fillRect(-15,-8,9,7);ctx.fillRect(6,-8,9,7);
      }else{
        ctx.fillStyle='#f1b35c';ctx.fillRect(-7,-5,4,4);ctx.fillRect(3,-5,4,4);
        ctx.strokeStyle=enemy.type==='brute'?'#d86b4e':'#8d6572';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-enemy.r,2);ctx.lineTo(-enemy.r-7,-7);ctx.moveTo(enemy.r,2);ctx.lineTo(enemy.r+7,-7);ctx.stroke();
      }
      ctx.restore();
    }
    if(S.phase==='gate'){
      ctx.save();ctx.fillStyle='#08090b';ctx.fillRect(426,21,108,32);ctx.fillStyle='#e6b45e';ctx.shadowColor='#ef7c32';ctx.shadowBlur=20;ctx.fillRect(438,26,84,23);ctx.fillStyle='#090b0d';ctx.fillRect(447,31,66,19);ctx.restore();
    }
    if(S.phase==='countdown'){
      ctx.save();ctx.fillStyle='#00000088';ctx.fillRect(0,0,960,640);ctx.fillStyle=S.room%10===0?'#e6b45e':'#f4ead7';ctx.font='bold 96px Georgia';ctx.textAlign='center';ctx.fillText(String(Math.max(1,Math.ceil(S.countdown))),480,345);ctx.restore();
    }
  };

  addEventListener('keydown',event=>{
    if(event.key!=='Enter'||!S||S.phase!=='gate'||Math.hypot(S.x-door.x,S.y-door.y)>=door.radius)return;
    S.room+=1;S.phase='transition';spawn();
  });
})();
