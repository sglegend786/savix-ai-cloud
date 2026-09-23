import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function SmartRecommendations() {
  const { token, user } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!token || !user || user.role === 'admin') return;
      setLoading(true);
      try {
        // Fetching 3 best matching schemes from backend based on user's saved profile fields
        const params = {
          limit: 3,
          state: user.state,
          gender: user.gender,
        };
        
        if (user.isStudent) params.isStudent = true;
        if (user.isFarmer) params.isFarmer = true;
        if (user.occupation) params.occupation = user.occupation;

        let res = await axios.get('/api/schemes', {
          params,
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.data.length === 0) {
          // Fallback 1: Try broader category if student
          if (user.isStudent || (user.occupation && user.occupation.toLowerCase().includes('student'))) {
            res = await axios.get('/api/schemes', {
              params: { limit: 3, category: 'Education & Learning' },
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          
          // Fallback 2: General state-wise
          if (res.data.data.length === 0) {
            res = await axios.get('/api/schemes', {
              params: { limit: 3, state: user.state },
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        }
        
        setRecommendations(res.data.data.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [token, user]);

  if (!user || user.role === 'admin' || (!loading && recommendations.length === 0)) {
    return null;
  }

  return (
    <div className="smart-recommendations-widget" style={{ marginTop: '24px', background: 'linear-gradient(135deg, #f0f8f2, #e3efe7)', padding: '24px', borderRadius: '16px', border: '1px solid #c2d6c9' }}>
      <div className="widget-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sparkles size={24} color="#3f7c54" />
        <h3 style={{ margin: 0, color: '#17221b', fontSize: '18px', fontWeight: '700' }}>Recommended For You</h3>
      </div>
      
      {loading ? (
        <p style={{ fontStyle: 'italic', color: '#6b8071' }}>Finding the best schemes for your profile...</p>
      ) : (
        <div className="recommendations-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recommendations.map(scheme => (
            <Link to={`/scheme/${scheme._id}`} key={scheme._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'white', borderRadius: '12px', textDecoration: 'none', color: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }} className="rec-card">
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#3f7c54' }}>{scheme.name}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b8071' }}>{scheme.category}</p>
              </div>
              <ChevronRight size={18} color="#9aafa2" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default SmartRecommendations;
