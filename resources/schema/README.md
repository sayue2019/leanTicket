说明：

*  _schema.json         Schema 定义文件
*  _permissions.json    Class 权限定义文件
*  _indexes.json        索引定义文件，仅限唯一索引
*  _all.json  上述三项元信息的合集

用户可以分别导入上面的三项元信息，也可以使用  all 文件一起导入。

Ticket结构在新增工单后无法自增nid字段，导致新建工单后返回nid一直为null

按leanCloud提示添加了一个nid唯一索引，如果你部署完也遇到跟我一样的问题，请将Ticket_new.json导入为Ticket