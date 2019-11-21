import PropTypes               from 'prop-types';
import React                   from 'react';
import P2P                     from 'deriv-p2p';
import Lazy                    from 'App/Containers/Lazy';
import Routes                  from 'App/Containers/Routes/routes.jsx';
import TradeFooterExtensions   from 'App/Containers/trade-footer-extensions.jsx';
import TradeSettingsExtensions from 'App/Containers/trade-settings-extensions.jsx';
import { MobxProvider }        from 'Stores/connect';
import initStore               from './init-store.js'; // eslint-disable-line import/extensions

import './i18n';
import 'Sass/app.scss';

class App extends React.Component {
    constructor(props) {
        super(props);
        // TODO: [trader-remove-client-base] - Refactor codebase to remove usage of ClientBase in Trader
        const { passthrough: { WS, root_store, client_base } } = props;
        this.root_store = initStore(root_store, WS, client_base);
    }

    render() {
        return (
            <MobxProvider store={ this.root_store }>
                <React.Fragment>
                    <P2P />
                    <Routes />
                    <Lazy
                        ctor={ () => import(/* webpackChunkName: "trade-modals", webpackPrefetch: true */'./Containers/Modals') }
                        should_load
                        has_progress={ false }
                    />
                    <TradeFooterExtensions />
                    <TradeSettingsExtensions />
                </React.Fragment>
            </MobxProvider>
        );
    }
}

App.propTypes = {
    passthrough: PropTypes.shape({
        root_store: PropTypes.object,
        WS        : PropTypes.object,
    }),
};

export default App;
