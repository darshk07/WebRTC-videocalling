
import { useState } from 'react';
import './App.css'
import Onboard from './pages/Onboard'
import Users from './pages/users';
import { User } from './pages/users';

function App() {
  const [isboarded, setIsboarded] = useState<boolean>(false);
  const [currUser, setCurrUser] = useState<User | null>(null);

  return (
    <>
      {
        !isboarded ?
          <Onboard setIsboarded={setIsboarded} setCurrUser={setCurrUser} /> :
          <Users currUser={currUser} />
      }
    </>
  )
}

export default App
