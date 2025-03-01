import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  Link
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import { API_BASE_URL } from '../config';

const StyledSection = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const StyledChip = styled(Chip)(({ theme, color }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: color,
  '&:hover': {
    backgroundColor: color,
    filter: 'brightness(0.95)'
  },
  transition: 'all 0.2s ease'
}));

const ClickableContent = memo(({ type, content }) => {
  const getLink = (type, value) => {
    switch (type) {
      case 'K':
        return `https://www.genome.jp/dbget-bin/www_bget?${value}`;
      case 'IPRs':
        return `https://www.ebi.ac.uk/interpro/entry/${value}`;
      case 'KOG':
        return `https://www.ncbi.nlm.nih.gov/research/cog/kog/${value}`;
      case 'KEGG_Pathways':
        // 不移除ko前缀，直接使用完整的pathway ID
        return `https://www.genome.jp/pathway/${value}`;
      default:
        return null;
    }
  };

  const LinkComponent = ({ id, type }) => (
    <Link 
      href={getLink(type, id)} 
      target="_blank" 
      rel="noopener noreferrer"
      sx={{ 
        color: 'primary.main', 
        textDecoration: 'none', 
        '&:hover': { 
          textDecoration: 'underline',
          opacity: 0.8 
        },
        fontWeight: 500
      }}
    >
      {id}
    </Link>
  );

  const renderLink = (text, type) => {
    if (type === 'KEGG_Pathways') {
      // 对于KEGG通路，先检查是否包含分号
      if (text.includes(';')) {
        const pathways = text.split(';').map(p => p.trim());
        return (
          <>
            {pathways.map((pathway, index) => {
              const keggMatch = pathway.match(/^(ko\d+):\s*(.+)$/);
              return (
                <React.Fragment key={index}>
                  {keggMatch ? (
                    <>
                      <LinkComponent id={keggMatch[1]} type={type} />
                      {`: ${keggMatch[2]}`}
                    </>
                  ) : (
                    renderLink(pathway, type)
                  )}
                  {index < pathways.length - 1 && <span>; </span>}
                </React.Fragment>
              );
            })}
          </>
        );
      }
      
      // 单个KEGG通路的处理
      const keggMatch = text.match(/^(ko\d+):\s*(.+)$/);
      if (keggMatch) {
        return (
          <>
            <LinkComponent id={keggMatch[1]} type={type} />
            {`: ${keggMatch[2]}`}
          </>
        );
      }
    }

    // 处理其他 ID (K00487, IPR036396 等)
    const parts = [];
    let lastIndex = 0;
    const regex = /(K\d+|IPR\d+|KOG\d+|ko\d+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const id = match[0];
      const currentType = id.startsWith('ko') ? 'KEGG_Pathways' : type;
      const link = getLink(currentType, id);
      
      if (link) {
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(<LinkComponent key={match.index} id={id} type={currentType} />);
        lastIndex = match.index + id.length;
      }
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  if (!content) return null;

  if (Array.isArray(content)) {
    return content.map((item, index) => {
      // 处理分号分隔的多个条目
      if (type === 'KEGG_Pathways' && item.includes(';')) {
        const pathways = item.split(';').map(p => p.trim());
        return (
          <Typography key={index} variant="body2">
            {pathways.map((pathway, pIndex) => (
              <React.Fragment key={pIndex}>
                <Box component="span">
                  {renderLink(pathway, type)}
                </Box>
                {pIndex < pathways.length - 1 && (
                  <Box component="span" sx={{ mx: 0.5 }}>;</Box>
                )}
              </React.Fragment>
            ))}
          </Typography>
        );
      }
      
      return (
        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
          • {renderLink(item, type)}
        </Typography>
      );
    });
  }

  return (
    <Typography variant="body2">
      {renderLink(content, type)}
    </Typography>
  );
});

const DetailItem = memo(({ label, content, color, icon, expanded, onToggle, sectionKey }) => {
  if (!content || (Array.isArray(content) && content.length === 0)) {
    return null;
  }

  return (
    <StyledSection>
      <ListItem 
        button 
        onClick={onToggle}
        sx={{ 
          backgroundColor: color,
          borderRadius: 1,
          mb: 1
        }}
      >
        <ListItemText
          primary={
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {icon} {label}
            </Typography>
          }
        />
      </ListItem>
      <Collapse in={expanded}>
        <Box sx={{ pl: 2 }}>
          <ClickableContent type={sectionKey} content={content} />
        </Box>
      </Collapse>
    </StyledSection>
  );
});

function ProteinDetails({ protein }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const sections = [
    { key: 'Biological_process', label: 'Biological Process', color: '#e3f2fd', icon: '🧬' },
    { key: 'Cellular_component', label: 'Cellular Component', color: '#e8f5e9', icon: '🔬' },
    { key: 'Molecular_function', label: 'Molecular Function', color: '#fff3e0', icon: '⚛️' },
    { key: 'KOG', label: 'KOG (Eukaryotic Orthologous Groups)', color: '#f3e5f5', icon: '📊' },
    { key: 'K', label: 'K (KEGG Orthology)', color: '#e8eaf6', icon: '🔑' },
    { key: 'KEGG_Pathways', label: 'KEGG Pathways (Kyoto Encyclopedia of Genes and Genomes)', color: '#fbe9e7', icon: '🛣️' },
    { key: 'IPRs', label: 'IPRs (InterPro Protein Domains)', color: '#e0f2f1', icon: '🔍' },
    { key: 'Subcellular_localization', label: 'Subcellular Localization', color: '#f9fbe7', icon: '📍' },
    { key: 'signalP', label: 'Signal P (Signal Peptide Prediction)', color: '#efebe9', icon: '📡' }
  ];

  const toggleSection = useCallback((key) => {
    setExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  useEffect(() => {
    if (!protein) {
      setDetails(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/protein/${protein}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`未找到蛋白质 ${protein} 的详细信息`);
          }
          throw new Error('获取蛋白质详情失败，请稍后重试');
        }
        const data = await response.json();
        if (!data || Object.keys(data).length === 0) {
          throw new Error(`蛋白质 ${protein} 暂无详细信息`);
        }
        setDetails(data);
        // 初始化展开状态
        const initialExpanded = {};
        Object.keys(data).forEach(key => {
          initialExpanded[key] = true;
        });
        setExpanded(initialExpanded);
      } catch (err) {
        setError(err.message);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [protein]);

  if (!protein) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            请选择一个蛋白质查看详细信息
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!details) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="info">
            未找到该蛋白质的详细信息
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', overflow: 'auto' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary" sx={{ 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {protein}
          <Tooltip title="点击各部分标题可展开/收起内容">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <List sx={{ p: 0 }}>
          {sections.map(({ key, label, color, icon }) => (
            <DetailItem
              key={key}
              label={label}
              content={details[key]}
              color={color}
              icon={icon}
              expanded={expanded[key]}
              onToggle={() => toggleSection(key)}
              sectionKey={key}
            />
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default memo(ProteinDetails);
