import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobilePillNav from './MobilePillNav';
import ThemeModal from './ThemeModal';

const Layout = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  }, [isCollapsed]);

  const showHeader = location.pathname === '/dashboard';

  return (
    <div className="flex h-screen bg-dark-950 gradient-mesh overflow-hidden max-w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <MobilePillNav />
      <ThemeModal />
      <div className={`flex-1 flex flex-col min-h-0 min-w-0 max-w-full ml-0 transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden min-w-0 max-w-full">
          {showHeader && <Header />}
          <div className="p-2.5 pb-24 sm:p-4 sm:pb-24 md:p-6 md:pb-6 lg:p-8 flex-1 flex flex-col min-h-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
