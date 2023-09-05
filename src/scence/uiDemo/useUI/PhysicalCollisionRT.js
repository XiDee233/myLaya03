import { PhysicalCollisionUI } from "../../../ui/layaMaxUI";
export default class PhysicalCollisionRT extends PhysicalCollisionUI {
    onEnable() {
        this.bTop.getComponent(Laya.BoxCollider).width = this.bTop.width;
        this.bBottom.getComponent(Laya.BoxCollider).width = this.bBottom.width;
        this.bRight.getComponent(Laya.BoxCollider).height = this.bRight.height;
        this.bLeft.getComponent(Laya.BoxCollider).height = this.bLeft.height;
    }
}