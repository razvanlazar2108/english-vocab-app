import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('vocab'); // 'vocab' sau 'quiz'
  const [vocabList, setVocabList] = useState([]);
  
  // State pentru căutare și filtrare
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  // State pentru adăugare / editare
  const [editingId, setEditingId] = useState(null);
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [grammarProperties, setGrammarProperties] = useState('');
  const [exampleText, setExampleText] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [difficulty, setDifficulty] = useState('A1-A2');

  // State pentru Quiz
  const [quizDifficulty, setQuizDifficulty] = useState('All');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState(null);

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
      const url = editingId 
        ? `http://localhost:5000/api/vocabulary/${editingId}`
        : 'http://localhost:5000/api/vocabulary';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        resetForm();
        fetchVocab();
      }
    } catch (err) {
      console.error('Error saving vocabulary:', err);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setWord(item.word);
    setTranslation(item.translation);
    setGrammarProperties(item.grammar_properties || '');
    const parsedExamples = item.examples ? JSON.parse(item.examples) : [];
    setExampleText(parsedExamples[0]?.sentence || '');
    setExampleTranslation(parsedExamples[0]?.translation || '');
    setDifficulty(item.difficulty);
  };

  const resetForm = () => {
    setEditingId(null);
    setWord('');
    setTranslation('');
    setGrammarProperties('');
    setExampleText('');
    setExampleTranslation('');
    setDifficulty('A1-A2');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sigur doriți să ștergeți acest cuvânt?')) return;
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

  const handleBackup = () => {
    window.open('http://localhost:5000/api/export', '_blank');
  };

  const startQuiz = async () => {
    try {
      const url = quizDifficulty === 'All' 
        ? 'http://localhost:5000/api/quiz' 
        : `http://localhost:5000/api/quiz?difficulty=${quizDifficulty}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        setQuizQuestions(data.data);
        setCurrentIndex(0);
        setScore(0);
        setQuizStarted(true);
        setShowResult(false);
        setUserAnswer('');
        setFeedback(null);
      } else {
        alert('Nu există cuvinte pentru această dificultate!');
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
    }
  };

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    const currentWord = quizQuestions[currentIndex];
    const isCorrect = userAnswer.trim().toLowerCase() === currentWord.translation.trim().toLowerCase();
    
    if (isCorrect) {
      setScore(score + 1);
      setFeedback({ correct: true, message: 'Corect! 🎯' });
    } else {
      setFeedback({ correct: false, message: `Greșit. Traducerea corectă era: ${currentWord.translation}` });
    }

    setTimeout(() => {
      setFeedback(null);
      setUserAnswer('');
      if (currentIndex + 1 < quizQuestions.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setShowResult(true);
      }
    }, 2000);
  };

  // Filtrare cuvinte după căutare și dificultate
  const filteredVocab = vocabList.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.translation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'All' || item.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div style={{ padding: '30px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '850px', margin: '0 auto', background: '#f4f7f6', minHeight: '100vh', borderRadius: '12px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>English Vocabulary App</h1>
        <p style={{ color: '#7f8c8d' }}>Învață, gestionează și testează-ți vocabularul eficient</p>
      </header>

      {/* Navigare Tab-uri și Buton Backup */}
      <div style={{ marginBottom: '25px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <button 
          onClick={() => setActiveTab('vocab')} 
          style={{ padding: '10px 20px', background: activeTab === 'vocab' ? '#3498db' : '#ecf0f1', color: activeTab === 'vocab' ? '#fff' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
          📖 Gestionare Cuvinte
        </button>
        <button 
          onClick={() => setActiveTab('quiz')} 
          style={{ padding: '10px 20px', background: activeTab === 'quiz' ? '#3498db' : '#ecf0f1', color: activeTab === 'quiz' ? '#fff' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
          🧠 Modul Quiz
        </button>
        <button 
          onClick={handleBackup} 
          style={{ padding: '10px 20px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}>
          📂 Backup Drive
        </button>
      </div>

      {activeTab === 'vocab' ? (
        <div>
          {/* Formular Adăugare / Editare */}
          <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#34495e' }}>{editingId ? '✏️ Editează cuvântul' : '➕ Adaugă cuvânt sau expresie nouă'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input type="text" placeholder="Cuvânt / Expresie" value={word} onChange={(e) => setWord(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="text" placeholder="Traducere" value={translation} onChange={(e) => setTranslation(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input type="text" placeholder="Proprietăți gramaticale (ex: verb iregulat, noun)" value={grammarProperties} onChange={(e) => setGrammarProperties(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input type="text" placeholder="Propoziție exemplu (English)" value={exampleText} onChange={(e) => setExampleText(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <input type="text" placeholder="Traducerea exemplului" value={exampleTranslation} onChange={(e) => setExampleTranslation(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}>
                <option value="A1-A2">A1-A2 (Începător)</option>
                <option value="B1">B1 (Mediu)</option>
                <option value="B2">B2 (Avansat)</option>
                <option value="C1-C2">C1-C2 (Expert)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ padding: '10px 20px', background: editingId ? '#f39c12' : '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editingId ? 'Salvează Modificările' : 'Adaugă în listă'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ padding: '10px 20px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Anulează
                </button>
              )}
            </div>
          </form>

          {/* Secțiune Căutare și Filtrare */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="🔍 Caută cuvânt sau traducere..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }} 
            />
            <select 
              value={filterDifficulty} 
              onChange={(e) => setFilterDifficulty(e.target.value)} 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}>
              <option value="All">Toate dificultățile</option>
              <option value="A1-A2">A1-A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1-C2">C1-C2</option>
            </select>
          </div>

          <h3 style={{ color: '#34495e' }}>Lista Casetelor de Vocabular ({filteredVocab.length})</h3>
          {filteredVocab.length === 0 ? (
            <p style={{ color: '#7f8c8d', background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>Nu au fost găsite cuvinte.</p>
          ) : (
            filteredVocab.map((item) => (
              <div key={item.id} style={{ border: '1px solid #e2e8f0', padding: '15px 20px', borderRadius: '10px', marginBottom: '12px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#2c3e50' }}>
                    {item.word} - <span style={{ color: '#3498db' }}>{item.translation}</span> 
                    <span style={{ fontSize: '12px', background: '#ebf5fb', color: '#2980b9', padding: '2px 8px', borderRadius: '12px', marginLeft: '10px' }}>{item.difficulty}</span>
                  </h4>
                  <p style={{ margin: '4px 0', color: '#7f8c8d', fontSize: '14px' }}><strong>Gramatică:</strong> {item.grammar_properties || '-'}</p>
                  <p style={{ margin: '4px 0', color: '#34495e', fontSize: '14px' }}><strong>Exemplu:</strong> {item.examples ? JSON.parse(item.examples)[0]?.sentence : ''} / <em>{item.examples ? JSON.parse(item.examples)[0]?.translation : ''}</em></p>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => handleEditClick(item)} style={{ padding: '6px 12px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Editează</button>
                  <button onClick={() => handleDelete(item.id)} style={{ padding: '6px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Șterge</button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#34495e', marginTop: 0 }}>Modul Test / Quiz</h3>
          {!quizStarted ? (
            <div>
              <p style={{ color: '#7f8c8d' }}>Alege nivelul de dificultate pentru testul tău:</p>
              <div style={{ marginBottom: '15px' }}>
                <select value={quizDifficulty} onChange={(e) => setQuizDifficulty(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="All">Toate nivelurile</option>
                  <option value="A1-A2">A1-A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1-C2">C1-C2</option>
                </select>
              </div>
              <button onClick={startQuiz} style={{ padding: '12px 25px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Pornește Testul</button>
            </div>
          ) : showResult ? (
            <div style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#2c3e50', fontSize: '22px' }}>Test Finalizat! 🎉</h4>
              <p style={{ fontSize: '18px' }}>Scorul tău: <strong style={{ color: '#27ae60' }}>{score}</strong> din <strong>{quizQuestions.length}</strong></p>
              <button onClick={() => setQuizStarted(false)} style={{ padding: '12px 25px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>Încearcă din nou</button>
            </div>
          ) : (
            <div>
              <p style={{ color: '#7f8c8d' }}>Întrebarea {currentIndex + 1} din {quizQuestions.length}</p>
              <h4 style={{ fontSize: '20px', color: '#2c3e50' }}>Traduce cuvântul: <span style={{ color: '#e74c3c' }}>{quizQuestions[currentIndex].word}</span></h4>
              <p style={{ fontSize: '13px', color: '#95a5a6' }}><em>Dificultate: {quizQuestions[currentIndex].difficulty}</em></p>
              
              <form onSubmit={handleAnswerSubmit}>
                <div style={{ marginBottom: '15px' }}>
                  <input 
                    type="text" 
                    placeholder="Scrie traducerea..." 
                    value={userAnswer} 
                    onChange={(e) => setUserAnswer(e.target.value)} 
                    disabled={feedback !== null}
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} 
                  />
                </div>
                <button type="submit" disabled={feedback !== null} style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Trimite Răspunsul</button>
              </form>

              {feedback && (
                <div style={{ marginTop: '15px', padding: '12px', background: feedback.correct ? '#eafaf1' : '#fdedec', color: feedback.correct ? '#27ae60' : '#c0392b', borderRadius: '6px', fontWeight: 'bold' }}>
                  {feedback.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;