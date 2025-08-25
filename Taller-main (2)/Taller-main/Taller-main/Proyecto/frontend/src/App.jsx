import React from 'react';
import Greet from './components/Greet';
import Books from './components/Books';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Greet />
      </header>
      <main>
        <Books />
      </main>
    </div>
  );
}

export default App;