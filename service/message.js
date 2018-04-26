"use strict";

module.exports = class ServiceMessage {
    /**
    Method to create template button message object.
    @method
    @param {Object} options - Option object
    @param {String} [options.alt_text=options.text] - Alt text of the message.
    @param {String} options.text - Text of the message.
    @param {Array.<String>} options.labels - String array which will be used as button label and text.
    */
    static create_template_button_message(options){
        let mo = {
            type: "template",
            altText: options.alt_text || options.text,
            template: {
                type: "buttons",
                text: options.text,
                actions: []
            }
        }
        options.labels.map((label) => {
            mo.template.actions.push({
                type: "message",
                label: label,
                text: label
            });
        });
        return mo;
    }

    /**
    Method to create template confirm message object.
    @method
    @param {Object} options - Option object
    @param {String} [options.alt_text=options.text] - Alt text of the message.
    @param {String} options.text - Text of the message.
    @param {Array.<String>} options.labels - String array which will be used as button label and text.
    */
    static create_template_confirm_message(options){
        let mo = {
            type: "template",
            altText: options.alt_text || options.text,
            template: {
                type: "confirm",
                text: options.text,
                actions: []
            }
        }
        options.labels.map((label) => {
            mo.template.actions.push({
                type: "message",
                label: label,
                text: label
            });
        });
        return mo;
    }

    static random(messages){
        let offset = Math.floor(Math.random() * (messages.length));
        return messages[offset];
    }

}
