/**
 * 游戏控制脚本。定义了几个dropBox，bullet，createBoxInterval等变量，能够在IDE显示及设置该变量
 * 更多类型定义，请参考官方文档
 */
export default class PhysicsGameMain extends Laya.Script {
    constructor() {
        super();
        /** @prop {name:createBoxInterval,tips:"间隔多少毫秒创建一个下跌的容器",type:int,default:1000}*/
        this.createBoxInterval = 1000;
        /**开始时间*/
        this._time = 0;
        /**是否已经开始游戏 */
        this._started = false;
        /**是否停止每帧更新 */
        this.updateStop = false;
    }
    onEnable() {
        this._time = Date.now();
        this._gameBox = this.owner.getChildByName("gameBox");
        //帧听舞台事件，当失去焦点后，停止每帧更新
        Laya.stage.on(Laya.Event.BLUR, this, () => { this.updateStop = true; });
        //当恢复鼠标焦点后，恢复每帧更新
        Laya.stage.on(Laya.Event.FOCUS, this, () => { this.updateStop = false; });
    }
    //涉及到与屏幕适配相关逻辑，必须要放到onStart里，否则就可能因适配值没计算完，导致一系列的问题
    onStart() {
        //先找到地板这个节点，然后再找到该节点挂的碰撞体,赋值给_ground，用于修改碰撞体的属性
        let _ground = this.owner.getChildByName("ground").getComponent(Laya.BoxCollider);
        //由于是全屏适配，将碰撞体的宽度设置为屏幕的宽
        _ground.width = Laya.stage.width;
    }
    onUpdate() {
        //避免由于切到后台后还在更新，而导致切出后台后，同时出现大量盒子
        if (this.updateStop)
            return;
        //每间隔一段时间创建一个盒子
        let now = Date.now();
        if (now - this._time > this.createBoxInterval && this._started) {
            this._time = now;
            this.createBox();
        }
    }
    createBox() {
        //使用对象池创建盒子
        let box = Laya.Pool.getItemByCreateFun("dropBox", this.dropBox.create, this.dropBox);
        box.pos(Math.random() * (Laya.stage.width - 100), -100);
        this._gameBox.addChild(box);
    }
    onStageClick(e) {
        //停止事件冒泡，提高性能，当然也可以不要
        e.stopPropagation();
        //舞台被点击后，使用对象池创建子弹
        let flyer = Laya.Pool.getItemByCreateFun("bullet", this.bullet.create, this.bullet);
        flyer.pos(Laya.stage.mouseX, Laya.stage.mouseY);
        this._gameBox.addChild(flyer);
    }
    /**开始游戏，通过激活本脚本方式开始游戏*/
    startGame() {
        if (!this._started) {
            this._started = true;
            this.enabled = true;
        }
    }
    /**结束游戏，通过非激活本脚本停止游戏 */
    stopGame() {
        this._started = false;
        this.enabled = false;
        this.createBoxInterval = 1000;
        this._gameBox.removeChildren();
    }
}
