import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobilePillNav from './MobilePillNav';

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-dark-950 gradient-mesh overflow-x-hidden max-w-full">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <MobilePillNav />
      <div className={`flex-1 flex flex-col min-w-0 max-w-full ml-0 transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Header />
        <main className="flex-1 p-2.5 pb-24 sm:p-4 sm:pb-24 md:p-6 md:pb-6 lg:p-8 overflow-y-auto overflow-x-hidden min-w-0 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
