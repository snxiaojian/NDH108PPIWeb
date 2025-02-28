import React, { useEffect, useState } from 'react';
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
  ListItemText
} from '@mui/material';
import { API_BASE_URL } from '../config';

function ProteinDetails({ protein }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        if (!response.ok) throw new Error('Failed to fetch protein details');
        const data = await response.json();
        setDetails(data);
      } catch (err) {
        setError(err.message);
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
          <Typography color="error" align="center">
            Error: {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!details) {
    return null;
  }

  const sections = [
    { key: 'Biological_process', label: 'Biological Process' },
    { key: 'Cellular_component', label: 'Cellular Component' },
    { key: 'Molecular_function', label: 'Molecular Function' },
    { key: 'KOG', label: 'KOG' },
    { key: 'K', label: 'K' },
    { key: 'KEGG_Pathways', label: 'KEGG Pathways' },
    { key: 'IPRs', label: 'IPRs' },
    { key: 'Subcellular_localization', label: 'Subcellular Localization' },
    { key: 'signalP', label: 'Signal P' }
  ];

  return (
    <Card sx={{ height: '100%', overflow: 'auto' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {protein}
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <List>
          {sections.map(({ key, label }) => (
            details[key] && (
              <ListItem key={key} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <ListItemText
                  primary={<Typography variant="subtitle2" color="primary">{label}</Typography>}
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {Array.isArray(details[key]) ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {details[key].map((item, index) => (
                            <Chip
                              key={index}
                              label={item}
                              size="small"
                              sx={{
                                backgroundColor: '#e3f2fd',
                                '&:hover': {
                                  backgroundColor: '#bbdefb'
                                }
                              }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2">{details[key]}</Typography>
                      )}
                    </Box>
                  }
                />
                <Divider sx={{ my: 1, width: '100%' }} />
              </ListItem>
            )
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default ProteinDetails;
