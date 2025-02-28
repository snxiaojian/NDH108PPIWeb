import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CircularProgress, Typography } from '@mui/material';

function ProteinNetwork({ onSelectProtein }) {
  const svgRef = useRef(null);
  const [data, setData] = useState({
    nodes: [],
    links: []
  });
  const [loading, setLoading] = useState(true);
  const [svgDimensions, setSvgDimensions] = useState({
    width: 800,
    height: 600
  });

  // Transform interaction data into graph data
  const transformData = (interactions) => {
    const nodesMap = new Map();
    const links = [];
    
    // Process interaction data
    interactions.forEach(interaction => {
      const source = interaction['Protein 1'];
      const target = interaction['Protein 2'];
      const score = parseFloat(interaction.Score);
      
      // Add nodes
      if (!nodesMap.has(source)) {
        nodesMap.set(source, { id: source });
      }
      if (!nodesMap.has(target)) {
        nodesMap.set(target, { id: target });
      }
      
      // Add links
      links.push({
        source,
        target,
        value: score
      });
    });
    
    return {
      nodes: Array.from(nodesMap.values()),
      links
    };
  };

  // Load interaction data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/interactions');
        const interactions = await response.json();
        const graphData = transformData(interactions);
        setData(graphData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch interactions:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;

    const svg = d3.select(svgRef.current);

    // Set SVG dimensions
    svg.attr('width', svgDimensions.width)
       .attr('height', svgDimensions.height)
       .style('transition', 'all 0.3s ease');

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(svgDimensions.width / 2, svgDimensions.height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', d => d.value === 1 ? '#1976d2' : '#999')
      .attr('stroke-opacity', d => d.value === 1 ? 1 : 0.6)
      .attr('stroke-width', d => d.value === 1 ? 2 : Math.sqrt(d.value || 1))
      .attr('stroke-dasharray', d => d.value === 1 ? null : '2,2');

    // Create nodes
    const node = svg.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', 8)
      .attr('fill', '#1976d2')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('click', (event, d) => {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 16)
          .transition()
          .duration(200)
          .attr('r', 8);
        onSelectProtein(d.id);
      })
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', 12)
          .attr('fill', '#ff7f0e');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', 8)
          .attr('fill', '#1976d2');
      });

    // Add node labels
    const label = svg.append('g')
      .selectAll('text')
      .data(data.nodes)
      .join('text')
      .text(d => d.id)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', '.35em');

    // Animate updates
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    // Drag event handlers
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [data, svgDimensions.width, svgDimensions.height, loading]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading protein interactions...
          </Typography>
        </Box>
      )}
      <svg 
        ref={svgRef}
        style={{ 
          width: svgDimensions.width, 
          height: svgDimensions.height,
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          opacity: loading ? 0.3 : 1
        }}
      ></svg>
    </Box>
  );
}

export default ProteinNetwork;
