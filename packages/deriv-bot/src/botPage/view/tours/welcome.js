import storageManager from 'binary-common-utils/lib/storageManager';
import { components } from '../components';
import { translator } from '../../../common/translator';

export default class Welcome {
	getSteps() {
		return [{
			content: `<p>
			${translator.translateText('Welcome to the binary bot')},
			${translator.translateText('a blockly based automation tool for binary.com trades')}.
			${translator.translateText('Skip this tutorial by clicking on the <b>X</b> button')}.
			${translator.translateText('Skip each step by <b>Right Arrow (')} &rarr;
			${translator.translateText(')</b> on the keyboard.')}
			</p>`,
			target: components.getUiComponent('center'),
			closeButton: true,
			nextButton: true,
			my: 'top center',
			at: 'bottom center',
			setup: () => {
				$('#blocker').show();
				components.setOpacityForAll(0.3);
			},
		}, {
			content: `<p>
			${translator.translateText('The blocks you put in here will create a binary bot code.')}
			${translator.translateText('You can then execute using the run button.')}
			</p>`,
			target: components.getUiComponent('center'),
			closeButton: true,
			nextButton: true,
			my: 'top center',
			at: 'bottom center',
			setup: () => {
				components.setOpacity('workspace', 1);
			},
			teardown: () => {
				components.setOpacity('workspace', 0.3);
			},
		}, {
			content: `<p>
			${translator.translateText('You can pick blocks from here to add to the workspace')}
			</p>`,
			target: components.getUiComponent('toolbox'),
			closeButton: true,
			nextButton: true,
			highlightTarget: true,
			my: 'left center',
			at: 'right center',
			setup: () => {
				components.setOpacity('toolbox', 1);
			},
			teardown: () => {
				components.setOpacity('toolbox', 0.3);
			},
		}, {
			content: `<p>
			${translator.translateText('Press Ctrl + -/+ to zoom out/in the blocks')}
			</p>`,
			target: components.getUiComponent('center'),
			closeButton: true,
			nextButton: true,
			my: 'top center',
			at: 'bottom center',
			setup: () => {
				components.setOpacity('workspace', 1);
			},
			teardown: () => {
				components.setOpacity('workspace', 0.3);
			},
		}, {
			content: `<p>
			${translator.translateText('You need to login before running the bot.')}
			</p>`,
			target: components.getUiComponent('login_logout'),
			closeButton: true,
			nextButton: true,
			highlightTarget: true,
			my: 'top center',
			at: 'bottom center',
			setup: () => {
				components.setOpacity('intro_login_logout', 1);
				components.setOpacity('login_logout', 1);
			},
			teardown: () => {
				components.setOpacity('intro_login_logout', 0.3);
				components.setOpacity('login_logout', 0.3);
			},
		}, {
			content: `<p>
			${translator.translateText('Use these buttons to save/load your blocks')}
			</p>`,
			target: components.getUiComponent('group_save'),
			closeButton: true,
			nextButton: true,
			highlightTarget: true,
			my: 'right center',
			at: 'left center',
			setup: () => {
				components.setOpacity('group_save', 1);
			},
			teardown: () => {
				components.setOpacity('group_save', 0.3);
			},
		}, {
			content: `<p>
			${translator.translateText('Use these buttons to Undo/Redo changes to your blocks.')}
			</p>`,
			target: components.getUiComponent('group_undo_redo'),
			closeButton: true,
			nextButton: true,
			highlightTarget: true,
			my: 'right center',
			at: 'left center',
			setup: () => {
				components.setOpacity('group_undo_redo', 1);
			},
			teardown: () => {
				components.setOpacity('group_undo_redo', 0.3);
			},
		}, {
			content: `<p>
			${translator.translateText('Open the summary panel.')}
			</p>`,
			target: components.getUiComponent('group_summary'),
			closeButton: true,
			nextButton: true,
			highlightTarget: true,
			my: 'right center',
			at: 'left center',
			setup: () => {
				components.setOpacity('group_summary', 1);
			},
			teardown: () => {
				components.setOpacity('group_summary', 0.3);
			},
		}, {
			content: `<p>
			${translator.translateText('Reset the blocks to their initial state.')}
			</p>`,
			target: components.getUiComponent('group_reset'),
			closeButton: true,
			nextButton: true,
			highlightTarget: true,
			my: 'right center',
			at: 'left center',
			setup: () => {
				components.setOpacity('group_reset', 1);
			},
			teardown: () => {
				components.setOpacity('group_reset', 0.3);
			},
		}, {
			content: `<p>
			${translator.translateText('Use the run/stop buttons in this menu to run or stop your blocks.')}
			</p>`,
			target: components.getUiComponent('group_start_stop'),
			closeButton: true,
			nextButton: true,
			highlightTarget: true,
			my: 'right center',
			at: 'left center',
			setup: () => {
				components.setOpacity('group_start_stop', 1);
			},
			teardown: () => {
				components.setOpacity('group_start_stop', 0.3);
			},
		}, {
			content: `<p>
			${translator.translateText('Good Luck!')}
			</p>`,
			target: components.getUiComponent('center'),
			nextButton: true,
			highlightTarget: true,
			my: 'top center',
			at: 'bottom center',
		}];
	}
	next() {
		if (this.tour) {
			this.tour.next();
		}
	}
	start(stopCallback) {
		this.stopCallback = stopCallback;
		this.tour = new Tourist.Tour({
			steps: this.getSteps(),
			cancelStep: () => {
				this.tour._teardownCurrentStep = () => {
				};
				$('#blocker').hide();
				components.setOpacityForAll(1);
				storageManager.setDone('welcomeFinished');
				this.stop();
			},
			successStep: () => {
				$('#blocker').hide();
				components.setOpacityForAll(1);
				storageManager.setDone('welcomeFinished');
				this.stop();
			},
		});
		this.tour.start();
	}
	welcome(stopCallback) {
		if (!storageManager.isDone('welcomeFinished')) {
			this.start(stopCallback);
		} else if (stopCallback) {
			stopCallback();
		}
	}
	stop() {
		components.setOpacityForAll(true, 1);
		this.tour.stop();
		Blockly.mainWorkspace.toolbox_.tree_.children_[6].setExpanded(false);
		delete this.tour;
		if (this.stopCallback) {
			this.stopCallback();
		}
	}
}
