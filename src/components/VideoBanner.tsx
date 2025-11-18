import promoVideo from "@/assets/promo-video.mp4";

const VideoBanner = () => {
  return (
    <section className="fixed top-[92px] left-0 right-0 h-[400px] overflow-hidden z-30">
      {/* Video Background */}
      <video
        src={promoVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default VideoBanner;
