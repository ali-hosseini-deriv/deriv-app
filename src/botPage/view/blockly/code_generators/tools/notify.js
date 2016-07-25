'use strict';
Blockly.JavaScript.notify = function(block) {
  var notification_type = block.getFieldValue('NOTIFICATION_TYPE');
  var message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = 'Bot.log( ' + message + ', \'' + notification_type + '\');\n';
  return code;
};
