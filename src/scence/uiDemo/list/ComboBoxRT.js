import { ComboBoxUI } from "../../../ui/layaMaxUI";
export default class ComboBoxRT extends ComboBoxUI {
    constructor() { super(); }
    onEnable() {
        //模拟list数据
        var _dataSourece = this.getDataSourece();
        // console.log(_dataSourece);
        Laya.loader.create("prefab/comboList.prefab", Laya.Handler.create(this, () => {
            //拿到json数据并创建一个对象
            this.comboList = (Laya.loader.getRes("prefab/comboList.prefab")).create();
            //修改数据源，这里用模拟数据替代
            this.comboList.array = _dataSourece;
            //列表数据长度
            this.comboList.repeatY = _dataSourece.length;
            //将自定义的List数据替换给下拉框自己创建的list
            this.combo2.list = this.comboList;
            this.combo2.list.width = this.combo2.width;
            this.combo2.selectHandler = new Laya.Handler(this, this.onSelected2);
        }));
        this.combo1.selectHandler = new Laya.Handler(this, this.onSelected1);
        // this.combo1.itemPadding = "20,5,5,25";
        // this.combo1.itemHeight = 70 ;
        // this.combo1.defaultLabel = "请选择下拉选项";
    }

    onSelected1(index) {
        this.selectedText.text = "您选中了：" + this.combo1.selectedLabel;
        // this.selectedText.text = "您选中了：" + this.combo1.list.array[index].label;
    }

    onSelected2(index) {
        this.selectedText.text = "您选中了：" + (index < 0 ? "" : this.comboList.array[index].label);
    }

    /**
     * 创建List用的模拟数据
     */
    getDataSourece() {
        for (var _data = [], i = 0; i < 10; i++) {
            _data[i] = { "optText": { "text": "选项" + (i + 1) } };
        }
        return _data;
    }
    onDisable() {}
}