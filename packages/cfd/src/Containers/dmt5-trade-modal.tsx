import React from 'react';
import getStatusBadgeConfig from '@deriv/account/src/Configs/get-status-badge-config';
import { DetailsOfEachMT5Loginid } from '@deriv/api-types';
import { Text, Icon, Money, StatusBadge } from '@deriv/components';
import {
    getCFDAccountDisplay,
    getCFDAccountKey,
    getCFDPlatformLabel,
    getPlatformSettings,
    getUrlBase,
    MT5_ACCOUNT_STATUS,
} from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { Localize, localize } from '@deriv/translations';
import { getPlatformMt5DownloadLink, getBrokerName } from '../Helpers/constants';
import SpecBox from '../Components/specbox';
import PasswordBox from '../Components/passwordbox';
import TradingPlatformIcon from '../Assets/svgs/trading-platform';
import { TTradingPlatformAccounts } from '../Components/props.types';

import { TCFDPasswordReset } from './props.types';
import { CATEGORY, CFD_PLATFORMS, MARKET_TYPE, JURISDICTION } from '../Helpers/cfd-config';

type TMT5TradeModalProps = {
    mt5_trade_account: DetailsOfEachMT5Loginid & {
        webtrader_url?: string;
    };
    show_eu_related_content: boolean;
    onPasswordManager: (
        arg1: string | undefined,
        arg2: string,
        group: TCFDPasswordReset['account_group'],
        arg4: string,
        arg5: string | undefined
    ) => void;
    toggleModal: () => void;
};

const getTitle = (market_type: string, show_eu_related_content: boolean) => {
    if (show_eu_related_content) localize('MT5 CFDs');
    return market_type;
};

const DMT5TradeModal = observer(
    ({ mt5_trade_account, show_eu_related_content, onPasswordManager, toggleModal }: TMT5TradeModalProps) => {
        const { ui, client } = useStore();
        const { is_mobile } = ui;
        const {
            account_status: { authentication },
        } = client;

        const getCompanyShortcode = () => {
            if (
                (mt5_trade_account.account_type === CATEGORY.DEMO &&
                    mt5_trade_account.market_type === MARKET_TYPE.FINANCIAL &&
                    mt5_trade_account.landing_company_short === JURISDICTION.LABUAN) ||
                mt5_trade_account.account_type === CATEGORY.REAL
            ) {
                return mt5_trade_account.landing_company_short;
            }
            return undefined;
        };

        const getHeadingTitle = () =>
            getCFDAccountDisplay({
                market_type: mt5_trade_account.market_type,
                sub_account_type: mt5_trade_account.sub_account_type,
                platform: CFD_PLATFORMS.MT5,
                is_eu: show_eu_related_content,
                shortcode: getCompanyShortcode(),
                is_mt5_trade_modal: true,
            });
        const getAccountTitle = () => {
            if (show_eu_related_content) return 'CFDs';
            else if (mt5_trade_account.market_type === MARKET_TYPE.SYNTHETIC) return 'Derived';
            else if (mt5_trade_account.market_type === MARKET_TYPE.ALL) return 'SwapFree';
            return 'Financial';
        };

        const { text: badge_text, icon: badge_icon } = getStatusBadgeConfig(
            mt5_trade_account?.status,
            undefined,
            undefined,
            undefined,
            {
                poi_status: authentication?.identity?.status,
                poa_status: authentication?.document?.status,
            }
        );

        const has_migration_status = [
            MT5_ACCOUNT_STATUS.MIGRATED_WITH_POSITION,
            MT5_ACCOUNT_STATUS.MIGRATED_WITHOUT_POSITION,
        ].includes(mt5_trade_account?.status);

        return (
            <div className='cfd-trade-modal-container'>
                <div className='cfd-trade-modal'>
                    <TradingPlatformIcon icon={getAccountTitle()} size={24} />
                    <div className='cfd-trade-modal__desc'>
                        <Text size='xs' line_height='l' className='cfd-trade-modal__desc-heading'>
                            {getHeadingTitle()}
                        </Text>
                        {(mt5_trade_account as TTradingPlatformAccounts)?.display_login && (
                            <Text color='less-prominent' size='xxxs' line_height='xxxs'>
                                {(mt5_trade_account as TTradingPlatformAccounts)?.display_login}
                            </Text>
                        )}
                    </div>
                    <div className='cfd-trade-modal__acc_status'>
                        {mt5_trade_account?.display_balance && (
                            <Text
                                size='xs'
                                color='profit-success'
                                className='cfd-trade-modal__desc-balance'
                                weight='bold'
                            >
                                <Money
                                    amount={mt5_trade_account.display_balance}
                                    currency={mt5_trade_account.currency}
                                    has_sign={!!mt5_trade_account.balance && mt5_trade_account.balance < 0}
                                    show_currency
                                />
                            </Text>
                        )}
                        {has_migration_status && (
                            <StatusBadge
                                className='trading-app-card__acc_status_badge'
                                account_status={mt5_trade_account.status}
                                icon={badge_icon}
                                text={badge_text}
                            />
                        )}
                    </div>
                </div>
                <div className='cfd-trade-modal__login-specs'>
                    <div className='cfd-trade-modal__login-specs-item'>
                        <Text className='cfd-trade-modal--paragraph'>{localize('Broker')}</Text>
                        <SpecBox is_bold is_broker value={getBrokerName()} />
                    </div>
                    <div className='cfd-trade-modal__login-specs-item'>
                        <Text className='cfd-trade-modal--paragraph'>{localize('Server')}</Text>
                        <SpecBox
                            is_bold
                            value={(mt5_trade_account as DetailsOfEachMT5Loginid)?.server_info?.environment}
                        />
                    </div>
                    <div className='cfd-trade-modal__login-specs-item'>
                        <Text className='cfd-trade-modal--paragraph'>{localize('Login ID')}</Text>
                        <SpecBox is_bold value={(mt5_trade_account as TTradingPlatformAccounts)?.display_login} />
                    </div>
                    <div className='cfd-trade-modal__login-specs-item'>
                        <Text className='cfd-trade-modal--paragraph'>{localize('Password')}</Text>
                        <div className='cfd-trade-modal--paragraph'>
                            <PasswordBox
                                platform='mt5'
                                onClick={() => {
                                    const account_type = getCFDAccountKey({
                                        market_type: mt5_trade_account.market_type,
                                        sub_account_type: mt5_trade_account.sub_account_type,
                                        platform: CFD_PLATFORMS.MT5,
                                        shortcode: mt5_trade_account.landing_company_short,
                                    });
                                    onPasswordManager(
                                        mt5_trade_account?.login,
                                        getTitle(mt5_trade_account.market_type ?? '', show_eu_related_content),
                                        mt5_trade_account.account_type ?? '',
                                        account_type,
                                        (mt5_trade_account as DetailsOfEachMT5Loginid)?.server
                                    );
                                    toggleModal();
                                }}
                            />
                        </div>
                    </div>
                    <div className='cfd-trade-modal__maintenance'>
                        <Icon
                            icon='IcAlertWarning'
                            size={is_mobile ? 28 : 20}
                            className='cfd-trade-modal__maintenance-icon'
                        />
                        <div className='cfd-trade-modal__maintenance-text'>
                            <Localize i18n_default_text='Server maintenance starts at 01:00 GMT every Sunday, and this process may take up to 2 hours to complete. Service may be disrupted during this time.' />
                        </div>
                    </div>
                </div>
                <div className='cfd-trade-modal__download-center-app'>
                    <div className='cfd-trade-modal__download-center-app--option'>
                        <Icon icon='IcRebrandingMt5Logo' size={32} />
                        <Text className='cfd-trade-modal__download-center-app--option-item' size='xs'>
                            {localize('MetaTrader 5 web')}
                        </Text>
                        <a
                            className='dc-btn cfd-trade-modal__download-center-app--option-link'
                            type='button'
                            href={mt5_trade_account.webtrader_url}
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            <Text size='xxs' weight='bold' color='prominent'>
                                {localize('Open')}
                            </Text>
                        </a>
                    </div>
                    <div className='cfd-trade-modal__download-center-app--option cfd-trade-modal__download-center-app--option-hide'>
                        <Icon icon='IcWindowsLogo' size={32} />
                        <Text className='cfd-trade-modal__download-center-app--option-item' size='xs'>
                            {localize('MetaTrader 5 Windows app')}
                        </Text>
                        <a
                            className='dc-btn cfd-trade-modal__download-center-app--option-link'
                            type='button'
                            href={getPlatformMt5DownloadLink('windows')}
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            <Text size='xxs' weight='bold' color='prominent'>
                                {localize('Download')}
                            </Text>
                        </a>
                    </div>
                    <div className='cfd-trade-modal__download-center-app--option cfd-trade-modal__download-center-app--option-hide'>
                        <Icon icon='IcMacosLogo' size={32} />
                        <Text className='cfd-trade-modal__download-center-app--option-item' size='xs'>
                            {localize('MetaTrader 5 MacOS app')}
                        </Text>
                        <a
                            className='dc-btn cfd-trade-modal__download-center-app--option-link'
                            type='button'
                            href={getPlatformMt5DownloadLink('macos')}
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            <Text size='xxs' weight='bold' color='prominent'>
                                {localize('Download')}
                            </Text>
                        </a>
                    </div>
                    <div className='cfd-trade-modal__download-center-app--option cfd-trade-modal__download-center-app--option-hide'>
                        <Icon icon='IcLinuxLogo' size={32} />
                        <Text className='cfd-trade-modal__download-center-app--option-item' size='xs'>
                            {localize('MetaTrader 5 Linux app')}
                        </Text>
                        <a
                            className='dc-btn cfd-trade-modal__download-center-app--option-link'
                            type='button'
                            href={getPlatformMt5DownloadLink('linux')}
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            <Text size='xxs' weight='bold' color='prominent'>
                                {localize('Learn more')}
                            </Text>
                        </a>
                    </div>
                </div>
                <Text
                    align='center'
                    as='div'
                    className='cfd-trade-modal__download-center-text'
                    size={is_mobile ? 'xxxs' : 'xxs'}
                    weight='bold'
                >
                    {localize(
                        'Download {{ platform }} on your phone to trade with the {{ platform }} {{ account }} account',
                        {
                            platform: getCFDPlatformLabel(CFD_PLATFORMS.MT5),
                            account: getAccountTitle(),
                        }
                    )}
                </Text>
                <div className='cfd-trade-modal__download-center-options'>
                    <div className='cfd-trade-modal__download-center-options--mobile-links'>
                        <a href={getPlatformMt5DownloadLink('ios')} target='_blank' rel='noopener noreferrer'>
                            <Icon icon='IcInstallationApple' width={135} height={40} />
                        </a>
                        <a href={getPlatformMt5DownloadLink('android')} target='_blank' rel='noopener noreferrer'>
                            <Icon icon='IcInstallationGoogle' width={135} height={40} />
                        </a>
                        <a href={getPlatformMt5DownloadLink('huawei')} target='_blank' rel='noopener noreferrer'>
                            <Icon icon='IcInstallationHuawei' width={135} height={40} />
                        </a>
                    </div>

                    <div className='cfd-trade-modal__download-center-options--qrcode cfd-trade-modal__download-center-options--qrcode-hide'>
                        <img src={getUrlBase('/public/images/common/mt5_download.png')} width={80} height={80} />
                        <Text align='center' size='xxs'>
                            {localize('Scan the QR code to download {{ platform }}.', {
                                platform: getPlatformSettings('mt5').name,
                            })}
                        </Text>
                    </div>
                </div>
            </div>
        );
    }
);

export default DMT5TradeModal;
