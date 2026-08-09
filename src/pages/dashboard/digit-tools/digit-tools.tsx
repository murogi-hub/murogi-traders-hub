import { useMemo, useState } from 'react';
import { useDigitStream } from './use-digit-stream';
import './digit-tools.scss';

const SYMBOLS = [
    { value: 'R_10', label: 'Volatility 10 Index' },
    { value: 'R_25', label: 'Volatility 25 Index' },
    { value: 'R_50', label: 'Volatility 50 Index' },
    { value: 'R_75', label: 'Volatility 75 Index' },
    { value: 'R_100', label: 'Volatility 100 Index' },
    { value: '1HZ10V', label: 'Volatility 10 (1s) Index' },
    { value: '1HZ25V', label: 'Volatility 25 (1s) Index' },
    { value: '1HZ50V', label: 'Volatility 50 (1s) Index' },
    { value: '1HZ75V', label: 'Volatility 75 (1s) Index' },
    { value: '1HZ100V', label: 'Volatility 100 (1s) Index' },
];

const TICK_COUNT_OPTIONS = [25, 50, 100, 250, 500, 1000];

const RING_COLORS = [
    '#ff5a5a',
    '#ff6b4a',
    '#ffb84a',
    '#f4d35e',
    '#8bd17c',
    '#2ed8a7',
    '#4ad0d0',
    '#5b8cff',
    '#a76bff',
    '#ff6bc9',
];

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DigitRing = ({
    digit,
    percent,
    relativeFill,
    isHot,
    isCold,
}: {
    digit: number;
    percent: number;
    relativeFill: number;
    isHot: boolean;
    isCold: boolean;
}) => {
    const offset = CIRCUMFERENCE * (1 - relativeFill / 100);

    return (
        <div className={`twh-digit-ring ${isHot ? 'twh-digit-ring--hot' : ''} ${isCold ? 'twh-digit-ring--cold' : ''}`}>
            <svg width='64' height='64' viewBox='0 0 64 64'>
                <circle className='twh-digit-ring__track' cx='32' cy='32' r={RADIUS} />
                <circle
                    className='twh-digit-ring__fill'
                    cx='32'
                    cy='32'
                    r={RADIUS}
                    stroke={RING_COLORS[digit]}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={offset}
                />
                <text x='32' y='29' textAnchor='middle' className='twh-digit-ring__digit'>
                    {digit}
                </text>
                <text x='32' y='42' textAnchor='middle' className='twh-digit-ring__pct'>
                    {percent.toFixed(2)}%
                </text>
            </svg>
            {isHot && <span className='twh-digit-ring__badge twh-digit-ring__badge--hot'>Hot</span>}
            {isCold && <span className='twh-digit-ring__badge twh-digit-ring__badge--cold'>Cold</span>}
        </div>
    );
};

const DigitTools = () => {
    const [symbol, setSymbol] = useState('R_100');
    const [tickCount, setTickCount] = useState(100);
    const [barrier, setBarrier] = useState(5);
    const [showMore, setShowMore] = useState(false);

    const { digits, connected, error } = useDigitStream(symbol, tickCount);

    const stats = useMemo(() => {
        const counts = new Array(10).fill(0);
        digits.forEach(d => {
            if (d >= 0 && d <= 9) counts[d] += 1;
        });
        const total = digits.length || 1;
        const percents = counts.map(c => (c / total) * 100);
        const maxPercent = Math.max(...percents, 0.0001);
        const minPercent = digits.length ? Math.min(...percents) : 0;
        const hotDigit = digits.length ? percents.indexOf(maxPercent) : -1;
        const coldDigit = digits.length ? percents.indexOf(minPercent) : -1;

        const overCount = digits.filter(d => d > barrier).length;
        const underCount = digits.filter(d => d <= barrier).length;
        const overPct = digits.length ? (overCount / digits.length) * 100 : 0;
        const underPct = digits.length ? (underCount / digits.length) * 100 : 0;

        const classifications = digits.map(d => (d > barrier ? 'O' : 'U'));

        let streak = 0;
        let streakType: 'O' | 'U' | null = null;
        for (let i = classifications.length - 1; i >= 0; i -= 1) {
            if (streakType === null) {
                streakType = classifications[i] as 'O' | 'U';
                streak = 1;
            } else if (classifications[i] === streakType) {
                streak += 1;
            } else {
                break;
            }
        }

        return { counts, percents, maxPercent, hotDigit, coldDigit, overPct, underPct, classifications, streak, streakType };
    }, [digits, barrier]);

    const visibleOutcomes = showMore ? stats.classifications.slice(-30) : stats.classifications.slice(-10);

    return (
        <div className='twh-digit-tools'>
            <div className='twh-digit-tools__header'>
                <div className='twh-digit-tools__label'>D-Circles &amp; Analysis</div>
                <div className='twh-digit-tools__controls'>
                    <select value={symbol} onChange={e => setSymbol(e.target.value)}>
                        {SYMBOLS.map(s => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <select value={tickCount} onChange={e => setTickCount(Number(e.target.value))}>
                        {TICK_COUNT_OPTIONS.map(n => (
                            <option key={n} value={n}>
                                Last {n} ticks
                            </option>
                        ))}
                    </select>
                    <span className={`twh-digit-tools__status ${connected ? 'is-live' : ''}`}>
                        <span className='dot' /> {connected ? 'Live' : 'Connecting...'}
                    </span>
                </div>
            </div>

            {error && <div className='twh-digit-tools__error'>{error}</div>}

            <div className='twh-digit-tools__rings'>
                {stats.percents.map((pct, digit) => (
                    <DigitRing
                        key={digit}
                        digit={digit}
                        percent={pct}
                        relativeFill={digits.length ? Math.max((pct / stats.maxPercent) * 100, 8) : 0}
                        isHot={digits.length > 0 && digit === stats.hotDigit}
                        isCold={digits.length > 0 && digit === stats.coldDigit}
                    />
                ))}
            </div>

            <div className='twh-digit-tools__analysis'>
                <div className='twh-digit-tools__analysis-top'>
                    <span>Over/Under Analysis</span>
                    <span className='twh-digit-tools__streak'>
                        Current streak: <strong>{stats.streak}x {stats.streakType === 'O' ? 'Over' : stats.streakType === 'U' ? 'Under' : '-'}</strong>
                    </span>
                </div>

                <div className='twh-digit-tools__barrier-row'>
                    {Array.from({ length: 10 }, (_, d) => d).map(d => (
                        <button
                            key={d}
                            className={`twh-digit-tools__barrier-btn ${d === barrier ? 'is-active' : ''}`}
                            onClick={() => setBarrier(d)}
                        >
                            {d}
                        </button>
                    ))}
                </div>

                <div className='twh-digit-tools__bars'>
                    <div className='twh-digit-tools__bar twh-digit-tools__bar--over'>
                        <div className='twh-digit-tools__bar-label'>
                            <span>Over {barrier}</span>
                            <span>{stats.overPct.toFixed(1)}%</span>
                        </div>
                        <div className='twh-digit-tools__bar-track'>
                            <div className='twh-digit-tools__bar-fill' style={{ width: `${stats.overPct}%` }} />
                        </div>
                    </div>
                    <div className='twh-digit-tools__bar twh-digit-tools__bar--under'>
                        <div className='twh-digit-tools__bar-label'>
                            <span>Under {barrier}</span>
                            <span>{stats.underPct.toFixed(1)}%</span>
                        </div>
                        <div className='twh-digit-tools__bar-track'>
                            <div className='twh-digit-tools__bar-fill' style={{ width: `${stats.underPct}%` }} />
                        </div>
                    </div>
                </div>

                <div className='twh-digit-tools__outcomes'>
                    {visibleOutcomes.map((c, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <span key={i} className={`twh-digit-tools__chip ${c === 'O' ? 'is-over' : 'is-under'}`}>
                            {c}
                        </span>
                    ))}
                    {stats.classifications.length > 10 && (
                        <button className='twh-digit-tools__more' onClick={() => setShowMore(v => !v)}>
                            {showMore ? 'Less' : 'More'}
                        </button>
                    )}
                </div>

                <p className='twh-digit-tools__disclaimer'>
                    ⚠ For informational purposes only. Past digit frequency does not predict future outcomes.
                </p>
            </div>
        </div>
    );
};

export default DigitTools;
