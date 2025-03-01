const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const csv = require('csv');

const app = express();
const PORT = 5001;

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 解析TSV文件
const parseTSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv.parse({ 
        delimiter: '\t', 
        columns: ['protein1', 'protein2', 'score'],
        skip_empty_lines: true,
        from_line: 2 // 跳过标题行
      }))
      .on('data', (data) => {
        if (data.protein1 && data.protein2 && data.score) {
          results.push({
            protein1: data.protein1.trim(),
            protein2: data.protein2.trim(),
            score: data.score.trim()
          });
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

// 获取蛋白质互作数据
app.get('/api/interactions', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../..', 'reason_result_NDH108_conbined.tsv');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Data file not found' });
    }
    const data = await parseTSV(filePath);
    
    // 如果指定了蛋白质ID，则只返回相关的互作
    const proteinId = req.query.proteinId;
    if (proteinId) {
      const relevantData = data.filter(interaction => 
        interaction.protein1 === proteinId || interaction.protein2 === proteinId
      );
      return res.json({
        total: relevantData.length,
        interactions: relevantData
      });
    }
    
    res.json({
      total: data.length,
      interactions: data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取蛋白质详细信息
app.get('/api/protein/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(__dirname, '../..', 'NDH108.protmap.json');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Protein data file not found' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const protein = data[id];
    
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
app.use(express.static(path.join(__dirname, '../build')));

// 客户端路由处理
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
