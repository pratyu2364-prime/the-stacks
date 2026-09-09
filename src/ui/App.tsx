import { Route, Routes } from 'react-router-dom';
import { Landing } from './routes/Landing';
import { NotBuilt } from './routes/NotBuilt';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<NotBuilt title="Sign in" task="t05" />} />
      <Route path="/signup" element={<NotBuilt title="Sign up" task="t05" />} />
      <Route path="/dashboard" element={<NotBuilt title="Dashboard" task="t06" />} />
      <Route path="/books" element={<NotBuilt title="Your library" task="t05" />} />
      <Route path="/books/:id" element={<NotBuilt title="Book" task="t05" />} />
      <Route path="/library" element={<NotBuilt title="The world" task="t03" />} />
      <Route path="*" element={<NotBuilt title="Nothing here" task="—" />} />
    </Routes>
  );
}
