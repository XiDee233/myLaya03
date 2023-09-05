import { BagListUI } from "../../../ui/layaMaxUI";
/**
 * 背包列表示例
 * @readme 重点示范列表的单元格选项切换处理与对应值的提取
 */
export default class BagListRT extends BagListUI {
    constructor() {
        super();
        this.lastIndex = -1;
    }
    onEnable() {
        Laya.loader.create("json/bagList.json", Laya.Handler.create(this, () => {
            //获取模拟list数据的json文件，文件要提前加载好
            let _json = Laya.loader.getRes("json/bagList.json");
            if (_json.bagList && _json.bagList.length > 0) {
                //把json数据传递给list组件的数据源属性array,当数据源符合ui组件属性规则时，可直接作为默认初始值。不符合时，可通过renderHandler自定义修改。
                this.bagList.array = _json.bagList;
                //绑定list渲染单元处理方法，自定义list的渲染单元数据
                this.bagList.renderHandler = new Laya.Handler(this, this.onListRender);
                //绑定list选项改变的切换
                this.bagList.selectHandler = new Laya.Handler(this, this.onListSelect);
                //绑定单元格的鼠标事件
                this.bagList.mouseHandler = new Laya.Handler(this, this.onListMouse);
            }
        }));
    }

    /** 列表单元的渲染处理 */
    onListRender(item, index) {
        //如果当前索引不在数据源可索引范围，则跳出
        if (index > this.bagList.array.length || index < 0)
            return;
        // (item.getChildByName("listItemBG") as Laya.Image).skin = "bg/bg100-0.png";
    }

    /**列表选择改变处理
     * @readme 这里是为了示范怎么在选项切换里处理数据的变化，故意采用了自定义的方式处理选中状态切换。
     * 如果只是为了列表单元的选中状态切换， 引擎里提供了更简单的设置方式：将选中态ui的name设置为selectBox。
     * 简单方式，可参照拉动刷新列表的示例。
     */
    onListSelect(index) {
        this.tips.visible = true;
        //获取当前选择的渲染单元对象
        this.bagList.array[index].listItemBG = { "skin": "bg/bg100-1.png" };
        // console.log(this.bagList.getItem(index), this.bagList.array);
        if (this.lastIndex !== -1) {
            //获取指定索引的对象（仅可获取可见对象）
            this.bagList.array[this.lastIndex].listItemBG = { "skin": "bg/bg100-0.png" };
        }
        //重置上次选择的索引
        this.lastIndex = index;
        //选中的数据显示
        this.itemImg.skin = this.bagList.array[index].listItemImg.skin;
        this.itemNumber.changeText("数量 " + this.bagList.array[index].listItemNumber.text);
        this.itemReadme.text = this.bagList.array[index].readme;
    }

    /**列表单元上的鼠标事件处理 */
    onListMouse(e, index) {
        //鼠标单击事件触发
        // if (e.type == Laya.Event.MOUSE_DOWN) {
        //     // console.log("事件目标", e.target);
        //     (e.target as Laya.Image).skin = "bg/bg100-1.png"; 
        // }
    }

    onDisable() {}
}