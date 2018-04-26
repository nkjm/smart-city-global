"use strict";

const debug = require("debug")("bot-express:skill");

// This skill is for test purpose only.
module.exports = class SkillClearContext {
    constructor(){
        this.clear_context_on_finish = true;
    }

    finish(bot, event, context, resolve, reject){
        let message;
        if (context.intent.fulfillment && context.intent.fulfillment.messages && context.intent.fulfillment.messages.length > 0){
            let offset = Math.floor(Math.random() * (context.intent.fulfillment.messages.length));
            if (context.intent.fulfillment.messages[offset].type === 0){
                message = {
                    type: "text",
                    text: context.intent.fulfillment.messages[offset].speech
                }
            } else if (context.intent.fulfillment.messages[offset].type === 4){
                // Set payload to message as it is.
                message = context.intent.fulfillment.messages[offset].payload;
            }
        } else {
            debug("Fulfillment not found so we do nothing.");
            return resolve();
        }
        return bot.reply(message).then((response) => {
            return resolve();
        })
    }
}
