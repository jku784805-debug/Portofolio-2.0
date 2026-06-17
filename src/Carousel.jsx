import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './Carousel.css';

const Carousel = ({ items }) => {
  const slides = items && items.length > 0 ? items : [
    'https://picsum.photos/id/1/800/400',
    'https://picsum.photos/id/2/800/400',
    'https://picsum.photos/id/3/800/400'
  ];

  return (
    <Swiper
      modules={[Navigation, Pagination]}
      spaceBetween={0}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      style={{ width: '100%', height: '100%' }}
    >
      {slides.map((src, index) => (
        <SwiperSlide key={index}>
          <img src={src} alt={`Slide ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
};
export default Carousel;