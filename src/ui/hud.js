/**
 * Authentic Arcade HUD
 * Renders segmented health bars with trailing damage, round victory markers,
 * 99-second match timer, combo counters, announcer banners, special mode badges,
 * character select screen, and tournament stage banners.
 */

export class HUD {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.timer = 99;
    this.timerTicks = 0;
    this.timerStopped = false;

    this.bannerText = '';
    this.bannerSubtext = '';
    this.bannerTimer = 0;
    this.bannerColor = '#facc15';
    this.bannerScale = 1;
  }

  resetTimer() {
    this.timer = 99;
    this.timerTicks = 0;
    this.timerStopped = false;
  }

  showBanner(text, subtext = '', duration = 90, color = '#facc15') {
    this.bannerText = text;
    this.bannerSubtext = subtext;
    this.bannerTimer = duration;
    this.bannerColor = color;
    this.bannerScale = 1.4;
  }

  update() {
    if (!this.timerStopped && this.timer > 0) {
      this.timerTicks++;
      if (this.timerTicks >= 60) {
        this.timerTicks = 0;
        this.timer--;
      }
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer--;
      if (this.bannerScale > 1.0) {
        this.bannerScale -= 0.05;
      }
    }
  }

  render(ctx, p1, p2, input, gameMode = 'VERSUS_2P', tournamentStage = 1) {
    const w = this.width;

    // 1. HEALTH BARS
    this.renderHealthBar(ctx, p1, 40, 24, 250, 16, false);
    this.renderHealthBar(ctx, p2, w - 290, 24, 250, 16, true);

    // 2. CHARACTER NAMES & SPECIAL MODE BADGES
    ctx.save();
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textBaseline = 'top';

    // P1 Name
    ctx.fillStyle = '#000000';
    ctx.fillText(p1.name, 42, 44);
    ctx.fillStyle = '#facc15';
    ctx.fillText(p1.name, 40, 43);

    // P1 Mode Badge (EASY vs CLASSIC)
    const p1Mode = input ? input.getSpecialMode('p1') : 'easy';
    this.renderModeBadge(ctx, p1Mode, 40 + ctx.measureText(p1.name).width + 8, 43);

    // P2 Name
    const p2TextW = ctx.measureText(p2.name).width;
    ctx.fillStyle = '#000000';
    ctx.fillText(p2.name, w - 40 - p2TextW + 2, 44);
    ctx.fillStyle = '#facc15';
    ctx.fillText(p2.name, w - 40 - p2TextW, 43);

    // P2 Mode Badge (EASY vs CLASSIC)
    const p2Mode = input ? input.getSpecialMode('p2') : 'easy';
    this.renderModeBadge(ctx, p2Mode, w - 40 - p2TextW - 74, 43);

    // 3. ROUND VICTORY ICONS (V Medallions)
    this.renderRoundIcons(ctx, p1.roundsWon, 40, 62, false);
    this.renderRoundIcons(ctx, p2.roundsWon, w - 40, 62, true);

    // 4. MATCH TIMER (Center 99s)
    this.renderTimer(ctx, w / 2, 24);

    // Tournament Stage Sub-banner
    if (gameMode === 'TOURNAMENT') {
      ctx.font = 'bold 11px "Impact", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`STAGE ${tournamentStage} / 8`, w / 2, 58);
    }

    // 5. COMBO COUNTERS
    this.renderCombos(ctx, p1, 40, 90, false);
    this.renderCombos(ctx, p2, w - 40, 90, true);

    // 6. ANNOUNCER BANNERS ("FIGHT!", "ROUND 1", "K.O.!")
    this.renderBanner(ctx);

    ctx.restore();
  }

  renderModeBadge(ctx, mode, x, y) {
    ctx.save();
    const isEasy = mode === 'easy';
    ctx.font = 'bold 9px "Segoe UI", sans-serif';
    ctx.fillStyle = isEasy ? '#15803d' : '#854d0e';
    ctx.fillRect(x, y - 1, 64, 14);
    ctx.strokeStyle = isEasy ? '#22c55e' : '#eab308';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y - 1, 64, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(isEasy ? '🟢 EASY' : '🟡 CLASSIC', x + 5, y + 1);
    ctx.restore();
  }

  renderHealthBar(ctx, player, x, y, width, height, flip) {
    const hpRatio = Math.max(0, player.health / player.maxHealth);
    const displayRatio = Math.max(0, player.displayHealth / player.maxHealth);

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(x - 3, y - 3, width + 6, height + 6);

    ctx.fillStyle = '#991b1b';
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = '#f97316';
    if (!flip) {
      ctx.fillRect(x, y, width * displayRatio, height);
    } else {
      const w = width * displayRatio;
      ctx.fillRect(x + width - w, y, w, height);
    }

    ctx.fillStyle = hpRatio < 0.25 ? '#ef4444' : '#facc15';
    if (!flip) {
      ctx.fillRect(x, y, width * hpRatio, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x, y, width * hpRatio, 3);
    } else {
      const w = width * hpRatio;
      ctx.fillRect(x + width - w, y, w, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x + width - w, y, w, 3);
    }

    ctx.fillStyle = '#1c1917';
    for (let i = 1; i < 6; i++) {
      ctx.fillRect(x + (width / 6) * i - 1, y, 2, height);
    }

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
  }

  renderTimer(ctx, centerX, y) {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(centerX - 24, y - 4, 48, 30);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 24, y - 4, 48, 30);

    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const tStr = this.timer.toString().padStart(2, '0');
    ctx.fillStyle = this.timer <= 10 ? '#ef4444' : '#facc15';
    ctx.fillText(tStr, centerX, y + 11);
    ctx.restore();
  }

  renderRoundIcons(ctx, roundsWon, x, y, flip) {
    ctx.save();
    for (let i = 0; i < 2; i++) {
      const ix = flip ? x - (i * 22) - 16 : x + (i * 22);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(ix + 8, y + 8, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (i < roundsWon) {
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('V', ix + 8, y + 9);
      }
    }
    ctx.restore();
  }

  renderCombos(ctx, player, x, y, flip) {
    if (player.comboCount >= 2) {
      ctx.save();
      ctx.font = 'bold 16px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = flip ? 'right' : 'left';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`${player.comboCount} HITS!`, flip ? x - 2 : x + 2, y + 2);
      ctx.fillStyle = '#ffea00';
      ctx.fillText(`${player.comboCount} HITS!`, x, y);
      ctx.restore();
    }
  }

  renderBanner(ctx) {
    if (this.bannerTimer <= 0 || !this.bannerText) return;

    ctx.save();
    ctx.translate(this.width / 2, this.height / 2 - 20);
    ctx.scale(this.bannerScale, this.bannerScale);

    ctx.font = '900 48px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText(this.bannerText, 0, 0);

    ctx.fillStyle = '#991b1b';
    ctx.fillText(this.bannerText, 3, 4);

    ctx.fillStyle = this.bannerColor;
    ctx.fillText(this.bannerText, 0, 0);

    if (this.bannerSubtext) {
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(this.bannerSubtext, 0, 42);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.bannerSubtext, 0, 42);
    }

    ctx.restore();
  }

  // --- CHARACTER SELECT SCREEN ---
  renderCharacterSelect(ctx, roster, p1Idx, p2Idx, p1Ready, p2Ready, isTournament = false, matchStartCountdown = -1) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 10, 15, 0.94)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Title
    ctx.font = '900 30px "Impact", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('SELECT YOUR FIGHTER', this.width / 2, 40);

    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#facc15';
    if (isTournament) {
      ctx.fillText('P1: [W/A/S/D] Select  •  [F / ENTER] Confirm  •  [V] Cancel', this.width / 2, 64);
    } else {
      ctx.fillText('P1: [WASD] & [F] Confirm [V] Cancel  •  P2: [ARROWS] & [Num 4 / I] Confirm [Num 1 / K] Cancel', this.width / 2, 64);
    }

    // 2-Row Grid of Character Cards (Row 0: 5 fighters, Row 1: 4 fighters centered)
    const cardW = 90;
    const cardH = 104;
    const gapX = 14;
    const startX0 = (this.width - (5 * cardW + 4 * gapX)) / 2;
    const startX1 = (this.width - (4 * cardW + 3 * gapX)) / 2;
    const cardY0 = 92;
    const cardY1 = 216;

    roster.forEach((char, idx) => {
      const isTopRow = idx < 5;
      const col = isTopRow ? idx : idx - 5;
      const cx = (isTopRow ? startX0 : startX1) + col * (cardW + gapX);
      const cy = isTopRow ? cardY0 : cardY1;
      const isP1 = p1Idx === idx;
      const isP2 = !isTournament && p2Idx === idx;

      // Card Background
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(cx, cy, cardW, cardH);

      // Selection outlines
      if (isP1 && isP2) {
        ctx.strokeStyle = '#a855f7'; // Mixed purple
        ctx.lineWidth = 4;
      } else if (isP1) {
        ctx.strokeStyle = '#3b82f6'; // P1 Blue
        ctx.lineWidth = 4;
      } else if (isP2) {
        ctx.strokeStyle = '#ef4444'; // P2 Red
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 2;
      }
      ctx.strokeRect(cx, cy, cardW, cardH);

      // Character Color Swatch Banner
      ctx.fillStyle = char.color;
      ctx.fillRect(cx + 6, cy + 6, cardW - 12, 36);

      // Character Name
      ctx.font = '900 13px "Impact", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(char.name, cx + cardW / 2, cy + 58);

      // Country / Style
      ctx.font = 'bold 9px "Segoe UI", sans-serif';
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(char.country, cx + cardW / 2, cy + 73);
      ctx.fillStyle = '#facc15';
      ctx.fillText(char.style, cx + cardW / 2, cy + 86);

      // Ready Markers
      if (isP1 && p1Ready) {
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 10px "Impact", sans-serif';
        ctx.fillText('P1 READY!', cx + cardW / 2, cy + 98);
      }
      if (isP2 && p2Ready) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px "Impact", sans-serif';
        ctx.fillText('P2 READY!', cx + cardW / 2, cy + 98);
      }
    });

    // P1 Cursor badge
    const p1IsTop = p1Idx < 5;
    const p1Col = p1IsTop ? p1Idx : p1Idx - 5;
    const p1CardX = (p1IsTop ? startX0 : startX1) + p1Col * (cardW + gapX);
    const p1CardY = p1IsTop ? cardY0 : cardY1;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(p1CardX + 4, p1CardY - 18, 28, 14);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Impact", sans-serif';
    ctx.fillText('P1', p1CardX + 18, p1CardY - 7);

    // P2 Cursor badge
    if (!isTournament) {
      const p2IsTop = p2Idx < 5;
      const p2Col = p2IsTop ? p2Idx : p2Idx - 5;
      const p2CardX = (p2IsTop ? startX0 : startX1) + p2Col * (cardW + gapX);
      const p2CardY = p2IsTop ? cardY0 : cardY1;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(p2CardX + cardW - 32, p2CardY - 18, 28, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "Impact", sans-serif';
      ctx.fillText('P2', p2CardX + cardW - 18, p2CardY - 7);
    }

    // Ready Countdown Notification
    if (matchStartCountdown > 0) {
      const pulse = Math.floor(Date.now() / 150) % 2 === 0;
      ctx.fillStyle = pulse ? '#ef4444' : '#facc15';
      ctx.font = '900 16px "Impact", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FIGHT STARTING...', this.width / 2, this.height - 10);
    }

    ctx.restore();
  }

  // --- TOURNAMENT VICTORY SCREEN ---
  renderTournamentWin(ctx, winnerName) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 10, 30, 0.94)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.font = '900 42px "Impact", sans-serif';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText('TOURNAMENT CHAMPION!', this.width / 2, 90);
    ctx.fillStyle = '#facc15';
    ctx.fillText('TOURNAMENT CHAMPION!', this.width / 2, 90);

    ctx.font = 'bold 24px "Impact", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${winnerName} CONQUERED THE WORLD!`, this.width / 2, 140);

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('You have defeated all rivals and vanquished M. Bison.', this.width / 2, 190);
    ctx.fillText('You are the supreme Street Fighter World Warrior!', this.width / 2, 215);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('PRESS [ENTER] OR [SPACE] TO PLAY AGAIN', this.width / 2, 280);

    ctx.restore();
  }
}
