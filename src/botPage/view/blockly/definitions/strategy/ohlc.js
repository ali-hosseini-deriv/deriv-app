// https://blockly-demo.appspot.com/static/demos/blockfactory/index.html#2jo335
import { insideStrategy } from '../../relationChecker';
import { translator } from '../../../../../common/translator';

Blockly.Blocks.ohlc = {
  init: function init() {
    this.appendDummyInput()
      .appendField(translator.translateText('Candles List'));
    this.setOutput(true, 'Array');
    this.setColour('#f2f2f2');
    this.setTooltip(translator.translateText('Returns the ohlc list'));
    this.setHelpUrl('https://github.com/binary-com/binary-bot/wiki');
  },
  onchange: function onchange(ev) {
    insideStrategy(this, ev, 'Candles List');
  },
};
Blockly.JavaScript.ohlc = () => ['ticks.ohlc', Blockly.JavaScript.ORDER_ATOMIC];
