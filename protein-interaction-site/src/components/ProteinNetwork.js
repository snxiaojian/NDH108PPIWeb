import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { API_BASE_URL } from '../config';

// 添加节流函数
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// 添加防抖函数
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

function ProteinNetwork({ selectedProtein, onSelectProtein }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const dataRef = useRef(null);
  const nodesDataSet = useRef(null);
  const edgesDataSet = useRef(null);
  // 记录当前中心蛋白
  const centerProteinRef = useRef(null);

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 如果选中的蛋白质和当前中心蛋白相同，不需要重新获取数据
        if (selectedProtein === centerProteinRef.current) {
          return;
        }

        setLoading(true);
        setError(null);

        // 只在选择了蛋白质时才获取数据
        if (!selectedProtein) {
          setData(null);
          setLoading(false);
          return;
        }

        const url = `${API_BASE_URL}/interactions?proteinId=${selectedProtein}`;
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
        dataRef.current = validData;
        setData(validData);
        // 更新当前中心蛋白
        centerProteinRef.current = selectedProtein;
      } catch (err) {
        setError(err.message);
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedProtein]);

  // 清理函数
  const cleanupNetwork = useCallback(() => {
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }
    if (nodesDataSet.current) {
      nodesDataSet.current.clear();
      nodesDataSet.current = null;
    }
    if (edgesDataSet.current) {
      edgesDataSet.current.clear();
      edgesDataSet.current = null;
    }
  }, []);

  // 更新节点颜色
  const updateNodesColor = useCallback((clickedNodeId) => {
    if (!nodesDataSet.current || !networkRef.current) return;

    // 暂时禁用物理引擎
    networkRef.current.setOptions({ physics: { enabled: false } });

    // 保存所有节点的当前位置
    const positions = {};
    const allNodes = nodesDataSet.current.get();
    allNodes.forEach(node => {
      const position = networkRef.current.getPosition(node.id);
      positions[node.id] = position;
    });

    // 更新节点颜色
    allNodes.forEach(node => {
      nodesDataSet.current.update({
        id: node.id,
        color: node.id === centerProteinRef.current ? '#e91e63' : 
               node.id === clickedNodeId ? '#ff9800' :
               '#2B7CE9',
        x: positions[node.id].x,
        y: positions[node.id].y,
        fixed: true  // 固定节点位置
      });
    });
  }, []);

  // 初始化网络
  useEffect(() => {
    if (!data || !containerRef.current) return;

    cleanupNetwork();
    setError(null);

    try {
      nodesDataSet.current = new DataSet();
      edgesDataSet.current = new DataSet();
      const addedNodes = new Set();

      if (selectedProtein) {
        const relevantInteractions = data.filter(interaction => 
          interaction.protein1 === selectedProtein || 
          interaction.protein2 === selectedProtein
        );

        if (relevantInteractions.length === 0) {
          console.log('No interactions found for protein:', selectedProtein);
          setError(`未找到与蛋白质 ${selectedProtein} 相关的互作关系`);
          return;
        }

        relevantInteractions.forEach(interaction => {
          const { protein1, protein2, score } = interaction;
          
          if (!addedNodes.has(protein1)) {
            nodesDataSet.current.add({ 
              id: protein1, 
              label: protein1,
              color: protein1 === selectedProtein ? '#e91e63' : '#2B7CE9',
              font: { size: 14 }
            });
            addedNodes.add(protein1);
          }
          if (!addedNodes.has(protein2)) {
            nodesDataSet.current.add({ 
              id: protein2, 
              label: protein2,
              color: protein2 === selectedProtein ? '#e91e63' : '#2B7CE9',
              font: { size: 14 }
            });
            addedNodes.add(protein2);
          }

          edgesDataSet.current.add({
            from: protein1,
            to: protein2,
            width: Math.max(parseFloat(score) * 3, 1),
            color: parseFloat(score) === 1 ? '#ff0000' : '#999999',
            title: `Score: ${score}`
          });
        });
      }

      const options = {
        nodes: {
          shape: 'dot',
          size: 20,
          font: {
            size: 14,
            color: '#333333',
            face: 'arial'
          },
          borderWidth: 2,
          shadow: true,
          fixed: {
            x: false,
            y: false
          }
        },
        edges: {
          smooth: {
            type: 'continuous',
            forceDirection: 'none'
          },
          shadow: true
        },
        physics: {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 200,
            updateInterval: 50,
            fit: true
          },
          barnesHut: {
            gravitationalConstant: -1000,
            centralGravity: 0.1,
            springLength: 150,
            springConstant: 0.02,
            damping: 0.09
          },
          maxVelocity: 50,
          minVelocity: 0.1,
          solver: 'barnesHut',
          timestep: 0.5
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          hideEdgesOnDrag: true,
          hideEdgesOnZoom: true,
          dragView: true,
          zoomView: true,
          selectConnectedEdges: false,
          multiselect: false,
          navigationButtons: false,
          keyboard: false,
          zoomSpeed: 0.5
        }
      };

      networkRef.current = new Network(
        containerRef.current, 
        { 
          nodes: nodesDataSet.current, 
          edges: edgesDataSet.current 
        }, 
        options
      );

      // 等待网络稳定后再允许点击
      networkRef.current.once('stabilized', () => {
        // 使用节流处理点击事件
        const handleNodeClick = throttle((params) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            if (nodeId !== centerProteinRef.current) {
              // 更新节点颜色
              updateNodesColor(nodeId);
              // 通知父组件更新详情
              onSelectProtein(nodeId);
            }
          }
        }, 300);

        networkRef.current.on('click', handleNodeClick);
      });

      // 使用防抖处理调整大小
      const handleResize = debounce(() => {
        if (networkRef.current) {
          networkRef.current.fit();
        }
      }, 250);

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        cleanupNetwork();
      };
    } catch (error) {
      console.error('Error creating network:', error);
      setError(error.message);
      cleanupNetwork();
    }
  }, [data, selectedProtein, onSelectProtein, cleanupNetwork, updateNodesColor]);

  if (!selectedProtein) {
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

  if (error && !selectedProtein) {
    setError(null);
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
                  const protein = row.protein1 === centerProteinRef.current ? row.protein2 : row.protein1;
                  onSelectProtein(protein);
                }}
                sx={{ 
                  cursor: 'pointer',
                  backgroundColor: (row.protein1 === centerProteinRef.current || row.protein2 === centerProteinRef.current) ? 
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
      <Box ref={containerRef} sx={{ 
        height: '100%', 
        width: '100%',
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'hidden'
      }} />
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
