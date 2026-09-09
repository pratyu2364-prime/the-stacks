import { Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth';
import { Landing } from './routes/Landing';
import { NotBuilt } from './routes/NotBuilt';
import { Library } from './routes/Library';
import { SignIn } from './routes/SignIn';
import { Books } from './routes/Books';
import { BookDetail } from './routes/BookDetail';
import { Dashboard } from './routes/Dashboard';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<SignIn mode="in" />} />
        <Route path="/signup" element={<SignIn mode="up" />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/books" element={<RequireAuth><Books /></RequireAuth>} />
        <Route path="/books/:id" element={<RequireAuth><BookDetail /></RequireAuth>} />
        <Route path="/library" element={<Library />} />
        <Route path="*" element={<NotBuilt title="Nothing here" task="—" />} />
      </Routes>
    </AuthProvider>
  );
}
