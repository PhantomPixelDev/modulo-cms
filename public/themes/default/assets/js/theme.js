// Default Theme JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNavigation = document.querySelector('.main-navigation');
    
    if (mobileMenuToggle && mainNavigation) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNavigation.classList.toggle('mobile-open');
            
            // Update aria-expanded attribute
            const isExpanded = mainNavigation.classList.contains('mobile-open');
            mobileMenuToggle.setAttribute('aria-expanded', isExpanded);
        });
    }
    
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Back to top button
    const backToTopButton = document.querySelector('.back-to-top');
    if (backToTopButton) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });
        
        backToTopButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Search form enhancement
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');
    
    if (searchForm && searchInput) {
        searchInput.addEventListener('focus', function() {
            searchForm.classList.add('focused');
        });
        
        searchInput.addEventListener('blur', function() {
            if (!this.value) {
                searchForm.classList.remove('focused');
            }
        });
    }
    
    // Image lazy loading fallback for older browsers
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // Theme customizer live preview (if in admin)
    if (window.themeCustomizer) {
        const root = document.documentElement;
        
        window.themeCustomizer.on('color-change', function(property, value) {
            root.style.setProperty(`--${property}`, value);
        });
        
        window.themeCustomizer.on('typography-change', function(property, value) {
            root.style.setProperty(`--${property}`, value);
        });
        
        window.themeCustomizer.on('layout-change', function(property, value) {
            root.style.setProperty(`--${property}`, value);
        });
    }
});
