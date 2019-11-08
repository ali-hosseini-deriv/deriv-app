import { translate }         from '../../../../utils/lang/i18n';

Blockly.Blocks.procedures_callnoreturn = {
    init() {
        this.arguments = [];
        this.argument_var_models = [];
        this.previousDisabledState = false;

        this.jsonInit(this.definition());
    },
    /**
     * Block definitions describe how a block looks and behaves, including the text,
     * the colour, the shape, and what other blocks it can connect to. We've separated
     * the block definition from the init function so we can search through it.
     * https://developers.google.com/blockly/guides/create-custom-blocks/define-blocks
     */
    definition() {
        return {
            message0: '%1 %2',
            args0   : [
                {
                    type: 'field_label',
                    name: 'NAME',
                    text: this.id,
                },
                {
                    type: 'input_dummy',
                    name: 'TOPROW',
                },
            ],
            colour           : Blockly.Colours.Special2.colour,
            colourSecondary  : Blockly.Colours.Special2.colourSecondary,
            colourTertiary   : Blockly.Colours.Special2.colourTertiary,
            previousStatement: null,
            nextStatement    : null,
            tooltip          : translate('Custom function'),
            category         : Blockly.Categories.Functions,
        };
    },
    /**
     * Meta returns an object with with properties that contain human readable strings,
     * these strings are used in the flyout help content, as well as used for searching
     * for specific blocks.
     */
    meta() {
        return {
            'display_name': translate('Custom function'),
            'description' : '',
        };
    },
    /**
     * Procedure calls cannot exist without the corresponding procedure
     * definition.  Enforce this link whenever an event is fired.
     * @param {!Blockly.Events.Abstract} event Change event.
     * @this Blockly.Block
     */
    onchange(event) {
        if (!this.workspace || this.workspace.isFlyout) {
            // Block is deleted or is in a flyout.
            return;
        }

        if (!event.recordUndo) {
            // Events not generated by user. Skip handling.
            return;
        }

        if (event.type === Blockly.Events.BLOCK_CREATE && event.ids.indexOf(this.id) !== -1) {
            // Look for the case where a procedure call was created (usually through
            // paste) and there is no matching definition.  In this case, create
            // an empty definition block with the correct signature.
            const name = this.getProcedureCall();
            let def    = Blockly.Procedures.getDefinition(name, this.workspace);

            if (
                def &&
                (def.type !== this.defType || JSON.stringify(def.arguments) !== JSON.stringify(this.arguments))
            ) {
                // The signatures don't match.
                def = null;
            }

            if (def) {
                this.data = def.id;
                return;
            }

            Blockly.Events.setGroup(event.group);
            /**
             * Create matching definition block.
             * <xml>
             *   <block type="procedures_defreturn" x="10" y="20">
             *     <mutation name="test">
             *       <arg name="x"></arg>
             *     </mutation>
             *     <field name="NAME">test</field>
             *   </block>
             * </xml>
             */
            const xml = document.createElement('xml');
            const block = document.createElement('block');
            block.setAttribute('type', this.defType);

            const xy = this.getRelativeToSurfaceXY();
            const x = xy.x + Blockly.SNAP_RADIUS * (this.RTL ? -1 : 1);
            const y = xy.y + Blockly.SNAP_RADIUS * 2;

            block.setAttribute('x', x);
            block.setAttribute('y', y);

            const mutation = this.mutationToDom();

            block.appendChild(mutation);

            const field = document.createElement('field');
            field.setAttribute('name', 'NAME');
            field.appendChild(document.createTextNode(this.getProcedureCall()));

            block.appendChild(field);
            xml.appendChild(block);

            Blockly.Xml.domToWorkspace(xml, this.workspace);
            Blockly.Events.setGroup(false);

            const procedure_definition = Blockly.Procedures.getDefinition(name, this.workspace);
            this.data = procedure_definition.id;
        } else if (event.type === Blockly.Events.BLOCK_DELETE) {
            // Look for the case where a procedure definition has been deleted,
            // leaving this block (a procedure call) orphaned.  In this case, delete
            // the orphan.
            const name = this.getProcedureCall();
            const def = Blockly.Procedures.getDefinition(name, this.workspace);

            if (!def) {
                Blockly.Events.setGroup(event.group);
                this.dispose(true, false);
                Blockly.Events.setGroup(false);
            }
        } else if (event.type === Blockly.Events.BLOCK_CHANGE && event.element === 'disabled') {
            const name = this.getProcedureCall();
            const def = Blockly.Procedures.getDefinition(name, this.workspace);

            if (def && def.id === event.blockId) {
                // in most cases the old group should be ''
                const oldGroup = Blockly.Events.getGroup();

                if (oldGroup) {
                    // This should only be possible programatically and may indicate a problem
                    // with event grouping. If you see this message please investigate. If the
                    // use ends up being valid we may need to reorder events in the undo stack.
                    // eslint-disable-next-line no-console
                    console.log('Saw an existing group while responding to a definition change');
                }

                Blockly.Events.setGroup(event.group);

                if (event.newValue) {
                    this.previousDisabledState = this.disabled;
                    this.setDisabled(true);
                } else {
                    this.setDisabled(this.previousDisabledState);
                }

                Blockly.Events.setGroup(oldGroup);
            }
        }
    },
    /**
     * Returns the related procedure definition block.
     * @return {Blockly.Block} Procedure definition block.
     * @this Blockly.Block
     */
    getProcedureDefinition(name) {
        // Assume that a procedure definition is a top block.
        return this.workspace.getTopBlocks(false).find(block => {
            if (block.getProcedureDef) {
                const tuple = block.getProcedureDef();
                return tuple && Blockly.Names.equals(tuple[0], name);
            }
            return false;
        });
    },
    /**
     * Returns the name of the procedure this block calls.
     * @return {string} Procedure name.
     * @this Blockly.Block
     */
    getProcedureCall() {
        // The NAME field is guaranteed to exist, null will never be returned.
        return /** @type {string} */ (this.getFieldValue('NAME'));
    },
    /**
     * Notification that a procedure is renaming.
     * If the name matches this block's procedure, rename it.
     * @param {string} oldName Previous name of procedure.
     * @param {string} newName Renamed procedure.
     * @this Blockly.Block
     */
    renameProcedure(oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getProcedureCall())) {
            this.setFieldValue(newName, 'NAME');
        }
    },
    /**
     * Notification that the procedure's parameters have changed.
     * @param {!Array.<string>} paramNames New param names, e.g. ['x', 'y', 'z'].
     * @private
     * @this Blockly.Block
     */
    setProcedureParameters(paramNames) {
        // Rebuild the block's arguments.
        this.arguments = [].concat(paramNames);

        // And rebuild the argument model list.
        this.argument_var_models = this.arguments.map(argumentName =>
            Blockly.Variables.getOrCreateVariablePackage(this.workspace, null, argumentName, '')
        );

        this.updateShape();
    },
    /**
     * Modify this block to have the correct number of arguments.
     * @private
     * @this Blockly.Block
     */
    updateShape() {
        this.arguments.forEach((argumentName, i) => {
            let field = this.getField(`ARGNAME${i}`);
            if (field) {
                // Ensure argument name is up to date.
                // The argument name field is deterministic based on the mutation,
                // no need to fire a change event.
                Blockly.Events.disable();
                try {
                    field.setValue(argumentName);
                } finally {
                    Blockly.Events.enable();
                }
            } else {
                // Add new input.
                field = new Blockly.FieldLabel(argumentName);
                const input = this.appendValueInput(`ARG${i}`).appendField(field, `ARGNAME${i}`);
                input.init();
            }
        });

        // Remove deleted inputs.
        let i = this.arguments.length;
        while (this.getInput(`ARG${i}`)) {
            this.removeInput(`ARG${i}`);
            i++;
        }

        // Add 'with:' if there are parameters, remove otherwise.
        const topRow = this.getInput('TOPROW');

        if (topRow) {
            if (this.arguments.length) {
                if (!this.getField('WITH')) {
                    topRow.appendField(translate('with:'), 'WITH');
                    topRow.init();
                }
            } else if (this.getField('WITH')) {
                topRow.removeField('WITH');
            }
        }
    },
    /**
     * Create XML to represent the (non-editable) name and arguments.
     * @return {!Element} XML storage element.
     * @this Blockly.Block
     */
    mutationToDom() {
        const container = document.createElement('mutation');
        container.setAttribute('name', this.getProcedureCall());

        this.arguments.forEach(argumentName => {
            const parameter = document.createElement('arg');
            parameter.setAttribute('name', argumentName);
            container.appendChild(parameter);
        });

        return container;
    },
    /**
     * Parse XML to restore the (non-editable) name and parameters.
     * @param {!Element} xmlElement XML storage element.
     * @this Blockly.Block
     */
    domToMutation(xmlElement) {
        const name = xmlElement.getAttribute('name');
        this.renameProcedure(this.getProcedureCall(), name);

        const args = [];
        const paramIds = [];

        xmlElement.childNodes.forEach(childNode => {
            if (childNode.nodeName.toLowerCase() === 'arg') {
                args.push(childNode.getAttribute('name'));
                paramIds.push(childNode.getAttribute('paramId'));
            }
        });

        this.setProcedureParameters(args, paramIds);
    },
    /**
     * Return all variables referenced by this block.
     * @return {!Array.<!Blockly.VariableModel>} List of variable models.
     * @this Blockly.Block
     */
    getVarModels() {
        return this.argument_var_models;
    },
    /**
     * Add menu option to find the definition block for this call.
     * @param {!Array} options List of menu options to add to.
     * @this Blockly.Block
     */
    customContextMenu(options) {
        const name = this.getProcedureCall();
        const { workspace } = this;

        const option = { enabled: true };
        option.text = translate('Highlight function definition');
        option.callback = () => {
            const def = this.getProcedureDefinition(name);
            if (def) {
                workspace.centerOnBlock(def.id);
                def.select();
            }
        };

        options.push(option);
    },
    defType: 'procedures_defnoreturn',
};

Blockly.JavaScript.procedures_callnoreturn = block => {
    // eslint-disable-next-line no-underscore-dangle
    const functionName = Blockly.JavaScript.variableDB_.getName(
        block.getFieldValue('NAME'),
        Blockly.Procedures.NAME_TYPE
    );
    const args = block.arguments.map(
        (arg, i) => Blockly.JavaScript.valueToCode(block, `ARG${i}`, Blockly.JavaScript.ORDER_COMMA) || 'null'
    );

    const code = `${functionName}(${args.join(', ')});\n`;
    return code;
};
