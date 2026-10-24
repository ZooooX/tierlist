import React from 'react';
import { createRoot } from 'react-dom/client';
// polices embarquées dans le build : rien n'est chargé depuis un serveur tiers, et la capture d'image les retrouve
import '@fontsource/chakra-petch/500.css';
import '@fontsource/chakra-petch/700.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/600.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
