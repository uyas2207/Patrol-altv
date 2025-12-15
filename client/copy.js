        this.viewDistance = 8.0;     // длина конуса
        this.viewAngle = 60;         // угол обзора (градусы)
        const halfAngle = 30
        steps = 12
        for (let i = -halfAngle; i <= halfAngle; i += this.viewAngle / steps) 
        i = -30; i <= 30; i = i + (60 / 12)
i = -30 + (60 / 12);
i = -30 + 5; i = -25;      //12 шагов всего

const angle = (heading + i) * (Math.PI / 180);