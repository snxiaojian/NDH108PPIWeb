我要写一个蛋白质互作展示的网站，
内容来源为：
expressed_NDH108.fasta
这是蛋白质id与序列
reason_result_NDH108_conbined.tsv
这是蛋白质互作文件 有三列，第一列 第二列为蛋白质id，第三列为 score
score为1则是实验获得的互作，score小于1为预测的互作。
NDH108.protmap.json
这是蛋白质的更详细的信息，包括 Biological process	Cellular component	Molecular function	KOG	K	KEGG_Pathways	IPRs	Subcellular_localization	signalP 这些key的信息。
直接按照这些key来展示，不需要翻译为中文。
这些文件都在项目根目录里，文件都非常大，不要想办法读取这些文件。
展示的好看一些，最好有一些动画效果，可以搜索，搜索后能看到与其互作的蛋白，鼠标点击蛋白后可以在右边展示这个蛋白的详细信息。
搜索的下面有一些例子，可以直接点击并自动执行搜索

看看目前的实现还有哪些没有做到，没做到的现在去完善 