import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { DBOT_TABS } from '@/constants/bot-contents';
import { load, save_types } from '@/external/bot-skeleton';
import { localize } from '@deriv-com/translations';
import { BACKEND_URL, Bot } from '../site-dashboard/backend-config';
import './free-bots.scss';

type TFreeBotsProps = {
    handleTabChange: (tab: number) => void;
};

declare global {
    interface Window {
        Blockly?: { derivWorkspace?: unknown };
    }
}

const FreeBots = observer(({ handleTabChange }: TFreeBotsProps) => {
    const [bots, setBots] = useState<Bot[] | null>(null);
    const [fetchError, setFetchError] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        fetch(`${BACKEND_URL}/api/bots`)
            .then(res => res.json())
            .then(data => setBots(Array.isArray(data) ? data : []))
            .catch(() => setFetchError(true));
    }, []);

    const openBot = async (bot: Bot) => {
        if (!bot.bot_file_url) {
            setLoadError(localize('This bot doesn\u2019t have a strategy file attached yet.'));
            return;
        }
        setLoadError('');
        setLoadingId(bot.id);
        try {
            const file_res = await fetch(bot.bot_file_url);
            if (!file_res.ok) throw new Error('download_failed');
            const block_string = await file_res.text();

            const workspace = window.Blockly?.derivWorkspace;
            if (!workspace) throw new Error('workspace_not_ready');

            const result = await load({
                block_string,
                file_name: bot.name,
                workspace,
                from: save_types.LOCAL,
                drop_event: null,
                strategy_id: null,
                showIncompatibleStrategyDialog: null,
            });

            if (result && (result as { error?: string }).error) {
                setLoadError(localize('That bot file could not be loaded. It may be corrupted or out of date.'));
                return;
            }

            handleTabChange(DBOT_TABS.BOT_BUILDER);
        } catch {
            setLoadError(localize('Couldn\u2019t open that bot. Please try again.'));
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className='free-bots'>
            <div className='free-bots__header'>
                <h3 className='free-bots__title'>{localize('Free Bots')}</h3>
                <p className='free-bots__hint'>
                    {localize('Tap a bot to load it straight into Bot Builder, ready to run.')}
                </p>
            </div>

            {!bots && !fetchError && <div className='free-bots__status'>{localize('Loading bots\u2026')}</div>}
            {fetchError && <div className='free-bots__status'>{localize('Couldn\u2019t load bots right now.')}</div>}
            {bots && bots.length === 0 && (
                <div className='free-bots__status'>{localize('No free bots yet. Check back soon.')}</div>
            )}
            {loadError && <div className='free-bots__error'>{loadError}</div>}

            <div className='free-bots__grid'>
                {bots?.map(bot => (
                    <button
                        key={bot.id}
                        type='button'
                        className='free-bots__card'
                        onClick={() => openBot(bot)}
                        disabled={loadingId === bot.id}
                    >
                        {bot.image_url ? (
                            <img src={bot.image_url} alt={bot.name} className='free-bots__pic' />
                        ) : (
                            <div className='free-bots__pic free-bots__pic--fallback'>🤖</div>
                        )}
                        <span className='free-bots__name'>{bot.name}</span>
                        {bot.description && <span className='free-bots__desc'>{bot.description}</span>}
                        <span className='free-bots__open'>
                            {loadingId === bot.id ? localize('Loading\u2026') : localize('Open \u2192')}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
});

export default FreeBots;
