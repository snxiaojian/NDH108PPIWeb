import pandas as pd

# 读取Excel文件
df = pd.read_excel('NDH108.protmap.xlsx')

# 将Accession列设为索引
df.set_index('Accession', inplace=True)

# 转换为JSON并保存
df.to_json('NDH108.protmap.json', orient='index', force_ascii=False)
