import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [vocabList, setVocabList] = useState([]);
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [grammarProperties, setGrammarProperties] = useState('');
  const [exampleText, setExampleText] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [difficulty, setDifficulty] = useState('A1-A2');

  const fetchVocab = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/vocabulary');
      const data = await response.json();
      if (data.data) {
        setVocabList(data.data);
      }
    } catch (err) {
      console.error('Error fetching vocabulary:', err);
    }
  };

  useEffect(() => {
    fetchVocab();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newItem = {
      word,
      translation,
      grammar_properties: grammarProperties,
      examples: [{ sentence: exampleText, translation: exampleTranslation }],
      difficulty
    };

    try {
      const response = await fetch('http://localhost:5000/api/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        setWord('');
        setTranslation('');
        setGrammarProperties('');
        setExampleText('');
        setExampleTranslation('');
        fetchVocab();
      }
    } catch (err) {
      console.error('Error saving vocabulary:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/vocabulary/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchVocab();
      }
    } catch (err) {
      console.error('Error deleting vocabulary:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>English Vocabulary Learning</h1>

      <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Adaugă cuvânt sau expresie nouă</h3>
        <div style={{ marginBottom: '10px' }}>
          <input type="text" placeholder="Cuvânt / Expresie" value={word} onChange={(e) => setWord(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input type="text" placeholder="Traducere" value={translation} onChange={(e) => setTranslation(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input type="text" placeholder="Proprietăți gramaticale (ex: verb iregulat, noun)" value={grammarProperties} onChange={(e) => setGrammarProperties(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input type="text" placeholder="Exemplu de propoziție în engleză" value={exampleText} onChange={(e) => setExampleText(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input type="text" placeholder="Traducerea exemplului" value={exampleTranslation} onChange={(e) => setExampleTranslation(e.target.value)} style={{ width: '100%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="A1-A2">A1-A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1-C2">C1-C2</option>
          </select>
        </div>
        <button type="submit" style={{ padding: '10px 15px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvează în memorie</button>
      </form>

      <h3>Lista Casetelor de Vocabular</h3>
      {vocabList.length === 0 ? (
        <p>Nu există cuvinte adăugate momentan.</p>
      ) : (
        vocabList.map((item) => (
          <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '10px', background: '#fff' }}>
            <h4>{item.word} - <span style={{ color: '#007BFF' }}>{item.translation}</span> ({item.difficulty})</h4>
            <p><strong>Gramatică:</strong> {item.grammar_properties || '-'}</p>
            <p><strong>Exemplu:</strong> {item.examples ? JSON.parse(item.examples)[0]?.sentence : ''} / <em>{item.examples ? JSON.parse(item.examples)[0]?.translation : ''}</em></p>
            <button onClick={() => handleDelete(item.id)} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Șterge</button>
          </div>
        ))
      )}
    </div>
  );
}

export default App;