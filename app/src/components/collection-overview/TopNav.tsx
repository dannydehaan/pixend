const TopNav = () => (
  <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 h-16 backdrop-blur-xl bg-[#0b1326] bg-opacity-80 border-none">
    <div className="flex items-center gap-8">
      <span className="text-xl font-black tracking-tighter text-[#d0bcff] uppercase">Pixend</span>
      <nav className="hidden lg:flex items-center gap-6">
        <a className="font-['Inter'] tracking-tight text-sm font-bold text-[#d0bcff] border-b-2 border-[#d0bcff] pb-1" href="#">
          Workspace
        </a>
        <a className="font-['Inter'] tracking-tight text-sm font-medium text-[#dae2fd]/60 hover:text-[#dae2fd] transition-colors" href="#">
          Environments
        </a>
        <a className="font-['Inter'] tracking-tight text-sm font-medium text-[#dae2fd]/60 hover:text-[#dae2fd] transition-colors" href="#">
          History
        </a>
      </nav>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <button className="p-2 rounded hover:bg-[#222a3d] transition-colors duration-200 text-[#dae2fd]/60">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button className="p-2 rounded hover:bg-[#222a3d] transition-colors duration-200 text-[#dae2fd]/60">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>
      <button className="bg-primary-container text-on-primary-container px-5 py-1.5 rounded-lg text-sm font-bold active:scale-95 transition-all">
        Send
      </button>
    </div>
  </header>
);

export default TopNav;
