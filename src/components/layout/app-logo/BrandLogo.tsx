// Trade With Hunna brand wordmark

type TBrandLogoProps = {
    width?: number;
    height?: number;
    fill?: string;
    className?: string;
};

export const BrandLogo = ({
    width = 150,
    height = 32,
    fill = 'currentColor',
    className = ''
}: TBrandLogoProps) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 150 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Trade With Hunna"
        >
            <text
                x="0"
                y="22"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="20"
                fontWeight="700"
                fill={fill}
            >
                Hunna<tspan fill="#ff5a5a">Bot</tspan>
            </text>
        </svg>
    );
};
