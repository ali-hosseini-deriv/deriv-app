// https://blockly-demo.appspot.com/static/demos/blockfactory/index.html#u7tjez
import { translator } from '../../../../../common/translator';

Blockly.Blocks.on_strategy = {
  init: function() {
    this.appendDummyInput()
      .appendField(translator.translateText('Step 2: Before Purchase'));
    this.appendStatementInput('STRATEGY_STACK')
      .setCheck('Purchase');
    this.setColour('#2a3052');
    this.setTooltip(translator.translateText('This block decides what to do each time a new tick is received'));
    this.setHelpUrl('https://github.com/binary-com/binary-bot/wiki');
  },
};
