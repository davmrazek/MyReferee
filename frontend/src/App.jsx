import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import './App.css';

function App() {
  const [allMatches, setAllMatches] = useState([]); // Store ALL matches here
  const [filteredMatches, setFilteredMatches] = useState([]); // Store only visible ones
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to Today
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data (Run once on load)
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
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  // 2. Filter Data (Run whenever date or matches change)
  useEffect(() => {
    if (allMatches.length === 0) return;

    const start = new Date(selectedDate);
    // Reset time to 00:00:00 to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 7); // Add 7 days range
    end.setHours(23, 59, 59, 999);

    const filtered = allMatches.filter(match => {
      // Parse "Po 1.9.25" -> Javascript Date Object
      const matchDate = parseCzechDate(match.Date);
      return matchDate >= start && matchDate <= end;
    });

    // Sort by date (oldest first)
    filtered.sort((a, b) => parseCzechDate(a.Date) - parseCzechDate(b.Date));

    setFilteredMatches(filtered);
  }, [selectedDate, allMatches]);

  // Helper: Turn "Po 1.9.25" into real Date
  const parseCzechDate = (dateStr) => {
    try {
      if (!dateStr) return new Date(0);
      // Remove day name (Po, Út...) if present and trim spaces
      const cleanStr = dateStr.trim().split(' ').pop(); 
      // Split 1.9.25
      const parts = cleanStr.split('.');
      if (parts.length < 3) return new Date(0);

      const day = parts[0];
      const month = parts[1];
      let year = parts[2];

      // Handle 2-digit year (25 -> 2025)
      if (year.length === 2) year = "20" + year;

      return new Date(`${year}-${month}-${day}`);
    } catch (e) {
      return new Date(0); 
    }
  };

  // Helper: Get formatted End Date string for UI
  const getEndDateString = () => {
    const start = new Date(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return end.toLocaleDateString();
  };

  // Helper: Get formatted Start Date string for UI
  const getStartDateString = () => {
    return new Date(selectedDate).toLocaleDateString();
  };

  return (
    <div className="container">
      <div className="header">
        <h1>⚽ Hanspaulka Referee Market</h1>
      </div>

      <div className="controls">
        <label>I want to referee starting from:</label>
        
        <div className="date-picker-wrapper">
            <input 
              type="date" 
              className="date-input"
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
            <span className="date-arrow">➔</span>
            <div className="end-date-display">
                To: {getEndDateString()}
            </div>
        </div>
        
        <p style={{fontSize: '0.9rem', color: '#666', marginTop: '5px'}}>
          Showing <strong>{filteredMatches.length}</strong> matches between <strong>{getStartDateString()}</strong> and <strong>{getEndDateString()}</strong>.
        </p>
      </div>
      
      {loading ? (
        <p className="empty-state">Loading matches...</p>
      ) : (
        <div className="matches-grid">
          {filteredMatches.length > 0 ? (
            filteredMatches.map(match => (
              <div key={match.id} className="match-card">
                <div className="match-info">
                  <h3>{match['Home Team']} <span style={{color:'#9ca3af', fontSize:'0.8em'}}>vs</span> {match['Away Team']}</h3>
                  <div className="match-meta">
                    <span>📅 {match.Date}</span>
                    <span>⏰ {match.Time}</span>
                    <span>📍 {match.Field}</span>
                    <span style={{color: '#6b7280', fontSize: '0.8em', marginTop:'5px'}}>({match.League.toUpperCase()})</span>
                  </div>
                </div>
                <button className="action-btn">
                  Offer Referee Service ($)
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              No matches found in this week.<br/>Try selecting a date during the season (e.g. September or October).
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;