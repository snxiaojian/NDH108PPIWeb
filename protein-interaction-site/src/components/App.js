import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Paper,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ProteinNetwork from './ProteinNetwork';
import ProteinDetails from './ProteinDetails';

function App() {
  // centerProtein 控制互作网络的中心蛋白
  const [centerProtein, setCenterProtein] = useState(null);
  // detailProtein 控制右侧详情面板显示的蛋白质
  const [detailProtein, setDetailProtein] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchError, setSearchError] = useState(null);

  const handleSearch = () => {
    if (!searchTerm) {
      setSearchError('请输入蛋白质ID');
      return;
    }
    
    if (!searchTerm.startsWith('NDH')) {
      setSearchError('请输入有效的蛋白质ID（以NDH开头）');
      return;
    }

    setSearchError(null);
    // 搜索时更新两个状态
    setCenterProtein(searchTerm.trim());
    setDetailProtein(searchTerm.trim());
  };

  // 处理蛋白质点击，只更新详情面板
  const handleProteinSelect = (proteinId) => {
    setDetailProtein(proteinId);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const exampleProteins = [
    'NDH07G27970.1',
    'NDH05G05590.1', 
    'NDH10G04270.1',
    'NDH18G16570.1',
    'NDH10G01520.1',
    'NDH09G31440.1'
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      py: 4
    }}>
      <Container maxWidth="xl">
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
            蛋白质互作网络可视化
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            本系统展示了蛋白质之间的互作关系。红色连线表示实验验证的互作（score=1），灰色连线表示预测的互作（score＜1）。
            点击节点可查看蛋白质的详细信息。
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="输入蛋白质ID"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSearchError(null);
                  }}
                  onKeyPress={handleKeyPress}
                  error={!!searchError}
                  helperText={searchError}
                  placeholder="例如: NDH07G27970.1"
                  size="medium"
                />
                <Button 
                  variant="contained" 
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                  sx={{ minWidth: '120px' }}
                >
                  搜索
                </Button>
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                示例蛋白质ID:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {exampleProteins.map((id) => (
                  <Chip
                    key={id}
                    label={id}
                    onClick={() => {
                      setSearchTerm(id);
                      handleSearch();
                    }}
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'white'
                      }
                    }}
                  />
                ))}
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 3 }}>
              <ProteinNetwork 
                selectedProtein={centerProtein} 
                onSelectProtein={handleProteinSelect}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, height: '100%' }}>
              <ProteinDetails protein={detailProtein} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;
