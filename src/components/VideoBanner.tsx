import promoVideo from "@/assets/promo-video.mp4";

const VideoBanner = () => {
  return (
    <section className="relative w-full overflow-hidden px-4">
      <div className="relative h-[250px] md:h-[400px] lg:h-[500px] group">
        {/* Cosmic glow border */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 animate-pulse-glow" />
        
        {/* Video container with border */}
        <div className="relative h-full rounded-2xl overflow-hidden border-2 border-primary/40 shadow-2xl shadow-primary/30">
          {/* Video Background */}
          <video
            src={promoVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Inner glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/30 to-transparent rounded-br-full" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/30 to-transparent rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/30 to-transparent rounded-tr-full" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-primary/30 to-transparent rounded-tl-full" />
          
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default VideoBanner;
