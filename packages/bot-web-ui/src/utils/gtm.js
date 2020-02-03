import { reaction } from 'mobx';

const GTM = (() => {
    let root_store;

    const getLoginId = () => {
        return root_store.core.client.loginid;
    };

    const getServerTime = () => {
        return root_store.server_time.unix();
    };

    const pushDataLayer = data => {
        return root_store.core.gtm.pushDataLayer(data);
    };

    const init = _root_store => {
        try {
            root_store = _root_store;

            const { run_panel, transactions, summary: s } = root_store;

            reaction(
                () => run_panel.is_running,
                () => run_panel.is_running && onRunBot(s.summary)
            );

            reaction(
                () => transactions.contracts,
                () => onTransactionClosed(transactions.contracts)
            );
        } catch (error) {
            console.warn('Error initializing GTM reactions ', error); // eslint-disable-line no-console
        }
    };

    const onRunBot = summary => {
        try {
            const run_id = `${getLoginId()}-${getServerTime()}`;
            const counters = `tr:${summary.number_of_runs},\
                ts:${summary.total_stake},\
                py:${summary.total_payout},\
                lc:${summary.lost_contracts},\
                wc:${summary.won_contracts},\
                pr:${summary.total_profit}`;

            const data = {
                counters: counters.replace(/\s/g, ''),
                event: 'dbot_run',
                run_id,
            };
            pushDataLayer(data);
        } catch (error) {
            console.warn('Error pushing run data to datalayer', error); // eslint-disable-line no-console
        }
    };

    const onTransactionClosed = contracts => {
        try {
            const contract = contracts.length > 0 && contracts[0];
            if (contract && contract.is_completed) {
                const data = {
                    event: 'dbot_run_transaction',
                    reference_id: contract.refrence_id,
                };
                pushDataLayer(data);
            }
        } catch (error) {
            console.warn('Error pushing transaction to datalayer', error); // eslint-disable-line no-console
        }
    };

    return {
        init,
    };
})();

export default GTM;
