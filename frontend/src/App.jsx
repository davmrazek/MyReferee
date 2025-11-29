import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import './App.css';

function App() {
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        console.log("Attempting to fetch matches...");
        const q = query(collection(db, "matches"), limit(10));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log("Connected, but no matches found!");
            setError("Connected to DB, but collection 'matches' is empty.");
        }

        const matchesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log("Matches found:", matchesList);
        setMatches(matchesList);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) return <h1>Loading matches...</h1>;
  if (error) return <div style={{color: 'red', padding: 20}}><h2>Something went wrong:</h2><p>{error}</p></div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>⚽ Hanspaulka Referee Market</h1>
      <div style={{ display: 'grid', gap: '10px' }}>
        {matches.map(match => (
          <div key={match.id} style={{ border: '1px solid #ccc', padding: '15px' }}>
            <h3>{match['Home Team']} vs {match['Away Team']}</h3>
            <p>{match.Date} at {match.Time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;