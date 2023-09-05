/**
 * 工具条收缩效果脚本
 */
export default class Folded extends Laya.Script {
    constructor() {
        super();
        /** 工具条是否打开 */
        this.isOpen = true;
    }
    onEnable() {
        //获得工具条背景对象
        this.toolbarBG = this.owner.parent;
        //获得折叠按钮对象
        this._owner = this.owner;
        //获得菜单组对象
        this.menu = this.owner.parent.getChildByName("menu");
    }
    onMouseDown(e) {
        //停止事件冒泡
        e.stopPropagation();
        if (this.isOpen) {
            //背景缓动收起
            Laya.Tween.to(this.toolbarBG, { width: 106 }, 1000, Laya.Ease.strongOut);
            //向左，移动+旋转
            Laya.Tween.to(this._owner, { x: 52, rotation: 540 }, 1000, Laya.Ease.strongOut, Laya.Handler.create(this, () => {
                //修改打开状态
                this.isOpen = false;
            }));
            //菜单消失
            Laya.Tween.to(this.menu, { alpha: 0 }, 300, Laya.Ease.strongOut, Laya.Handler.create(this, () => {
                //修改帮助菜单显示状态
                this.menu.visible = false;
            }));
        }
        else {
            //背景缓动打开
            Laya.Tween.to(this.toolbarBG, { width: 460 }, 1000, Laya.Ease.strongOut);
            //向右，移动+旋转
            Laya.Tween.to(this._owner, { x: 402, rotation: -360 }, 1000, Laya.Ease.strongOut, Laya.Handler.create(this, () => {
                //修改打开状态
                this.isOpen = true;
            }));
            //菜单显示
            Laya.Tween.to(this.menu, { alpha: 1 }, 200, Laya.Ease.strongOut, Laya.Handler.create(this, () => {
                //修改帮助菜单显示状态
                this.menu.visible = true;
            }));
        }
    }
    onDisable() {
    }
}
