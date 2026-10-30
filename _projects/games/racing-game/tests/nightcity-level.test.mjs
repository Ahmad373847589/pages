import test from 'node:test';
import assert from 'node:assert/strict';
import GameLevelNightcity, { NightCityPlayer } from '../levels/nightcity-level.js';
import TimeLapScreen from '../levels/TimeLapScreen.js';

test('Night City uses the shared lap tracker HUD and finish line on the painted start line', () => {
  const level = new GameLevelNightcity({ path: '/site' });
  const player = level.classes.find(({ class: ObjectClass }) => ObjectClass === NightCityPlayer);
  const hud = level.classes.find(({ class: ObjectClass }) => ObjectClass === TimeLapScreen);

  assert.ok(player);
  assert.equal(player.data.src, '/site/images/projects/racing-game/Red_Car.png');
  assert.equal(NightCityPlayer.name, 'Player', 'the shared HUD and spline barriers recognize the car');
  assert.ok(hud);
  assert.deepEqual(hud.data.finishLine, { x: 0.5, top: 0.77, bottom: 0.91 });
  assert.equal(hud.data.totalLaps, 3);
  assert.equal(hud.data.showLosingScreen, false, 'a solo race should not announce a losing player');
});

test('Night City loads its background and car-selection sprites under the game path', () => {
  const level = new GameLevelNightcity({ path: '/site' });
  const background = level.classes[0].data;
  const selection = level.classes.find(({ class: ObjectClass }) => ObjectClass.name === 'NightCityCarSelection');

  assert.equal(background.src, '/site/images/projects/racing-game/nightcitylevel.png');
  assert.ok(selection);
});
