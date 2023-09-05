import { ShapeDetectionUI } from "../../../ui/layaMaxUI";
import ShapeDetection from "./ShapeDetection";
export default class ShapeDetectionRT extends ShapeDetectionUI {
    constructor() {
        super();
        /** 检测类型 */
        this._detectionType = 0;
        /** 需要碰撞的节点 */
        this.collisionNodes = [this.c1, this.p1, this.p2];
        ShapeDetectionRT.i = this;
    }
    onEnable() {
        //获取场景上的组件
        this._script = this.getComponent(ShapeDetection);
        //关联切换选项
        this.detectionType.selectHandler = new Laya.Handler(this, this.onSelected);
        //设置默认的选项
        this.detectionType.selectedIndex = 0;
    }

    /** 当选中某个选项时 */
    onSelected(index) {
        this._detectionType = index;
        switch (index) {
            case 0:
                this.setCircleLine([this.c11, this.p11, this.p22]);
                break;
            case 1:
                this.setRectLine([this.c11, this.p11, this.p22]);
                break;
            case 2:
                this.c11.graphics.clear();
                this.p11.graphics.clear();
                this.p22.graphics.clear();
                break;
        }
    }

    /** 碰撞检测
     * @param self 发起碰撞的对象
     */
    collisionWith(self) {
        /** 被撞的对象 */
        let nodes;
        nodes = this._script.collisionWith(self, this.collisionNodes, this._detectionType);
        if (nodes.length > 0) {
            nodes.push(self);
            this.setLineWidth(nodes);
        } else {
            this.retsetLineWidth();
        }
    }

    /** 设置边框宽度
     * @param nodes 节点对象数组
     */
    setLineWidth(nodes) {
        for (let i = 0; i < nodes.length; i++) {
            nodes[i]._graphics._one.lineWidth = 3;
        }
    }

    /** 重置边框宽度 */
    retsetLineWidth() {
        for (let i = 0; i < this.collisionNodes.length; i++) {
            this.collisionNodes[i]._graphics._one.lineWidth = 0;
        }
    }

    /** 设置圆形边线
     * @param nodes 节点对象数组
     * @param lineWidth 线框宽度
     * @param lineColor 线的颜色
     */
    setCircleLine(nodes, lineWidth = 1, lineColor = "#1e00fb") {
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].graphics.clear();
            let x = nodes[i].width / 2,
                y = nodes[i].height / 2,
                radius = this._script.rectToRadius(nodes[i].width, nodes[i].height);
            nodes[i].graphics.drawCircle(x, y, radius, null, lineColor, lineWidth);
        }
    }

    /** 设置矩形边线
     * @param nodes 节点对象数组
     * @param lineWidth 线框宽度
     * @param lineColor 线的颜色
     */
    setRectLine(nodes, lineWidth = 1, lineColor = "#1e00fb") {
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].graphics.clear();
            nodes[i].graphics.drawRect(nodes[i].x, nodes[i].y, nodes[i].width, nodes[i].height, null, lineColor, lineWidth);
        }
    }
}