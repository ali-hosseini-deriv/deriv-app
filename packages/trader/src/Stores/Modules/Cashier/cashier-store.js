import {
    action,
    observable,
    toJS }                  from 'mobx';
import { isCryptocurrency } from '_common/base/currency_base';
import { isEmptyObject }    from '_common/utility';
import { localize }         from 'App/i18n';
import { WS }               from 'Services';
import BaseStore            from '../../base-store';

class Config {
    container          = '';
    is_session_timeout = true;
    onIframeLoaded     = '';
    timeout_session    = '';

    @observable error = {
        message    : '',
        button_text: '',
        link       : '',
    };

    @observable iframe_height = 0;
    @observable iframe_url    = '';

    constructor({ container }) {
        this.container = container;
    }
}

class ConfigVerification {
    is_button_clicked = false;
    timeout_button    = '';

    @observable is_email_sent     = false;
    @observable is_resend_clicked = false;
    @observable resend_timeout    = 60;
}

export default class CashierStore extends BaseStore {
    @observable is_loading = false;

    bank_default_option = [{ text: localize('Any'), value: '' }];

    @observable config = {
        deposit      : new Config({ container: 'deposit' }),
        payment_agent: {
            container       : 'payment_agent',
            filtered_list   : [],
            list            : [],
            is_name_selected: true,
            supported_banks : this.bank_default_option,
            verification    : new ConfigVerification(),
        },
        withdraw: {
            ...(toJS(new Config({ container: 'withdraw' }))),
            verification: new ConfigVerification(),
        },
    };

    containers = [
        this.config.deposit.container,
        this.config.withdraw.container,
    ];

    error_fields = {
        address_city    : localize('Town/City'),
        address_line_1  : localize('First line of home address'),
        address_postcode: localize('Postal Code/ZIP'),
        address_state   : localize('State/Province'),
        email           : localize('Email address'),
        phone           : localize('Telephone'),
        residence       : localize('Country of Residence'),
    };

    constructor({ root_store }) {
        super({ root_store });

        this.onSwitchAccount(this.accountSwitcherListener);
    }

    @action.bound
    async onMount(current_action, verification_code) {
        if (this.containers.indexOf(current_action) === -1) {
            throw new Error('Cashier Store onMount requires a valid container name.');
        }
        this.setErrorMessage('', current_action);
        this.setContainerHeight(0, current_action);
        this.setLoading(true);

        if (!this.config[current_action].is_session_timeout) {
            this.checkIframeLoaded(current_action);
            return;
        }

        // if session has timed out reset everything
        this.setIframeUrl('', current_action);

        if (current_action === this.config.withdraw.container && !verification_code) {
            // if no verification code, we should request again
            return;
        }

        const response_cashier = await WS.cashier(current_action, verification_code);

        if (response_cashier.error) {
            this.setLoading(false);
            this.setErrorMessage(response_cashier.error, current_action);
            this.setSessionTimeout(true, current_action);
            this.clearTimeoutCashierUrl(current_action);
            if (verification_code) {
                // clear verification code on error
                this.clearVerification(current_action);
            }
        } else if (isCryptocurrency(this.root_store.client.currency)) {
            this.setLoading(false);
            this.setContainerHeight('700', current_action);
            this.setIframeUrl(response_cashier.cashier, current_action);
            // crypto cashier can only be accessed once and the session expires
            // so no need to set timeouts to keep the session alive
        } else {
            await this.checkIframeLoaded(current_action);
            this.setIframeUrl(response_cashier.cashier, current_action);
            this.setSessionTimeout(false, current_action);
            this.setTimeoutCashierUrl(current_action);
        }
    }

    @action.bound
    async onMountDeposit() {
        await this.onMount(this.config.deposit.container);
    }

    @action.bound
    async checkIframeLoaded(container) {
        this.removeOnIframeLoaded(container);
        this.config[container].onIframeLoaded = (function (e) {
            if (/cashier|doughflow/.test(e.origin)) {
                this.setLoading(false);
                // set the height of the container after content loads so that the
                // loading bar stays vertically centered until the end
                this.setContainerHeight(+e.data || '1200', container);
                // do not remove the listener
                // on every iframe screen change we need to update the height to more/less to match the new content
            }
        }).bind(this);
        window.addEventListener('message', this.config[container].onIframeLoaded, false);
    }

    removeOnIframeLoaded(container) {
        if (this.config[container].onIframeLoaded) {
            window.removeEventListener('message', this.config[container].onIframeLoaded, false);
            this.config[container].onIframeLoaded = '';
        }
    }

    @action.bound
    setIframeUrl(url, container) {
        this.config[container].iframe_url = url;
        if (url) {
            // after we set iframe url we can clear verification code
            this.root_store.client.setVerificationCode('');
        }
    }

    @action.bound
    setContainerHeight(height, container) {
        this.config[container].iframe_height = height;
    }

    @action.bound
    setErrorMessage(error, container) {
        const obj_error = this.getError(error) || {};
        this.config[container].error = {
            message    : obj_error.error_message,
            button_text: obj_error.error_button_text,
            link       : obj_error.error_link,
        };
    }

    getError = (error) => {
        if (!error || isEmptyObject(error)) {
            return null;
        }

        let error_message,
            error_button_text,
            error_link;

        switch (error.code) {
            case 'ASK_EMAIL_VERIFY':
            case 'InvalidToken':
                error_message = [
                    localize('Verification code is wrong.'),
                    localize('Please use the link sent to your email.'),
                ];
                error_button_text = localize('Okay');
                break;
            case 'ASK_TNC_APPROVAL':
                error_message = localize('Please accept the updated Terms and Conditions.');
                error_link    = 'user/tnc_approvalws';
                break;
            case 'ASK_FIX_DETAILS':
                error_message = [
                    localize('There was a problem validating your personal details.'),
                    (error.details.fields ?
                        localize('Please update your {{details}}.', { details: error.details.fields.map(field => (this.error_fields[field] || field)).join(', ') })
                        :
                        localize('Please update your details.')
                    ),
                ];
                break;
            // TODO: handle ukgc after enabling different brokers on deriv
            // case 'ASK_UK_FUNDS_PROTECTION':
            //     error_message = [
            //         localize(
            //             'We are required by our license to inform you about what happens to funds which we hold on account for you, and the extent to which funds are protected in the event of insolvency {{gambling_link}}.',
            //             { gambling_link: '<a href=\'%\' target=\'_blank\' rel=\'noopener noreferrer\'>%</a>'.replace(/%/g, 'http://www.gamblingcommission.gov.uk/for-the-public/Your-rights/Protection-of-customer-funds.aspx') }
            //         ),
            //         localize('The company holds customer funds in separate bank accounts to the operational accounts which would not, in the event of insolvency, form part of the Company\'s assets. This meets the Gambling Commission\'s requirements for the segregation of customer funds at the level: <strong>medium protection</strong>.'),
            //     ];
            //     error_button_text = localize('Proceed');
            //     break;
            case 'ASK_AUTHENTICATE':
                error_message = localize('Please [_1]authenticate[_2] your account.');
                error_link    = 'user/authenticate';
                break;
            case 'ASK_FINANCIAL_RISK_APPROVAL':
                error_message = [
                    localize('Financial Risk approval is required.'),
                    localize('Please contact customer support for more information.'),
                ];
                error_link = 'contact';
                break;
            case 'ASK_AGE_VERIFICATION':
                error_message = [
                    localize('Account needs age verification.'),
                    localize('Please contact customer support for more information.'),
                ];
                error_link = 'contact';
                break;
            case 'ASK_SELF_EXCLUSION_MAX_TURNOVER_SET':
                error_message = localize('Please set your 30-day turnover limit to access the cashier.');
                error_link    = 'user/security/self_exclusionws';
                break;
            default:
                error_message = error.message;
        }

        return { error_message, error_link, error_button_text };
    };

    @action.bound
    setLoading(is_loading) {
        this.is_loading = is_loading;
    }

    @action.bound
    setSessionTimeout(is_session_time_out, container) {
        this.config[container].is_session_timeout = is_session_time_out;
        if (is_session_time_out) {
            this.removeOnIframeLoaded(container);
        }
    }

    @action.bound
    setVerificationButtonClicked(is_button_clicked, container) {
        this.config[container].verification.is_button_clicked = is_button_clicked;
    }

    @action.bound
    setVerificationEmailSent(is_email_sent, container) {
        this.config[container].verification.is_email_sent = is_email_sent;
    }

    @action.bound
    setVerificationResendClicked(is_resend_clicked, container = this.root_store.ui.active_cashier_tab) {
        this.config[container].verification.is_resend_clicked = is_resend_clicked;
    }

    @action.bound
    setVerificationResendTimeout(resend_timeout, container) {
        this.config[container].verification.resend_timeout = resend_timeout;
    }

    clearTimeoutCashierUrl(container) {
        if (this.config[container].timeout_session) {
            clearTimeout(this.config[container].timeout_session);
        }
    }

    // cashier session expires after one minute
    // so we should resend the request for container (deposit|withdraw) url on next mount
    @action.bound
    setTimeoutCashierUrl(container) {
        this.clearTimeoutCashierUrl(container);
        this.config[container].timeout_session = setTimeout(() => {
            this.setSessionTimeout(true, container);
        }, 60000);
    }

    clearTimeoutVerification(container) {
        if (this.config[container].verification.timeout_button) {
            clearTimeout(this.config[container].verification.timeout_button);
        }
    }

    // verification token expires after one hour
    // so we should show the verification request button again after that
    @action.bound
    setTimeoutVerification(container) {
        this.clearTimeoutVerification(container);
        this.config[container].verification.timeout_button = setTimeout(() => {
            this.clearVerification(container);
        }, 3600000);
    }

    @action.bound
    async onMountWithdraw(verification_code) {
        await this.onMount(this.config.withdraw.container, verification_code);
    }

    @action.bound
    async sendVerificationEmail() {
        const container = this.root_store.ui.active_cashier_tab;
        if (this.config[container].verification.is_button_clicked) {
            return;
        }

        this.setErrorMessage('', this.config.withdraw.container);
        this.setVerificationButtonClicked(true, container);
        const withdrawal_type = `payment${container === this.config.payment_agent.container ? 'agent' : ''}_withdraw`;
        const response_verify_email = await WS.verifyEmail(this.root_store.client.email, withdrawal_type);

        if (response_verify_email.error) {
            this.clearVerification(container);
            this.setErrorMessage(response_verify_email.error, this.config.withdraw.container);
        } else {
            this.setVerificationEmailSent(true, container);
            this.setTimeoutVerification(container);
        }
    }

    @action.bound
    resendVerificationEmail() {
        const container = this.root_store.ui.active_cashier_tab;
        // don't allow clicking while ongoing timeout
        if (this.config[container].verification.resend_timeout < 60) {
            return;
        }
        this.setVerificationButtonClicked(false, container);
        this.setCountDownResendVerification(container);
        this.sendVerificationEmail();
    }

    setCountDownResendVerification(container) {
        this.setVerificationResendTimeout(this.config[container].verification.resend_timeout - 1, container);
        const resend_interval = setInterval(() => {
            if (this.config[container].verification.resend_timeout === 1) {
                this.setVerificationResendTimeout(60, container);
                clearInterval(resend_interval);
            } else {
                this.setVerificationResendTimeout(this.config[container].verification.resend_timeout - 1, container);
            }
        }, 1000);
    }

    clearVerification(container) {
        this.clearTimeoutVerification(container);
        this.setVerificationButtonClicked(false, container);
        this.setVerificationEmailSent(false, container);
        this.setVerificationResendClicked(false, container);
        this.setVerificationResendTimeout(60, container);
        this.root_store.client.setVerificationCode('');
    }

    @action.bound
    setActiveTab(container) {
        // used to detect if old tabs with withdrawal tab open should be closed after verification token is opened in new tab
        this.root_store.ui.setCashierActiveTab(container);
    }

    @action.bound
    async onMountPaymentAgent() {
        this.setLoading(true);
        const residence = this.root_store.client.accounts[this.root_store.client.loginid].residence;
        const currency  = this.root_store.client.currency;

        if (!this.config.payment_agent.list.length) {
            const payment_agent_list = await WS.paymentAgentList(residence, currency);
            this.setPaymentAgentList(payment_agent_list);
        }

        this.setIsNameSelected(true);
        this.filterPaymentAgentList();
        this.setLoading(false);
    }

    @action.bound
    setIsNameSelected(is_name_selected = !this.config.payment_agent.is_name_selected) {
        this.config.payment_agent.is_name_selected = is_name_selected;
    }

    @action.bound
    addSupportedBank(bank) {
        const supported_bank_exists =
            this.config.payment_agent.supported_banks.find(supported_bank =>
                supported_bank.value === bank.toLowerCase()
            );
        if (!supported_bank_exists) {
            this.config.payment_agent.supported_banks.push({ text: bank, value: bank.toLowerCase() });
        }
    }

    @action.bound
    setPaymentAgentList(payment_agent_list) {
        this.config.payment_agent.list            = [];
        this.config.payment_agent.supported_banks = this.bank_default_option;

        payment_agent_list.paymentagent_list.list.forEach((payment_agent) => {
            this.config.payment_agent.list.push({
                email          : payment_agent.email,
                phone          : payment_agent.telephone,
                name           : payment_agent.name,
                supported_banks: payment_agent.supported_banks,
                url            : payment_agent.url,
            });
            payment_agent.supported_banks.split(',').forEach((bank) => {
                this.addSupportedBank(bank);
            });
        });
    }

    @action.bound
    filterPaymentAgentList(bank) {
        if (bank) {
            this.config.payment_agent.filtered_list = [];
            this.config.payment_agent.list.forEach((payment_agent) => {
                if (payment_agent.supported_banks.toLowerCase().split(',').indexOf(bank) !== -1) {
                    this.config.payment_agent.filtered_list.push(payment_agent);
                }
            });
        } else {
            this.config.payment_agent.filtered_list = this.config.payment_agent.list;
        }
    }

    @action.bound
    onChangePaymentMethod({ target }) {
        this.filterPaymentAgentList(target.value);
    }

    onUnmount() {
        [this.config.withdraw.container, this.config.payment_agent.container].forEach((container) => {
            this.clearVerification(container);
        });
        [this.config.deposit.container, this.config.withdraw.container].forEach((container) => {
            this.setIframeUrl('', container);
            this.clearTimeoutCashierUrl(container);
            this.setSessionTimeout(true, container);
        });
    }

    accountSwitcherListener() {
        return new Promise(async (resolve) => resolve(this.onUnmount()));
    }
}
