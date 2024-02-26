// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import HHMint from './components/HHMint'; // Adjust the path accordingly

const App = () => {
  return (
    <Router>
      <Route path="/:userPublicKey?" component={HHMint} />
    </Router>
  );
};

export default App;