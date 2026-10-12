import './chunk-loader.scss';

const FEATURES = [
    { icon: '🤖', label: 'Bot Builder' },
    { icon: '◎', label: 'D-Circles' },
    { icon: '📊', label: 'Charts' },
];

// Purely decorative - static, no network calls. This is the app's global
// loading fallback, so it must never depend on a live connection to render.
const TICKER = [
    { symbol: 'Volatility 100', change: '+0.9%', up: true },
    { symbol: 'GBP/USD', change: '-0.3%', up: false },
    { symbol: 'GOLD', change: '+0.5%', up: true },
];

export default function ChunkLoader({ message }: { message: string }) {
    return (
        <div className='brand-loader'>
            <div className='brand-loader__card'>
                <div className='brand-loader__stage'>
                    <img src='/assets/branding/logo-v2.png' alt='Murogi Trading Hub' className='brand-loader__logo' />
                    <svg className='brand-loader__glow' viewBox='0 0 1024 1024' aria-hidden='true'>
                        <circle className='brand-loader__dot brand-loader__dot--main' r='9' fill='#fff' />
                        <circle className='brand-loader__dot brand-loader__dot--arm-h' r='6' fill='#fff' />
                        <circle className='brand-loader__dot brand-loader__dot--arm-v' r='6' fill='#fff' />
                        <circle className='brand-loader__flash' cx='787' cy='258' r='16' fill='#fff' />
                    </svg>
                </div>

                <div className='brand-loader__wordmark'>
                    <span className='brand-loader__wordmark-a'>MUROGI</span>
                    <span className='brand-loader__wordmark-b'>TRADING HUB</span>
                </div>
                <div className='brand-loader__subrow'>
                    <span className='brand-loader__subrow-label'>AUTOMATED TRADING</span>
                    <span className='brand-loader__live-pill'>
                        <span className='brand-loader__live-dot' /> LIVE
                    </span>
                </div>

                <hr className='brand-loader__rule' />

                <h1 className='brand-loader__welcome'>Welcome to Murogi Trading Hub</h1>
                <p className='brand-loader__tagline'>Empowering your financial journey.</p>

                <div className='brand-loader__progress-track'>
                    <div className='brand-loader__progress-fill' />
                </div>

                <div className='brand-loader__status'>
                    <span className='brand-loader__spinner' />
                    <span className='brand-loader__message'>{message}</span>
                </div>

                <div className='brand-loader__dots'>
                    {Array.from({ length: 6 }).map((_, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <span key={i} className={`brand-loader__pdot ${i === 4 ? 'is-active' : ''}`} />
                    ))}
                </div>

                <div className='brand-loader__features'>
                    {FEATURES.map(f => (
                        <div className='brand-loader__feature' key={f.label}>
                            <span className='brand-loader__feature-icon'>{f.icon}</span>
                            <span className='brand-loader__feature-label'>{f.label}</span>
                        </div>
                    ))}
                </div>

                <p className='brand-loader__footer-tagline'>Preparing a seamless trading experience for you</p>
            </div>

            <div className='brand-loader__ticker'>
                {TICKER.map(t => (
                    <span className='brand-loader__ticker-item' key={t.symbol}>
                        {t.symbol}
                        <span className={`brand-loader__ticker-change ${t.up ? 'is-up' : 'is-down'}`}>
                            {t.up ? '▲' : '▼'} {t.change}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    );
}
