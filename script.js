// Função do carrossel unificada
/**
 * Inicializa um componente de carrossel com opções personalizáveis.
 *
 * @param {string} containerClass - O nome da classe do elemento contêiner do carrossel.
 * @param {Array<Object>} items - Um array de objetos representando os itens do carrossel.
 * @param {string} items[].image - A URL da imagem para itens do carrossel de cursos (usado apenas se `isCourseCarousel` for verdadeiro).
 * @param {string} items[].alt - O texto alternativo para a imagem.
 * @param {string} [items[].title] - O título do curso (usado apenas se `isCourseCarousel` for verdadeiro).
 * @param {string} [items[].desc] - A descrição do curso (usado apenas se `isCourseCarousel` for verdadeiro).
 * @param {string} [items[].price] - O preço do curso (usado apenas se `isCourseCarousel` for verdadeiro).
 * @param {string} [items[].src] - A URL da imagem para itens do carrossel geral (usado apenas se `isCourseCarousel` for falso).
 * @param {boolean} [isCourseCarousel=false] - Indica se o carrossel é para cursos ou itens gerais.
 *
 * @returns {void}
 *
 * @example
 * const items = [
 *   { image: 'curso1.jpg', alt: 'Curso 1', title: 'Curso 1', desc: 'Aprenda algo novo', price: 'R$ 100,00' },
 *   { image: 'curso2.jpg', alt: 'Curso 2', title: 'Curso 2', desc: 'Aprimore suas habilidades', price: 'R$ 150,00' }
 * ];
 * initCarousel('curso-carousel', items, true);
 *
 * @example
 * const items = [
 *   { src: 'imagem1.jpg', alt: 'Slide 1' },
 *   { src: 'imagem2.jpg', alt: 'Slide 2' }
 * ];
 * initCarousel('imagem-carousel', items);
 */
function initCarousel(containerClass, items, isCourseCarousel = false) {
    const container = document.querySelector(`.${containerClass}`);
    if (!container) return;

    const track = container.querySelector('.carousel-track');
    const dotsContainer = container.querySelector('.carousel-dots');
    const prevBtn = container.querySelector('.carousel-btn.prev');
    const nextBtn = container.querySelector('.carousel-btn.next');

    let currentIndex = 0;
    let slidesPerView = 1;
    let autoplay;

    function updateSlidesPerView() {
        if (window.innerWidth >= 992) {
            slidesPerView = isCourseCarousel ? 3 : 1;
        } else if (window.innerWidth >= 768) {
            slidesPerView = isCourseCarousel ? 2 : 1;
        } else {
            slidesPerView = 1;
        }
    }

    function createCarouselItems() {
        track.innerHTML = '';
        if (dotsContainer) dotsContainer.innerHTML = '';

        items.forEach((item, index) => {
            const carouselItem = document.createElement('div');
            carouselItem.className = 'carousel-item';
            carouselItem.setAttribute('aria-hidden', index !== 0);
            carouselItem.setAttribute('aria-label', `Item ${index + 1} de ${items.length}`);

            if (isCourseCarousel) {
                carouselItem.innerHTML = `
                    <article class="course-card">
                        <div class="course-img-container">
                            <img src="${item.image}" alt="${item.alt}" loading="lazy" class="course-img" width="400" height="300">
                        </div>
                        <div class="course-content">
                            <h3 class="course-title">${item.title}</h3>
                            <p class="course-desc">${item.desc}</p>
                            <div class="course-footer">
                                <span class="course-price">${item.price}</span>
                                <a href="#inscricao" class="course-btn">Quero me inscrever</a>
                            </div>
                        </div>
                    </article>
                `;
            } else {
                carouselItem.innerHTML = `
                    <div class="aspect-ratio-box" style="--aspect-ratio: 16/9">
                        <img src="${item.src}" alt="${item.alt}" loading="lazy" width="800" height="450">
                    </div>
                    <p class="carousel-caption">${item.alt}</p>
                `;
            }

            track.appendChild(carouselItem);

            if (dotsContainer && (!isCourseCarousel || index < items.length - slidesPerView + 1)) {
                const dot = document.createElement('button');
                dot.className = 'carousel-dot';
                dot.setAttribute('aria-label', `Ir para slide ${index + 1}`);
                if (index === 0) {
                    dot.classList.add('active');
                    dot.setAttribute('aria-current', 'true');
                }
                dot.addEventListener('click', () => goToSlide(index));
                dotsContainer.appendChild(dot);
            }
        });
    }

    function updateCarousel() {
        const itemWidth = track.children[0]?.offsetWidth + 20 || 0;
        track.style.transform = isCourseCarousel 
            ? `translateX(-${currentIndex * itemWidth}px)`
            : `translateX(-${currentIndex * 100}%)`;

        // Atualiza estados ARIA
        track.querySelectorAll('.carousel-item').forEach((item, index) => {
            item.setAttribute('aria-hidden', 
                isCourseCarousel 
                    ? index < currentIndex || index >= currentIndex + slidesPerView
                    : index !== currentIndex
            );
        });

        if (dotsContainer) {
            dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, index) => {
                const isActive = index === currentIndex;
                dot.classList.toggle('active', isActive);
                dot.setAttribute('aria-current', isActive ? 'true' : 'false');
            });
        }
    }

    function goToSlide(index) {
        if (index < 0 || (isCourseCarousel && index > items.length - slidesPerView)) return;
        if (!isCourseCarousel && index >= items.length) index = 0;
        if (!isCourseCarousel && index < 0) index = items.length - 1;
        
        currentIndex = index;
        updateCarousel();
        resetAutoplay();
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function resetAutoplay() {
        if (autoplay) clearInterval(autoplay);
        autoplay = setInterval(nextSlide, 5000);
    }

    function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
    }

    function handleTouchEnd(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }

    function handleSwipe() {
        const difference = touchStartX - touchEndX;
        if (difference > 50) nextSlide();
        else if (difference < -50) prevSlide();
    }

    // Inicialização
    updateSlidesPerView();
    createCarouselItems();
    
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    
    track.addEventListener('touchstart', handleTouchStart, { passive: true });
    track.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    });
    
    window.addEventListener('resize', () => {
        updateSlidesPerView();
        updateCarousel();
    });
    
    resetAutoplay();
    track.addEventListener('mouseenter', () => clearInterval(autoplay));
    track.addEventListener('mouseleave', resetAutoplay);
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) resetAutoplay();
            else clearInterval(autoplay);
        });
    }, { threshold: 0.5 });
    
    observer.observe(track);
}

// Inicialização no DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Carrossel de cursos
    const courses = [
        {
            title: "Bordado em Ponto Cruz",
            desc: "Aprenda a criar peças incríveis com ponto cruz.",
            price: "R$ 150,00",
            image: "https://i.pinimg.com/736x/ea/66/11/ea66116498f3befe920bba47c2634d61.jpg",
            alt: "Material para curso de ponto cruz"
        },
        {
            title: "Bordado em Relevo",
            desc: "Descubra técnicas avançadas de bordado em relevo.",
            price: "R$ 180,00",
            image: "https://i.pinimg.com/736x/02/5d/e8/025de8925f968ae0e735a1388db5dade.jpg",
            alt: "Bordado em relevo demonstrativo"
        },
        {
            title: "Bordado Livre para Iniciantes",
            desc: "Aprenda técnicas básicas em 4 aulas práticas.",
            price: "R$ 120,00",
            image: "https://i.pinimg.com/736x/93/cb/dd/93cbdd1dd30193acc6329f0348bd4e23.jpg",
            alt: "Aluna aprendendo bordado livre"
        }
    ];
    initCarousel('courses-carousel', courses, true);

    // Carrossel de galeria (se necessário)
    const galleryImages = [
        { src: 'https://i.pinimg.com/736x/60/72/de/6072de0c3eaec316090e53db7dff1880.jpg', alt: 'Toalha bordada com motivos florais' },
        { src: 'https://i.pinimg.com/736x/d6/ad/2d/d6ad2d12211c208e1c2cfab695a9ef21.jpg', alt: 'Jogo americano bordado em ponto cruz' },
        { src: 'https://i.pinimg.com/736x/c7/04/55/c7045589b4e61a46b066f5e91b894a52.jpg', alt: 'Pano de prato com bordado personalizado' }
    ];
    initCarousel('gallery-carousel', galleryImages, false);
});
// Botão flutuante
const whatsappBtn = document.createElement('a');
whatsappBtn.href = 'https://wa.me/5512988861969?text=Olá,%20gostaria%20de%20um%20orçamento';
whatsappBtn.className = 'whatsapp-float';
whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i>';
document.body.appendChild(whatsappBtn);

// Ensure the CSS for .whatsapp-float is included in a separate style.css file.