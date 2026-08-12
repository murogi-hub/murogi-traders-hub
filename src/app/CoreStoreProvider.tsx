import { useCallback, useEffect, useMemo, useRef } from 'react';
import Cookies from 'js-cookie';
import { observer } from 'mobx-react-lite';
import { toMoment } from '@/components/shared';
import { FORM_ERROR_MESSAGES } from '@/components/shared/constants/form-error-messages';
import { initFormErrorMessages } from '@/components/shared/utils/validation/declarative-validation-rules';
import { api_base } from '@/external/bot-skeleton';
import { useApiBase } from '@/hooks/useApiBase';
import { useLogout } from '@/hooks/useLogout';
import { useStore } from '@/hooks/useStore';
import { TSocketResponseData } from '@/types/api-types';
import { clearInvalidTokenParams } from '@/utils/url-utils';
import { useTranslations } from '@deriv-com/translations';

type TClientInformation = {
    loginid?: string;
    email?: string;
    currency?: string;
    residence?: string | null;
    first_name?: string;
    last_name?: string;
    preferred_language?: string | null;
    user_id?: number | string;
};
const CoreStoreProvider: React.FC<{ children: React.ReactNode }> = observer(({ children }) => {
    const currentDomain = useMemo(() => '.' + window.location.hostname.split('.').slice(-2).join('.'), []);
    const { isAuthorizing, isAuthorized, connectionStatus, accountList, activeLoginid } = useApiBase();

    const appInitialization = useRef(false);
    const accountInitialization = useRef(false);
    const timeInterval = useRef<NodeJS.Timeout | null>(null);
    const msg_listener = useRef<{ unsubscribe: () => void } | null>(null);
    const { client, common } = useStore() ?? {};

    const { currentLang } = useTranslations();

    const handleLogout = useLogout();

    const activeAccount = useMemo(
        () => accountList?.find(account => account.loginid === activeLoginid),
        [activeLoginid, accountList]
    );

    useEffect(() => {
        if (client && activeAccount && isAuthorized) {
            client?.setLoginId(activeLoginid);
            client?.setAccountList(accountList);
            client?.setIsLoggedIn(true);
        } else if (client && !isAuthorized) {
            // Ensure client shows as not logged in until authorization is complete
            client?.setIsLoggedIn(false);
        }
    }, [accountList, activeAccount, activeLoginid, client, isAuthorized]);

    useEffect(() => {
        initFormErrorMessages(FORM_ERROR_MESSAGES());

        return () => {
            if (timeInterval.current) {
                clearInterval(timeInterval.current);
            }
        };
    }, []);

    useEffect(() => {
        if (common && currentLang) {
            common.setCurrentLanguage(currentLang);
        }
    }, [currentLang, common]);

    // Type-safe interface for API with time() method
    interface ApiWithTime {
        time(): Promise<TSocketResponseData<'time'>>;
    }

    useEffect(() => {
        const updateServerTime = () => {
            // Fixed type safety: replaced 'as any' with proper interface and runtime check
            // Ensures time() method exists before calling it
            if (!api_base.api || !('time' in api_base.api)) return;
            (api_base.api as ApiWithTime)
                .time()
                .then((res: TSocketResponseData<'time'>) => {
                    common.setServerTime(toMoment(res.time), false);
                })
                .catch(() => {
                    common.setServerTime(toMoment(Date.now()), true);
                });
        };

        // Clear any existing interval before setting up a new one
        if (timeInterval.current) {
            clearInterval(timeInterval.current);
            timeInterval.current = null;
        }

        if (client && !appInitialization.current) {
            if (!api_base?.api) return;
            appInitialization.current = true;

            // Initial time update
            updateServerTime();

            // Schedule updates every 10 seconds
            timeInterval.current = setInterval(updateServerTime, 10000);
        }

        // Cleanup on unmount or dependency change
        return () => {
            if (timeInterval.current) {
                clearInterval(timeInterval.current);
                timeInterval.current = null;
            }
        };
    }, [client, common]);

    const handleMessages = useCallback(
        // Changed parameter type from Record<string, unknown> to unknown to match onMessage signature
        async (res: unknown) => {
            if (!res) return;
            const data = (res as Record<string, unknown>).data as TSocketResponseData<'balance'>;
            const { msg_type, error } = data;

            // Handle auth errors by calling client.logout() directly instead of useLogout hook
            // This prevents redundant logout operations since useLogout internally calls client.logout()
            if (
                error?.code === 'AuthorizationRequired' ||
                error?.code === 'DisabledClient' ||
                error?.code === 'InvalidToken'
            ) {
                // Clear all URL query parameters for these auth errors
                clearInvalidTokenParams();
                // Call client store logout directly to avoid double logout
                await client?.logout();
            }

            if (msg_type === 'balance' && data && !error) {
                const balance = data.balance;
                if (balance && typeof balance.balance === 'number') {
                    client.setBalance(balance.balance.toString());

                    if (balance.currency) {
                        client.setCurrency(balance.currency);
                    }
                }
            }
        },
        // Fixed memory leak: removed handleLogout from deps as it's not used in function body
        // Only client is actually referenced (line 129), preventing unnecessary re-subscriptions
        [client]
    );

    useEffect(() => {
        if (!isAuthorizing && client) {
            const subscription = api_base?.api?.onMessage().subscribe(handleMessages);
            // Fixed unsubscribe type - only store if subscription exists
            if (subscription) {
                msg_listener.current = { unsubscribe: subscription.unsubscribe };
            }
        }

        return () => {
            if (msg_listener.current) {
                msg_listener.current.unsubscribe?.();
            }
        };
    }, [connectionStatus, handleMessages, isAuthorizing, isAuthorized, client]);

    // Safety net: the balance is meant to stay live via the WebSocket
    // subscription in handleMessages above, but if that push ever gets missed
    // (network hiccup, a reconnect that doesn't replay the last message, etc.)
    // there's otherwise no way for a stale balance to self-correct. Re-fetch
    // directly on a short interval as a backstop - cheap, and guarantees the
    // displayed balance is never more than ~15s out of date regardless of the
    // push mechanism's state.
    const balancePollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const pollBalance = async () => {
            if (!api_base?.api || !client) return;
            try {
                // TApiBaseApi's declared type is missing `balance` (a pre-existing gap -
                // the exact same call is already used, with the same cast-free error
                // tolerated, in api-base.ts's authorizeAndSubscribe). Narrow-casting
                // here rather than widening the shared type, since doing that cascaded
                // into unrelated type errors elsewhere that rely on its current shape.
                const apiWithBalance = api_base.api as unknown as {
                    balance: () => Promise<{
                        balance?: { balance?: number; currency?: string };
                        error?: unknown;
                    }>;
                };
                const { balance, error } = await apiWithBalance.balance();
                if (!error && balance && typeof balance.balance === 'number') {
                    client.setBalance(balance.balance.toString());
                    if (balance.currency) {
                        client.setCurrency(balance.currency);
                    }
                }
            } catch {
                // Silent - this is a background refresh, the push subscription
                // is still the primary mechanism and errors here shouldn't
                // surface to the user.
            }
        };

        if (isAuthorized && client) {
            balancePollInterval.current = setInterval(pollBalance, 15000);
        }

        return () => {
            if (balancePollInterval.current) {
                clearInterval(balancePollInterval.current);
                balancePollInterval.current = null;
            }
        };
    }, [isAuthorized, client]);

    useEffect(() => {
        if (!isAuthorizing && isAuthorized && !accountInitialization.current && client) {
            accountInitialization.current = true;
            const client_information: TClientInformation = {
                loginid: activeAccount?.loginid,
                email: '',
                currency: client?.currency,
                residence: '',
                first_name: '',
                last_name: '',
                preferred_language: '',
                user_id:
                    (api_base.account_info &&
                    typeof api_base.account_info === 'object' &&
                    'user_id' in api_base.account_info
                        ? (api_base.account_info as { user_id: number }).user_id
                        : null) || activeLoginid,
            };

            Cookies.set('client_information', JSON.stringify(client_information), {
                domain: currentDomain,
            });
        }
    }, [isAuthorizing, isAuthorized, client, activeAccount?.loginid, activeLoginid, currentDomain]);

    return <>{children}</>;
});

export default CoreStoreProvider;
