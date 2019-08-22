import {
    action,
    observable }              from 'mobx';
import { setSmartChartsPublicPath } from 'smartcharts-beta';
import { getUrlBase }          from '_common/url';
import { localize }           from 'App/i18n';
import BinarySocket           from '_common/base/socket_base';
import { isEmptyObject }      from '_common/utility';
import { WS }                 from 'Services';
import ContractStore          from './contract-store';
import { contractSold }       from '../Portfolio/Helpers/portfolio-notifcations';
import BaseStore              from '../../base-store';

setSmartChartsPublicPath(getUrlBase('/js/smartcharts/'));

export default class ContractReplayStore extends BaseStore {
    @observable contract_store = { contract_info: {} };
    // --- Observable properties ---
    @observable is_sell_requested = false;
    @observable has_error         = false;
    @observable error_message     = '';
    @observable is_chart_loading  = true;
    // ---- chart props
    @observable margin;

    // ---- Replay Contract Config ----
    @observable contract_id;
    @observable indicative_status;
    @observable contract_info   = observable.object({});
    @observable is_static_chart = false;

    // ---- Normal properties ---
    is_ongoing_contract = false;
    prev_indicative = 0;

    // TODO: you view a contract and then share that link with another person,
    // when the person opens, try to switch account they get the error
    // Forget old proposal_open_contract stream on account switch from ErrorComponent
    should_forget_first = false;

    // -------------------
    // ----- Actions -----
    // -------------------
    handleSubscribeProposalOpenContract = (contract_id, cb) => {
        const proposal_open_contract_request = [contract_id, cb, false];

        if (this.should_forget_first) {
            // TODO; don't forget all ever
            WS.forgetAll('proposal_open_contract').then(() => {
                this.should_forget_first = false;
                WS.subscribeProposalOpenContract(...proposal_open_contract_request);
            });
        } else {
            WS.subscribeProposalOpenContract(...proposal_open_contract_request);
        }
    }

    @action.bound
    onMount(contract_id) {
        if (contract_id) {
            this.contract_id = contract_id;
            this.contract_store = new ContractStore(this.root_store, { contract_id });
            BinarySocket.wait('authorize').then(() => {
                this.handleSubscribeProposalOpenContract(this.contract_id, this.populateConfig);
            });
            WS.activeSymbols({ skip_cache_update: true });
        }
    }

    @action.bound
    onUnmount() {
        this.forgetProposalOpenContract(this.contract_id, this.populateConfig);
        this.contract_id         = null;
        this.is_ongoing_contract = false;
        this.is_static_chart     = false;
        this.is_chart_loading    = true;
        this.contract_info       = {};
        this.indicative_status   = null;
        this.prev_indicative     = 0;
    }

    @action.bound
    populateConfig(response) {
        if ('error' in response) {
            this.has_error        = true;
            this.is_chart_loading = false;
            return;
        }
        if (isEmptyObject(response.proposal_open_contract)) {
            this.has_error           = true;
            this.error_message       = localize('Sorry, you can\'t view this contract because it doesn\'t belong to this account.');
            this.should_forget_first = true;
            this.is_chart_loading = false;
            return;
        }
        if (+response.proposal_open_contract.contract_id !== this.contract_id) return;

        this.contract_info = response.proposal_open_contract;

        // Add indicative status for contract
        const prev_indicative  = this.prev_indicative;
        const new_indicative   = +this.contract_info.bid_price;
        if (new_indicative > prev_indicative) {
            this.indicative_status = 'profit';
        } else if (new_indicative < prev_indicative) {
            this.indicative_status = 'loss';
        } else {
            this.indicative_status = null;
        }
        this.prev_indicative = new_indicative;

        // update the contract_store here passing contract_info
        this.contract_store.populateConfig(this.contract_info);

        const end_time = this.contract_store.end_time;

        this.updateMargin(
            (end_time || this.contract_info.date_expiry) - this.contract_info.date_start
        );

        if (!end_time) this.is_ongoing_contract = true;

        // finish contracts if end_time exists
        if (end_time) {
            if (!this.is_ongoing_contract) {
                this.is_static_chart = true;
            } else {
                this.is_static_chart = false;
            }
        }

        this.is_chart_loading = false;
    }

    @action.bound
    updateMargin(duration) {
        const granularity = this.contract_store.contract_config.granularity;

        this.margin = Math.floor(
            !granularity ?  (Math.max(300, (30 * duration) / (60 * 60) || 0)) : 3 * granularity
        );
    }

    @action.bound
    onClickSell(contract_id) {
        const { bid_price } = this.contract_info;
        if (contract_id && bid_price) {
            this.is_sell_requested = true;
            WS.sell(contract_id, bid_price).then(this.handleSell);
        }
    }

    @action.bound
    handleSell(response) {
        if (response.error) {
            // If unable to sell due to error, give error via pop up if not in contract mode
            this.is_sell_requested = false;
            this.root_store.common.services_error = {
                type: response.msg_type,
                ...response.error,
            };
            this.root_store.ui.toggleServicesErrorModal(true);
        } else if (!response.error && response.sell) {
            this.is_sell_requested = false;
            // update contract store sell info after sell
            this.sell_info = {
                sell_price    : response.sell.sold_for,
                transaction_id: response.sell.transaction_id,
            };
            this.root_store.ui.addNotification(contractSold(this.root_store.client.currency, response.sell.sold_for));
        }
    }

    forgetProposalOpenContract = (contract_id, cb) => {
        WS.forget('proposal_open_contract', cb, { contract_id });
    }

    @action.bound
    removeErrorMessage() {
        delete this.has_error;
        delete this.error_message;
    }
}
