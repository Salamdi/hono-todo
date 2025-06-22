import { useEffect, useState } from 'react';
import './App.css';
import { Auth } from './Auth';
import { Main } from './Main';

function App() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const localToken = localStorage.getItem('token');
    if (localToken) {
      setToken(localToken);
      return;
    }
  }, []);

  const handleAuth = (token: string) => {
    setToken(token);
    localStorage.setItem('token', token);
  };

  if (!token) {
    return <Auth onAuth={handleAuth} />;
  }
  return <Main />;
}

export default App;
