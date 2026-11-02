import GameObject from '@assets/js/GameEnginev1.1/essentials/GameObject.js';
import GameEnvBackground from '@assets/js/GameEnginev1.1/essentials/GameEnvBackground.js';
import Player from '@assets/js/GameEnginev1.1/essentials/Player.js';
import SplineBarrier from '@assets/js/GameEnginev1.1/essentials/SplineBarrier.js';
import LapTracker from './LapTracker.js';

class TimeLapScreen extends GameObject {
  constructor(data = {}, gameEnv = null) {
    super(gameEnv);
    this.data = data;
    this.totalLaps = Number.isFinite(data.totalLaps) ? data.totalLaps : 3;
    this.currentLap = 1;
    this.startedAt = null;
    this.finishedAt = null;
    this.lapTracker = new LapTracker({
      finishLine: { x: 0.5, top: 0.7, bottom: 0.85 },
      checkpoint: { x: 0.5, top: 0.22, bottom: 0.34 },
      totalLaps: this.totalLaps,
    });
    this.player = gameEnv?.gameObjects?.find((object) => object instanceof NightCityPlayer);
    this.panel = { x: 18, y: 18, width: 240, height: 138 };
  }

  update() {
    if (this.player?.selected) {
      const now = performance.now();
      if (this.startedAt === null) {
        this.startedAt = now;
      }
      this.updateLapProgress(now);
    }
    this.draw();
  }

  updateLapProgress(now) {
    if (this.finishedAt !== null || !this.player) {
      return;
    }

    const center = this.player.getCenter();
    const position = {
      x: center.x / this.gameEnv.innerWidth,
      y: center.y / this.gameEnv.innerHeight
    };
    const justFinished = this.lapTracker.update(this.player, position);
    this.currentLap = Math.min(
      this.lapTracker.getLapsCompleted(this.player) + 1,
      this.totalLaps
    );
    if (justFinished) {
      this.finishedAt = now;
    }
  }

  draw() {
    const ctx = this.gameEnv && this.gameEnv.ctx;
    if (!ctx) {
      return;
    }

    const elapsedMs = this.startedAt === null
      ? 0
      : (this.finishedAt ?? performance.now()) - this.startedAt;
    const timeLabel = this.formatTime(elapsedMs);
    const lapLabel = this.finishedAt === null ? 'Lap ' + this.currentLap + '/' + this.totalLaps : 'FINISH!';
    const { x, y, width, height } = this.panel;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TIME', x + 16, y + 28);
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(timeLabel, x + 16, y + 56);

    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('LAP', x + 16, y + 80);
    ctx.fillStyle = '#bbf7d0';
    ctx.fillText(lapLabel, x + 72, y + 80);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(this.player?.getBoostLabel() || 'BOOST READY', x + 16, y + 105);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px sans-serif';
    ctx.fillText('WASD DRIVE   SPACE DRIFT   SHIFT BOOST', x + 16, y + 126);
  }

  formatTime(ms) {
    const totalSeconds = Math.max(0, ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const tenths = Math.floor((totalSeconds * 10) % 10);
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + tenths;
  }

  resize() {
    this.draw();
  }

  destroy() {
    const gameObjects = this.gameEnv && this.gameEnv.gameObjects;
    const index = gameObjects ? gameObjects.indexOf(this) : -1;
    if (index !== -1 && gameObjects) {
      gameObjects.splice(index, 1);
    }
  }
}

class NightCityPlayer extends Player {
  constructor(data = {}, gameEnv = null) {
    super(data, gameEnv);
    this.isPlayer = true;
    this.selected = false;
    this.visible = false;
    this.collisionVisible = false; // Forces off the black hitbox rendering
    this.heading = Math.PI; // Start facing Left towards the track curve
    this.motionVelocity = { x: 0, y: 0 };
    this.lastPhysicsUpdate = performance.now();
    this.boostDuration = 3000;
    this.boostCooldown = 12000;
    this.boostEndsAt = 0;
    this.boostReadyAt = 0;
    this.normalTopSpeed = 0.34;
    this.boostTopSpeed = 0.