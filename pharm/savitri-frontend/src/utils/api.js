const API_URL = 'https://savix-pharmacy-api-sy7t.onrender.com/api';

export const fetchDashboardAnalytics = async (token, pharmacyId) => {
  try {
    const response = await fetch(`${API_URL}/pharmacies/dashboard/analytics?pharmacyId=${pharmacyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const fetchNearbyPharmacies = async (lng, lat) => {
  try {
    const response = await fetch(`${API_URL}/search/nearby-pharmacies?lng=${lng}&lat=${lat}`);
    if (!response.ok) throw new Error('Failed to fetch nearby pharmacies');
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

