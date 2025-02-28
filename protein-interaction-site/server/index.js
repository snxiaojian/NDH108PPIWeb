const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const csv = require('csv');

const app = express();
const PORT = 5000;

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 解析TSV文件
const parseTSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv.parse({ delimiter: '\t', columns: true }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

// 获取蛋白质互作数据
app.get('/api/interactions', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../reason_result_NDH108_conbined.tsv');
    const data = await parseTSV(filePath);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取蛋白质详细信息
app.get('/api/protein/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(__dirname, '../../NDH108.protmap.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const protein = data.find(p => p.id === id);
    
    if (protein) {
      res.json(protein);
    } else {
      res.status(404).json({ error: 'Protein not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, '../../protein-interaction-site/build')));

// 客户端路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../protein-interaction-site/build/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
