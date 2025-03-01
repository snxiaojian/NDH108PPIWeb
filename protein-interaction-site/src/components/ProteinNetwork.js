import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import { API_BASE_URL } from '../config';
import ProteinNetworkGraph from './ProteinNetworkGraph';

function ProteinNetwork({ centerProtein, onSelectProtein }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [showTable, setShowTable] = useState(false);

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 只在选择了蛋白质时才获取数据
        if (!centerProtein) {
          setData(null);
          setLoading(false);
          return;
        }

        const url = `${API_BASE_URL}/interactions?proteinId=${centerProtein}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        
        if (!result || !Array.isArray(result.interactions)) {
          throw new Error('Invalid data format');
        }
        
        const validData = result.interactions.filter(item => 
          item && 
          typeof item.protein1 === 'string' && 
          typeof item.protein2 === 'string' && 
          typeof item.score === 'string'
        );
        
        // 根据互作数量决定展示方式
        setShowTable(result.total > 50);
        setData(validData);
      } catch (err) {
        setError(err.message);
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [centerProtein]);

  if (!centerProtein) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        p: 3
      }}>
        <img 
          src="/protein-network.svg" 
          alt="蛋白质网络示意图"
          style={{ 
            width: '200px', 
            height: '200px',
            marginBottom: '24px',
            opacity: 0.6
          }}
        />
        <Typography variant="h6" color="text.secondary" align="center" gutterBottom>
          请搜索或选择一个蛋白质
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          在上方搜索框输入蛋白质ID，或点击示例蛋白质进行查看
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        minHeight: '400px'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (showTable && data) {
    return (
      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>蛋白质1</TableCell>
              <TableCell>蛋白质2</TableCell>
              <TableCell>互作分数</TableCell>
              <TableCell>互作类型</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow 
                key={index}
                hover
                onClick={() => {
                  const protein = row.protein1 === centerProtein ? row.protein2 : row.protein1;
                  onSelectProtein(protein);
                }}
                sx={{ 
                  cursor: 'pointer',
                  backgroundColor: (row.protein1 === centerProtein || row.protein2 === centerProtein) ? 
                    'rgba(233, 30, 99, 0.1)' : 'inherit'
                }}
              >
                <TableCell>{row.protein1}</TableCell>
                <TableCell>{row.protein2}</TableCell>
                <TableCell>{row.score}</TableCell>
                <TableCell>
                  {parseFloat(row.score) === 1 ? '实验验证' : '预测互作'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '600px', width: '100%' }}>
      {data && (
        <ProteinNetworkGraph
          data={data}
          centerProtein={centerProtein}
          onSelectProtein={onSelectProtein}
        />
      )}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
}

export default ProteinNetwork;
