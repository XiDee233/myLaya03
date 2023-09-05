var Event = Laya.Event;
var Point = Laya.Point;
/**
 * 2D摇杆脚本，
 * 控制角色行走与站立、控制地图偏移中心点
 */
export default class Joystick extends Laya.Script {
    constructor() {
        super();
        /** @prop {name:runAniName, tips:"各个方向对应的角色跑动动画名称，共16个方向，以英文逗号间隔。方向顺序从右开始，顺时针从0至15", type:String, default:"Right,Rdown1,Rdown2,Rdown3,Down,Ldown3,Ldown2,Ldown1,Left,Lup1,Lup2,Lup3,Up,Rup3,Rup2,Rup1"}*/
        this.runAniName = "Right,Rdown1,Rdown2,Rdown3,Down,Ldown3,Ldown2,Ldown1,Left,Lup1,Lup2,Lup3,Up,Rup3,Rup2,Rup1";
        /** @prop {name:standAniName, tips:"各个方向对应的角色站立动画名称，共8个方向，以英文逗号间隔。方向顺序从右开始，顺时针从0至7", type:String, default:"Right,Rdown,Down,Ldown,Left,Lup,Up,Rup"}*/
        this.standAniName = "Right,Rdown,Down,Ldown,Left,Lup,Up,Rup";
        /** 记录stage上的鼠标点，当频繁使用stage坐标转化时，可以减少实例开销 */
        this.stageMouse = new Point();
        /** 中心点坐标偏移值 */
        this.axisPivot = new Point();
        /** 摇杆角度 */
        this.angle = 0;
        /** 摇杆弧度 */
        this.radian = 0;
        /** 是否允许跑动 */
        this.isMoving = false;
    }
    onEnable() {
        //查找节点对象
        this.joystickBG = this.owner;
        this.joystickAxis = this.owner.getChildByName("joystickAxis");
        //得到摇杆轴最大移动的距离，可用于限制轴心的移动范围，如果不想超出背景大圈，再除2即可。
        this.maxDistance = this.joystickBG.width - this.joystickAxis.width;
        //记录中心点偏移值，需要提前在IDE里将摇杆轴joystickAxis的坐标摆放到中心点坐标上
        this.axisPivot.x = this.joystickAxis.x;
        this.axisPivot.y = this.joystickAxis.y;
        //对整个panel视窗进行鼠标事件侦听
        this.sceneWindow.on(Event.MOUSE_DOWN, this, this.mouseDown);
        this.sceneWindow.on(Event.MOUSE_MOVE, this, this.mouseMove);
        this.sceneWindow.on(Event.MOUSE_UP, this, this.mouseUp);
        this.sceneWindow.on(Event.MOUSE_OUT, this, this.mouseUp);
        //添加角色到视窗中心
        this.roleAniNode = this.roleAni.create();
        this.sceneWindow.addChild(this.roleAniNode);
        this.roleAniNode.pivot(this.roleAniNode.width / 2, this.roleAniNode.height / 2);
        this.roleAniNode.x = this.sceneWindow.width / 2;
        this.roleAniNode.y = this.sceneWindow.height / 2;
        //找到动画
        this.roleStand = this.roleAniNode.getChildByName("roleStand");
        this.roleRun = this.roleAniNode.getChildByName("roleRun");
    }
    /** 侦听panel 鼠标\手势按下时 */
    mouseDown(e) {
        //记录按下的touchId，用于判断是否是按下的事件
        this.touchId = e.touchId;
        this.isMoving = true;
        this.updateJoystickPoint();
    }
    /** 更新摇杆按下的位置 */
    updateJoystickPoint() {
        //先把stage坐标转换为摇杆节点的本地坐标,这里是轴心的父节点坐标摇杆背景
        this.stageMouse.x = Laya.stage.mouseX;
        this.stageMouse.y = Laya.stage.mouseY;
        let joystickBGMouse = this.joystickBG.globalToLocal(this.stageMouse), 
        /** 根据摇杆轴心偏移调整后的鼠标坐标点 */
        mouseX = joystickBGMouse.x - this.joystickAxis.width / 2, mouseY = joystickBGMouse.y - this.joystickAxis.height / 2;
        //计算弧度、角度
        this.radian = Math.atan2(mouseY - this.axisPivot.y, mouseX - this.axisPivot.x);
        this.lastAngle = this.angle;
        this.angle = Math.round(this.radian * 180 / Math.PI * 10) / 10;
        this.angle < 0 && (this.angle += 360);
        /**计算摇杆轴的移动距离，摇杆节点（joystickBG）的中心位置到摇杆节点坐标系的摇杆轴鼠标点位置*/
        let distance = this.getDistance(this.joystickBG.width / 2, this.joystickBG.height / 2, joystickBGMouse.x, joystickBGMouse.y);
        // console.log({ distance }, this.maxDistance);
        //在摇杆背景区域外，并且角度发生变化才更新摇杆轴位置
        if (distance > this.maxDistance && this.lastAngle !== this.angle) {
            this.joystickAxis.x = Math.floor(Math.cos(this.radian) * this.maxDistance) + this.axisPivot.x;
            this.joystickAxis.y = Math.floor(Math.sin(this.radian) * this.maxDistance) + this.axisPivot.y;
        }
        else {
            //在限制内，直接设置坐标, 用joystickBG坐标系下的鼠标坐标，减去joystickAxis自身的中心点偏移值，得到joystickAxis最终的坐标值
            this.joystickAxis.pos(joystickBGMouse.x - this.joystickAxis.width / 2, joystickBGMouse.y - this.joystickAxis.height / 2);
        }
        this.switchAni("run");
    }
    /** 切换动画
     * @param aniType 动作类型
     */
    switchAni(aniType) {
        if (aniType == "run") {
            //停止站立动画播放
            if (this.roleStand.isPlaying) {
                this.roleStand.stop();
                //让动画节点消失
                this.roleStand.visible = false;
                //让跑动节点显示
                this.roleRun.visible = true;
            }
            let _runAniName = this.getOrientation(this.angle, this.runAniName);
            if (_runAniName !== this.lastRunAniName) {
                this.lastRunAniName = _runAniName;
                this.roleRun.play(0, true, _runAniName);
            }
        }
        else {
            //跑动 动画停止
            if (this.roleRun.isPlaying) {
                this.roleRun.stop();
                this.roleRun.visible = false;
                this.roleStand.visible = true;
            }
            this.lastAngle !== this.angle && this.roleStand.play(0, true, this.getOrientation(this.angle, this.standAniName));
        }
    }
    /** 鼠标抬起时 */
    mouseUp(e) {
        //不是按下的，不作处理
        if (e.touchId != this.touchId)
            return;
        this.touchId = null;
        this.isMoving = false;
        //摇杆轴回归原位（摇杆背景中心）
        this.joystickAxis.pos(this.axisPivot.x, this.axisPivot.y);
        //设置站立朝向
        this.switchAni("stand");
    }
    /** 鼠标移动的时候 */
    mouseMove(e) {
        //只处理按下并移动的逻辑
        if (e.touchId != this.touchId)
            return;
        this.updateJoystickPoint();
    }
    /** 根据角度得到朝向动画名
     * @param angle 角度
     * @param aniName 动画名称字符串
     * @return 动画名
    */
    getOrientation(angle, aniName) {
        let aniArr = aniName.split(",");
        const angleConditions = 360 / aniArr.length;
        return aniArr[Math.floor(angle / angleConditions)];
    }
    onUpdate() {
        if (!this.isMoving)
            return;
        //更新角色的移动
        this.updateRoleMove();
    }
    /** 更新角色移动相关 */
    updateRoleMove() {
        //根据摇杆角度改变角色移动朝向
        this.switchAni("run");
        //移动的坐标向量为：摇杆弧度下的坐标向量比率（斜边比）乘以移动速度
        let dx = Math.cos(this.radian) * 2;
        let dy = Math.sin(this.radian) * 2;
        //通过反向移动地图，形成角色位移的视觉效果
        ((dx < 0 && this.gameMap.x < 0) || (dx > 0 && this.gameMap.x > this.sceneWindow.width - this.gameMap.width)) && (this.gameMap.x -= dx);
        ((dy < 0 && this.gameMap.y < 0) || (dy > 0 && this.gameMap.y > this.sceneWindow.height - this.gameMap.height)) && (this.gameMap.y -= dy);
    }
    /**
    * 获得两个坐标点的直线距离，
    * 依据勾股定理，用目标坐标的分量与原始坐标的分量计算斜边(目标点到鼠标点的直线距离)，用于判断是否超出限制范围
    * @param centerX 原始的中心点坐标X轴位置
    * @param centerY 原始的中心点坐标Y轴位置
    * @param mouseX 鼠标点X轴位置
    * @param mouseY 鼠标点Y轴位置
    */
    getDistance(centerX, centerY, mouseX, mouseY) {
        let dx = centerX - mouseX, dy = centerY - mouseY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
