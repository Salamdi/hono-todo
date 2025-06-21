import { useEffect, useState } from 'react';
import './App.css';
import { Auth } from './Auth/Auth';

function App() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const localToken = localStorage.getItem('token');
    if (localToken) {
      setToken(localToken);
      return;
    }
  });

  const handleAuth = (token: string) => {
    setToken(token);
    localStorage.setItem('token', token);
  };

  if (!token) {
    return <Auth onAuth={handleAuth} />;
  }
  return <h1>Welcome!</h1>;
}

export default App;
