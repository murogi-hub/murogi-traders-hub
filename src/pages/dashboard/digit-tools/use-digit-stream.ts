import { useEffect, useRef, useState } from 'react';

const APP_ID = '340wutvNtAldWVNWazqCC';
const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

export interface DigitStreamResult {
    /** Last digit of each tick's quote, oldest first, newest last. */
    digits: number[];
    connected: boolean;
    error: string | null;
}

/**
 * Streams live tick data for `symbol` from Deriv's public API (no login required)
 * and reduces each tick down to its last decimal digit (0-9). Keeps at most
 * `maxTicks` digits, dropping the oldest as new ticks arrive.
 *
 * Decimal precision (pip size) is fetched once per connection via `active_symbols`
 * so digits are computed correctly regardless of how the browser's JSON parser
 * trims trailing zeros off the raw price numbers.
 */
export function useDigitStream(symbol: string, maxTicks: number): DigitStreamResult {
    const [digits, setDigits] = useState<number[]>([]);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const decimalsRef = useRef<number>(2);

    useEffect(() => {
        setDigits([]);
        setError(null);
        setConnected(false);
        decimalsRef.current = 2;

        let cancelled = false;
        const ws = new WebSocket(WS_URL);

        const toDigit = (quote: number) => {
            const str = quote.toFixed(decimalsRef.current);
            return Number(str.slice(-1));
        };

        ws.onopen = () => {
            if (cancelled) return;
            setConnected(true);
            ws.send(JSON.stringify({ active_symbols: 'brief', product_type: 'basic' }));
        };

        ws.onmessage = event => {
            if (cancelled) return;
            let data: any;
            try {
                data = JSON.parse(event.data);
            } catch {
                return;
            }

            if (data.error) {
                setError(data.error.message || 'Could not load tick data.');
                return;
            }

            if (data.msg_type === 'active_symbols' && Array.isArray(data.active_symbols)) {
                const found = data.active_symbols.find((s: any) => s.symbol === symbol);
                if (found?.pip) {
                    const decimalPart = String(found.pip).split('.')[1] || '';
                    decimalsRef.current = decimalPart.length || 2;
                }
                ws.send(
                    JSON.stringify({
                        ticks_history: symbol,
                        adjust_start_time: 1,
                        count: maxTicks,
                        end: 'latest',
                        start: 1,
                        style: 'ticks',
                        subscribe: 1,
                    })
                );
                return;
            }

            if (data.msg_type === 'history' && data.history?.prices) {
                const prices: number[] = data.history.prices.map((p: string | number) => Number(p));
                setDigits(prices.map(toDigit));
                return;
            }

            if (data.msg_type === 'tick' && data.tick) {
                const digit = toDigit(Number(data.tick.quote));
                setDigits(prev => {
                    const next = [...prev, digit];
                    return next.length > maxTicks ? next.slice(next.length - maxTicks) : next;
                });
            }
        };

        ws.onerror = () => {
            if (!cancelled) setError('Connection error. Retrying may help.');
        };

        ws.onclose = () => {
            if (!cancelled) setConnected(false);
        };

        return () => {
            cancelled = true;
            try {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ forget_all: 'ticks' }));
                }
                ws.close();
            } catch {
                /* noop */
            }
        };
    }, [symbol, maxTicks]);

    return { digits, connected, error };
}
