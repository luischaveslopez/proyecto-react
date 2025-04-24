import { useTheme } from '@mui/material/styles'; // Import useTheme from Material-UI

const DiscoverySidebar = () => {
  const theme = useTheme(); // Use the theme object from Material-UI

  return (
    <Box sx={{ width: '100%', maxWidth: 360 }}>
      {/* Suggested Friends */}
      <Card 
        sx={{ 
          mb: 2,
          borderRadius: 2,
          boxShadow: theme.shadows[2] // Use theme.shadows
        }}
      >
        {/* ...existing code... */}
      </Card>

      {/* Trending Posts */}
      <Card 
        sx={{ 
          mb: 2,
          borderRadius: 2,
          boxShadow: theme.shadows[2] // Use theme.shadows
        }}
      >
        {/* ...existing code... */}
      </Card>

      {/* Popular Games */}
      <Card 
        sx={{ 
          borderRadius: 2,
          boxShadow: theme.shadows[2] // Use theme.shadows
        }}
      >
        {/* ...existing code... */}
      </Card>
    </Box>
  );
};