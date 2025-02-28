import React, { useState } from 'react';
import { Box, Container, Grid, TextField, Button, Typography } from '@mui/material';
import ProteinNetwork from './ProteinNetwork';
import ProteinDetails from './ProteinDetails';

function App() {
  const [selectedProtein, setSelectedProtein] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={8}>
            <TextField
              fullWidth
              label="Search Protein"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setSelectedProtein(searchTerm);
                }
              }}
              sx={{ mb: 2 }}
            />
            <Button 
              variant="contained" 
              onClick={() => setSelectedProtein(searchTerm)}
              sx={{ mb: 2 }}
            >
              Search
            </Button>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Examples:
              {[
                'NDH07G27970.1',
                'NDH05G05590.1', 
                'NDH10G04270.1',
                'NDH18G16570.1',
                'NDH10G01520.1',
                'NDH09G31440.1'
              ].map((id) => (
                <span 
                  key={id}
                  onClick={() => {
                    setSearchTerm(id);
                    setSelectedProtein(id);
                  }}
                  style={{
                    cursor: 'pointer',
                    margin: '0 4px',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    backgroundColor: '#e3f2fd',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#bbdefb',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  {id}
                </span>
              ))}
            </Typography>
            {selectedProtein && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                Showing results for: <strong>{selectedProtein}</strong>
              </Typography>
            )}
            <ProteinNetwork 
              onSelectProtein={setSelectedProtein}
            />
          </Grid>
          <Grid item xs={4}>
            <ProteinDetails protein={selectedProtein} />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default App;
