import React                  from 'react';
import PropTypes              from 'prop-types';
import {
    Button,
    Dialog }                  from 'deriv-components';
import AgentContext           from 'Components/context/agent-context';
import FooterActions          from 'Components/footer-actions/footer-actions.jsx';
import { localize, Localize } from 'Components/i18next';
import { secondsToTimer }     from 'Utils/date-time';
import ServerTime             from 'Utils/server-time';
import { WS }                 from 'Utils/websocket';
import Popup                  from '../popup.jsx';
import './order-details.scss';

const OrderInfoBlock = ({ label, value }) => (
    <div className='order-details__info-block'>
        <p className='order-details__info-block-label'>{ label }</p>
        <strong className='order-details__info-block-value'>{ value }</strong>
    </div>
);

OrderInfoBlock.propTypes = {
    label: PropTypes.string,
    value: PropTypes.string,
};

const OrderDetailsStatusBlock = ({ order_details }) => {
    const is_agent = React.useContext(AgentContext);
    const {
        is_buyer,
        is_buyer_cancelled,
        is_buyer_confirmed,
        is_completed,
        is_expired,
        is_pending,
        is_refunded,
        is_seller_confirmed,
    } = order_details;

    return (
        <h2 className='order-details__header-status'>
            {/* Agent view */}
            { is_agent && is_pending && is_buyer &&
                localize('Wait for payment')
            }
            { is_agent && is_pending && !is_buyer &&
                localize('Please pay')
            }
            { is_agent && is_buyer_cancelled && is_buyer &&
                localize('Buyer has cancelled this order')
            }
            { is_agent && is_buyer_cancelled && !is_buyer &&
                localize('You have cancelled this order')
            }
            { is_agent && is_refunded && is_buyer &&
                localize('Buyer has been refunded')
            }
            { is_agent && is_refunded && !is_buyer &&
                localize('You have been refunded')
            }
            { is_agent && is_buyer_confirmed && is_buyer &&
                localize('Confirm payment')
            }
            { is_agent && is_buyer_confirmed && !is_buyer &&
                localize('Wait for release')
            }
            {/* Client view */}
            { !is_agent && is_pending && is_buyer &&
                localize('Please pay')
            }
            { !is_agent && is_pending && !is_buyer &&
                localize('Wait for payment')
            }
            { !is_agent && is_buyer_cancelled && is_buyer &&
                localize('You have cancelled this order')
            }
            { !is_agent && is_buyer_cancelled && !is_buyer &&
                localize('Buyer has cancelled this order')
            }
            { !is_agent && is_refunded && is_buyer &&
                localize('You have been refunded')
            }
            { !is_agent && is_refunded && !is_buyer &&
                localize('Buyer has been refunded')
            }
            { !is_agent && is_buyer_confirmed && is_buyer &&
                localize('Wait for release')
            }
            { !is_agent && is_buyer_confirmed && !is_buyer &&
                localize('Confirm payment')
            }
            {/* Common view */}
            { is_expired &&
                localize('Cancelled due to timeout')
            }
            { (is_seller_confirmed || is_completed) &&
                localize('Order complete')
            }
        </h2>
    );
};

OrderDetailsStatusBlock.propTypes = {
    order_details: PropTypes.object,
};

const OrderDetailsAmountBlock = ({ order_details }) => (
    (order_details.is_pending || order_details.is_buyer_confirmed) ? (
        <h1 className='order-details__header-amount'>
            { `${order_details.transaction_currency} ${order_details.display_transaction_amount}` }
        </h1>
    ) : null
);

OrderDetailsAmountBlock.propTypes = {
    order_details: PropTypes.object,
};

const OrderDetailsTimerBlock = ({ order_details }) => {
    const [remaining_time, setRemainingTime] = React.useState();
    let interval;

    const checkDistance = (expiry_in_millis) => {
        const now_millis = ServerTime.get();
        const distance = expiry_in_millis - now_millis;

        return distance;
    };

    const countDownTimer = () => {
        const distance = checkDistance(order_details.order_expiry_millis);
        const timer = secondsToTimer(distance);

        if (distance < 0) {
            setRemainingTime('expired');
            clearInterval(interval);

        } else {
            setRemainingTime(timer);
        }
    };

    React.useEffect(() => {
        interval = setInterval(countDownTimer, 1000);
        const distance = checkDistance(order_details.order_expiry_millis);
        const timer = secondsToTimer(distance);

        if (distance < 0) {
            setRemainingTime('expired');
        } else {
            setRemainingTime(timer);
        }

        return () => {
            clearInterval(interval);
        };
    }, []);

    return (order_details.is_pending || order_details.is_buyer_confirmed) ? (
        <div className='order-details__header-timer'>
            <p>{ localize('Time left') }</p>
            <p className='order-details__header-timer-counter'>
                { remaining_time }
            </p>
        </div>
    ) : null;
};

OrderDetailsTimerBlock.propTypes = {
    order_details: PropTypes.object,
};

const OrderActionsBlock = ({ cancelPopup, order_details, showPopup }) => {
    const is_agent = React.useContext(AgentContext);
    const {
        display_offer_amount,
        display_transaction_amount,
        is_buyer,
        is_buyer_confirmed,
        is_pending,
        offer_currency,
        order_id,
        setStatus,
        transaction_currency,
    } = order_details;
    let buttons_to_render = null;

    const cancelOrder = () => {
        const cancel = async (setFormStatus) => {
            setFormStatus({ error_message: '' });
            const cancel_response = await WS({ p2p_order_cancel: 1, order_id });

            if (!cancel_response.error) {
                setStatus(cancel_response.p2p_order_cancel.status);
                cancelPopup();
            } else {
                setFormStatus({ error_message: cancel_response.error.message });
            }
        };
        const options = {
            title         : localize('Cancel this order?'),
            message       : localize('There will be no refund after cancelling the order. If you have paid, please do not cancel the order.'),
            confirm_text  : localize('Cancel this order'),
            onClickConfirm: cancel,
        };
        showPopup(options);
    };

    const paidOrder = () => {
        const payOrder = async (setFormStatus) => {
            setFormStatus({ error_message: '' });

            const update_response = await WS({
                p2p_order_confirm: 1,
                order_id,
            });
            if (!update_response.error) {
                setStatus(update_response.p2p_order_confirm.status);
                cancelPopup();
            } else {
                setFormStatus({ error_message: update_response.error.message });
            }
        };
        const options = {
            title         : localize('Confirm this payment?'),
            message       : localize('Make sure you have successfully sent the funds to the seller’s bank account or e-wallet mentioned above.'),
            has_cancel    : true,
            cancel_text   : localize('I didn\'t pay yet'),
            confirm_text  : localize('I\'ve paid'),
            onClickConfirm: payOrder,
        };
        showPopup(options);
    };

    const receivedFunds = () => {
        const receive = async (setFormStatus) => {
            setFormStatus({ error_message: '' });

            const update_response = await WS({
                p2p_order_confirm: 1,
                order_id,
            });
            if (!update_response.error) {
                setStatus(update_response.p2p_order_confirm.status);
                cancelPopup();
            } else {
                setFormStatus({ error_message: update_response.error.message });
            }
        };
        const options = {
            title            : localize('Have you received funds?'),
            message          : localize('Make sure that you have logged in your bank account or other e-wallet to check the receipt.'),
            need_confirmation: true,
            order            : {
                display_offer_amount,
                offer_currency,
                transaction_currency,
                display_transaction_amount,
            },
            onClickConfirm: receive,
        };
        showPopup(options);
    };

    if (is_agent && (is_pending || is_buyer_confirmed) && is_buyer) {
        buttons_to_render = (
            <Button className='order-details__actions-button' large primary onClick={receivedFunds}>{ localize('I\'ve received funds') }</Button>
        );
    }

    if (is_agent && is_pending && !is_buyer) {
        buttons_to_render = (
            <React.Fragment>
                <Button className='order-details__actions-button' large secondary onClick={cancelOrder}>{ localize('Cancel order') }</Button>
                <Button className='order-details__actions-button' large primary onClick={paidOrder}>{ localize('I\'ve paid') }</Button>
            </React.Fragment>
        );
    }

    if (!is_agent && is_pending && is_buyer) {
        buttons_to_render = (
            <React.Fragment>
                <Button className='order-details__actions-button' large secondary onClick={cancelOrder}>{ localize('Cancel order') }</Button>
                <Button className='order-details__actions-button' large primary onClick={paidOrder}>{ localize('I\'ve paid') }</Button>
            </React.Fragment>
        );
    }

    if (!is_agent && (is_pending || is_buyer_confirmed) && !is_buyer) {
        buttons_to_render = (
            <Button className='order-details__actions-button' large primary onClick={receivedFunds}>{ localize('I\'ve received funds') }</Button>
        );
    }

    return buttons_to_render;
};

OrderActionsBlock.propTypes = {
    cancelPopup  : PropTypes.func,
    order_details: PropTypes.object,
    showPopup    : PropTypes.func,
};

const OrderDetailsResultMessage = ({ order_details }) => {
    const is_agent = React.useContext(AgentContext);
    const {
        is_seller_confirmed,
        is_completed,
        is_buyer,
        offer_currency,
        display_offer_amount,
    } = order_details;

    if (is_agent && (is_seller_confirmed || is_completed) && is_buyer) {
        return (
            <p className='order-details__wrapper-message order-details__wrapper-message--success'>
                { localize('You sold {{offered_currency}} {{offered_amount}}',
                    {
                        offered_currency: offer_currency,
                        offered_amount  : display_offer_amount,
                    })
                }
            </p>
        );
    }

    if (is_agent && (is_seller_confirmed || is_completed) && !is_buyer) {
        return (
            <p className='order-details__wrapper-message order-details__wrapper-message--success'>
                { localize('{{offered_currency}} {{offered_amount}} was deposited on your account',
                    {
                        offered_currency: offer_currency,
                        offered_amount  : display_offer_amount,
                    })
                }
            </p>
        );
    }

    if (!is_agent && (is_seller_confirmed || is_completed) && is_buyer) {
        return (
            <p className='order-details__wrapper-message order-details__wrapper-message--success'>
                { localize('{{offered_currency}} {{offered_amount}} was deposited on your account',
                    {
                        offered_currency: offer_currency,
                        offered_amount  : display_offer_amount,
                    })
                }
            </p>
        );
    }

    if (!is_agent && (is_seller_confirmed || is_completed) && !is_buyer) {
        return (
            <p className='order-details__wrapper-message order-details__wrapper-message--success'>
                { localize('You sold {{offered_currency}} {{offered_amount}}',
                    {
                        offered_currency: offer_currency,
                        offered_amount  : display_offer_amount,
                    })
                }
            </p>
        );
    }
    // TODO: [p2p-timeout-status-check] - Check if order has timed out and add timeout message
    return null;
};

OrderDetailsResultMessage.propTypes = {
    order_details: PropTypes.object,
};

const OrderDetails = ({
    order_details,
}) => {
    const {
        advertiser_name,
        advertiser_notes,
        display_offer_amount,
        display_price_rate,
        display_transaction_amount,
        is_buyer,
        is_buyer_confirmed,
        is_expired,
        offer_currency,
        order_id,
        order_purchase_datetime,
        transaction_currency,
    } = order_details;
    const [show_popup, setShowPopup] = React.useState(false);
    const [popup_options, setPopupOptions] = React.useState({});

    const is_agent = React.useContext(AgentContext);
    const onCancelClick = () => setShowPopup(false);

    const handleShowPopup = (options) => {
        setPopupOptions(options);
        setShowPopup(true);
    };

    return (
        <div className='order-details'>
            <div className='order-details__wrapper order-details__wrapper--outer'>
                <OrderDetailsResultMessage order_details={ order_details } />
                <div className='order-details__wrapper--inner'>
                    <div className='order-details__header'>
                        <span>
                            <OrderDetailsStatusBlock order_details={ order_details } />
                            <OrderDetailsAmountBlock order_details={ order_details } />
                        </span>
                        <OrderDetailsTimerBlock order_details={ order_details } />
                    </div>
                    <div className='deriv-p2p__separator' />
                    <div className='order-details__info'>
                        <OrderInfoBlock label={ localize('Advertiser notes') } value={ advertiser_notes } />
                        <div className='order-details__info-columns'>
                            <div className='order-details__info--left'>
                                {is_agent && <OrderInfoBlock label={ is_buyer ? localize('Receive') : localize('Send') } value={ `${transaction_currency} ${display_transaction_amount}` } />}
                                {!is_agent && <OrderInfoBlock label={ is_buyer ? localize('Send') : localize('Receive') } value={ `${transaction_currency} ${display_transaction_amount}` } />}
                                <OrderInfoBlock label={ localize('Price') } value={ `${transaction_currency} ${display_price_rate}` } />
                                <OrderInfoBlock label={ localize('Order ID') } value={ order_id } />
                            </div>
                            <div className='order-details__info--right'>
                                {is_agent && <OrderInfoBlock label={ is_buyer ? localize('Send') : localize('Receive') } value={ `${offer_currency} ${display_offer_amount}` } />}
                                {!is_agent && <OrderInfoBlock label={ is_buyer ? localize('Receive') : localize('Send') } value={ `${offer_currency} ${display_offer_amount}` } />}
                                {is_agent && !is_buyer && <OrderInfoBlock label={localize('Seller')} value={ advertiser_name } />}
                                {!is_agent && is_buyer && <OrderInfoBlock label={localize('Seller')} value={ advertiser_name } />}
                                <OrderInfoBlock label={ localize('Time') } value={ order_purchase_datetime } />
                            </div>
                        </div>
                    </div>
                    { (is_buyer_confirmed || (is_expired && is_buyer)) &&
                        <React.Fragment>
                            <div className='deriv-p2p__separator' />
                            <div className='order-details__footer'>
                                <p>
                                    <Localize
                                        i18n_default_text='If you have a complaint, please email <0>{{support_email}}</0> and include your order ID.'
                                        values={{ support_email: 'support@deriv.com' }}
                                        components={[ <a key={0} className='link' rel='noopener noreferrer' target='_blank' href='mailto:support@deriv.com' /> ]}
                                    />
                                </p>
                            </div>
                        </React.Fragment>
                    }
                </div>
            </div>

            <FooterActions>
                <OrderActionsBlock
                    cancelPopup={onCancelClick}
                    showPopup={handleShowPopup}
                    order_details={order_details}
                />
            </FooterActions>
            {show_popup && (
                <div className='orders__dialog'>
                    <Dialog is_visible={show_popup}>
                        <Popup {...popup_options} onCancel={onCancelClick} />
                    </Dialog>
                </div>
            )}
        </div>
    );
};

OrderDetails.propTypes = {
    order_details: PropTypes.object,
};

export default OrderDetails;
