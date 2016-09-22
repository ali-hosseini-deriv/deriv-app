// https://blockly-demo.appspot.com/static/demos/blockfactory/index.html#yn3rh2
import config from '../../../../../common/const';
import { translator } from '../../../../../common/translator';
import { insideCondition } from '../../relationChecker';

Blockly.Blocks.barrier_offset = {
  init: function init() {
    this.appendValueInput('BARRIEROFFSET_IN')
      .setCheck('Number')
      .appendField(new Blockly.FieldDropdown(config.barrierTypes), 'BARRIEROFFSETTYPE_LIST');
    this.setInputsInline(false);
    this.setOutput(true, 'BarrierOffset');
    this.setColour('#dedede');
    this.setTooltip(translator.translateText('Add sign to a number to make a Barrier Offset.'));
    this.setHelpUrl('https://github.com/binary-com/binary-bot/wiki');
  },
  onchange: function onchange(ev) {
    insideCondition(this, ev, 'Barrier Offset');
  },
};
Blockly.JavaScript.barrier_offset = (block) => {
  const barrierOffsetType = block.getFieldValue('BARRIEROFFSETTYPE_LIST');
  const barrierOffset = Blockly.JavaScript.valueToCode(block, 'BARRIEROFFSET_IN', Blockly.JavaScript.ORDER_ATOMIC);
  const code = barrierOffsetType + Number(barrierOffset);
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

