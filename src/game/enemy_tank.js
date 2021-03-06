import msgBus from './util/message_bus';
import * as PIXI from 'pixi.js';
import Game from './game';
import Bullet from './bullet';
import {randomInt} from './util/random';

const game = Game.getInstance();

class EnemyTank {
  constructor(){
    this.camp = Game.CAMP.ENEMY;
    this.sp = new PIXI.Sprite(PIXI.utils.TextureCache['assets/tank2.png']);
    this.sp.anchor.set(0.5);
    this.sp.rotation = Math.PI;
    game.getPlayContainer().addChild(this.sp);
    game.getTicker().add(() => this.onTick());
    this.tickCount = 0;
    this.randomInt = randomInt(1,60);
  }

  reactive(){
    this.sp.x = Math.floor(Math.random() * game.getWidth());
    this.sp.y = 0;
    this.sp.rotation = Math.random()*Math.PI/2 + Math.PI/4*3;
    this.sp.visible = true;
    aliveTankPool.push(this);
  }

  moveToIdleTankPool(){
    this.sp.visible = false;
    idleTankPool.add(this);
    const i = aliveTankPool.indexOf(this);
    aliveTankPool.splice(i, 1);
  }

  onTick(){
    if(this.sp.visible) {
      this.sp.y -= Math.cos(this.sp.rotation) * EnemyTank.speed;
      this.sp.x += Math.sin(this.sp.rotation) * EnemyTank.speed;
      if(this.sp.y > game.getHeight() || this.sp.x < 0 || this.sp.x > game.getWidth()){
        this.moveToIdleTankPool();
      }

      this.tickCount++;
      if(this.tickCount> 1000000) {
        this.tickCount = 0;
      }
      if(this.tickCount%240 === this.randomInt) {
        this.fire();
      }
    }
  }

  fire(){
    if (game.status === Game.STATUS.PLAYING){
      Bullet.getEnemyOne(this, this.sp.rotation, EnemyTank.bulletSpeed);
    }
  }

  crash() {
    this.moveToIdleTankPool();
    // TODO
  }
}

EnemyTank.speed = 1;
EnemyTank.bulletSpeed = 2;

const idleTankPool = new Set();
const aliveTankPool = [];

function sendANewTank(){
  let tank;
  if(idleTankPool.size){
    tank = idleTankPool.values().next().value;
    idleTankPool.delete(tank);
  } else {
    tank = new EnemyTank();
  }
  tank.reactive();
  waitRandomTime(sendANewTank);
}

function waitRandomTime(callBack) {
  const dt = Math.floor(Math.random() * 1500) + 2500;
  if (game.status === Game.STATUS.PLAYING) {
    setTimeout(callBack, dt);
  }
}

function onGameStart(){
  sendANewTank();
}

msgBus.listen('game.statusChange', content => {
  if (content.new === Game.STATUS.PLAYING) {
    onGameStart();
  }
});

EnemyTank.getActiveTanks = () => {
  return aliveTankPool;
};

game.addToLoader('assets/tank2.png');

export default EnemyTank;