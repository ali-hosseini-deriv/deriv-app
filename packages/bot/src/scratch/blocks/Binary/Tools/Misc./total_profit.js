import { translate } from '../../../../../utils/lang/i18n';

Blockly.Blocks.total_profit = {
    init() {
        this.jsonInit(this.definition());
    },
    definition() {
        return {
            message0       : translate('Total profit/loss'),
            output         : 'Number',
            outputShape    : Blockly.OUTPUT_SHAPE_ROUND,
            colour         : Blockly.Colours.Base.colour,
            colourSecondary: Blockly.Colours.Base.colourSecondary,
            colourTertiary : Blockly.Colours.Base.colourTertiary,
            tooltip        : translate('Returns the total profit/loss'),
            category       : Blockly.Categories.Miscellaneous,
        };
    },
    meta() {
        return {
            'display_name': translate('Total profit/loss'),
            'description' : translate('This block gives you the total profit/loss of your trading strategy since your bot started running. You can reset this by clicking “Clear stats” on the Transaction Stats window, or by refreshing this page in your browser.'),
        };
    },
    onchange(event) {
        if (!this.workspace || this.isInFlyout || this.workspace.isDragging()) {
            return;
        }

        if (
            event.type === Blockly.Events.END_DRAG ||
            event.type === Blockly.Events.BLOCK_CREATE && event.ids.includes(this.id)
        ) {
            const input_statement = this.getRootInputTargetBlock();

            if (input_statement === 'INITIALIZATION') {
                this.unplug(true);
            }
        }
    },
};

Blockly.Blocks.total_profit_string = {
    init() {
        this.jsonInit(this.definition());
    },
    definition() {
        return {
            message0       : translate('Total Profit String'),
            output         : 'String',
            outputShape    : Blockly.OUTPUT_SHAPE_SQUARE,
            colour         : Blockly.Colours.Base.colour,
            colourSecondary: Blockly.Colours.Base.colourSecondary,
            colourTertiary : Blockly.Colours.Base.colourTertiary,
            tooltip        : translate('Returns the total profit in string format'),
            category       : Blockly.Categories.Miscellaneous,
        };
    },
    meta() {
        return {
            'display_name': translate('Total Profit String'),
            'description' : translate('Total Profit String Description'),
        };
    },
    onchange: Blockly.Blocks.total_profit.onchange,
};

Blockly.JavaScript.total_profit = () => ['Bot.getTotalProfit(false)', Blockly.JavaScript.ORDER_ATOMIC];
Blockly.JavaScript.total_profit_string = () => ['Bot.getTotalProfit(true)', Blockly.JavaScript.ORDER_ATOMIC];
