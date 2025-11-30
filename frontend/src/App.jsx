import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import './App.css';

function App() {
  const [allMatches, setAllMatches] = useState([]); 
  const [filteredMatches, setFilteredMatches] = useState([]);
  
  // User Inputs
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysRange, setDaysRange] = useState(7); // New State: Number of days to look ahead
  
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

  // Filter Logic
  useEffect(() => {
    if (allMatches.length === 0) return;

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    // DYNAMIC: Use the daysRange variable instead of hardcoded 7
    end.setDate(end.getDate() + Number(daysRange)); 
    end.setHours(23, 59, 59, 999);

    const filtered = allMatches.filter(match => {
      const matchDate = parseCzechDate(match.Date);
      return matchDate >= start && matchDate <= end;
    });

    filtered.sort((a, b) => parseCzechDate(a.Date) - parseCzechDate(b.Date));
    setFilteredMatches(filtered);
  }, [selectedDate, daysRange, allMatches]); // Re-run when date OR range changes

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

  // Helper for UI dates
  const formatDate = (dateObj) => dateObj.toLocaleDateString('en-GB'); 

  // Helper to show end date based on user input
  const getEndDateString = () => {
    const start = new Date(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + Number(daysRange));
    return end.toLocaleDateString('en-GB');
  };

  return (
    <div className="container">
      {/* HEADER */}
      <div className="header">
        <h1>⚽ Hanspaulka Referee</h1>
        <div className="today-badge">
          Today: {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="controls">
        <div className="controls-row">
            
            {/* Input 1: Start Date */}
            <div className="control-group">
                <label>Start Date:</label>
                <input 
                type="date" 
                className="date-input"
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                />
            </div>

            {/* Input 2: Duration (Days) */}
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

        <div className="range-summary">
            <span>
                Searching from <span className="date-highlight">{formatDate(new Date(selectedDate))}</span> to <span className="date-highlight">{getEndDateString()}</span>
            </span>
            <span>
                Found: <strong>{filteredMatches.length}</strong> matches
            </span>
        </div>
      </div>
      
      {/* GRID */}
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
              No matches found in this range.<br/>
              Try increasing the duration or changing the start date.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;