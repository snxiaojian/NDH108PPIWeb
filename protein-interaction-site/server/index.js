const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const csv = require('csv');
const readline = require('readline');

const app = express();
const PORT = 5001;

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 解析FASTA文件
const parseFasta = async (filePath) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentHeader = '';
  let currentSequence = '';
  const sequences = {};

  for await (const line of rl) {
    if (line.startsWith('>')) {
      // 如果已经有序列在处理中，保存它
      if (currentHeader && currentSequence) {
        sequences[currentHeader] = currentSequence;
      }
      // 提取序列ID（去除>符号并只取第一个空格前的内容）
      currentHeader = line.slice(1).split(' ')[0].trim();
      currentSequence = '';
    } else {
      // 将序列行添加到当前序列中
      currentSequence += line.trim();
    }
  }

  // 保存最后一个序列
  if (currentHeader && currentSequence) {
    sequences[currentHeader] = currentSequence;
  }

  return sequences;
};

// 缓存解析后的序列数据
let sequencesCache = null;

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
    const filePath = path.join(__dirname, 'data', 'reason_result_NDH108_conbined.tsv');
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
    const filePath = path.join(__dirname, 'data', 'NDH108.protmap.json');
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

// 获取蛋白质序列信息
app.get('/api/protein/:id/sequence', async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(__dirname, 'data', 'expressed_NDH108.fasta');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Sequence data file not found' });
    }

    // 如果缓存中没有数据，则解析文件
    if (!sequencesCache) {
      sequencesCache = await parseFasta(filePath);
    }

    const sequence = sequencesCache[id];
    
    if (sequence) {
      res.json({ id, sequence });
    } else {
      res.status(404).json({ error: 'Sequence not found' });
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
