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
        this.size = 40;

        this.characters = [
            '/commons/svgs/45114-gojo.gif'
        ];
        this.currentCharacter = 0;
        this.init();
    }

    init() {
        this.createFollower();
        this.addEventListeners();
        this.animate();

        setInterval(() => this.blink(), 3000 + Math.random() * 4000);
        setInterval(() => this.changeCharacter(), 30000);
    }

    createFollower() {
        this.follower = document.createElement('div');
        this.follower.id = 'anime-cursor-follower';
        this.follower.innerHTML = `<img src="${this.characters[this.currentCharacter]}" alt="Anime cursor follower" />`;
        document.body.appendChild(this.follower);

        this.followerX = window.innerWidth - 80;
        this.followerY = window.innerHeight - 80;
        this.updatePosition();
    }

    addEventListeners() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        document.addEventListener('mouseover', (e) => {
            if (this.isClickable(e.target)) this.setExcited(true);
        });

        document.addEventListener('mouseout', (e) => {
            if (this.isClickable(e.target)) this.setExcited(false);
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
        const ease = 0.08;
        const dx = this.mouseX - this.followerX;
        const dy = this.mouseY - this.followerY;

        this.followerX += dx * ease;
        this.followerY += dy * ease;

        if (dx > 3 && this.lastDirection === 'left') {
            this.lastDirection = 'right';
            this.follower.classList.remove('flip');
        } else if (dx < -3 && this.lastDirection === 'right') {
            this.lastDirection = 'left';
            this.follower.classList.add('flip');
        }

        this.constrainPosition();
        this.updatePosition();

        requestAnimationFrame(() => this.animate());
    }

    constrainPosition() {
        var half = this.size / 2;
        this.followerX = Math.max(half, Math.min(window.innerWidth - half, this.followerX));
        this.followerY = Math.max(half, Math.min(window.innerHeight - half, this.followerY));
    }

    updatePosition() {
        if (this.follower) {
            var half = this.size / 2;
            this.follower.style.transform =
                'translate(' + (this.followerX - half) + 'px,' + (this.followerY - half) + 'px)' +
                (this.lastDirection === 'left' ? ' scaleX(-1)' : '');
        }
    }

    blink() {
        if (this.follower) {
            this.follower.classList.add('blink');
            setTimeout(() => this.follower.classList.remove('blink'), 300);
        }
    }

    changeCharacter() {
        this.currentCharacter = (this.currentCharacter + 1) % this.characters.length;
        var img = this.follower.querySelector('img');
        if (img) img.src = this.characters[this.currentCharacter];
    }

    setCharacter(index) {
        if (index >= 0 && index < this.characters.length) {
            this.currentCharacter = index;
            var img = this.follower.querySelector('img');
            if (img) img.src = this.characters[this.currentCharacter];
        }
    }

    addCharacter(imageUrl) {
        this.characters.push(imageUrl);
    }

    toggle() {
        if (this.follower) {
            this.follower.style.display = this.follower.style.display === 'none' ? 'block' : 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.animeCursorFollower = new AnimeCursorFollower();
    }
});
