import { useState, useEffect } from 'react';
import axios from 'axios';

export const useDisasters = () => {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDisasters = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/disasters');
      const disastersData = response.data.disasters || [];
      console.log('Fetched disasters:', disastersData.length, 'disasters');
      console.log('Disaster types:', disastersData.map(d => ({ type: d.type, severity: d.severity, location: `${d.latitude}, ${d.longitude}` })));
      setDisasters(disastersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching disasters:', err);
      setError(err.message);
      // Keep empty array for real data only
      setDisasters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      await fetchDisasters();
    };
    
    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { disasters, loading, error, refetch: fetchDisasters };
};
