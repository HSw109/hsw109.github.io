// Anime Cursor Follower
class AnimeCursorFollower {
    constructor() {
        this.follower = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.followerX = 0;
        this.followerY = 0;
        this.lastDirection = 'right';
        this.isExcited = false;
        
        // Array of cute anime girl images (you can replace with your preferred images)
        this.characters = [
            'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Woman%20technologist/3D/woman_technologist_3d.png',
            'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Woman%20student/3D/woman_student_3d.png',
            'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Woman%20scientist/3D/woman_scientist_3d.png'
        ];
        
        this.currentCharacter = 0;
        this.init();
    }
    
    init() {
        this.createFollower();
        this.addEventListeners();
        this.animate();
        
        // Random blinking
        setInterval(() => {
            this.blink();
        }, 3000 + Math.random() * 4000); // Random blink every 3-7 seconds
        
        // Change character occasionally
        setInterval(() => {
            this.changeCharacter();
        }, 30000); // Change character every 30 seconds
    }
    
    createFollower() {
        this.follower = document.createElement('div');
        this.follower.id = 'anime-cursor-follower';
        this.follower.innerHTML = `<img src="${this.characters[this.currentCharacter]}" alt="Anime cursor follower" />`;
        document.body.appendChild(this.follower);
        
        // Start position (bottom right corner)
        this.followerX = window.innerWidth - 120;
        this.followerY = window.innerHeight - 120;
        this.updatePosition();
    }
    
    addEventListeners() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        // Excitement on hover over clickable elements
        document.addEventListener('mouseover', (e) => {
            if (this.isClickable(e.target)) {
                this.setExcited(true);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (this.isClickable(e.target)) {
                this.setExcited(false);
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.constrainPosition();
        });
    }
    
    isClickable(element) {
        return element.tagName === 'A' || 
               element.tagName === 'BUTTON' || 
               element.onclick !== null ||
               element.style.cursor === 'pointer' ||
               element.classList.contains('clickable');
    }
    
    setExcited(excited) {
        this.isExcited = excited;
        if (excited) {
            this.follower.classList.add('excited');
        } else {
            this.follower.classList.remove('excited');
        }
    }
    
    animate() {
        // Smooth following with easing
        const ease = 0.15; // Increased from 0.1 for slightly faster following
        const dx = this.mouseX - this.followerX;
        const dy = this.mouseY - this.followerY;
        
        this.followerX += dx * ease;
        this.followerY += dy * ease;
        
        // Determine direction for flipping
        if (dx > 5 && this.lastDirection === 'left') {
            this.lastDirection = 'right';
            this.follower.classList.remove('flip');
        } else if (dx < -5 && this.lastDirection === 'right') {
            this.lastDirection = 'left';
            this.follower.classList.add('flip');
        }
        
        this.constrainPosition();
        this.updatePosition();
        
        requestAnimationFrame(() => this.animate());
    }
    
    constrainPosition() {
        // Keep the follower within viewport bounds with smaller margins
        const margin = 25; // Reduced from 50 for closer following
        this.followerX = Math.max(margin, Math.min(window.innerWidth - margin, this.followerX));
        this.followerY = Math.max(margin, Math.min(window.innerHeight - margin, this.followerY));
    }
    
    updatePosition() {
        if (this.follower) {
            // Reduced offset for closer following (since image is now 50% size)
            this.follower.style.left = this.followerX - 25 + 'px'; // Reduced from 50
            this.follower.style.top = this.followerY - 35 + 'px';  // Reduced from 100, closer to cursor
        }
    }
    
    blink() {
        if (this.follower) {
            this.follower.classList.add('blink');
            setTimeout(() => {
                this.follower.classList.remove('blink');
            }, 300);
        }
    }
    
    changeCharacter() {
        this.currentCharacter = (this.currentCharacter + 1) % this.characters.length;
        const img = this.follower.querySelector('img');
        if (img) {
            img.src = this.characters[this.currentCharacter];
        }
    }
    
    // Public method to change character manually
    setCharacter(index) {
        if (index >= 0 && index < this.characters.length) {
            this.currentCharacter = index;
            const img = this.follower.querySelector('img');
            if (img) {
                img.src = this.characters[this.currentCharacter];
            }
        }
    }
    
    // Public method to add custom character
    addCharacter(imageUrl) {
        this.characters.push(imageUrl);
    }
    
    // Public method to hide/show follower
    toggle() {
        if (this.follower) {
            this.follower.style.display = this.follower.style.display === 'none' ? 'block' : 'none';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if user prefers reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.animeCursorFollower = new AnimeCursorFollower();
    }
});

// Console commands for fun
console.log(`
🌟 Anime Cursor Follower Commands:
- animeCursorFollower.setCharacter(0-2) - Change character
- animeCursorFollower.addCharacter('url') - Add custom character
- animeCursorFollower.toggle() - Hide/show follower
- animeCursorFollower.blink() - Make her blink
`);
