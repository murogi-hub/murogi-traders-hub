import { observer } from 'mobx-react-lite';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useLogout } from '@/hooks/useLogout';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
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

const QuickActions = observer(() => {
    const { dashboard } = useStore();
    const { setActiveTab } = dashboard;
    const handleLogout = useLogout();

    const actions: TQuickAction[] = [
        {
            id: 'bot-builder',
            color: 'orange',
            icon: '🤖',
            title: localize('Bot Builder'),
            description: localize('Build an automated trading strategy with drag-and-drop blocks.'),
            cta: localize('Open'),
            onClick: () => setActiveTab(DBOT_TABS.BOT_BUILDER),
        },
        {
            id: 'charts',
            color: 'green',
            icon: '📊',
            title: localize('Charts'),
            description: localize('Live price charts with technical indicators for your markets.'),
            cta: localize('Open'),
            onClick: () => setActiveTab(DBOT_TABS.CHART),
        },
        {
            id: 'tutorials',
            color: 'purple',
            icon: '🎓',
            title: localize('Tutorials'),
            description: localize('New here? Walk through guided tutorials to get started fast.'),
            cta: localize('Open'),
            onClick: () => setActiveTab(DBOT_TABS.TUTORIAL),
        },
        {
            id: 'logout',
            color: 'yellow',
            icon: '🔒',
            title: localize('Log out'),
            description: localize('End your session on this device.'),
            cta: localize('Log out'),
            onClick: () => handleLogout(),
        },
    ];

    return (
        <div className='quick-actions'>
            <div className='quick-actions__label'>{localize('Quick Actions')}</div>
            <div className='quick-actions__cards'>
                {actions.map(action => (
                    <button
                        key={action.id}
                        type='button'
                        className={`quick-actions__card quick-actions__card--${action.color}`}
                        onClick={action.onClick}
                    >
                        <span className='quick-actions__icon'>{action.icon}</span>
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
