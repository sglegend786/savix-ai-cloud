import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function CompareSchemes() {
  const { token } = useContext(AuthContext);
  const [schemes, setSchemes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Fetch all schemes so user can select them
    axios.get('/api/schemes').then(res => {
      const allSchemes = res.data.data;
      setSchemes(allSchemes);
      setLoading(false);
      
      // Auto-Compare Logic
      const params = new URLSearchParams(window.location.search);
      const autoCompare = params.get('autoCompare');
      if (autoCompare) {
        const namesToCompare = autoCompare.split(',').map(s => s.trim().toLowerCase());
        const fuzzyMatch = (target, search) => {
          const tWords = target.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(Boolean);
          const sWords = search.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(Boolean);
          let match = 0;
          sWords.forEach(sw => {
            if (tWords.some(tw => tw.includes(sw) || sw.includes(tw))) match++;
          });
          return match / sWords.length;
        };

        const matchedIds = namesToCompare.map(name => {
           const bestMatch = allSchemes.reduce((best, s) => {
             const score = fuzzyMatch(s.name, name);
             return score > best.score ? { id: s._id, score } : best;
           }, { id: null, score: 0 });
           return bestMatch.score > 0.4 ? bestMatch.id : null;
        }).filter(Boolean).slice(0, 3);
          
        if (matchedIds.length >= 2) {
          setSelectedIds(matchedIds);
          // Set a timeout to allow state to settle before comparing
          setTimeout(() => {
             triggerCompare(matchedIds);
          }, 500);
        }
      }
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (schemes.length === 0) return;
    const params = new URLSearchParams(location.search);
    const autoCompare = params.get('autoCompare');
    if (autoCompare) {
      const namesToCompare = autoCompare.split(',').map(s => s.trim().toLowerCase());
      const fuzzyMatch = (target, search) => {
        const tWords = target.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(Boolean);
        const sWords = search.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(' ').filter(Boolean);
        let match = 0;
        sWords.forEach(sw => {
          if (tWords.some(tw => tw.includes(sw) || sw.includes(tw))) match++;
        });
        return match / sWords.length;
      };

      const matchedIds = namesToCompare.map(name => {
         const bestMatch = schemes.reduce((best, s) => {
           const score = fuzzyMatch(s.name, name);
           return score > best.score ? { id: s._id, score } : best;
         }, { id: null, score: 0 });
         return bestMatch.score > 0.4 ? bestMatch.id : null;
      }).filter(Boolean).slice(0, 3);
        
      if (matchedIds.length >= 2) {
        setSelectedIds(matchedIds);
        setTimeout(() => {
           triggerCompare(matchedIds);
        }, 500);
      }
    }
  }, [location.search, schemes]);

  const triggerCompare = async (ids) => {
    if (ids.length < 2) return;
    setComparing(true);
    setComparison(null);
    try {
      const res = await axios.post('/api/ai/compare', { schemeIds: ids }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComparison(res.data.data.comparison);
      setRecommendation(res.data.data.recommendation);
    } catch (err) {
      console.error("Comparison failed", err);
    } finally {
      setComparing(false);
    }
  };

  const handleCompare = () => triggerCompare(selectedIds);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };



  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading schemes...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link to="/" style={{ color: '#3f7c54', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ArrowLeft size={18} /> Back
        </Link>
        <h1 style={{ margin: 0, color: '#17221b', fontSize: '28px' }}>Compare Schemes via AI</h1>
      </div>

      <p style={{ color: '#6b8071', marginBottom: '24px' }}>Select up to 3 schemes to generate a smart comparison table.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {schemes.map(scheme => (
          <div 
            key={scheme._id} 
            onClick={() => toggleSelect(scheme._id)}
            style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              border: `2px solid ${selectedIds.includes(scheme._id) ? '#3f7c54' : '#eee'}`,
              background: selectedIds.includes(scheme._id) ? '#f0f8f2' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#17221b' }}>{scheme.name}</h3>
            <span style={{ fontSize: '12px', background: '#eee', padding: '4px 8px', borderRadius: '12px' }}>{scheme.category}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={handleCompare} 
        disabled={selectedIds.length < 2 || comparing}
        style={{
          background: selectedIds.length < 2 ? '#ccc' : '#3f7c54',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: selectedIds.length < 2 ? 'not-allowed' : 'pointer',
          display: 'block',
          width: '100%',
          maxWidth: '300px',
          margin: '0 auto 40px auto'
        }}
      >
        {comparing ? 'Generating Comparison...' : `Compare ${selectedIds.length} Schemes`}
      </button>

      {comparison && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #ddd', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8faf8' }}>
                <th style={{ padding: '16px', borderBottom: '2px solid #ddd', color: '#6b8071' }}>Feature</th>
                {selectedIds.map((id, index) => {
                  const s = schemes.find(x => x._id === id);
                  return <th key={id} style={{ padding: '16px', borderBottom: '2px solid #ddd', color: '#17221b' }}>{s?.name}</th>
                })}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#3f7c54' }}>{row.feature}</td>
                  {selectedIds.map((id, sIdx) => {
                    const key = `scheme${sIdx + 1}`;
                    return <td key={id} style={{ padding: '16px', color: '#17221b', fontSize: '14px' }}>{row[key]}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {recommendation && (
            <div style={{ padding: '20px', background: '#f0f8f2', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <AlertCircle color="#3f7c54" size={24} style={{ flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#3f7c54' }}>AI Recommendation</h4>
                <p style={{ margin: 0, color: '#17221b', lineHeight: '1.5', fontSize: '14px' }}>{recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CompareSchemes;
