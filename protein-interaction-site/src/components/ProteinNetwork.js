import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { API_BASE_URL } from '../config';

function ProteinNetwork({ onSelectProtein }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/interactions`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 初始化网络
  useEffect(() => {
    if (!data || !containerRef.current) return;

    const nodes = new DataSet();
    const edges = new DataSet();
    const addedNodes = new Set();

    data.forEach(interaction => {
      const { protein1, protein2, score } = interaction;
      
      if (!addedNodes.has(protein1)) {
        nodes.add({ id: protein1, label: protein1 });
        addedNodes.add(protein1);
      }
      if (!addedNodes.has(protein2)) {
        nodes.add({ id: protein2, label: protein2 });
        addedNodes.add(protein2);
      }

      edges.add({
        from: protein1,
        to: protein2,
        width: parseFloat(score) * 2,
        color: parseFloat(score) === 1 ? '#ff0000' : '#999999'
      });
    });

    const options = {
      nodes: {
        shape: 'dot',
        size: 16,
        font: {
          size: 12,
          color: '#333333'
        },
        borderWidth: 2,
        color: {
          background: '#ffffff',
          border: '#2B7CE9'
        }
      },
      edges: {
        smooth: {
          type: 'continuous'
        }
      },
      physics: {
        stabilization: true,
        barnesHut: {
          gravitationalConstant: -80000,
          springConstant: 0.001,
          springLength: 200
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200
      }
    };

    // 清理旧的网络实例
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    // 创建新的网络实例
    const network = new Network(containerRef.current, { nodes, edges }, options);
    
    // 添加事件监听器
    network.on('selectNode', (params) => {
      if (params.nodes.length > 0) {
        onSelectProtein(params.nodes[0]);
      }
    });

    networkRef.current = network;

    // 清理函数
    return () => {
      if (networkRef.current) {
        try {
          networkRef.current.destroy();
          networkRef.current = null;
        } catch (e) {
          console.error('Error destroying network:', e);
        }
      }
    };
  }, [data, onSelectProtein]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="500px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="500px" color="error.main">
        Error: {error}
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '500px',
        border: '1px solid #ddd',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    />
  );
}

export default ProteinNetwork;
