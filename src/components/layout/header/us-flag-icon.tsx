import React from 'react';

/** Small circular American flag, shown beside "Real account". */
type TUsFlagIcon = { size?: number; className?: string };

const UsFlagIcon = ({ size = 16, className }: TUsFlagIcon) => {
    const stripe_height = 10 / 13;
    const stars: Array<[number, number]> = [];
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
            stars.push([0.9 + col * 1.35, 0.8 + row * 1.2]);
        }
    }

    return (
        <span
            className={['acc-flag', className].filter(Boolean).join(' ')}
            style={{ width: size, height: size }}
            role='img'
            aria-label='United States flag'
        >
            <svg
                width='100%'
                height='100%'
                viewBox='0 0 19 10'
                preserveAspectRatio='xMinYMid slice'
                xmlns='http://www.w3.org/2000/svg'
                aria-hidden='true'
            >
                <rect width='19' height='10' fill='#ffffff' />
                {Array.from({ length: 7 }).map((_, i) => (
                    <rect
                        key={i}
                        y={i * 2 * stripe_height}
                        width='19'
                        height={stripe_height}
                        fill='#b22234'
                    />
                ))}
                <rect width='7.6' height={7 * stripe_height} fill='#3c3b6e' />
                {stars.map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r='0.28' fill='#ffffff' />
                ))}
            </svg>
        </span>
    );
};

export default UsFlagIcon;
