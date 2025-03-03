import pandas as pd
import json
import re

def clean_gene_count(value):
    """Clean gene count values to extract numeric counts"""
    if pd.isna(value):
        return "N/A"
    if isinstance(value, (int, float)):
        return str(int(value))
    # Extract first number from text descriptions
    match = re.search(r'\d+', str(value))
    return str(match.group(0)) if match else "N/A"

# 读取 Excel 文件
df = pd.read_excel('family 2.13(1).xlsx')

# 清理基因数量列
df['Gene Count'] = df['Gene Count'].apply(clean_gene_count)

# 转换为 JSON 格式
json_data = df.to_json(orient='records', force_ascii=False)

# 写入 data.js 文件
with open('data.js', 'w', encoding='utf-8') as f:
    f.write(f'const geneData = {json_data};')
