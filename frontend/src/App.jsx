import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('vocab'); // 'vocab' sau 'quiz'
  const [vocabList, setVocabList] = useState([]);
  
  // State pentru adăugare
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

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>English Vocabulary Learning</h1>

      {/* Navigare Tab-uri și Buton Backup */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('vocab')} 
          style={{ padding: '10px 20px', background: activeTab === 'vocab' ? '#007BFF' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Gestionare Cuvinte
        </button>
        <button 
          onClick={() => setActiveTab('quiz')} 
          style={{ padding: '10px 20px', background: activeTab === 'quiz' ? '#007BFF' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Generează Test / Quiz
        </button>
        <button 
          onClick={handleBackup} 
          style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: 'auto' }}>
          📂 Backup / Export Drive
        </button>
      </div>

      {activeTab === 'vocab' ? (
        <div>
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
      ) : (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h3>Modul Test / Quiz</h3>
          {!quizStarted ? (
            <div>
              <p>Alege nivelul de dificultate pentru test:</p>
              <div style={{ marginBottom: '15px' }}>
                <select value={quizDifficulty} onChange={(e) => setQuizDifficulty(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                  <option value="All">Toate nivelurile</option>
                  <option value="A1-A2">A1-A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1-C2">C1-C2</option>
                </select>
              </div>
              <button onClick={startQuiz} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Pornește Testul</button>
            </div>
          ) : showResult ? (
            <div>
              <h4>Test Finalizat! 🎉</h4>
              <p>Scorul tău: <strong>{score}</strong> din <strong>{quizQuestions.length}</strong></p>
              <button onClick={() => setQuizStarted(false)} style={{ padding: '10px 20px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Încearcă din nou</button>
            </div>
          ) : (
            <div>
              <p>Întrebarea {currentIndex + 1} din {quizQuestions.length}</p>
              <h4>Traduce cuvântul: <span style={{ color: '#d9534f' }}>{quizQuestions[currentIndex].word}</span></h4>
              <p><em>Dificultate: {quizQuestions[currentIndex].difficulty}</em></p>
              
              <form onSubmit={handleAnswerSubmit}>
                <div style={{ marginBottom: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Scrie traducerea..." 
                    value={userAnswer} 
                    onChange={(e) => setUserAnswer(e.target.value)} 
                    disabled={feedback !== null}
                    required 
                    style={{ width: '100%', padding: '8px' }} 
                  />
                </div>
                <button type="submit" disabled={feedback !== null} style={{ padding: '10px 15px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Trimite Răspunsul</button>
              </form>

              {feedback && (
                <div style={{ marginTop: '15px', padding: '10px', background: feedback.correct ? '#d4edda' : '#f8d7da', color: feedback.correct ? '#155724' : '#721c24', borderRadius: '4px' }}>
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