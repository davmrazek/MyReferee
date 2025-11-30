import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import './App.css';

function App() {
  const [allMatches, setAllMatches] = useState([]); 
  const [filteredMatches, setFilteredMatches] = useState([]);
  
  // Inputs
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysRange, setDaysRange] = useState(7);
  const [selectedPitches, setSelectedPitches] = useState([]); // NEW: Stores selected pitch names
  
  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const q = query(collection(db, "matches"));
        const querySnapshot = await getDocs(q);
        
        const matchesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllMatches(matchesList);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  // Filter Logic (Date + Pitch)
  useEffect(() => {
    if (allMatches.length === 0) return;

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + Number(daysRange)); 
    end.setHours(23, 59, 59, 999);

    const filtered = allMatches.filter(match => {
      // 1. Check Date
      const matchDate = parseCzechDate(match.Date);
      const isDateMatch = matchDate >= start && matchDate <= end;

      // 2. Check Pitch (NEW)
      // If no pitches selected, show ALL (return true). Otherwise check if match field is in list.
      const isPitchMatch = selectedPitches.length === 0 || selectedPitches.includes(match.Field);

      return isDateMatch && isPitchMatch;
    });

    filtered.sort((a, b) => parseCzechDate(a.Date) - parseCzechDate(b.Date));
    setFilteredMatches(filtered);
  }, [selectedDate, daysRange, selectedPitches, allMatches]); // Re-run if pitches change

  // Get list of ALL unique pitches from data for the buttons
  const availablePitches = [...new Set(allMatches.map(m => m.Field))].sort();

  const togglePitch = (pitch) => {
    if (selectedPitches.includes(pitch)) {
      // Remove if already selected
      setSelectedPitches(prev => prev.filter(p => p !== pitch));
    } else {
      // Add if not selected
      setSelectedPitches(prev => [...prev, pitch]);
    }
  };

  const parseCzechDate = (dateStr) => {
    try {
      if (!dateStr) return new Date(0);
      const cleanStr = dateStr.trim().split(' ').pop();
      const parts = cleanStr.split('.');
      if (parts.length < 3) return new Date(0);
      let [day, month, year] = parts;
      if (year.length === 2) year = "20" + year;
      return new Date(`${year}-${month}-${day}`);
    } catch { return new Date(0); }
  };

  const formatDate = (dateObj) => dateObj.toLocaleDateString('en-GB'); 
  const getEndDateString = () => {
    const start = new Date(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + Number(daysRange));
    return end.toLocaleDateString('en-GB');
  };

  return (
    <div className="container">
      <div className="header">
        <h1>⚽ Hanspaulka Referee</h1>
        <div className="today-badge">
          Today: {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="controls">
        {/* Row 1: Date Controls */}
        <div className="controls-row">
            <div className="control-group">
                <label>Start Date:</label>
                <input 
                type="date" 
                className="date-input"
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                />
            </div>

            <div className="control-group" style={{flex: '0 0 auto'}}>
                <label>Duration (Days):</label>
                <input 
                type="number" 
                className="days-input"
                min="1"
                max="60"
                value={daysRange} 
                onChange={(e) => setDaysRange(e.target.value)} 
                />
            </div>
        </div>

        {/* Row 2: Pitch Filter (NEW) */}
        <div className="filter-section">
            <label className="filter-label">Filter by Pitch: {selectedPitches.length > 0 ? `(${selectedPitches.length} selected)` : '(All)'}</label>
            <div className="pitch-list">
                {availablePitches.map(pitch => (
                    <button 
                        key={pitch} 
                        className={`pitch-chip ${selectedPitches.includes(pitch) ? 'selected' : ''}`}
                        onClick={() => togglePitch(pitch)}
                    >
                        {pitch}
                    </button>
                ))}
            </div>
        </div>

        <div className="range-summary">
            <span>Matches until: <strong>{getEndDateString()}</strong></span>
            <span>Found: <strong>{filteredMatches.length}</strong> matches</span>
        </div>
      </div>
      
      {loading ? (
        <p className="empty-state">Loading data...</p>
      ) : (
        <div className="matches-grid">
          {filteredMatches.length > 0 ? (
            filteredMatches.map(match => (
              <div key={match.id} className="match-card">
                <div className="match-info">
                  <h3>{match['Home Team']} <span className="vs">vs</span> {match['Away Team']}</h3>
                  
                  <div className="match-details">
                    <div className="detail-row">
                      <span className="icon">📅</span> {match.Date}
                    </div>
                    <div className="detail-row">
                      <span className="icon">⏰</span> {match.Time}
                    </div>
                    <div className="detail-row">
                      <span className="icon">📍</span> {match.Field}
                    </div>
                    {match.League && (
                      <div className="detail-row" style={{color: '#3b82f6', fontWeight: '600', fontSize:'0.8rem'}}>
                        League: {match.League.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <button className="action-btn">Take Match ($)</button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              No matches found for this date and pitch combination.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;