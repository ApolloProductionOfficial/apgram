const TopBanner = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#FF4500] text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <span className="text-sm font-medium">Проект Reddit:</span>
        <a 
          href="https://onlyreddit.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-bold hover:underline flex items-center gap-1"
        >
          onlyreddit.com →
        </a>
      </div>
    </div>
  );
};

export default TopBanner;
