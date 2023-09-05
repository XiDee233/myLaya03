export default class bgImg extends Laya.Script {
    constructor() {
        super(...arguments);
        /** x轴最大可拖坐标点 */
        this.maxX = 0;
        /** x轴最小可拖坐标点 */
        this.minX = -90;
        /** y轴最大可拖坐标点 */
        this.maxY = 0;
        /** y轴最小可拖坐标点 */
        this.minY = -580;
        /**每次滚轮的缩放大小 */
        this.scaleSize = 0.1;
        /** 上次的距离值 */
        this.lastDistance = 0;
    }
    onEnable() {
        this._owner = this.owner;
        this.onMouseWheel();
    }
    /** 帧听滚轮事件，并处理滚动 */
    onMouseWheel() {
        //处理滚轮事件的帧听
        this.owner.on(Laya.Event.MOUSE_WHEEL, this, (e) => {
            //转换舞台坐标为本地坐标
            let point = this._owner.globalToLocal(new Laya.Point(Laya.stage.mouseX, Laya.stage.mouseY));
            // this.addTestPoint(point);
            if (e.delta > 0) { //当滑轮向上滚动时  
                this._owner.scaleX += this.scaleSize;
                this._owner.scaleY += this.scaleSize;
            }
            if (e.delta < 0) { //当滑轮向下滚动时  
                this._owner.scaleX -= this.scaleSize;
                this._owner.scaleY -= this.scaleSize;
                //设置最小缩放值
                (this._owner.scaleX < 1) && (this._owner.scaleX = 1);
                (this._owner.scaleY < 1) && (this._owner.scaleY = 1);
            }
            //缩放后的鼠标位置
            let point2 = this._owner.globalToLocal(new Laya.Point(Laya.stage.mouseX, Laya.stage.mouseY));
            // this.addTestPoint(point2, "#ffffff");
            //计算缩放引发的xy偏移值
            let _offsetX = (point2.x - point.x) * this._owner.scaleX;
            let _offsetY = (point2.y - point.y) * this._owner.scaleY;
            //偏移的实际坐标位置
            _offsetX += this._owner.x;
            _offsetY += this._owner.y;
            //缩放后,图的宽高改变了，要更新边界限制
            this.updateLimit();
            //对于有边界限制的，要考虑偏移不要超过边界限制
            if (_offsetX > this.maxX)
                this._owner.x = this.maxX;
            else if (_offsetX < this.minX)
                this._owner.x = this.minX;
            else
                this._owner.x = _offsetX;
            if (_offsetY > this.maxY)
                this._owner.y = this.maxY;
            else if (_offsetY < this.minY)
                this._owner.y = this.minY;
            else
                this._owner.y = _offsetY;
        });
    }
    onStart() {
        //onStart 生命周期里得到的适配宽高比较准确
        this.updateLimit();
    }
    /** 更新边界限制 */
    updateLimit() {
        //父节点，panel
        let _parent = this.owner.parent.parent;
        //设置初始值
        this.minX = _parent.width - this._owner.width * this._owner.scaleY;
        this.minY = _parent.height - this._owner.height * this._owner.scaleY;
    }
    onMouseDown(e) {
        e.stopPropagation();
        //当触摸操作的touch对象数组存在，并且大于1个触摸点，就认定为缩放
        if (e.touches && e.touches.length > 1) {
            let lastPivot = this.setPivot(e.touches);
            //加个保护，个别浏览器（例如safari）有bug，可能偶尔遗失手势信息
            if (!(lastPivot.x) || !(lastPivot.y)) {
                console.log("(((((((((((((((((((((((", this.lastPivot, JSON.parse(JSON.stringify(e.touches)));
            }
            else {
                //把初始的touch空间位置通过开平方运算，记录为初始双指距离
                this.lastDistance = this.getDistance(e.touches);
                //纪录缩放前的手指中心点坐标
                this.lastPivot = lastPivot;
                //多指按下的情况下，再去侦听手势移动事件并处理逻辑
                this._owner.on(Laya.Event.MOUSE_MOVE, this, this.mouseMove);
                // this.addTestPoint(this.lastPivot);
            }
        }
        else if (Laya.Browser.onPC) //拖拽图片  
            this._owner.startDrag();
    }
    onMouseUp(e) {
        //鼠标或手势抬起后，移除侦听
        this._owner.off(Laya.Event.MOUSE_MOVE, this, this.mouseMove);
    }
    /** 计算两个触摸点坐标之间的距离 */
    getDistance(touches) {
        //初始值为0
        var distance = 0;
        if (touches && touches.length > 1) {
            //计算距离
            let dx = touches[0].stageX - touches[1].stageX;
            let dy = touches[0].stageY - touches[1].stageY;
            distance = Math.sqrt(dx * dx + dy * dy);
        }
        return distance;
    }
    /** 鼠标（或手势）在对象上移动时触发的事件侦听方法 */
    mouseMove(e) {
        /**当前的双指距离*/
        let distance = this.getDistance(e.touches);
        //设置缩放
        this._owner.scaleX += (distance - this.lastDistance) * (this.scaleSize / 10);
        this._owner.scaleY += (distance - this.lastDistance) * (this.scaleSize / 10);
        //设置缩放值值限制条件
        (this._owner.scaleX < 1) && (this._owner.scaleX = 1);
        (this._owner.scaleY < 1) && (this._owner.scaleY = 1);
        (this._owner.scaleX > 5) && (this._owner.scaleX = 5);
        (this._owner.scaleY > 5) && (this._owner.scaleY = 5);
        //缩放后的手势中心点位置(局部位置)
        let nowPivot = this.setPivot(e.touches);
        //加个保护，个别浏览器（例如safari）有bug，可能偶尔遗失手势信息
        if (!(nowPivot.x) || !(nowPivot.y)) {
            console.log("$$$$$$$$$$$", nowPivot, JSON.parse(JSON.stringify(e.touches)));
        }
        else {
            // this.addTestPoint(nowPivot, "#ffffff");
            //缩放后,图的宽高改变了，要更新边界限制
            this.updateLimit();
            //计算缩放引发的xy偏移值
            let _offsetX = (nowPivot.x - this.lastPivot.x) * this._owner.scaleX;
            let _offsetY = (nowPivot.y - this.lastPivot.y) * this._owner.scaleY;
            //偏移的实际坐标位置
            _offsetX += this._owner.x;
            _offsetY += this._owner.y;
            //对于有边界限制的，要考虑偏移不要超过边界限制
            if (_offsetX > this.maxX)
                this._owner.x = this.maxX;
            else if (_offsetX < this.minX)
                this._owner.x = this.minX;
            else
                this._owner.x = _offsetX;
            if (_offsetY > this.maxY)
                this._owner.y = this.maxY;
            else if (_offsetY < this.minY)
                this._owner.y = this.minY;
            else
                this._owner.y = _offsetY;
            //保存当前值，用于下次计算
            this.lastDistance = distance;
        }
    }
    /**
     * 计算并设置多指的中心点坐标
     * @param touches 手势信息数组
     */
    setPivot(touches) {
        let Point0 = this._owner.globalToLocal(new Laya.Point(touches[0].stageX, touches[0].stageY));
        let Point1 = this._owner.globalToLocal(new Laya.Point(touches[1].stageX, touches[1].stageY));
        return new Laya.Point((Point0.x + Point1.x) / 2, (Point0.y + Point1.y) / 2);
    }
    onUpdate() {
        //边界控制
        (this._owner.x > this.maxX) && (this._owner.x = this.maxX);
        (this._owner.x < this.minX) && (this._owner.x = this.minX);
        (this._owner.y > this.maxY) && (this._owner.y = this.maxY);
        (this._owner.y < this.minY) && (this._owner.y = this.minY);
        // console.log("---------_owner.xy++++++++++", this._owner.x, this._owner.y, this.maxX, this.maxY, this.minX, this.minY);
    }
    /** 添加一个测试点
     * @param point 测试点坐标
     * @param size 测试点大小，圆的半径
     * @param color 测试点的颜色
     */
    addTestPoint(point, color = "#ff0000", size = 2) {
        let spTest = new Laya.Sprite();
        spTest.graphics.drawCircle(0, 0, size, color);
        this.owner.addChild(spTest);
        spTest.pos(point.x, point.y);
        // console.log("====---------", point.x, point.y)
    }
}
