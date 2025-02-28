import React from 'react';
import { Box, Typography, Paper, Divider, Fade } from '@mui/material';

function ProteinDetails({ protein }) {
  if (!protein) {
    return (
      <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" color="textSecondary">
          Please select a protein to view details
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Fade in={true} timeout={500}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {protein.id}
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Sequence</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-word', fontFamily: 'monospace' }}>
              {protein.sequence}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Biological Process</Typography>
            <Typography variant="body2">
              {protein.Biological_process || 'No information'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Cellular Component</Typography>
            <Typography variant="body2">
              {protein.Cellular_component || 'No information'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Molecular Function</Typography>
            <Typography variant="body2">
              {protein.Molecular_function || 'No information'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>KOG Classification</Typography>
            <Typography variant="body2">
              {protein.KOG || 'No information'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>KEGG Pathways</Typography>
            <Typography variant="body2">
              {protein.KEGG_Pathways || 'No information'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>IPRs</Typography>
            <Typography variant="body2">
              {protein.IPRs || 'No information'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Subcellular Localization</Typography>
            <Typography variant="body2">
              {protein.Subcellular_localization || 'No information'}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Signal Peptide</Typography>
            <Typography variant="body2">
              {protein.signalP || 'No information'}
            </Typography>
          </Box>

          {/* Tag container */}
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mt: 2
          }}>
            {protein.KEGG_Pathways && (
              <Box sx={{
                bgcolor: 'primary.light',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}>
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                  KEGG Pathway: {protein.KEGG_Pathways}
                </Typography>
              </Box>
            )}
            {protein.Subcellular_localization && (
              <Box sx={{
                bgcolor: 'secondary.light',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}>
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                  Subcellular Localization: {protein.Subcellular_localization}
                </Typography>
              </Box>
            )}
            {protein.signalP && (
              <Box sx={{
                bgcolor: 'warning.light',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}>
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                  Signal Peptide: {protein.signalP}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Fade>
    </Paper>
  );
}

export default ProteinDetails;
