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
            if (!file_res.ok) {
                throw new Error(
                    localize('Could not download that bot\u2019s strategy file. Check your connection and try again.')
                );
            }
            const block_string = await file_res.text();

            // IMPORTANT: do not call handleTabChange(BOT_BUILDER) before this.
            // The already-working Upload Bot flow (load-modal-store.ts) reads
            // window.Blockly.derivWorkspace directly with no wait/poll at
            // all, which confirms the workspace is already mounted early
            // regardless of which tab is currently showing. Switching tabs
            // here first (tried once before) causes the load to run against
            // a component mid-unmount/remount and gets stuck loading forever
            // - switch AFTER a successful load instead, same as Upload Bot.
            const workspace = window.Blockly?.derivWorkspace;
            if (!workspace) {
                throw new Error(localize('Bot Builder isn\u2019t ready yet. Please try again in a moment.'));
            }

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
                throw new Error(localize('That bot file could not be loaded. It may be corrupted or out of date.'));
            }

            handleTabChange(DBOT_TABS.BOT_BUILDER);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : localize('Couldn\u2019t open that bot. Please try again.'));
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div
            className='free-bots'
            style={{
                maxHeight: 'calc(100vh - 8rem)',
                overflowY: 'scroll',
                WebkitOverflowScrolling: 'touch',
            }}
        >
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

            <div className='free-bots__list'>
                {bots?.map(bot => (
                    <div key={bot.id} className='free-bots__card'>
                        <div className='free-bots__card-top'>
                            {bot.image_url ? (
                                <img src={bot.image_url} alt={bot.name} className='free-bots__icon' />
                            ) : (
                                <div className='free-bots__icon free-bots__icon--fallback'>&#9889;</div>
                            )}
                            <span className='free-bots__name'>{bot.name}</span>
                        </div>
                        {bot.description && <p className='free-bots__desc'>{bot.description}</p>}
                        {bot.bot_file_url ? (
                            <button
                                type='button'
                                className='free-bots__run-btn'
                                onClick={() => openBot(bot)}
                                disabled={loadingId === bot.id}
                            >
                                <span className='free-bots__run-icon'>&#9889;</span>
                                {loadingId === bot.id ? localize('Loading\u2026') : localize('Run Bot')}
                            </button>
                        ) : (
                            <button type='button' className='free-bots__run-btn free-bots__run-btn--disabled' disabled>
                                {localize('Coming soon')}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
});

export default FreeBots;
