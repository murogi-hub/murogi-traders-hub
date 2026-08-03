import './chunk-loader.scss';

export default function ChunkLoader({ message }: { message: string }) {
    return (
        <div className='brand-loader'>
            <div className='brand-loader__stage'>
                <img src='/assets/branding/logo.png' alt='Trade With Hunna' className='brand-loader__logo' />
                <svg className='brand-loader__glow' viewBox='0 0 1024 1024' aria-hidden='true'>
                    <circle className='brand-loader__dot brand-loader__dot--main' r='9' fill='#fff' />
                    <circle className='brand-loader__dot brand-loader__dot--arm-h' r='6' fill='#fff' />
                    <circle className='brand-loader__dot brand-loader__dot--arm-v' r='6' fill='#fff' />
                    <circle className='brand-loader__flash' cx='787' cy='258' r='16' fill='#fff' />
                </svg>
            </div>
            <div className='brand-loader__message'>{message}</div>
        </div>
    );
}
