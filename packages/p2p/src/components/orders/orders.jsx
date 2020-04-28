import React from 'react';
import { localize } from 'Components/i18next';
import Dp2pContext from 'Components/context/dp2p-context';
import PageReturn from 'Components/page-return/page-return.jsx';
import OrderInfo from './order-info';
import OrderDetails from './order-details/order-details.jsx';
import OrderTable from './order-table/order-table.jsx';
import './orders.scss';

const Orders = ({ params }) => {
    const { orders, order_id, setOrderId } = React.useContext(Dp2pContext);
    const [order_details, setDetails] = React.useState(null);
    const hideDetails = () => {
        setDetails(null);
        setOrderId(null);
    };

    const setQueryDetails = input_order => {
        setOrderId(input_order.id);
        setDetails(input_order);
    };

    React.useEffect(() => {
        if (params && params.order_info) {
            const order_info = new OrderInfo(params.order_info);
            setQueryDetails(order_info);
        }
        // Clear details when unmounting
        return () => {
            hideDetails();
        };
    }, []);

    React.useEffect(() => {
        if (orders.length && order_id) {
            const order_payload = orders.find(order => order.id === order_id);
            setQueryDetails(order_payload);
        }
        if (order_details) {
            const updated_order = orders.find(order => order.id === order_details.id);
            if (updated_order.status !== order_details.status) {
                const updated_order_info = new OrderInfo(updated_order);
                setQueryDetails(updated_order_info);
            }
        }
    }, [orders]);

    return (
        <div className='orders'>
            {order_details && (
                <React.Fragment>
                    <PageReturn
                        onClick={hideDetails}
                        page_title={
                            order_details.is_buyer
                                ? localize('Buy {{offered_currency}} order', {
                                      offered_currency: order_details.offer_currency,
                                  })
                                : localize('Sell {{offered_currency}} order', {
                                      offered_currency: order_details.offer_currency,
                                  })
                        }
                    />
                    <OrderDetails order_details={order_details} />
                </React.Fragment>
            )}
            {!order_details && <OrderTable showDetails={setQueryDetails} />}
        </div>
    );
};

export default Orders;
