import { ChangeTextureUI } from "../../../ui/layaMaxUI";
export default class ChangeTextureRT extends ChangeTextureUI {
    constructor() { super(); }
    onEnable() {
        Laya.timer.loop(2000, this, () => {
            this.changeImgSkin();
            this.changeSpriteTexture();
            this.changeFillTexture();
            this.changeTexture();
        });
    }

    /** 替换Image组件的资源 */
    changeImgSkin() {
        this.Img.skin = this.randomImg();
    }


    /**替换Sprite组件的资源 */
    changeSpriteTexture() {
        this.spImg.loadImage(this.randomImg(true, 6, 5));
    }

    /**替换FillTexture资源，基于Graphics绘图只能是重绘 */
    changeFillTexture() {
        //需要注意，调用clear方法会清除当前节点上的所有Graphics绘图（不含子节点），如果不想全部清，则需要把该不需要清除的Graphics绘图放到其它节点上。
        this.graphics.clear();
        let _texture = Laya.loader.getRes(this.randomImg(true, 4));
        //重绘纹理
        this.graphics.fillTexture(_texture, 10, 325, 132, 306);
    }

    /** 替换Texture资源，基于Graphics绘图只能是重绘 */
    changeTexture() {
        //清除this._textureImg节点下的所有绘图（不含子节点）
        this._textureImg.graphics.clear();
        //加载资源获得一个纹理对象
        let _texture = Laya.loader.getRes(this.randomImg(true, 8, 7));
        //在this._textureImg节点上重绘纹理
        this._textureImg.graphics.drawTexture(_texture);
    }

    /** 生成随意图片地址 */
    randomImg(isMan = false, max = 8, min = 1) {
        let mum = Math.floor(Math.random() * (max - min + 1)) + min;
        if (isMan)
            return "role/m" + mum + ".png";
        return "role/w" + mum + ".png";
    }
    onDisable() {}
}