import React, { useEffect, useRef, memo, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { Box } from '@mui/material';

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

const ProteinNetworkGraph = memo(({ data, centerProtein: initialCenterProtein, onSelectProtein }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const nodesDataSet = useRef(null);
  const edgesDataSet = useRef(null);
  const currentCenterProtein = useRef(initialCenterProtein);
  const initialDataRef = useRef(data);

  // 创建稳定的点击事件处理函数
  const handleNodeClick = useCallback((params) => {
    console.log('Node clicked:', params);
    if (networkRef.current) {
      const nodeId = networkRef.current.getNodeAt(params.pointer.DOM);
      console.log('Found node at click position:', nodeId);
      if (nodeId && nodeId !== currentCenterProtein.current) {
        console.log('Calling onSelectProtein with:', nodeId);
        onSelectProtein(nodeId);
      }
    }
  }, [onSelectProtein]);

  // 清理函数
  const cleanupNetwork = useCallback(() => {
    if (networkRef.current) {
      networkRef.current.off('click'); // 移除点击事件监听
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

  // 初始化网络 - 只在组件首次加载时执行
  useEffect(() => {
    initialDataRef.current = data;
    if (!data || !containerRef.current) return;

    console.log('Setting up network with initial data');
    cleanupNetwork();

    try {
      nodesDataSet.current = new DataSet();
      edgesDataSet.current = new DataSet();
      const addedNodes = new Set();

      const relevantInteractions = data.filter(interaction => 
        interaction.protein1 === currentCenterProtein.current || 
        interaction.protein2 === currentCenterProtein.current
      );

      if (relevantInteractions.length === 0) {
        console.log('No interactions found for protein:', currentCenterProtein.current);
        return;
      }

      relevantInteractions.forEach(interaction => {
        const { protein1, protein2, score } = interaction;
        
        if (!addedNodes.has(protein1)) {
          nodesDataSet.current.add({ 
            id: protein1, 
            label: protein1,
            color: protein1 === currentCenterProtein.current ? '#e91e63' : '#2B7CE9',
            font: { size: 14 }
          });
          addedNodes.add(protein1);
        }
        if (!addedNodes.has(protein2)) {
          nodesDataSet.current.add({ 
            id: protein2, 
            label: protein2,
            color: protein2 === currentCenterProtein.current ? '#e91e63' : '#2B7CE9',
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
          scaling: {
            min: 20,
            max: 20
          },
          chosen: {
            node: function(values, id, selected, hovering) {
              values.size = 25;
            }
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
            iterations: 1000,
            updateInterval: 100,
            fit: true,
            onlyDynamicEdges: false,
            default: true
          },
          barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.3,
            springLength: 200,
            springConstant: 0.04,
            damping: 0.09,
            avoidOverlap: 1
          },
          maxVelocity: 30,
          minVelocity: 0.75,
          solver: 'barnesHut',
          timestep: 0.3
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          hideEdgesOnDrag: true,
          hideEdgesOnZoom: true,
          dragView: true,
          zoomView: true,
          selectable: false,
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

      // 直接绑定点击事件，不等待稳定
      const throttledClick = throttle(handleNodeClick, 300);
      networkRef.current.on('click', throttledClick);
      console.log('Click event handler attached');

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
      cleanupNetwork();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组，只在组件首次加载时执行

  return (
    <Box ref={containerRef} sx={{ 
      height: '100%', 
      width: '100%',
      border: '1px solid #ddd',
      borderRadius: '4px',
      overflow: 'hidden'
    }} />
  );
});

export default ProteinNetworkGraph; 