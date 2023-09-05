import ShapeDetectionRT from "../../scence/uiDemo/interactive/ShapeDetectionRT";
export default class DragAndTips extends Laya.Script {
    constructor() {
        super(...arguments);
        /** @prop {name:tipsText,tips:"移入点击区的提示文本，为空则不显示",type:string} */
        this.tipsText = '';
        /** 是否已按下 */
        this.isDown = false;
    }
    onEnable() {
        this.tipsText.replace(/(^\s*)|(\s*$)/g, '');
    }
    onMouseDown() {
        this.owner.startDrag();
        this.isDown = true;
    }
    onMouseUp() {
        this.isDown = false;
    }
    onMouseMove() {
        this.isDown && ShapeDetectionRT.i.collisionWith(this.owner);
    }
    onMouseOver() {
        Laya.Mouse.cursor = "move";
        this.tipsText !== "" && Laya.Scene.open("uiDemo/Msg.scene", false, { "text": this.tipsText });
    }
    onMouseOut() {
        Laya.Mouse.cursor = "auto";
    }
}
