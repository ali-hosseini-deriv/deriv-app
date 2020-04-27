import classNames from 'classnames';
import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Icon, Loading, Table, ProgressIndicator } from '@deriv/components';
import { localize } from 'Components/i18next';
import Dp2pContext from 'Components/context/dp2p-context';
import { InfiniteLoaderList } from 'Components/table/infinite-loader-list.jsx';
import { TableError } from 'Components/table/table-error.jsx';
import { requestWS } from 'Utils/websocket';
import { MyAdsLoader } from './my-ads-loader.jsx';
import Popup from '../orders/popup.jsx';

const getHeaders = offered_currency => [
    { text: localize('Ad ID') },
    { text: localize('Limits') },
    { text: localize('Rate (1 {{ offered_currency }})', { offered_currency }) },
    { text: localize('Payment method') },
    { text: localize('Available amount') },
    { text: '' }, // empty header for delete icon
];

const type = {
    buy: localize('Buy'),
    sell: localize('Sell'),
};

const row_style = {
    gridTemplateColumns: '1fr 2fr 2fr 2fr 2fr 1fr',
};

const RowComponent = React.memo(({ data, row_actions, style }) => (
    <div style={style}>
        <Table.Row style={row_style}>
            <Table.Cell>
                {type[data.type]} {data.id}
            </Table.Cell>
            <Table.Cell>
                {data.display_min_available}-{data.display_max_available} {data.offer_currency}
            </Table.Cell>
            <Table.Cell className='p2p-my-ads__table-price'>
                {data.display_price_rate} {data.transaction_currency}
            </Table.Cell>
            <Table.Cell>{data.display_payment_method}</Table.Cell>
            <Table.Cell className='p2p-my-ads__table-available'>
                <ProgressIndicator
                    className={'p2p-my-ads__table-available-progress'}
                    value={data.available_amount}
                    total={data.offer_amount}
                />
                <div className='p2p-my-ads__table-available-value'>
                    {data.display_available_amount}/{data.display_offer_amount} {data.offer_currency}
                </div>
            </Table.Cell>
            <Table.Cell className='p2p-my-ads__table-delete'>
                <Icon icon='IcDelete' size={16} onClick={() => row_actions.onClickDelete(data.id)} />
            </Table.Cell>
        </Table.Row>
    </div>
));
RowComponent.propTypes = {
    data: PropTypes.object,
    style: PropTypes.object,
};
RowComponent.displayName = 'RowComponent';

const MyAdsTable = ({ is_enabled }) => {
    let item_offset = 0;

    const { currency, list_item_limit } = useContext(Dp2pContext);
    const [is_mounted, setIsMounted] = useState(false);
    const [is_loading, setIsLoading] = useState(true);
    const [api_error_message, setApiErrorMessage] = useState('');
    const [has_more_items_to_load, setHasMoreItemsToLoad] = useState(false);
    const [selected_ad_id, setSelectedAdId] = useState('');
    const [show_popup, setShowPopup] = useState(false);
    const [ads, setAds] = useState([]);
    const table_container_Ref = React.createRef();

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    useEffect(() => {
        if (is_mounted) {
            loadMoreAds(item_offset);
        }
    }, [is_mounted]);

    const loadMoreAds = start_idx => {
        return new Promise(resolve => {
            requestWS({
                p2p_advertiser_adverts: 1,
                offset: start_idx,
                limit: list_item_limit,
            }).then(response => {
                if (is_mounted) {
                    if (!response.error) {
                        setHasMoreItemsToLoad(response.length >= list_item_limit);
                        setAds(ads.concat(response));
                        setIsLoading(false);
                        item_offset += response.length;
                    } else {
                        setApiErrorMessage(response.api_error_message);
                    }
                    resolve();
                }
            });
        });
    };

    const onClickDelete = id => {
        setSelectedAdId(id);
        setShowPopup(true);
    };

    const onClickCancel = () => {
        setSelectedAdId('');
        setShowPopup(false);
    };

    const onClickConfirm = showError => {
        requestWS({ p2p_advert_update: 1, id: selected_ad_id, is_active: 0 }).then(response => {
            if (response.error) {
                showError({ error_message: response.error.message });
            } else {
                // remove the deleted ad from the list of items
                const updated_items = ads.filter(ad => ad.id !== response.p2p_advert_update.id);
                setAds(updated_items);
                setShowPopup(false);
            }
        });
    };

    if (is_loading) {
        return <Loading is_fullscreen={false} />;
    }
    if (api_error_message) {
        return <TableError message={api_error_message} />;
    }

    if (ads.length) {
        const item_height = 56;
        return (
            <div ref={table_container_Ref}>
                <Table
                    className={classNames('p2p-my-ads__table', {
                        'p2p-my-ads__table--disabled': !is_enabled,
                    })}
                >
                    <Table.Header>
                        <Table.Row style={row_style}>
                            {getHeaders(currency).map(header => (
                                <Table.Head key={header.text}>{header.text}</Table.Head>
                            ))}
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        <InfiniteLoaderList
                            // screen size - header size - footer size - page overlay header - page overlay content padding -
                            // tabs height - padding of tab content - toggle height - toggle margin - table header height
                            initial_height={
                                'calc(100vh - 48px - 36px - 41px - 2.4rem - 36px - 2.4rem - 50px - 1.6rem - 52px)'
                            }
                            items={ads}
                            item_size={item_height}
                            row_actions={{ onClickDelete }}
                            RenderComponent={RowComponent}
                            RowLoader={MyAdsLoader}
                            has_more_items_to_load={has_more_items_to_load}
                            loadMore={loadMoreAds}
                        />
                    </Table.Body>
                </Table>
                {show_popup && (
                    <div className='orders__dialog'>
                        <Dialog is_visible={!!show_popup}>
                            <Popup
                                has_cancel
                                title={localize('Delete this ad')}
                                message={localize("You won't be able to restore it later.")}
                                cancel_text={localize('Cancel')}
                                confirm_text={localize('Delete')}
                                onCancel={onClickCancel}
                                onClickConfirm={onClickConfirm}
                            />
                        </Dialog>
                    </div>
                )}
            </div>
        );
    }

    return <div className='cashier-p2p__empty'>{localize("You haven't posted any ads yet.")}</div>;
};

MyAdsTable.propTypes = {
    is_enabled: PropTypes.bool,
};

export default MyAdsTable;
