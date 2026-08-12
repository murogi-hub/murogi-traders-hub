import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import './quick-actions.scss';

type TQuickAction = {
    id: string;
    color: 'orange' | 'green' | 'purple' | 'yellow';
    icon: string;
    title: string;
    description: string;
    cta: string;
    onClick: () => void;
};

const QUOTES = [
    localize('Small consistent gains build extraordinary wealth.'),
    localize('Discipline turns strategy into results.'),
    localize('Protect your capital first, profits follow.'),
    localize('Every trade is a lesson - review, refine, repeat.'),
    localize('Patience is a position too.'),
];

const QuickActions = observer(() => {
    const { dashboard, client, load_modal, quick_strategy } = useStore();
    const { setActiveTab } = dashboard;
    const { toggleLoadModal, setActiveTabIndex } = load_modal;
    const { setFormVisibility } = quick_strategy;
    const { isDesktop } = useDevice();
    const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

    const openFileLoader = () => {
        toggleLoadModal();
        setActiveTabIndex(isDesktop ? 1 : 0);
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    const actions: TQuickAction[] = [
        {
            id: 'upload-bot',
            color: 'orange',
            icon: '📁',
            title: localize('Upload Bot'),
            description: localize('Import an XML bot from your computer'),
            cta: localize('Open'),
            onClick: openFileLoader,
        },
        {
            id: 'free-bots',
            color: 'green',
            icon: '🤖',
            title: localize('Free Bots'),
            description: localize('Browse ready-made trading strategies'),
            cta: localize('Open'),
            onClick: () => setActiveTab(DBOT_TABS.FREE_BOTS),
        },
        {
            id: 'bot-editor',
            color: 'purple',
            icon: '🧩',
            title: localize('Bot Editor'),
            description: localize('Build a custom bot with the visual editor'),
            cta: localize('Open'),
            onClick: () => setActiveTab(DBOT_TABS.BOT_BUILDER),
        },
        {
            id: 'quick-strategy',
            color: 'yellow',
            icon: '⚡',
            title: localize('Quick Strategy'),
            description: localize('Start fast with a pre-built strategy template'),
            cta: localize('Open'),
            onClick: () => {
                setActiveTab(DBOT_TABS.BOT_BUILDER);
                setFormVisibility(true);
            },
        },
    ];

    return (
        <div className='quick-actions'>
            <div className='quick-actions__greeting'>
                <h2>
                    {localize('Hello')} {client?.is_logged_in ? client.loginid : localize('Trader')} <span>&#128075;</span>
                </h2>
                <p>&ldquo;{quote}&rdquo;</p>
            </div>
            <div className='quick-actions__label'>{localize('Quick Actions')}</div>
            <div className='quick-actions__cards'>
                {actions.map(action => (
                    <button
                        key={action.id}
                        type='button'
                        className={`quick-actions__card quick-actions__card--${action.color}`}
                        onClick={action.onClick}
                    >
                        <div className='quick-actions__card-top'>
                            <span className='quick-actions__icon'>{action.icon}</span>
                            <span className='quick-actions__arrow' aria-hidden='true'>
                                &rarr;
                            </span>
                        </div>
                        <span className='quick-actions__title'>{action.title}</span>
                        <span className='quick-actions__description'>{action.description}</span>
                        <span className='quick-actions__cta'>
                            {action.cta} <span aria-hidden='true'>&rarr;</span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
});

export default QuickActions;
