import config        from '../../../../constants';
import { translate } from '../../../../utils/lang/i18n';

Blockly.Blocks.contract_check_result = {
    init() {
        this.jsonInit(this.definition());
    },
    definition(){
        return {
            message0: translate('Result is %1'),
            args0   : [
                {
                    type   : 'field_dropdown',
                    name   : 'CHECK_RESULT',
                    options: config.lists.CHECK_RESULT,
                },
            ],
            output         : 'Boolean',
            outputShape    : Blockly.OUTPUT_SHAPE_HEXAGONAL,
            colour         : Blockly.Colours.Analysis.colour,
            colourSecondary: Blockly.Colours.Analysis.colourSecondary,
            colourTertiary : Blockly.Colours.Analysis.colourTertiary,
            tooltip        : translate('True if the result of the last trade matches the selection'),
            category       : Blockly.Categories.After_Purchase,
        };
    },
    meta(){
        return {
            'display_name': translate('Last trade result'),
            'description' : translate('This block checks the result of the last trade.'),
        };
    },
    onchange(event) {
        if (!this.workspace || this.isInFlyout || this.workspace.isDragging()) {
            return;
        }

        if (event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.END_DRAG) {
            if (!this.isDescendantOf('after_purchase')) {
                this.unplug(true);
            } else if (this.disabled) {
                this.setDisabled(false);
            }
        }
    },
};

Blockly.JavaScript.contract_check_result = block => {
    const checkWith = block.getFieldValue('CHECK_RESULT');

    const code = `Bot.isResult('${checkWith}')`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
