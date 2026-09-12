import { CharactersProvider } from '../context/CharactersContext.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';

export default function AppLayout({ children }) {
  return (
    <CharactersProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <TopBar />
          <main className="app-content">{children}</main>
        </div>
      </div>
    </CharactersProvider>
  );
}
